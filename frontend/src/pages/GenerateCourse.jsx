import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

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
        <h2>Diseñando tu aula virtual...</h2>
        <p className="loading-sub">
          La IA está creando un plan de estudio completo con lecciones,
          actividades y evaluaciones adaptadas a tu perfil.
        </p>
        <p className="loading-sub" style={{ opacity: 0.6, fontSize: "0.85rem" }}>
          Esto puede tardar entre 20 y 60 segundos
        </p>
      </div>
    );
  }

  return (
    <div className="generate-page fade-in">
      <div className="generate-hero">
        <h1>Crea tu aula virtual en minutos</h1>
        <p className="subtitle">
          Nuestra IA diseña un plan de estudio completo con lecciones progresivas,
          actividades prácticas, tests interactivos y evaluación final.
          Todo adaptado a tu nivel y objetivo.
        </p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="generate-card glass">
        <form className="generate-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tema del curso</label>
            <input
              type="text"
              name="tema"
              value={form.tema}
              onChange={handleChange}
              placeholder="Ej: Marketing digital, Química orgánica, Gestión del tiempo, Python..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nivel del alumno</label>
              <select name="nivel" value={form.nivel} onChange={handleChange}>
                <option value="principiante">🟢 Principiante</option>
                <option value="intermedio">🟡 Intermedio</option>
                <option value="avanzado">🔴 Avanzado</option>
              </select>
            </div>

            <div className="form-group">
              <label>Formato preferido</label>
              <select name="formato" value={form.formato} onChange={handleChange}>
                <option value="lecturas_breves">📖 Lecturas breves</option>
                <option value="lecturas_ejercicios">📝 Lecturas + ejercicios</option>
                <option value="esquemas_problemas">🧩 Esquemas + problemas</option>
                <option value="mixto">🔄 Mixto</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Perfil del alumno</label>
            <input
              type="text"
              name="perfil"
              value={form.perfil}
              onChange={handleChange}
              placeholder="Ej: Estudiante de bachillerato, Profesional de marketing, Estudiante de 1º de Química..."
              required
            />
          </div>

          <div className="form-group">
            <label>Objetivo principal</label>
            <textarea
              name="objetivo"
              value={form.objetivo}
              onChange={handleChange}
              placeholder="Ej: Aprobar la EBAU, Entender los mecanismos básicos de genética, Organizar mejor mi tiempo..."
              rows={2}
              required
            />
          </div>

          <div className="form-group">
            <label>Tiempo disponible</label>
            <input
              type="text"
              name="tiempo"
              value={form.tiempo}
              onChange={handleChange}
              placeholder="Ej: 4 semanas, 30 min al día"
              required
            />
          </div>

          <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: "0.5rem" }}>
            🎓 Diseñar curso ahora
          </button>
        </form>
      </div>
    </div>
  );
}
