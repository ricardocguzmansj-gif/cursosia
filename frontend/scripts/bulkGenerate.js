import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini API Key from your .env
const GEMINI_API_KEY = "AIzaSyB8j6G8NTBNktKF3monh-aJAwHSCnU09AM";

// Helper functions for prompts
const getSystemPrompt = (targetLanguage, mode = 'full') => {
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

FORMATO DE SALIDA (OBLIGATORIO JSON VÁLIDO EN CADA PROPIEDAD):
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

FORMATO DE SALIDA (OBLIGATORIO JSON VÁLIDO EN CADA PROPIEDAD):
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

  return baseInstructions;
};

async function callGeminiAPI(systemPrompt, userPrompt, isAdvanced) {
  const modelsToTry = isAdvanced 
    ? ['gemini-2.5-pro', 'gemini-1.5-pro'] 
    : ['gemini-2.5-flash', 'gemini-1.5-flash'];

  let maxRetries = 3;

  for (const model of modelsToTry) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
              tools: [{ googleSearch: {} }],
              generationConfig: {
                temperature: 0.7
              },
            }),
          }
        );

        if (response.status === 429) {
          console.log(`[Rate Limit 429] Esperando 10 segundos antes de reintentar (Modelo: ${model}, Intento: ${i+1})...`);
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }

        if (!response.ok) {
            const errBody = await response.text();
            console.log(`[Error HTTP ${response.status}] ${errBody}`);
            break; 
        }

        const data = await response.json();
        let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(rawText);
        }

      } catch (e) {
        console.error(`[Fetch Error] ${e.message}`);
        if(e.name === 'SyntaxError') break; 
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  throw new Error("Failed to generate content after all retries and models.");
}

async function generateCourseComplete(course) {
  console.log(`\n======================================================`);
  console.log(`🚀 INICIANDO GENERACIÓN: ${course.topic} (${course.level})`);
  
  const targetLanguage = 'Español';
  const isAdvanced = course.level.toLowerCase().includes('avanzado') || course.level.toLowerCase().includes('experto');

  console.log(`[1/2] Generando Syllabus...`);
  const sysSyllabus = getSystemPrompt(targetLanguage, 'syllabus');
  const userSyllabus = `DATOS DE DISEÑO:\nTema: ${course.topic}\nNivel: ${course.level}\nPerfil: ${course.profile}\nObjetivo: ${course.objective || 'Aprender sobre el tema'}\n\nGenera el Temario (Syllabus) estructurado del curso ahora.`;
  
  const syllabusJson = await callGeminiAPI(sysSyllabus, userSyllabus, isAdvanced);
  
  if (!syllabusJson.curso || !syllabusJson.curso.unidades) {
      throw new Error("Syllabus generation returned invalid structure.");
  }

  console.log(`[2/2] Expandiendo lecciones (${syllabusJson.curso.unidades.length} unidades)...`);
  const sysLesson = getSystemPrompt(targetLanguage, 'expand-lesson');

  for (let u = 0; u < syllabusJson.curso.unidades.length; u++) {
    const unidad = syllabusJson.curso.unidades[u];
    if(!unidad.lecciones) continue;

    for (let l = 0; l < unidad.lecciones.length; l++) {
      const leccion = unidad.lecciones[l];
      console.log(`     > Generando Unidad ${u+1}, Lección ${l+1}: ${leccion.titulo}`);
      
      const userLesson = `CONTEXTO DEL CURSO:\nCurso: ${syllabusJson.curso.titulo}\nUnidad ${u + 1}: ${unidad.titulo}\nLección ${l + 1}: ${leccion.titulo}\n\nTAREA: Expande esta lección de forma exhaustiva, práctica y realista.`;
      
      try {
          const lessonData = await callGeminiAPI(sysLesson, userLesson, isAdvanced);
          unidad.lecciones[l] = { ...leccion, ...lessonData };
          await new Promise(r => setTimeout(r, 2000)); // Sleep 2 seconds between lessons
      } catch (err) {
          console.error(`       [!] Error expandiendo lección: ${err.message}. Dejando vacía.`);
      }
    }
  }

  console.log(`✅ Curso '${course.topic}' generado con éxito!`);
  return syllabusJson.curso;
}

async function main() {
  const coursesPath = path.join(__dirname, 'courses_to_generate.json');
  const coursesRaw = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
  
  // Test with first course only
  const courses = coursesRaw.slice(0, 1);

  const sqlFilePath = path.join(__dirname, 'updates.sql');
  fs.writeFileSync(sqlFilePath, '-- Bulk Update of courses\\n\\n', 'utf8');

  console.log(`Se procesarán ${courses.length} cursos en total.`);

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    try {
      const fullContent = await generateCourseComplete(course);
      
      const contentStr = JSON.stringify(fullContent).replace(/'/g, "''");
      const sqlCommand = `UPDATE courses SET content = '${contentStr}'::jsonb WHERE id = '${course.id}';\n`;
      
      fs.appendFileSync(sqlFilePath, sqlCommand, 'utf8');
    } catch (error) {
       console.error(`🚨 Error crítico procesando el curso ${course.id} (${course.topic}):`, error.message);
    }
  }

  console.log(`\n🎉 PROCESO COMPLETADO. El archivo updates.sql ha sido generado.`);
}

main();
