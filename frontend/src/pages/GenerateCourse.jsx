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

    try {
      const course = await api.generateCourse({ 
        ...form, 
        language: i18n.language || "es" 
      });
      navigate(`/course/${course.id}`);
    } catch (err) {
      setError(err.message || t('gen_error', 'Error al generar el curso'));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <h2>{t('gen_loading')}</h2>
        <p className="loading-sub">{t('gen_loading_sub')}</p>
        <p className="loading-sub" style={{ opacity: 0.6, fontSize: "0.85rem" }}>
          {t('gen_loading_time', 'Esto puede tardar entre 20 y 60 segundos')}
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
