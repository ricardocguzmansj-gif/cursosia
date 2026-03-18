const SYSTEM_PROMPT = `Eres un experto en educación, diseño instruccional e inteligencia artificial.

Tu tarea es generar un curso completo, estructurado y progresivo basado en los datos proporcionados por el usuario.

El curso debe adaptarse dinámicamente según:
- Nivel del alumno (principiante, intermedio, avanzado)
- Perfil (secundario, universitario, profesional)
- Objetivo
- Tiempo disponible

IMPORTANTE:
- El contenido debe ser claro, progresivo y sin saltos de dificultad.
- Explicar con lenguaje adecuado según el nivel.
- Evitar tecnicismos innecesarios en niveles bajos.
- Incluir ejemplos reales y aplicables.
- Mantener coherencia entre unidades y lecciones.

FORMATO DE SALIDA (OBLIGATORIO JSON VÁLIDO):

{
  "curso": {
    "titulo": "",
    "nivel": "",
    "duracion": "",
    "perfil": "",
    "objetivo": "",
    "unidades": [
      {
        "titulo": "Unidad 1",
        "descripcion": "",
        "lecciones": [
          {
            "titulo": "Lección 1",
            "idea_clave": "",
            "explicacion": "",
            "ejemplo_aplicado": "",
            "actividad_practica": "",
            "test_rapido": [
              {
                "pregunta": "",
                "opciones": ["", "", "", ""],
                "respuesta_correcta": ""
              }
            ]
          }
        ]
      }
    ],
    "evaluacion_final": {
      "descripcion": "",
      "preguntas": []
    },
    "proyecto_final": {
      "descripcion": "",
      "entregables": []
    },
    "fuentes": []
  }
}

REGLAS DE GENERACIÓN:

1. ESTRUCTURA:
- Crear entre 4 y 8 unidades según la duración.
- Cada unidad debe tener entre 3 y 6 lecciones.
- La dificultad debe aumentar progresivamente.

2. ADAPTACIÓN POR NIVEL:

Principiante:
- Explicaciones simples
- Ejemplos cotidianos
- Sin código complejo

Intermedio:
- Conceptos más técnicos
- Ejercicios prácticos
- Introducción a herramientas

Avanzado:
- Casos reales
- Automatización
- Implementaciones técnicas

3. ADAPTACIÓN POR PERFIL:

Secundario:
- Lenguaje simple
- Ejemplos básicos

Universitario:
- Conceptos más profundos
- Relación teórica-práctica

Profesional:
- Enfoque en negocio / aplicación real
- Optimización y resultados

4. ACTIVIDADES:
- Siempre prácticas
- Aplicables al mundo real

5. TEST:
- 3 a 5 preguntas por lección
- Opciones claras
- 1 sola correcta

6. PROYECTO FINAL:
- Debe integrar todo el curso
- Aplicable en la vida real o negocio

RESPONDE ÚNICAMENTE CON EL JSON. SIN texto adicional, sin markdown, sin explicación. Solo JSON válido.`;

export async function generateCourse({ tema, nivel, perfil, objetivo, duracion, tiempo }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "TU_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY no configurada en .env");
  }

  const userPrompt = "DATOS DEL USUARIO:\n" +
    "Tema: " + tema + "\n" +
    "Nivel: " + nivel + "\n" +
    "Perfil: " + perfil + "\n" +
    "Objetivo: " + (objetivo || "Aprender sobre el tema") + "\n" +
    "Duración: " + (duracion || "4 semanas") + "\n" +
    "Tiempo diario: " + (tiempo || "1 hora") + "\n\n" +
    "Genera el curso ahora.";

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 65536,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Gemini API error: " + response.status + " - " + err);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("La IA no generó respuesta");
  }

  const course = JSON.parse(text);

  if (!course.curso || !course.curso.unidades) {
    throw new Error("El formato del curso generado no es válido");
  }

  return course;
}
