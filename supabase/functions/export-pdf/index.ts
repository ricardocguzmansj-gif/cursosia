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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { course_id } = await req.json();
    if (!course_id) {
      return new Response(JSON.stringify({ error: "course_id requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("*")
      .eq("id", course_id)
      .single();

    if (courseErr || !course) {
      return new Response(JSON.stringify({ error: "Curso no encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const curso = course.content?.curso;
    if (!curso) {
      return new Response(JSON.stringify({ error: "Curso sin contenido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build HTML for PDF-like rendering
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1a1a2e; line-height: 1.6; }
      h1 { color: #6c5ce7; border-bottom: 3px solid #6c5ce7; padding-bottom: 0.5rem; }
      h2 { color: #2d2d4e; margin-top: 2rem; border-left: 4px solid #6c5ce7; padding-left: 0.75rem; }
      h3 { color: #444; }
      .meta { display: flex; gap: 1rem; margin: 1rem 0; color: #666; }
      .meta span { background: #f0f0ff; padding: 0.3rem 0.8rem; border-radius: 1rem; font-size: 0.85rem; }
      .idea { background: #fff9e6; border-left: 4px solid #fdcb6e; padding: 1rem; margin: 1rem 0; border-radius: 0 0.5rem 0.5rem 0; }
      .example { background: #e6f9ff; border-left: 4px solid #00cec9; padding: 1rem; margin: 1rem 0; border-radius: 0 0.5rem 0.5rem 0; }
      .activity { background: #e6ffe6; border-left: 4px solid #00b894; padding: 1rem; margin: 1rem 0; border-radius: 0 0.5rem 0.5rem 0; }
      .footer { text-align: center; margin-top: 3rem; color: #999; font-size: 0.8rem; border-top: 1px solid #eee; padding-top: 1rem; }
      .page-break { page-break-after: always; }
      ul { padding-left: 1.5rem; }
      li { margin: 0.3rem 0; }
    </style></head><body>`;

    // Title page
    html += `<h1>📚 ${curso.titulo}</h1>`;
    if (curso.descripcion_corta || curso.descripcion) {
      html += `<p>${curso.descripcion_corta || curso.descripcion}</p>`;
    }
    html += `<div class="meta">
      <span>📊 ${curso.nivel || course.level}</span>
      <span>⏱️ ${curso.duracion || course.duration}</span>
      <span>👤 ${curso.perfil || course.profile}</span>
    </div>`;

    // Objectives
    if (curso.objetivos_aprendizaje?.length) {
      html += `<h2>🎯 Objetivos de Aprendizaje</h2><ul>`;
      curso.objetivos_aprendizaje.forEach((o: string) => { html += `<li>${o}</li>`; });
      html += `</ul>`;
    }

    // Units
    curso.unidades?.forEach((unidad: any, uIdx: number) => {
      html += `<div class="page-break"></div>`;
      html += `<h2>Unidad ${uIdx + 1}: ${unidad.titulo}</h2>`;
      if (unidad.descripcion) html += `<p>${unidad.descripcion}</p>`;

      unidad.lecciones?.forEach((lec: any, lIdx: number) => {
        html += `<h3>${uIdx + 1}.${lIdx + 1} ${lec.titulo}</h3>`;
        if (lec.idea_clave) html += `<div class="idea"><strong>💡 Idea clave:</strong> ${lec.idea_clave}</div>`;
        if (lec.explicacion) html += `<p>${lec.explicacion}</p>`;
        if (lec.ejemplo_aplicado) html += `<div class="example"><strong>🔍 Ejemplo:</strong> ${lec.ejemplo_aplicado}</div>`;
        if (lec.actividad_practica) html += `<div class="activity"><strong>🛠️ Actividad:</strong> ${lec.actividad_practica}</div>`;
      });
    });

    // Sources
    if (curso.fuentes?.length) {
      html += `<h2>📚 Fuentes y Referencias</h2><ul>`;
      curso.fuentes.forEach((f: any) => {
        const txt = typeof f === "string" ? f : (f.titulo || f.title || "");
        const url = typeof f === "string" ? "" : (f.url || f.enlace || "");
        html += `<li>${txt}${url ? ` — <a href="${url}">${url}</a>` : ""}</li>`;
      });
      html += `</ul>`;
    }

    html += `<div class="footer"><p>Generado por CursosIA — Plataforma de cursos con IA</p></div>`;
    html += `</body></html>`;

    // Track event
    await supabase.from("events").insert({
      user_id: user.id,
      event_type: "course_exported_pdf",
      course_id,
    });

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${curso.titulo || 'curso'}.html"`,
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
