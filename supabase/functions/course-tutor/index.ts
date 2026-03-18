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

    const { course_id, unit_index, lesson_index, message, history = [] } = await req.json();

    if (!course_id || unit_index === undefined || lesson_index === undefined || !message) {
      return new Response(JSON.stringify({ error: "Faltan parámetros" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get course content
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: course } = await supabase
      .from("courses")
      .select("content, title, level")
      .eq("id", course_id)
      .single();

    if (!course) {
      return new Response(JSON.stringify({ error: "Curso no encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const unidad = course.content?.curso?.unidades?.[unit_index];
    const leccion = unidad?.lecciones?.[lesson_index];
    if (!leccion) {
      return new Response(JSON.stringify({ error: "Lección no encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context
    const lessonContext = `
CURSO: ${course.content?.curso?.titulo || course.title}
NIVEL: ${course.level}
UNIDAD ${unit_index + 1}: ${unidad.titulo}
LECCIÓN ${unit_index + 1}.${lesson_index + 1}: ${leccion.titulo}

IDEA CLAVE: ${leccion.idea_clave || 'N/A'}
EXPLICACIÓN: ${leccion.explicacion || 'N/A'}
EJEMPLO: ${leccion.ejemplo_aplicado || 'N/A'}
    `.trim();

    const systemPrompt = `Eres un tutor experto y amigable. El alumno está estudiando el siguiente contenido:

${lessonContext}

INSTRUCCIONES:
- Responde de forma clara, concisa y didáctica.
- Usa el contenido de la lección como base para tus respuestas.
- Si el alumno pide simplificar, usa analogías y lenguaje más sencillo.
- Si pide más ejemplos, genera ejemplos prácticos relacionados.
- Si pide un quiz, genera 2-3 preguntas de opción múltiple sobre la lección.
- NO reveles que eres IA. Actúa como un profesor real.
- Responde en el mismo idioma que usa el alumno.`;

    // Build conversation
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "¡Hola! Estoy aquí para ayudarte con esta lección. ¿Qué necesitas?" }] },
      ...history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("OPENAI_API_KEY");
    if (!GEMINI_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Flash for speed (tutor should be fast)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

    const geminiRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: "Error del tutor IA", detail: errText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude generar una respuesta. Intenta de nuevo.";

    // Track event
    await supabase.from("events").insert({
      user_id: user.id,
      event_type: "tutor_message",
      course_id,
      metadata: { unit_index, lesson_index },
    });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
