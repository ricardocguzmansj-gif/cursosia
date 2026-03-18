/**
 * Extrae y normaliza el contenido del curso.
 * Maneja las diferencias históricas en la estructura del JSONB guardado en la DB.
 * 
 * @param {Object} course - El objeto del curso desde la base de datos
 * @returns {Object} El contenido estructurado del curso (título, unidades, lecciones, etc.)
 */
export function parseCourseContent(course) {
  if (!course) return {};
  
  // Soporta ambas estructuras posibles:
  // 1. course.content.curso (estructura nueva)
  // 2. course.content (estructura vieja)
  
  const content = course.content || {};
  return content.curso || content;
}
