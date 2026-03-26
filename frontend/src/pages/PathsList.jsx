import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";

export default function PathsList() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadPaths();
  }, []);

  const loadPaths = async () => {
    try {
      const data = await api.getPublishedPaths();
      setPaths(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="catalog-page">
      <Navbar />
      <div className="catalog-header">
        <div className="catalog-header-content fade-in" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1>🗺️ Rutas de Aprendizaje</h1>
          <p className="subtitle">Sigue un plan de estudio estructurado y domina una nueva habilidad desde cero hasta experto.</p>
        </div>
      </div>

      <div className="courses-grid" style={{ padding: "0 2rem", maxWidth: "1200px", margin: "0 auto" }}>
        {loading ? (
          <div className="loading-spinner"></div>
        ) : paths.length === 0 ? (
          <div className="empty-state glass">
             <p>No hay rutas de aprendizaje disponibles en este momento.</p>
          </div>
        ) : (
          paths.map(path => (
            <Link key={path.id} to={`/paths/${path.slug}`} className="course-card glass" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="course-card-header">
                <div>
                  <span className="badge badge-level">{path.level || "Multinivel"}</span>
                  <span className="badge" style={{ marginLeft: "0.5rem" }}>
                    📚 {path.path_courses?.length || 0} cursos
                  </span>
                </div>
              </div>
              
              <div className="course-card-body">
                <h3>{path.badge_icon || "🗺️"} {path.title}</h3>
                <p>{path.description || "Ruta de aprendizaje completa."}</p>
              </div>
              
              <div className="course-card-footer">
                <button className="btn btn-primary btn-sm" style={{ width: "100%" }}>
                  Ver Ruta Completa
                </button>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
