import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function PostJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    location_type: "",
    salary_range: "",
    description: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company_name || !formData.description) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      await api.createJobPosting(formData);
      setSuccess(true);
      toast.success("¡Oferta enviada exitosamente para revisión!");
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar la oferta. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ padding: "4rem 1rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <div className="glass" style={{ padding: "3rem", borderRadius: "16px" }}>
          <span style={{ fontSize: "5rem", display: "block", marginBottom: "1rem" }}>✅</span>
          <h2 style={{ color: "var(--accent-primary)" }}>Oferta Recibida</h2>
          <p style={{ opacity: 0.8, fontSize: "1.1rem", marginBottom: "2rem" }}>
            Hemos recibido tu oferta de trabajo: <strong>{formData.title}</strong>. 
            Nuestro equipo la revisará y la publicará en la bolsa de trabajo para nuestros estudiantes a la brevedad.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Volver a CursosIA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "3rem 1rem", maxWidth: "800px", margin: "0 auto" }}>
      <div className="header glass" style={{ padding: "2rem", borderRadius: "16px", marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>🏢 Publicar Empleo</h1>
        <p style={{ opacity: 0.8 }}>Forma parte de la red CursosIA conectando con talento IA directamente egresado de nuestros cursos.</p>
      </div>

      <div className="glass" style={{ padding: "2rem", borderRadius: "16px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Título del Puesto *</label>
              <input 
                type="text" 
                className="input-field" 
                name="title"
                placeholder="Ej. Desarrollador Frontend con IA"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Nombre de la Empresa *</label>
              <input 
                type="text" 
                className="input-field" 
                name="company_name"
                placeholder="Ej. TechCorp LLC"
                value={formData.company_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Modalidad</label>
              <select className="input-field" name="location_type" value={formData.location_type} onChange={handleChange}>
                <option value="">Seleccionar modalidad...</option>
                <option value="Remoto">100% Remoto</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>

            <div className="form-group">
              <label>Rango Salarial (Opcional)</label>
              <input 
                type="text" 
                className="input-field" 
                name="salary_range"
                placeholder="Ej. $1,500 - $2,000 USD / mes"
                value={formData.salary_range}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Descripción y Requisitos del Puesto *</label>
            <textarea 
              className="input-field" 
              name="description"
              placeholder="Describe detalladamente el perfil que buscas, requerimientos y beneficios..."
              style={{ minHeight: "200px", resize: "vertical" }}
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            disabled={loading}
            style={{ alignSelf: "flex-end", padding: "1rem 3rem" }}
          >
            {loading ? "Enviando..." : "🚀 Enviar para Aprobación"}
          </button>
        </form>
      </div>
    </div>
  );
}
