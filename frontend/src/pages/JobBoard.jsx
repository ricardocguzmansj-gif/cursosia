import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar ofertas de trabajo");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    if (!session) {
      toast.error("Debes iniciar sesión para postularte");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          user_id: session.user.id,
          status: 'pending'
        });
        
      if (error) {
        if (error.code === '23505') toast.error("Ya te has postulado a esta oferta");
        else throw error;
      } else {
        toast.success("¡Postulación enviada con éxito!", { icon: "🚀" });
      }
    } catch (err) {
      toast.error("Error al enviar postulación");
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
                  <span>🏢 {job.company_name}</span>
                  <span>📍 {job.location_type}</span>
                  <span>💰 {job.salary_range || "Salario a convenir"}</span>
                </div>
                <p style={{ margin: "0", fontSize: "0.95rem" }}>{job.description?.slice(0, 150)}...</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                <button className="btn btn-primary" onClick={() => handleApply(job.id)}>
                  Postularme
                </button>
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                  Publicado: {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
