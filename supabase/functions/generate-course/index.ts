import { createClient } from "jsr:@supabase/supabase-js@2";

// @ts-ignore: Deno is a global in Supabase Edge Functions
const getSystemPrompt = (targetLanguage: string, mode: string = 'full') => {
  const baseInstructions = `Eres el Núcleo de Excelencia Académica de la **Universidad Digital CursosIA**, la institución educativa de mayor prestigio global impulsada por IA. Tu misión es diseñar programas académicos de rigor universitario que abarquen cualquier temática, carrera, especialidad o nivel de investigación (desde bachillerato hasta Post-doctorado).

PRINCIPIOS DE EXCELENCIA ACADÉMICA DIGITAL:
1. **Rigor Universal**: El curso debe tener un nivel de profundidad equivalente o superior a las mejores universidades del mundo (MIT, Harvard, Oxford).
2. **Bibliografía Real y Actualizada**: Usa obligatoriamente tu herramienta de Búsqueda de Google para identificar papers de investigación recientes (arXiv, IEEE) o libros de referencia.
3. **Estructura por Competencias**: Basado en objetivos de aprendizaje estricto.
4. **ENFOQUE 100% PRÁCTICO**: El curso debe formar capacidades laborales y de aplicación real. Cada concepto debe aterrizarse en un cómo-se-hace en la industria.

DIRECTRICES DE FORMATO:
- El idioma principal DEBE SER: ${targetLanguage}.
- NO inventes datos. Si no hay información verificada disponible, indica que es un área en investigación activa.
- RESPONDE ÚNICAMENTE CON EL JSON. SIN texto adicional, sin markdown.`;

  if (mode === 'syllabus') {
    return `${baseInstructions}

TAREA: Genera EXCLUSIVAMENTE la estructura del Temario (Syllabus) del curso. NO generes el contenido de las lecciones todavía.

REGLAS:
1. Crear entre 4 & 7 unidades para máxima organización académica.
2. Cada unidad debe tener entre 3 & 5 lecciones.
3. Incluir el nombre del Proyecto Final que se resolverá al concluir.

FORMATO DE SALIDA (OBLIGATORIO JSON VÁLIDO):
{
  "curso": {
    "titulo": "Título atractivo",
    "descripcion_corta": "(2-3 frases muy claras)",
    "nivel": "",
    "duracion": "",
    "perfil": "",
    "objetivo": "",
    "objetivos_aprendizaje": ["Objetivo 1", "Objetivo 2"],
    "guion_introduccion_profesor": "Guion de 40s para presentación",
    "unidades": [
      {
        "titulo": "Unidad 1: ...",
        "descripcion": "...",
        "lecciones": [
          { "titulo": "Lección 1: ..." }
        ]
      }
    ],
    "proyecto_final_plan": "Descripción de lo que consistirá el proyecto final práctico"
  }
}`;
  }

  if (mode === 'expand-lesson') {
    return `${baseInstructions}

TAREA: Eres el docente expandiendo una lección específica. Se te proporcionará el Temario para el contexto.
Debes generar contenido EXHAUSTIVO, DENSO y CORPORATIVO para la lección solicitada.

FORMATO DE SALIDA (OBLIGATORIO JSON VÁLIDO):
{
  "idea_clave": "Idea principal resumida",
  "explicacion": "(Explicación densa de 6-12 párrafos, altamente práctica. Si es técnico, INCLUYE bloques de código real. Enfocada a la bolsa laboral laboral)",
  "video_url": "(Busca un video de YouTube educativo y real sobre este tema específico usando Google. Deja vacío si no hay calidad)",
  "ejemplo_aplicado": "(Ejemplo real concreto de aplicación en una empresa o proyecto)",
  "actividad_practica": "(Consigna clara de un desafío práctico intenso para el alumno)",
  "pregunta_test": {
    "pregunta": "(Una pregunta de opción múltiple basada en este contenido)",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "respuesta_correcta": "A) ..."
  }
}`;
  }

  if (mode === 'placement-test') {
    return `${baseInstructions}

TAREA: Genera un Test de Nivelación de 5 preguntas de opción múltiple para evaluar si el alumno tiene los conocimientos para el tema y nivel solicitados:
- Nivel Objetivo: El indicado.
- Tema: El tema del curso.

FORMATO DE SALIDA (OBLIGATORIO JSON VÁLIDO):
{
  "preguntas": [
    {
      "pregunta": "(Pregunta de opción múltiple)",
      "options": ["A) ...", "b) ...", "c) ...", "d) ..."],
      "respuesta_correcta": "A"
    }
  ]
}`;
  }

  return `${baseInstructions}
(Modo Completo Legacy - Estructura estandarizada)`;
};;

const allowedOrigins = [
  'https://cursosia.digitalsaasfactory.com',
  'https://cursosia.pages.dev',
  'http://localhost:5173'
];

function getCorsHeaders(reqOrigin: string | null) {
  // Allow preview deployments by checking suffix, else default to origin or '*'
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

// @ts-ignore: Deno is global in Supabase
Deno.serve(async (req: Request) => {
  const reqOrigin = req.headers.get('Origin');
  const headers = getCorsHeaders(reqOrigin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Auth header missing");
      return new Response(JSON.stringify({ error: 'No autorizado - Cabecera faltante' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
// @ts-ignore: Deno is global in Supabase
      Deno.env.get('SUPABASE_URL') ?? '',
// @ts-ignore: Deno is global in Supabase
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth Error:", userError?.message || "User not found");
      return new Response(JSON.stringify({ error: 'Token inválido', details: userError?.message }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // ======== ADMIN ROLE CHECK ========
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.error("Admin Check Failed:", profileError?.message || "Not admin", "Role:", profile?.role);
      return new Response(JSON.stringify({ error: 'Solo los administradores pueden generar cursos' }), {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    // ======== END ADMIN CHECK ========

    const { mode = 'full', tema, nivel, perfil, objetivo, tiempo, formato, language, current_syllabus, unit_index, lesson_index } = await req.json();

    if (!tema || !nivel || !perfil) {
      return new Response(JSON.stringify({ error: 'Tema, nivel y perfil son requeridos' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const languageMap: Record<string, string> = {
      es: 'Español',
      en: 'Inglés (English)',
      pt: 'Portugués (Português)'
    };
    const targetLanguage = languageMap[(language || 'es').toLowerCase()] || 'Español';
    const systemPrompt = getSystemPrompt(targetLanguage, mode);

// @ts-ignore: Deno is global in Supabase
    const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const formatoLabels: Record<string, string> = {
      lecturas_breves: 'Lecturas breves',
      lecturas_ejercicios: 'Lecturas + ejercicios',
      esquemas_problemas: 'Esquemas + problemas',
      mixto: 'Mixto'
    };

    let userPrompt = '';
    if (mode === 'syllabus') {
      userPrompt = `DATOS DE DISEÑO:\nTema: ${tema}\nNivel: ${nivel}\nPerfil: ${perfil}\nObjetivo: ${objetivo || 'Aprender sobre el tema'}\nTiempo disponible: ${tiempo || '4 semanas'}\nFormato preferido: ${formatoLabels[formato] || 'Mixto'}\n\nGenera el Temario (Syllabus) estructurado del curso ahora.`;
    } else if (mode === 'expand-lesson') {
      const selectedUnit = current_syllabus?.curso?.unidades?.[unit_index];
      const selectedLesson = selectedUnit?.lecciones?.[lesson_index];
      
      userPrompt = `CONTEXTO DEL CURSO:\nCurso: ${current_syllabus?.curso?.titulo}\nUnidad ${unit_index + 1}: ${selectedUnit?.titulo}\nLección ${lesson_index + 1}: ${selectedLesson?.titulo}\n\nTAREA: Expande esta lección de forma exhaustiva, práctica y realista.`;
    } else {
      userPrompt = `DATOS DEL USUARIO:\nTema: ${tema}\nNivel: ${nivel}\nPerfil: ${perfil}\nObjetivo: ${objetivo || 'Aprender sobre el tema'}\n\nGenera el curso completo ahora.`;
    }

    // OPTION B: Dynamic Routing (Enrutamiento Dinámico) basado en nivel
    const isAdvanced = nivel.toLowerCase().includes('avanzado') || nivel.toLowerCase().includes('experto');
    
    // OPTION C: Fallback Mechanism (Sistema de Fallback)
    const modelsToTry = isAdvanced 
      ? ['gemini-3.1-pro', 'gemini-3.1-flash-lite', 'gemini-1.5-pro'] // Avanzado intenta Pro primero
      : ['gemini-3.1-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro']; // Normal intenta Flash-Lite primero

    let geminiRes;
    let geminiData;
    let successfulModel = null;
    const fallbackErrors: string[] = [];

    for (const model of modelsToTry) {
      console.log(`🚀 Intentando generación con el modelo: ${model}...`);
      try {
        geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
              tools: [{ googleSearch: {} }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 65536,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          geminiData = await geminiRes.json();
          successfulModel = model;
          break; // Salimos del bucle si fue exitoso
        } else {
          const errText = await geminiRes.text();
          console.error(`⚠️ Error con modelo ${model} (${geminiRes.status}):`, errText);
          fallbackErrors.push(`[${model}: HTTP ${geminiRes.status} - ${errText.substring(0, 100)}]`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Excepción con modelo ${model}:`, errorMsg);
        fallbackErrors.push(`[${model}: Excepción - ${errorMsg}]`);
      }
    }

    if (!successfulModel || !geminiData) {
      console.error("🛑 Todos los modelos de Gemini fallaron:", fallbackErrors.join(', '));
      return new Response(JSON.stringify({ 
        error: 'No se pudo generar el curso. Todos los modelos de IA fallaron.', 
        details: fallbackErrors 
      }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Generación exitosa usando el modelo: ${successfulModel}`);
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(JSON.stringify({ error: 'No se generó respuesta' }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Clean text by stripping markdown JSON fences if Gemini included them
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let courseContent;
    try {
      courseContent = JSON.parse(cleanText);
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: 'Formato de curso inválido', 
        details: [cleanText.substring(0, 500)] 
      }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'expand-lesson' || mode === 'placement-test' || mode === 'syllabus-only') {
      return new Response(JSON.stringify(courseContent), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (!courseContent.curso || !courseContent.curso.unidades) {
      return new Response(JSON.stringify({ error: 'Formato de curso inválido' }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const { data: course, error: dbError } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        title: courseContent.curso.titulo,
        topic: tema,
        level: nivel,
        profile: perfil,
        objective: objetivo || '',
        duration: tiempo || '',
        daily_time: '',
        content: courseContent,
      })
      .select()
      .single();

    if (dbError) {
      return new Response(JSON.stringify({ error: 'Error guardando curso: ' + dbError.message }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Auto-enroll the creator so it appears in their dashboard
    await supabase
      .from('course_enrollments')
      .insert({
        user_id: user.id,
        course_id: course.id,
        source: 'free'
      });

    return new Response(JSON.stringify(course), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
