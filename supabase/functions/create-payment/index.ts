import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = Deno.env.get("SITE_URL") || "https://cursosia.digitalsaasfactory.com";

// Price configuration
const PRICES: Record<string, { amount: number; currency: string; description: string }> = {
  certificate: { amount: 20, currency: "USD", description: "Certificado de Aprobación Oficial" },
  ai_video: { amount: 9.99, currency: "USD", description: "Tutor IA Personalizado" },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for DB writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 2. Parse body
    const { course_id, application_id, type } = await req.json();
    if (!type) {
      return new Response(JSON.stringify({ error: "type es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3 & 4. Determine price and entity
    let amount: number;
    let currency: string;
    let description: string;
    let target_course_id: string | null = course_id || null;

    if (type === "escrow") {
      if (!application_id) {
        return new Response(JSON.stringify({ error: "application_id es requerido para escrow" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      // Get Application details
      const { data: appData, error: appErr } = await supabase
        .from("job_applications")
        .select("id, bid_amount, job_id, job_postings(title)")
        .eq("id", application_id)
        .single();
        
      if (appErr || !appData) {
        return new Response(JSON.stringify({ error: "Propuesta no encontrada" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Calculate Fees
      const bid_amount = Number(appData.bid_amount);
      const employer_fee = bid_amount * 0.10; // 10% platform fee for employer
      const talent_fee = bid_amount * 0.10;   // 10% platform fee for talent
      const total_paid = bid_amount + employer_fee;
      const talent_earnings = bid_amount - talent_fee;

      // Update the application with the calculated fees prior to checkout
      await supabase.from("job_applications").update({
        employer_fee,
        talent_fee,
        total_paid,
        talent_earnings
      }).eq("id", application_id);

      amount = total_paid;
      currency = "USD";
      description = `Escrow B2B: ${appData.job_postings.title} (Comisión incl.)`;
      target_course_id = null; // No course tied
      
    } else {
      if (!course_id) {
        return new Response(JSON.stringify({ error: "course_id es requerido para este tipo" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      // Get course details
      const { data: course, error: courseErr } = await supabase
        .from("courses")
        .select("id, title, price, currency")
        .eq("id", course_id)
        .single();

      if (courseErr || !course) {
        return new Response(JSON.stringify({ error: "Curso no encontrado" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (type === "course") {
        amount = Number(course.price) || 49.99;
        currency = course.currency || "USD";
        description = `Inscripción: ${course.title}`;
      } else if (PRICES[type]) {
        amount = PRICES[type].amount;
        currency = PRICES[type].currency;
        description = `${PRICES[type].description} — ${course.title}`;
      } else {
        return new Response(JSON.stringify({ error: "Tipo de pago no válido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 5. Get user profile for payer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // 6. Create payment order in DB
    const { data: order, error: orderErr } = await supabase
      .from("payment_orders")
      .insert({
        user_id: user.id,
        course_id: target_course_id,
        type,
        amount,
        currency,
        status: "pending",
        metadata: { 
          description, 
          application_id: type === 'escrow' ? application_id : null 
        },
      })
      .select()
      .single();

    if (orderErr) {
      console.error("Error creating payment order:", orderErr);
      return new Response(JSON.stringify({ error: "Error creando orden de pago" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Create MercadoPago preference
    const mpToken = Deno.env.get("MP_PLATFORM_ACCESS_TOKEN");
    if (!mpToken) {
      return new Response(JSON.stringify({ error: "MercadoPago no configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const preference = {
      items: [
        {
          title: description,
          quantity: 1,
          unit_price: amount,
          currency_id: currency,
        },
      ],
      payer: {
        email: user.email,
        name: profile?.full_name?.split(" ")[0] || "",
        surname: profile?.full_name?.split(" ").slice(1).join(" ") || "",
      },
      back_urls: {
        success: `${SITE_URL}/payment/result?status=success`,
        failure: `${SITE_URL}/payment/result?status=failure`,
        pending: `${SITE_URL}/payment/result?status=pending`,
      },
      auto_return: "approved",
      external_reference: order.id, // Our payment_order UUID
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      statement_descriptor: "CursosIA",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      const mpError = await mpRes.text();
      console.error("MercadoPago error:", mpRes.status, mpError);
      return new Response(JSON.stringify({ error: "Error creando preferencia de pago", details: mpError }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpRes.json();

    // 8. Update order with MP preference ID
    await supabase
      .from("payment_orders")
      .update({ mp_preference_id: mpData.id })
      .eq("id", order.id);

    // 9. Return checkout URL
    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      preference_id: mpData.id,
      order_id: order.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("create-payment error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
