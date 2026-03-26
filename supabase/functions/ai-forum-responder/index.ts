import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = [
  'https://cursosia.digitalsaasfactory.com',
  'https://cursosia.pages.dev',
  'http://localhost:5173'
];

function getCorsHeaders(reqOrigin: string | null) {
  let origin = '*';
  if (reqOrigin) {
    if (allowedOrigins.includes(reqOrigin) || reqOrigin.endsWith('.cursosia.pages.dev')) {
      origin = reqOrigin;
    }
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  const reqOrigin = req.headers.get('Origin');
  const headers = getCorsHeaders(reqOrigin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Token inválido");

    const { courseId, unitIndex, lessonIndex, commentId, commentContent } = await req.json();

    if (!courseId || !commentContent) {
      return new Response(JSON.stringify({ error: 'Parámetros incompletos' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    // 1. Fetch Course Context
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, content')
      .eq('id', courseId)
      .single();

    if (courseError || !course) throw new Error("Curso no encontrado");

    const syllabus = course.content?.curso;
    const unitTitle = syllabus?.unidades?.[unitIndex]?.titulo || "Unidad General";
    const lessonTitle = syllabus?.unidades?.[unitIndex]?.lecciones?.[lessonIndex]?.titulo || "Lección General";

    const systemPrompt = `Eres el Tutor de Excelencia Académica de CursosIA.
Tu tarea es responder de forma amable, precisa y extremadamente didáctica a la pregunta de un estudiante en el foro del curso.
Mantén tu respuesta estructurada, usando viñetas si es necesario, y un tono motivador.

CONTEXTO DEL CURSO:
Curso: ${course.title}
Unidad actual: ${unitTitle}
Lección actual: ${lessonTitle}
`;

    const userPrompt = `Duda del estudiante:\n"${commentContent}"\n\nPor favor, proporciona una respuesta clara y completa.`;

    // @ts-ignore
    const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
    if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
          generationConfig: { temperature: 0.7 }
        }),
      }
    );

    if (!geminiRes.ok) throw new Error("Error en la IA: " + await geminiRes.text());

    const geminiData = await geminiRes.json();
    const aiResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponseText) throw new Error("Respuesta vacía de Gemini");

    // 3. Insert AI response into course_comments
    // We do NOT use user_id because it's an AI response, we leave it null and rely on is_ai_response = true
    const { data: insertedComment, error: insertError } = await supabase
      .from('course_comments')
      .insert({
        course_id: courseId,
        unit_index: unitIndex,
        lesson_index: lessonIndex,
        content: aiResponseText.trim(),
        is_ai_response: true,
        ai_prompt_metadata: { responded_to: commentId }
      })
      .select('*, profiles(full_name)')
      .single();

    if (insertError) throw new Error("Error al guardar respuesta IA: " + insertError.message);

    return new Response(JSON.stringify(insertedComment), { headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
