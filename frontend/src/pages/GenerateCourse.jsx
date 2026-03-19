import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";

export default function GenerateCourse() {
  const [form, setForm] = useState({
    tema: "",
    nivel: "principiante",
    perfil: "",
    objetivo: "",
    tiempo: "",
    formato: "mixto"
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ stage: "", current: 0, total: 0 });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setProgress({ stage: "Diseñando Temario (Syllabus)... 📋", current: 0, total: 0 });

    try {
      // 1. Generar Syllabus
      const courseResult = await api.generateCourse({ 
        ...form, 
        mode: 'syllabus',
        language: i18n.language || "es" 
      });

      const syllabus = courseResult.content;
      if (!syllabus?.curso?.unidades) throw new Error("Temario inválido generado.");

      const totalLessons = syllabus.curso.unidades.reduce((acc, u) => acc + (u.lecciones?.length || 0), 0);
      let loaded = 0;
      setProgress({ stage: "Inicializando expansión de clases... 🏗️", current: 0, total: totalLessons });

      // 2. Bucle de Expansión
      const expandedUnits = [];
      for (let uIdx = 0; uIdx < syllabus.curso.unidades.length; uIdx++) {
        const unit = syllabus.curso.unidades[uIdx];
        const expandedLecciones = [];

        for (let lIdx = 0; lIdx < (unit.lecciones?.length || 0); lIdx++) {
          loaded++;
          setProgress({ 
            stage: `Unidad ${uIdx + 1}: Expandiendo "${unit.lecciones[lIdx].titulo}"... 🧠`, 
            current: loaded, 
            total: totalLessons 
          });

          // Invocar expansión para esta lección
          const lessonDetails = await api.generateCourse({
            ...form,
            mode: 'expand-lesson',
            current_syllabus: syllabus,
            unit_index: uIdx,
            lesson_index: lIdx,
            language: i18n.language || "es"
          });

          expandedLecciones.push({
            ...unit.lecciones[lIdx],
            ...lessonDetails // idea_clave, explicacion, video_url, ejemplo_aplicado, actividad_practica, pregunta_test
          });
        }

        expandedUnits.push({
          ...unit,
          lecciones: expandedLecciones
        });
      }

      // 3. Compilar Contenido Final
      const finalContent = {
        ...syllabus,
        curso: {
          ...syllabus.curso,
          unidades: expandedUnits
        }
      };

      setProgress({ stage: "Finalizando y Guardando en base de datos... 💾", current: totalLessons, total: totalLessons });

      // 4. Actualizar la fila en Supabase
      await api.updateCourseData(courseResult.id, { content: finalContent });

      navigate(`/course/${courseResult.id}`);
    } catch (err) {
      setError(err.message || t('gen_error', 'Error al generar el curso'));
      setLoading(false);
    }
  };

  if (loading) {
    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <h2>{percentage > 0 ? `🚀 Generando Contenido (${percentage}%)` : "📋 Diseñando Temario..."}</h2>
        <p className="loading-sub" style={{ color: 'var(--accent)', fontWeight: 'bold', margin: '1rem 0' }}>
          {progress.stage}
        </p>
        {progress.total > 0 && (
          <div style={{ width: '80%', maxWidth: '400px', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ width: `${percentage}%`, background: 'var(--accent)', height: '100%', transition: 'width 0.4s ease' }}></div>
          </div>
        )}
        <p className="loading-sub" style={{ opacity: 0.6, fontSize: "0.85rem" }}>
          {percentage > 0 
            ? `Clase ${progress.current} de ${progress.total}. Esto garantiza el máximo rigor académico y práctico.` 
            : t('gen_loading_time', 'Esto puede tardar entre 20 y 60 segundos')}
        </p>
      </div>
    );
  }

  return (
    <div className="generate-page fade-in">
      <div className="generate-hero">
        <h1>{t('gen_title')}</h1>
        <p className="subtitle">{t('gen_subtitle')}</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="generate-card glass">
        <form className="generate-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('gen_topic_label')}</label>
            <input
              type="text"
              name="tema"
              value={form.tema}
              onChange={handleChange}
              placeholder={t('gen_topic_ph')}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('gen_level_label')}</label>
              <select name="nivel" value={form.nivel} onChange={handleChange}>
                <option value="principiante">🟢 {t('gen_level_opt1')}</option>
                <option value="intermedio">🟡 {t('gen_level_opt2')}</option>
                <option value="avanzado">🔴 {t('gen_level_opt3')}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('gen_format_label')}</label>
              <select name="formato" value={form.formato} onChange={handleChange}>
                <option value="lecturas_breves">📖 {t('gen_format_opt1')}</option>
                <option value="lecturas_ejercicios">📝 {t('gen_format_opt2')}</option>
                <option value="esquemas_problemas">🧩 {t('gen_format_opt3')}</option>
                <option value="mixto">🔄 {t('gen_format_opt4')}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t('gen_profile_label')}</label>
            <input
              type="text"
              name="perfil"
              value={form.perfil}
              onChange={handleChange}
              placeholder={t('gen_profile_ph')}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('gen_objective_label')}</label>
            <textarea
              name="objetivo"
              value={form.objetivo}
              onChange={handleChange}
              placeholder={t('gen_objective_ph')}
              rows={2}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('gen_time_label')}</label>
            <input
              type="text"
              name="tiempo"
              value={form.tiempo}
              onChange={handleChange}
              placeholder={t('gen_time_ph')}
              required
            />
          </div>

          <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: "0.5rem", pointerEvents: loading ? "none" : "auto" }}>
            🎓 {t('gen_submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
