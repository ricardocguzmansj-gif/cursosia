import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployerJobs();
      setJobs(data || []);
    } catch (err) {
      toast.error("Error al cargar tus ofertas de trabajo");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner" style={{ margin: "4rem auto" }}></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🛠️ Mis Ofertas Publicadas</h1>
        <Link to="/post-job" className="btn btn-primary">➕ Nueva Oferta</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state glass">
          <span className="empty-icon">📝</span>
          <h3>No has publicado ofertas</h3>
          <p>Publica un trabajo para recibir propuestas de la red de talento de CursosIA.</p>
        </div>
      ) : (
        <div className="courses-grid" style={{ gridTemplateColumns: "1fr" }}>
          {jobs.map(job => (
            <div key={job.id} className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem' }}>
              <div>
                <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--primary-light)", fontSize: "1.3rem" }}>{job.title}</h3>
                <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  <span>📍 {job.location_type || "No especificado"}</span>
                  <span>💰 {job.salary_range || "A convenir"}</span>
                  <span style={{ color: job.status === 'open' ? 'var(--success)' : 'var(--warning)' }}>
                    {job.status === 'open' ? '🟢 Activo' : '🟡 ' + job.status}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link to={`/admin/jobs/${job.id}/applications`} className="btn btn-accent">
                  👥 Ver Candidatos
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
