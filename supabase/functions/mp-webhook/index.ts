import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // MercadoPago sends GET for test and POST for real notifications
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const mpToken = Deno.env.get("MP_PLATFORM_ACCESS_TOKEN");
    if (!mpToken) {
      console.error("MP_PLATFORM_ACCESS_TOKEN not configured");
      return new Response("OK", { status: 200 });
    }

    // Parse the notification
    let body: any = {};
    if (req.method === "POST") {
      body = await req.json();
    }

    // MercadoPago sends topic-based notifications
    // We care about "payment" topic or action "payment.updated"/"payment.created"
    const topic = body.topic || body.type || "";
    const paymentId = body.data?.id || "";

    // Also handle IPN-style query params
    const url = new URL(req.url);
    const queryTopic = url.searchParams.get("topic") || url.searchParams.get("type") || "";
    const queryId = url.searchParams.get("id") || url.searchParams.get("data.id") || "";

    const actualTopic = topic || queryTopic;
    const actualPaymentId = paymentId || queryId;

    console.log(`📩 MP Webhook: topic=${actualTopic}, paymentId=${actualPaymentId}`);

    // Only process payment notifications
    if (!actualTopic.includes("payment") || !actualPaymentId) {
      console.log("⏭️ Skipping non-payment notification");
      return new Response("OK", { status: 200 });
    }

    // 1. Fetch payment details from MercadoPago API
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${actualPaymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });

    if (!mpRes.ok) {
      console.error(`❌ MP API error: ${mpRes.status}`);
      return new Response("OK", { status: 200 }); // Always return 200 to MP
    }

    const payment = await mpRes.json();
    const externalReference = payment.external_reference; // Our payment_order UUID
    const paymentStatus = payment.status; // approved, rejected, pending, in_process, etc.

    console.log(`💳 Payment ${actualPaymentId}: status=${paymentStatus}, ref=${externalReference}`);

    if (!externalReference) {
      console.log("⚠️ No external_reference found");
      return new Response("OK", { status: 200 });
    }

    // 2. Get our payment order
    const { data: order, error: orderErr } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("id", externalReference)
      .single();

    if (orderErr || !order) {
      console.error("❌ Payment order not found:", externalReference, orderErr?.message);
      return new Response("OK", { status: 200 });
    }

    // 3. Update payment order status
    const statusMap: Record<string, string> = {
      approved: "approved",
      rejected: "rejected",
      pending: "pending",
      in_process: "in_process",
      cancelled: "cancelled",
      refunded: "rejected",
      charged_back: "rejected",
    };

    const newStatus = statusMap[paymentStatus] || "pending";

    await supabase
      .from("payment_orders")
      .update({
        status: newStatus,
        mp_payment_id: String(actualPaymentId),
        updated_at: new Date().toISOString(),
        metadata: { ...order.metadata, mp_status: paymentStatus, mp_status_detail: payment.status_detail },
      })
      .eq("id", order.id);

    // 4. If approved → fulfill the purchase
    if (paymentStatus === "approved") {
      console.log(`✅ Payment approved! Fulfilling order: type=${order.type}, course=${order.course_id}`);

      if (order.type === "course") {
        // Enroll user in the course
        const { error: enrollErr } = await supabase
          .from("course_enrollments")
          .upsert({
            user_id: order.user_id,
            course_id: order.course_id,
            source: "paid",
          }, { onConflict: "user_id,course_id" });

        if (enrollErr) {
          console.error("❌ Enrollment error:", enrollErr.message);
        } else {
          console.log("✅ User enrolled successfully");
        }
      } else if (order.type === "certificate") {
        // Mark certificate as paid
        await supabase
          .from("course_enrollments")
          .update({ paid_certificate: true })
          .eq("user_id", order.user_id)
          .eq("course_id", order.course_id);

        console.log("✅ Certificate payment recorded");
      } else if (order.type === "ai_video") {
        // Enable AI video for the course
        await supabase
          .from("courses")
          .update({ is_ai_video_enabled: true })
          .eq("id", order.course_id);

        console.log("✅ AI Video enabled");
      } else if (order.type === "escrow") {
        const applicationId = order.metadata?.application_id;
        if (applicationId) {
          // Update application status to in_progress
          const { data: updatedApp, error: appErr } = await supabase
            .from("job_applications")
            .update({ status: 'in_progress' })
            .eq("id", applicationId)
            .select("job_id")
            .single();

          if (appErr) {
            console.error("❌ Escrow Application update error:", appErr.message);
          } else if (updatedApp?.job_id) {
            // Update job posting to in_progress to indicate it's active and funded
            const { error: jobErr } = await supabase
              .from("job_postings")
              .update({ status: 'in_progress' })
              .eq("id", updatedApp.job_id);

            if (jobErr) console.error("❌ Escrow Job update error:", jobErr.message);
            else console.log(`✅ Escrow Job ${updatedApp.job_id} is now in_progress`);
          }
        }
      }

      // 5. Send confirmation email via send-email function
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", order.user_id)
          .single();

        const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);

        const emailPayload = {
          to: userData?.user?.email,
          template: order.type === "course" ? "enrollment_confirmed" : order.type === "certificate" ? "certificate_paid" : order.type === "escrow" ? "escrow_funded" : "payment_confirmed",
          data: {
            name: profile?.full_name || "Estudiante",
            course_title: order.metadata?.description || order.metadata?.course_title || "Servicio B2B",
            amount: order.amount,
            currency: order.currency,
            payment_id: actualPaymentId,
          },
        };

        // Call send-email Edge Function internally
        const emailRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify(emailPayload),
          }
        );
        console.log(`📧 Email sent: ${emailRes.status}`);
      } catch (emailErr) {
        console.error("⚠️ Email error (non-blocking):", emailErr);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("mp-webhook error:", err);
    // Always return 200 to MercadoPago to avoid retries
    return new Response("OK", { status: 200 });
  }
});
