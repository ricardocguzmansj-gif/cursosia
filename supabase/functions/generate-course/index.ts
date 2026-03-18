import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SYSTEM_PROMPT = `Eres un profesor y diseñador instruccional experto. Tu tarea es generar un curso completo, estructurado y progresivo.

IMPORTANTE:
- Adapta la dificultad al NIVEL y al PERFIL del alumno.
- Usa el OBJETIVO principal y el TIEMPO disponible para ajustar la profundidad y el número de unidades.
- Adapta el FORMATO según la preferencia del alumno.
- El contenido debe ser claro, progresivo y sin saltos de dificultad.
- Usa un tono didáctico, cercano y claro.
- Evita párrafos gigantes; mejor frases cortas y bien puntuadas.
- Cuando el tema sea complejo, usa analogías y ejemplos intuitivos sin perder rigor.
- NO hables de "modelo", "IA" ni "inteligencia artificial". Exprésate como un profesor humano.
- El idioma SIEMPRE debe ser español.
- Incluye ejemplos reales y aplicables.

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
    "descripcion": "(2-3 frases describiendo el curso)",
    "nivel": "",
    "duracion": "",
    "perfil": "",
    "objetivo": "",
    "objetivos_aprendizaje": ["(5-7 objetivos específicos que el alumno logrará)"],
    "unidades": [
      {
        "titulo": "Unidad 1: Título atractivo",
        "descripcion": "(frase resumen muy clara)",
        "lecciones": [
          {
            "titulo": "Lección 1",
            "idea_clave": "",
            "explicacion": "(4-8 frases adaptadas al nivel)",
            "ejemplo_aplicado": "(ejemplo real y concreto)",
            "actividad_practica": "(consigna clara para hacer algo real)",
            "test_rapido": [
              {
                "pregunta": "",
                "opciones": ["A) ...", "B) ...", "C) ...", "D) ..."],
                "respuesta_correcta": "A) ..."
              }
            ]
          }
        ]
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

REGLAS:
1. Crear entre 6 y 8 unidades con títulos atractivos (no genéricos).
2. Cada unidad tiene entre 3 y 5 lecciones.
3. La dificultad aumenta progresivamente.
4. Cada lección tiene 3-5 preguntas de test rápido.
5. La evaluación final tiene 8-10 preguntas sobre todo el temario.
6. El proyecto final tiene 2 propuestas aplicables.
7. Incluir al menos 5 fuentes reales y relevantes.

RESPONDE ÚNICAMENTE CON EL JSON. SIN texto adicional, sin markdown. Solo JSON válido.`;

const allowedOrigins = [
  'https://cursosia.digitalsaasfactory.com',
  'https://cursosia.pages.dev',
  'http://localhost:5173'
];

function getCorsHeaders(reqOrigin: string | null) {
  const origin = reqOrigin && allowedOrigins.includes(reqOrigin) 
    ? reqOrigin 
    : allowedOrigins[0];
    
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

Deno.serve(async (req: Request) => {
  const reqOrigin = req.headers.get('Origin');
  const headers = getCorsHeaders(reqOrigin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const { tema, nivel, perfil, objetivo, tiempo, formato } = await req.json();

    if (!tema || !nivel || !perfil) {
      return new Response(JSON.stringify({ error: 'Tema, nivel y perfil son requeridos' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
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

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: 'Gemini API error: ' + geminiRes.status + ' - ' + errText }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(JSON.stringify({ error: 'No se generó respuesta' }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const courseContent = JSON.parse(text);

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

    return new Response(JSON.stringify(course), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error interno' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
