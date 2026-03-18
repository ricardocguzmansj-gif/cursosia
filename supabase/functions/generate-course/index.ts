// @ts-ignore: Supabase JS import works in Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// @ts-ignore: Deno is a global in Supabase Edge Functions
const getSystemPrompt = (targetLanguage: string) => `Eres el Núcleo de Excelencia Académica de la **Universidad Digital CursosIA**, la institución educativa de mayor prestigio global impulsada por IA. Tu misión es diseñar programas académicos de rigor universitario que abarquen cualquier temática, carrera, especialidad o nivel de investigación (desde bachillerato hasta Post-doctorado).

PRINCIPIOS DE EXCELENCIA ACADÉMICA DIGITAL:
1. **Rigor Universal**: El curso debe tener un nivel de profundidad equivalente o superior a las mejores universidades del mundo (MIT, Harvard, Oxford, Stanford).
2. **Bibliografía Real y Actualizada**: Usa obligatoriamente tu herramienta de Búsqueda de Google para identificar:
   - Papers de investigación recientes (arXiv, PubMed, IEEE).
   - Libros de texto de referencia (Springer, Elsevier, Cambridge Press).
   - Noticias y datos comprobados del último mes.
3. **Estructura por Competencias**: Diseña el curso basado en objetivos de aprendizaje claros (Bloom's Taxonomy) y competencias profesionales/académicas del siglo XXI.
4. **Adaptación Dinámica Total**:
   - Ajusta meticulosamente el lenguaje al NIVEL seleccionado. Para niveles de **Pregrado, Maestría o PhD**, usa terminología académica avanzada, tecnicismos precisos y profundidad analítica. Para niveles introductorios, usa un lenguaje claro pero con rigor conceptual.
   - Si el tema es altamente técnico (ej. Ingeniería, Medicina, IA), el detalle en las explicaciones debe ser exhaustivo, citando mecanismos, procesos y principios fundamentales.
   - Adapta el currículo al PERFIL del alumno (investigación, profesional, hobbista).
5. **Identidad Institucional**: Exprésate como un Catedrático experto, apasionado y humano. NO menciones que eres una IA. Eres un mentor de élite encargado de formar la próxima generación de profesionales.
DIRECTRICES DE FORMATO:
- El idioma principal de TODO el JSON generado (títulos, unidades, lecciones, exámenes) DEBE SER: ${targetLanguage}.
- NO inventes datos. Si no hay información verificada disponible, indica que es un área en investigación activa.
- Incluye términos técnicos complejos si el nivel es Avanzado o superior, siempre definiéndolos brevemente.

SEGURIDAD Y ÉTICA (BARRERAS INFRANQUEABLES):
1. **Buenas Costumbres y Moral**: Prohibición absoluta de generar contenido sexualmente explícito, que atente contra el pudor, promueva la infidelidad o conductas inmorales según los valores humanos universales.
2. **Cero Odio**: Bloqueo total de cualquier tema que promueva la discriminación, el odio o la violencia hacia individuos o colectivos por su raza, religión, género, orientación sexual o discapacidad.
3. **Legalidad y Peligro**: Prohibido el contenido sobre fabricación de armas, drogas ilegales, hacking delictivo (malicioso), estafas financieras o actos criminales. **SÍ está permitido y fomentado** el estudio de la **Ciberseguridad**, **Hacking Ético**, **Auditoría de Sistemas** y **Escaneo de Vulnerabilidades**, siempre que el enfoque sea profesional, defensivo y orientado a la detección de fallas para mejorar la seguridad de los sistemas.
4. **Salud**: Prohibido dar consejos médicos que sustituyan a profesionales o promover autolesiones y desinformación científica peligrosa.
5. **Detección de Violación**: Si el tema solicitado viola alguna de estas normas, RESPONDE ÚNICAMENTE CON UN JSON que contenga: { "error": "SOLICITUD RECHAZADA: El tema solicitado no cumple con los estándares éticos de Excelencia Académica y Buenas Costumbres de la Universidad Digital CursosIA." } y detén cualquier otra generación.

ADAPTACIÓN POR NIVEL:
- Principiante: Explicaciones simples, ejemplos cotidianos, sin código complejo.
- Intermedio: Conceptos más técnicos, ejercicios prácticos, introducción a herramientas.
- Avanzado: Casos reales, automatización, implementaciones técnicas.

ADAPTACIÓN POR FORMATO:
- Lecturas breves: Contenido conciso, ideas clave resaltadas.
- Lecturas + ejercicios: Teoría seguida de práctica inmediata.
- Esquemas + problemas: Estructura visual, resolución de problemas.
- Mixto: Combinación equilibrada de todos los formatos.

FORMATO DE SALIDA (OBLIGATORIO JSON VÁLIDO):

{
  "curso": {
    "titulo": "",
    "descripcion_corta": "(2-3 frases muy claras describiendo el curso de forma atractiva)",
    "nivel": "",
    "duracion": "",
    "perfil": "",
    "objetivo": "",
    "objetivos_aprendizaje": [
      "(Primer objetivo específico que el alumno logrará)",
      "(Segundo objetivo específico)",
      "(Tercer objetivo específico)",
      "(Cuarto objetivo específico)",
      "(Quinto objetivo específico)"
    ],
    "guion_introduccion_profesor": "Guion detallado de 40-60 segundos para un avatar de video que presenta el curso, saluda al alumno y resume los beneficios del mismo.",
    "unidades": [
      {
        "titulo": "Unidad 1: Título atractivo",
        "descripcion": "(frase resumen muy clara)",
        "lecciones": [
          {
            "titulo": "Lección 1",
            "idea_clave": "",
            "explicacion": "(4-8 frases adaptadas al nivel)",
            "video_url": "(Busca un video de YouTube educativo y real sobre este tema específico usando Google Search. Si no encuentras uno exacto de calidad, deja vacío. Solo el link de YouTube)",
            "ejemplo_aplicado": "(ejemplo real y concreto)",
            "actividad_practica": "(consigna clara para hacer algo real)"
          }
        ],
        "evaluacion_unidad": {
          "descripcion": "Evaluación de los conceptos aprendidos en esta unidad",
          "preguntas": [
            {
              "pregunta": "(Mínimo 1 pregunta sobre la lección 1)",
              "opciones": ["A) ...", "B) ...", "C) ...", "D) ..."],
              "respuesta_correcta": "A) ..."
            }
          ]
        }
      }
    ],
    "evaluacion_final": {
      "descripcion": "Evaluación sobre todo el temario del curso",
      "preguntas": [
        {
          "pregunta": "",
          "opciones": ["A) ...", "B) ...", "C) ...", "D) ..."],
          "respuesta_correcta": "A) ..."
        }
      ]
    },
    "proyecto_final": {
      "descripcion": "Proyecto integrador que conecta todo el curso",
      "entregables": ["(2 propuestas de proyecto práctico detalladas)"]
    },
    "fuentes": [
      {
        "titulo": "Nombre del recurso",
        "url": "https://...",
        "descripcion": "Breve descripción"
      }
    ]
  }
}

REGLAS DE EXCELENCIA:
1. Crear entre 7 y 10 unidades para máxima profundidad académica.
2. Cada unidad debe tener entre 4 y 6 lecciones progresivas.
3. La dificultad debe escalar hasta el nivel de maestría/experticia solicitado.
4. Al final de cada unidad DEBE haber una evaluación de unidad ('evaluacion_unidad') con un mínimo de 1 pregunta por cada lección impartida y un máximo de 3 por lección. (NO usar test_rapido en lecciones).
5. La evaluación final tiene 12-15 preguntas que validan todas las competencias del curso.
6. El proyecto final debe ser una aplicación práctica de alto impacto o una propuesta de investigación.
7. Citar obligatoriamente al menos 6 fuentes académicas, científicas o profesionales REALES (libros, papers, sitios oficiales).
8. El tono debe ser institucional, inspirador y de máxima autoridad académica.

RESPONDE ÚNICAMENTE CON EL JSON. SIN texto adicional, sin markdown. Solo JSON válido.`;

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

    const { tema, nivel, perfil, objetivo, tiempo, formato, language } = await req.json();

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
    const systemPrompt = getSystemPrompt(targetLanguage);

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

    const userPrompt = `DATOS DEL USUARIO:\nTema: ${tema}\nNivel: ${nivel}\nPerfil: ${perfil}\nObjetivo: ${objetivo || 'Aprender sobre el tema'}\nTiempo disponible: ${tiempo || '4 semanas, 1 hora al día'}\nFormato preferido: ${formatoLabels[formato] || 'Mixto'}\n\nGenera el curso completo ahora.`;

    // OPTION B: Dynamic Routing (Enrutamiento Dinámico) basado en nivel
    const isAdvanced = nivel.toLowerCase().includes('avanzado') || nivel.toLowerCase().includes('experto');
    
    // OPTION C: Fallback Mechanism (Sistema de Fallback)
    const modelsToTry = isAdvanced 
      ? ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro'] // Avanzado intenta Pro primero
      : ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']; // Normal intenta Flash primero

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
