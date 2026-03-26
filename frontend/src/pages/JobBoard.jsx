import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    loadJobs();
  }, []);

  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    bidAmount: '',
    estimatedDays: ''
  });

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          employer:profiles!employer_id(is_verified)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("JobBoard Error:", err);
      toast.error(`Error al cargar ofertas: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const initApply = (job) => {
    if (!session) {
      toast.error("Debes iniciar sesión para postularte");
      return;
    }
    setSelectedJob(job);
    setApplicationData({ coverLetter: '', bidAmount: '', estimatedDays: '' });
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!session) return;
    
    try {
      await api.createJobApplication(selectedJob.id, applicationData.coverLetter, applicationData.bidAmount, applicationData.estimatedDays);
      toast.success("¡Postulación y Propuesta enviadas con éxito!", { icon: "🚀" });
      setSelectedJob(null);
    } catch (err) {
      toast.error(err.message || "Error al enviar postulación");
    }
  };

  return (
    <div className="job-board-container" style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div className="header glass" style={{ padding: "2rem", borderRadius: "16px", marginBottom: "2rem", textAlign: "center" }}>
        <h1>💼 Bolsa de Trabajo</h1>
        <p style={{ opacity: 0.8 }}>Oportunidades laborales exclusivas para estudiantes de CursosIA</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <div className="loading-spinner-lg"></div>
          <p>Cargando ofertas...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state glass" style={{ padding: "4rem", textAlign: "center", borderRadius: "16px" }}>
          <span style={{ fontSize: "4rem", marginBottom: "1rem", display: "block" }}>🏢</span>
          <h3>No hay ofertas disponibles</h3>
          <p>Vuelve pronto para ver nuevas oportunidades laborales que hagan match con tus habilidades.</p>
        </div>
      ) : (
        <div className="jobs-grid" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {jobs.map(job => (
            <div key={job.id} className="job-card glass" style={{ padding: "1.5rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ flex: 1, minWidth: "300px" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--primary-light)" }}>{job.title}</h3>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.9rem", opacity: 0.8, marginBottom: "0.5rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    🏢 {job.company_name}
                    {job.employer?.is_verified && <span title="Empresa Verificada" style={{ color: "var(--accent)", fontSize: "0.9rem" }}>✔️</span>}
                  </span>
                  <span>📍 {job.location_type}</span>
                  <span>💰 {job.salary_range || "Salario a convenir"}</span>
                </div>
                <p style={{ margin: "0", fontSize: "0.95rem" }}>{job.description?.slice(0, 150)}...</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                <button className="btn btn-primary" onClick={() => initApply(job)}>
                  Hacer una Propuesta
                </button>
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                  Publicado: {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedJob && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content glass" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Postular a: {selectedJob.title}</h2>
              <button 
                onClick={() => setSelectedJob(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Carta de Presentación / Propuesta *</label>
                <textarea 
                  required
                  rows="5"
                  placeholder="Explícale al reclutador por qué eres la mejor opción para este trabajo..."
                  value={applicationData.coverLetter}
                  onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Tu Presupuesto ($ USD)</label>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="Ej. 150.00"
                    value={applicationData.bidAmount}
                    onChange={(e) => setApplicationData({...applicationData, bidAmount: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Tiempo Estimado (Días)</label>
                  <input 
                    type="number"
                    placeholder="Ej. 7"
                    value={applicationData.estimatedDays}
                    onChange={(e) => setApplicationData({...applicationData, estimatedDays: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedJob(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  🚀 Enviar Propuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
