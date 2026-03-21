import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { parseCourseContent } from "../lib/courseHelper";

// Sub-componentes para manejar la estructura recursiva

function EvaluacionEditor({ evaluacion, onChange }) {
  if (!evaluacion) return null;

  const handlePreguntaChange = (idx, key, val) => {
    const newPreguntas = [...evaluacion.preguntas];
    newPreguntas[idx] = { ...newPreguntas[idx], [key]: val };
    onChange({ ...evaluacion, preguntas: newPreguntas });
  };

  const handleOpcionChange = (pIdx, oIdx, val) => {
    const newPreguntas = [...evaluacion.preguntas];
    const newOptions = [...newPreguntas[pIdx].opciones];
    newOptions[oIdx] = val;
    newPreguntas[pIdx] = { ...newPreguntas[pIdx], opciones: newOptions };
    onChange({ ...evaluacion, preguntas: newPreguntas });
  };

  const addPregunta = () => {
    onChange({
      ...evaluacion,
      preguntas: [...evaluacion.preguntas, { pregunta: "Nueva pregunta", opciones: ["A) Opción 1", "B) Opción 2", "C) Opción 3", "D) Opción 4"], respuesta_correcta: "A) Opción 1" }]
    });
  };

  const deletePregunta = (idx) => {
    const newP = [...evaluacion.preguntas];
    newP.splice(idx, 1);
    onChange({ ...evaluacion, preguntas: newP });
  };

  return (
    <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(108, 92, 231, 0.05)", borderRadius: "8px", border: "1px dashed rgba(108, 92, 231, 0.4)" }}>
      <h4 style={{ marginBottom: "0.5rem", color: "var(--accent-glow)" }}>📝 {evaluacion.descripcion || "Evaluación"}</h4>
      <div className="form-group" style={{ marginBottom: "1rem" }}>
        <label>Descripción de la Evaluación</label>
        <input 
          type="text" 
          className="input-field" 
          value={evaluacion.descripcion || ""} 
          onChange={e => onChange({ ...evaluacion, descripcion: e.target.value })} 
        />
      </div>

      {evaluacion.preguntas?.map((p, pIdx) => (
        <div key={pIdx} style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <h5>Pregunta {pIdx + 1}</h5>
            <button className="btn btn-outline" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", color: "#ff7675", borderColor: "#ff7675" }} onClick={() => deletePregunta(pIdx)}>Borrar Pregunta</button>
          </div>
          
          <input className="input-field" value={p.pregunta || ""} onChange={e => handlePreguntaChange(pIdx, "pregunta", e.target.value)} placeholder="Texto de la pregunta" style={{ marginBottom: "0.5rem" }} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
            {p.opciones?.map((opt, oIdx) => (
              <input key={oIdx} className="input-field" value={opt} onChange={e => handleOpcionChange(pIdx, oIdx, e.target.value)} placeholder={`Opción ${oIdx + 1}`} />
            ))}
          </div>

          <label style={{ fontSize: "0.9rem" }}>Respuesta Correcta (debe coincidir exacto con una opción):</label>
          <input className="input-field" value={p.respuesta_correcta || ""} onChange={e => handlePreguntaChange(pIdx, "respuesta_correcta", e.target.value)} />
        </div>
      ))}
      <button className="btn btn-secondary" onClick={addPregunta} style={{ padding: "0.5rem" }}>+ Añadir Pregunta</button>
    </div>
  );
}

function LeccionEditor({ leccion, idx, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: "var(--bg-glass-heavy)", border: "1px solid var(--border-color)", borderRadius: "8px", marginBottom: "0.5rem", overflow: "hidden" }}>
      <div 
        style={{ padding: "0.8rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: expanded ? "rgba(108, 92, 231, 0.1)" : "transparent" }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontWeight: 600 }}>Lección {idx + 1}: {leccion.titulo || "Sin título"}</span>
        <div>
          <span style={{ marginRight: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {expanded ? "▲ Cerrar" : "▼ Expandir"}
          </span>
          <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ padding: "0.2rem 0.6rem", fontSize: "0.8rem", borderColor: "#ff7675", color: "#ff7675" }}>
            X
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "1rem", borderTop: "1px solid var(--border-color)" }}>
          <div className="form-group">
            <label>Título de Lección</label>
            <input className="input-field" value={leccion.titulo || ""} onChange={e => onChange({ ...leccion, titulo: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Idea Clave</label>
            <input className="input-field" value={leccion.idea_clave || ""} onChange={e => onChange({ ...leccion, idea_clave: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Explicación Principal</label>
            <textarea className="input-field" style={{ minHeight: "150px", resize: "vertical" }} value={leccion.explicacion || ""} onChange={e => onChange({ ...leccion, explicacion: e.target.value })} />
          </div>
          <div className="form-group">
            <label>URL Video (YouTube)</label>
            <input className="input-field" value={leccion.video_url || ""} onChange={e => onChange({ ...leccion, video_url: e.target.value })} placeholder="https://youtube.com/..." />
          </div>
          <div className="form-group">
            <label>Ejemplo Aplicado</label>
            <textarea className="input-field" value={leccion.ejemplo_aplicado || ""} onChange={e => onChange({ ...leccion, ejemplo_aplicado: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Actividad Práctica</label>
            <textarea className="input-field" value={leccion.actividad_practica || ""} onChange={e => onChange({ ...leccion, actividad_practica: e.target.value })} />
          </div>

          {/* Soporte Retrocompatible de test_rapido por leccion */}
          {leccion.test_rapido && (
             <EvaluacionEditor evaluacion={{ descripcion: "Test Rápido de la Lección", preguntas: leccion.test_rapido }} onChange={(eva) => onChange({ ...leccion, test_rapido: eva.preguntas })} />
          )}
        </div>
      )}
    </div>
  );
}

function UnidadEditor({ unidad, idx, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  const handleLessonChange = (lIdx, newLec) => {
    const newL = [...unidad.lecciones];
    newL[lIdx] = newLec;
    onChange({ ...unidad, lecciones: newL });
  };

  const handleAddLesson = () => {
    const newL = [...(unidad.lecciones || []), { titulo: "Nueva Lección", explicacion: "" }];
    onChange({ ...unidad, lecciones: newL });
    setExpanded(true);
  };

  const handleRemoveLesson = (lIdx) => {
    const newL = [...unidad.lecciones];
    newL.splice(lIdx, 1);
    onChange({ ...unidad, lecciones: newL });
  };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", marginBottom: "1rem", overflow: "hidden" }}>
       <div 
        style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: expanded ? "var(--bg-glass-heavy)" : "transparent" }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-primary)" }}>
          Unidad {idx + 1}: {unidad.titulo || "Nueva"}
        </span>
        <div>
           <span style={{ marginRight: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {expanded ? "▲ Ocultar Lecciones" : "▼ Ver Lecciones"}
          </span>
          <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ padding: "0.3rem 0.8rem", borderColor: "#ff7675", color: "#ff7675" }}>
            Borrar Unidad
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "1.5rem", paddingTop: "0.5rem" }}>
          <div className="form-group">
            <label>Título de Unidad</label>
            <input className="input-field" value={unidad.titulo || ""} onChange={e => onChange({ ...unidad, titulo: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Descripción de Unidad</label>
            <input className="input-field" value={unidad.descripcion || ""} onChange={e => onChange({ ...unidad, descripcion: e.target.value })} />
          </div>

          <h4 style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>📚 Lecciones</h4>
          {unidad.lecciones?.map((lec, lIdx) => (
            <LeccionEditor key={lIdx} leccion={lec} idx={lIdx} onChange={(newLec) => handleLessonChange(lIdx, newLec)} onRemove={() => handleRemoveLesson(lIdx)} />
          ))}
          <button className="btn btn-secondary btn-sm" onClick={handleAddLesson} style={{ marginTop: "0.5rem" }}>
            + Añadir Lección
          </button>

          {/* Evaluacion de Unidad */}
          <h4 style={{ marginTop: "2rem", marginBottom: "1rem" }}>📋 Evaluación de Unidad</h4>
          {unidad.evaluacion_unidad ? (
            <EvaluacionEditor 
              evaluacion={unidad.evaluacion_unidad} 
              onChange={eva => onChange({ ...unidad, evaluacion_unidad: eva })} 
            />
          ) : (
             <button className="btn btn-outline" onClick={() => onChange({ ...unidad, evaluacion_unidad: { descripcion: "Evaluación Integrada", preguntas: [] } })}>
               + Activar Evaluación de Unidad Integral
             </button>
          )}

        </div>
      )}
    </div>
  );
}


export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [courseMetadata, setCourseMetadata] = useState(null); // title, topic, etc.
  const [contentObj, setContentObj] = useState(null); // parsed JSON 
  const [generatingSyllabus, setGeneratingSyllabus] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dbCourse = await api.getCourse(id);
      setCourseMetadata({
        title: dbCourse.title,
        topic: dbCourse.topic,
        level: dbCourse.level,
        profile: dbCourse.profile,
        objective: dbCourse.objective
      });
      
      const parsed = parseCourseContent(dbCourse);
      setContentObj(parsed);
    } catch (e) {
      toast.error("Error cargando editor de curso: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Pack Content
      const finalContent = { curso: contentObj }; // CursosIA stores {"curso": {...}} at root
      
      // 2. Perform Save
      await api.updateCourseData(id, {
        title: courseMetadata.title,
        topic: courseMetadata.topic,
        level: courseMetadata.level,
        profile: courseMetadata.profile,
        objective: courseMetadata.objective,
        content: finalContent
      });
      
      toast.success("¡Curso guardado exitosamente!");
      navigate(`/course/${id}`);
    } catch (e) {
      toast.error("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner" style={{ margin: "5rem auto" }}></div>;
  if (!contentObj) return <div style={{ textAlign: "center", padding: "5rem" }}>Contenido no válido.</div>;

  return (
    <div className="container" style={{ maxWidth: "1000px", padding: "2rem 1rem", paddingBottom: "8rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <button className="btn btn-outline" onClick={() => navigate(`/course/${id}`)} style={{ marginBottom: "1rem" }}>
            ← Volver al curso (Sin guardar)
          </button>
          <h1>🛠️ Editor de Curso</h1>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "💾 Guardar Todos los Cambios"}
        </button>
      </div>

      {/* METADATA FORM */}
      <section style={{ background: "var(--bg-card)", padding: "2rem", borderRadius: "16px", marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1.5rem" }}>Parámetros Generales</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label>Título / Nombre</label>
            <input className="input-field" value={courseMetadata.title} onChange={e => setCourseMetadata({...courseMetadata, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Nivel</label>
            <input className="input-field" value={courseMetadata.level} onChange={e => setCourseMetadata({...courseMetadata, level: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Perfil Ideal</label>
            <input className="input-field" value={courseMetadata.profile} onChange={e => setCourseMetadata({...courseMetadata, profile: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Tema de Búsqueda</label>
            <input className="input-field" value={courseMetadata.topic} onChange={e => setCourseMetadata({...courseMetadata, topic: e.target.value})} />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Objetivo Educativo Corto</label>
          <textarea className="input-field" value={courseMetadata.objective || ""} onChange={e => setCourseMetadata({...courseMetadata, objective: e.target.value})} />
        </div>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Guion de Introducción (Profesor IA)</label>
          <textarea className="input-field" value={contentObj.guion_introduccion_profesor || ""} onChange={e => setContentObj({...contentObj, guion_introduccion_profesor: e.target.value})} />
        </div>
      </section>

      {/* UNIDADES FORM */}
      <section>
        <h2 style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Estructura de Unidades
          <button 
            className="btn btn-secondary"
            onClick={() => setContentObj({ ...contentObj, unidades: [...(contentObj.unidades || []), { titulo: "Unidad Nueva", lecciones: [] }] })}
          >
            + Nueva Unidad
          </button>
        </h2>

        {(!contentObj.unidades || contentObj.unidades.length === 0) && (
          <div className="content-card glass" style={{ textAlign: "center", padding: "3rem", margin: "2rem 0" }}>
             <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✨</div>
             <h3 style={{ marginBottom: "1rem" }}>Generar Plan de Estudios desde Cero</h3>
             <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
               Usa la Inteligencia Artificial para crear un temario completo para este curso basado en sus parámetros generales.
             </p>
             <button 
               className="btn btn-accent btn-lg"
               disabled={generatingSyllabus}
               onClick={async () => {
                 setGeneratingSyllabus(true);
                 try {
                   const result = await api.generateCourse({
                     mode: 'syllabus-only',
                     tema: courseMetadata.topic || courseMetadata.title,
                     nivel: courseMetadata.level,
                     perfil: courseMetadata.profile,
                     objetivo: courseMetadata.objective,
                     tiempo: courseMetadata.duration || "2 horas"
                   });
                   
                   if (result.content && result.content.curso) {
                     setContentObj(result.content.curso);
                     toast.success("¡Plan de estudios generado!");
                   }
                 } catch (e) {
                   toast.error("Error al generar: " + e.message);
                 } finally {
                   setGeneratingSyllabus(false);
                 }
               }}
             >
               {generatingSyllabus ? "⏳ Diseñando Syllabus..." : "🪄 Generar Temario con IA"}
             </button>
          </div>
        )}

        {contentObj.unidades?.map((u, uIdx) => (
          <UnidadEditor 
            key={uIdx} 
            unidad={u} 
            idx={uIdx} 
            onChange={(newU) => {
              const newUnidades = [...contentObj.unidades];
              newUnidades[uIdx] = newU;
              setContentObj({ ...contentObj, unidades: newUnidades });
            }}
            onRemove={() => {
              if (window.confirm("¿Seguro que deseas borrar toda la Unidad " + (uIdx + 1) + "?")) {
                const newUnidades = [...contentObj.unidades];
                newUnidades.splice(uIdx, 1);
                setContentObj({ ...contentObj, unidades: newUnidades });
              }
            }}
          />
        ))}
      </section>

      {/* EVAL FINAL Y PROYECTO */}
      <section style={{ background: "var(--bg-glass-heavy)", padding: "2rem", borderRadius: "16px", marginTop: "2rem" }}>
        <h2>🏁 Evaluación Final</h2>
        <EvaluacionEditor 
          evaluacion={contentObj.evaluacion_final}
          onChange={(eva) => setContentObj({ ...contentObj, evaluacion_final: eva })}
        />

        <h2 style={{ marginTop: "2rem" }}>🔬 Proyecto Final</h2>
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Descripción del Proyecto</label>
          <textarea className="input-field" value={contentObj.proyecto_final?.descripcion || ""} onChange={e => setContentObj({...contentObj, proyecto_final: { ...contentObj.proyecto_final, descripcion: e.target.value }})} />
        </div>
      </section>

      {/* Sticky Bottom Save Bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--bg-dark)", borderTop: "1px solid var(--border-color)", padding: "1rem 2rem", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving} style={{ width: "300px" }}>
          {saving ? "Procesando..." : "💾 Guardar Todos los Cambios"}
        </button>
      </div>

    </div>
  );
}
