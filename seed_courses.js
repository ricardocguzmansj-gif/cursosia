const fs = require('fs');

const adminId = "7242b415-7c49-4b6a-9fc8-3434fadec09f";

const topics = [
  "Inteligencia Artificial aplicada",
  "Machine Learning",
  "Prompt Engineering (uso de IA generativa)",
  "Desarrollo Full Stack",
  "Programación con Python",
  "Desarrollo Web (HTML, CSS, JS)",
  "Desarrollo de Apps móviles",
  "Cloud Computing (AWS, Google Cloud)",
  "DevOps y automatización",
  "Ciberseguridad ofensiva y defensiva"
];

const levels = ["Principiante", "Intermedio", "Avanzado"];

let sql = "INSERT INTO courses (user_id, title, topic, level, profile, objective, duration, daily_time, is_published, content) VALUES \n";

let values = [];

topics.forEach((topic) => {
  levels.forEach((level) => {
    const title = `${topic}`; 
    
    // Crear syllabus template
    const syllabus = {
      curso: {
        titulo: `${topic} (${level})`,
        unidades: [
          {
            titulo: "Unidad 1: Fundamentos y Conceptos Clave",
            lecciones: [
              { titulo: `1.1: ¿Qué es ${topic}?` },
              { titulo: `1.2: Historia y Evolución en el ámbito de ${level}` },
              { titulo: `1.3: Primeros pasos` }
            ]
          },
          {
            titulo: "Unidad 2: Herramientas y Práctica",
            lecciones: [
              { titulo: "2.1: Configuración del entorno de trabajo" },
              { titulo: "2.2: Ejercicios guiados" },
              { titulo: "2.3: Desafío práctico modular" }
            ]
          },
          {
            titulo: "Unidad 3: Escenarios Reales y Proyecto",
            lecciones: [
              { titulo: "3.1: Casos de estudio interactivos" },
              { titulo: "3.2: Proyecto Integrador final" }
            ]
          }
        ]
      }
    };

    const contentStr = JSON.stringify(syllabus).replace(/'/g, "''"); // Escape single quotes

    values.push(`('${adminId}', '${title.replace(/'/g, "''")}', '${topic.replace(/'/g, "''")}', '${level}', 'Estudiante / Profesional', 'Adquirir habilidades en ${topic}', '4 semanas', '1 hora', true, '${contentStr}')`);
  });
});

sql += values.join(",\n") + ";";

fs.writeFileSync("bulk_insert.sql", sql);
console.log("✅ Archivo bulk_insert.sql corregido y regenerado.");
