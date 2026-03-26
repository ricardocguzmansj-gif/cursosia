import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";
import { useTranslation } from "react-i18next";

export default function PathDetail() {
  const { slug } = useParams();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPath();
  }, [slug]);

  const loadPath = async () => {
    try {
      const data = await api.getPathBySlug(slug);
      setPath(data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="course-view page-transition">
        <Navbar />
        <div className="loading-state">
           <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="course-view page-transition">
        <Navbar />
        <div className="empty-state glass" style={{ margin: "4rem auto", maxWidth: "600px" }}>
          <h2>Ruta no encontrada</h2>
          <button className="btn btn-primary mt-4" onClick={() => navigate("/paths")}>Volver a Rutas</button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-view page-transition">
      <Navbar />
      
      <div className="course-header" style={{ marginBottom: "2rem" }}>
        <div className="course-header-content">
          <h1>{path.badge_icon || "🗺️"} {path.title}</h1>
          <p className="subtitle">{path.description}</p>
          <div className="course-tags">
            <span className="badge badge-level">{path.level || "Multinivel"}</span>
            <span className="badge">📚 {path.path_courses?.length || 0} Cursos en total</span>
          </div>
        </div>
      </div>

      <div className="course-content-layout" style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 2rem" }}>
        <div className="main-content">
          <div className="syllabus-container glass">
            <h2 className="section-title">Plan de Estudio Serializado</h2>
            <div className="syllabus-list">
              {path.path_courses?.map((pc, index) => {
                const c = pc.courses;
                if (!c) return null;
                return (
                  <div key={pc.id} className="unit-card glass">
                    <div className="unit-header" style={{ cursor: "default" }}>
                      <div className="unit-title-group">
                        <span className="unit-number">{index + 1}</span>
                        <h3>{c.title}</h3>
                      </div>
                      <Link to={`/course/${c.id}`} className="btn btn-accent btn-sm">
                        Ver Curso
                      </Link>
                    </div>
                    <div className="unit-content" style={{ display: "block", background: "rgba(0,0,0,0.2)", padding: "1rem" }}>
                       <p style={{ margin: 0, opacity: 0.8 }}>Tema: {c.topic} · Nivel: {c.level}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="sidebar">
          <div className="enroll-card glass sticky-sidebar">
             <h3>¡Comienza esta ruta!</h3>
             <p>Completa cada curso en orden para desbloquear el diploma integral de esta Carrera.</p>
             <Link to={path.path_courses?.length > 0 ? `/course/${path.path_courses[0].courses?.id}` : "#"} className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
               Empezar Módulo 1
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
