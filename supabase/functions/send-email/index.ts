import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email templates
const templates: Record<string, (data: any) => { subject: string; html: string }> = {
  welcome: (data) => ({
    subject: "🎓 ¡Bienvenido a CursosIA!",
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#e0e0e0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#6c5ce7,#a855f7);padding:40px 30px;text-align:center">
          <h1 style="color:white;margin:0;font-size:28px">¡Bienvenido a CursosIA!</h1>
          <p style="color:rgba(255,255,255,0.9);margin-top:10px;font-size:16px">Tu viaje de aprendizaje comienza ahora</p>
        </div>
        <div style="padding:30px">
          <p style="font-size:16px">Hola <strong>${data.name || "Estudiante"}</strong>,</p>
          <p>Tu cuenta ha sido creada exitosamente. Ahora puedes explorar nuestro catálogo de cursos generados por inteligencia artificial de nivel universitario.</p>
          <div style="text-align:center;margin:30px 0">
            <a href="https://cursosia.digitalsaasfactory.com/catalog" style="background:linear-gradient(135deg,#6c5ce7,#a855f7);color:white;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:bold;font-size:16px;display:inline-block">Explorar Catálogo</a>
          </div>
          <p style="font-size:14px;opacity:0.7">— El equipo de CursosIA</p>
        </div>
      </div>`,
  }),

  enrollment_confirmed: (data) => ({
    subject: `✅ Inscripción confirmada: ${data.course_title}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#e0e0e0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#00b894,#00cec9);padding:40px 30px;text-align:center">
          <h1 style="color:white;margin:0;font-size:28px">✅ ¡Inscripción Confirmada!</h1>
        </div>
        <div style="padding:30px">
          <p style="font-size:16px">Hola <strong>${data.name}</strong>,</p>
          <p>Tu inscripción al curso <strong>"${data.course_title}"</strong> ha sido procesada exitosamente.</p>
          ${data.amount ? `<p>💰 Monto: <strong>${data.currency} ${data.amount}</strong> · Pago #${data.payment_id || "N/A"}</p>` : ""}
          <div style="text-align:center;margin:30px 0">
            <a href="https://cursosia.digitalsaasfactory.com/dashboard" style="background:linear-gradient(135deg,#00b894,#00cec9);color:white;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:bold;font-size:16px;display:inline-block">Ir a Mis Cursos</a>
          </div>
          <p style="font-size:14px;opacity:0.7">— El equipo de CursosIA</p>
        </div>
      </div>`,
  }),

  certificate_issued: (data) => ({
    subject: `🏅 Tu certificado está listo: ${data.course_title}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#e0e0e0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#f39c12,#e17055);padding:40px 30px;text-align:center">
          <h1 style="color:white;margin:0;font-size:28px">🏅 ¡Certificado Emitido!</h1>
        </div>
        <div style="padding:30px">
          <p style="font-size:16px">Felicitaciones <strong>${data.name}</strong>,</p>
          <p>Has completado exitosamente el curso <strong>"${data.course_title}"</strong> con una nota de <strong>${data.score}/10</strong>.</p>
          ${data.verification_code ? `<p>🔐 Código de verificación: <strong>${data.verification_code}</strong></p>` : ""}
          <div style="text-align:center;margin:30px 0">
            <a href="https://cursosia.digitalsaasfactory.com/dashboard" style="background:linear-gradient(135deg,#f39c12,#e17055);color:white;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:bold;font-size:16px;display:inline-block">Ver Mi Certificado</a>
          </div>
          <p style="font-size:14px;opacity:0.7">— El equipo de CursosIA</p>
        </div>
      </div>`,
  }),

  certificate_paid: (data) => ({
    subject: `📜 Certificado Oficial pagado: ${data.course_title}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#e0e0e0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#6c5ce7,#fd79a8);padding:40px 30px;text-align:center">
          <h1 style="color:white;margin:0;font-size:28px">📜 Certificado Oficial Activado</h1>
        </div>
        <div style="padding:30px">
          <p style="font-size:16px">Hola <strong>${data.name}</strong>,</p>
          <p>Tu pago de <strong>${data.currency} ${data.amount}</strong> por el Certificado de Aprobación Oficial del curso <strong>"${data.course_title}"</strong> ha sido procesado correctamente.</p>
          <p>Ya puedes descargar tu certificado oficial desde la plataforma.</p>
          <div style="text-align:center;margin:30px 0">
            <a href="https://cursosia.digitalsaasfactory.com/dashboard" style="background:linear-gradient(135deg,#6c5ce7,#fd79a8);color:white;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:bold;font-size:16px;display:inline-block">Ver Certificado</a>
          </div>
          <p style="font-size:14px;opacity:0.7">— El equipo de CursosIA</p>
        </div>
      </div>`,
  }),

  payment_confirmed: (data) => ({
    subject: `💳 Pago confirmado — CursosIA`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#e0e0e0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#6c5ce7,#a855f7);padding:40px 30px;text-align:center">
          <h1 style="color:white;margin:0;font-size:28px">💳 Pago Confirmado</h1>
        </div>
        <div style="padding:30px">
          <p style="font-size:16px">Hola <strong>${data.name}</strong>,</p>
          <p>Tu pago de <strong>${data.currency} ${data.amount}</strong> ha sido procesado exitosamente.</p>
          <p>ID del pago: <strong>${data.payment_id || "N/A"}</strong></p>
          <div style="text-align:center;margin:30px 0">
            <a href="https://cursosia.digitalsaasfactory.com/dashboard" style="background:linear-gradient(135deg,#6c5ce7,#a855f7);color:white;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:bold;font-size:16px;display:inline-block">Ir al Dashboard</a>
          </div>
          <p style="font-size:14px;opacity:0.7">— El equipo de CursosIA</p>
        </div>
      </div>`,
  }),
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "notificaciones@turnos.publicalogratis.com";

    if (!resendKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, template, data } = await req.json();

    if (!to || !template) {
      return new Response(JSON.stringify({ error: "to and template are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateFn = templates[template];
    if (!templateFn) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = templateFn(data || {});

    // Send via Resend API
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `CursosIA <${fromEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error(`Resend error ${resendRes.status}:`, errText);
      return new Response(JSON.stringify({ error: "Error sending email", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await resendRes.json();
    console.log(`📧 Email sent to ${to}: template=${template}, id=${result.id}`);

    return new Response(JSON.stringify({ success: true, email_id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
