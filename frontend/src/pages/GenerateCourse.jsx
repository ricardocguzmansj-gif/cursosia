import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function GenerateCourse() {
  const [form, setForm] = useState({
    tema: "",
    nivel: "principiante",
    perfil: "universitario",
    objetivo: "",
    duracion: "4 semanas",
    tiempo: "1 hora diaria"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const course = await api.generateCourse(form);
      navigate(`/course/${course.id}`);
    } catch (err) {
      setError(err.message || "Error al generar el curso");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>🧠 Generando tu curso con IA...</p>
        <p className="loading-sub">Esto puede tardar entre 15 y 45 segundos</p>
      </div>
    );
  }

  return (
    <div className="generate-page fade-in">
      <h1>✨ Generar nuevo curso</h1>
      <p className="subtitle">
        Completá los datos y la IA generará un curso completo adaptado a vos
      </p>

      {error && <div className="error-msg">{error}</div>}

      <form className="generate-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>¿Qué querés aprender?</label>
          <input
            type="text"
            name="tema"
            value={form.tema}
            onChange={handleChange}
            placeholder="Ej: Marketing digital, Python, Diseño UX, Finanzas personales..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nivel</label>
            <select name="nivel" value={form.nivel} onChange={handleChange}>
              <option value="principiante">🟢 Principiante</option>
              <option value="intermedio">🟡 Intermedio</option>
              <option value="avanzado">🔴 Avanzado</option>
            </select>
          </div>

          <div className="form-group">
            <label>Perfil</label>
            <select name="perfil" value={form.perfil} onChange={handleChange}>
              <option value="secundario">🎒 Secundario</option>
              <option value="universitario">🎓 Universitario</option>
              <option value="profesional">💼 Profesional</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Objetivo de aprendizaje</label>
          <textarea
            name="objetivo"
            value={form.objetivo}
            onChange={handleChange}
            placeholder="Ej: Quiero aprender a crear campañas de marketing efectivas para mi emprendimiento"
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Duración del curso</label>
            <select name="duracion" value={form.duracion} onChange={handleChange}>
              <option value="1 semana">1 semana</option>
              <option value="2 semanas">2 semanas</option>
              <option value="4 semanas">4 semanas</option>
              <option value="8 semanas">8 semanas</option>
              <option value="12 semanas">12 semanas</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tiempo diario</label>
            <select name="tiempo" value={form.tiempo} onChange={handleChange}>
              <option value="30 minutos">30 minutos</option>
              <option value="1 hora">1 hora</option>
              <option value="2 horas">2 horas</option>
              <option value="3 horas">3 horas</option>
            </select>
          </div>
        </div>

        <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: "0.5rem" }}>
          🚀 Generar curso con IA
        </button>
      </form>
    </div>
  );
}
