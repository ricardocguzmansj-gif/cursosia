import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function JobApplications() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [jobId]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getJobApplicationsForEmployer(jobId);
      data?.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0)); // Sort by AI Score descending
      setApplications(data || []);
    } catch (err) {
      toast.error("Error al cargar las postulaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (appId) => {
    setAnalyzingId(appId);
    try {
      await api.analyzeCandidateWithAI(appId);
      toast.success("Candidato analizado con IA");
      loadApplications();
    } catch (err) {
      toast.error(err.message || "Error al analizar");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleEscrowCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const initPoint = await api.acceptProposalEscrow(showCheckoutModal.id);
      window.location.href = initPoint;
    } catch (err) {
      toast.error(err.message || 'Error procesando el pago seguro.');
      setCheckoutLoading(false);
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      await api.updateApplicationStatus(appId, status);
      toast.success("Estado de postulación actualizado");
      loadApplications();
    } catch (err) {
      toast.error(err.message || "Error al actualizar estado");
    }
  };

  const renderCheckoutModal = () => {
    if (!showCheckoutModal) return null;
    const bidAmount = Number(showCheckoutModal.bid_amount);
    const serviceFee = bidAmount * 0.10; // 10%
    const total = bidAmount + serviceFee;

    return (
      <div className="modal-overlay" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem'
      }}>
        <div className="card glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💳 Checkout Escrow (Seguro)
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Al pagar, los fondos quedarán seguros en la bóveda de CursosIA. El talento 
            comenzará a trabajar y el dinero solo se liberará cuando apruebes la entrega final.
          </p>
          
          <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Propuesta del Talento</span>
              <strong>${bidAmount.toFixed(2)} USD</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
              <span>Service Fee (10%)</span>
              <span>${serviceFee.toFixed(2)} USD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', fontSize: '1.2rem' }}>
              <strong>Total a Pagar</strong>
              <strong style={{ color: 'var(--primary-light)' }}>${total.toFixed(2)} USD</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setShowCheckoutModal(null)} disabled={checkoutLoading}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleEscrowCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? 'Generando link...' : 'Ir al Pago Seguro'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading-spinner" style={{ margin: "4rem auto" }}></div>;

  return (
    <div className="dashboard" style={{ maxWidth: '1000px' }}>
      <div className="dashboard-header" style={{ marginBottom: '1rem' }}>
        <div>
          <Link to="/manage-jobs" style={{ display: 'inline-block', marginBottom: '1rem', fontSize: '0.9rem' }}>
            ← Volver a Mis Ofertas
          </Link>
          <h1>📑 Propuestas Recibidas</h1>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state glass">
          <span className="empty-icon">📭</span>
          <h3>No hay candidatos aún</h3>
          <p>Las propuestas de los talentos aparecerán aquí.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {applications.map(app => (
            <div key={app.id} className="card glass" style={{ padding: "2rem" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {app.profiles?.full_name || 'Usuario Anónimo'}
                    {app.profiles?.is_verified && <span title="Perfil Verificado" style={{ color: "var(--accent)", fontSize: "1.1rem" }}>✔️</span>}
                  </h3>
                  <div style={{ color: 'var(--accent)', fontSize: '1rem', marginBottom: '0.5rem' }}>
                    {app.profiles?.headline}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>⚡ {app.profiles?.total_xp || 0} XP CursosIA</span>
                    {app.profiles?.hourly_rate && <span>💲 {app.profiles.hourly_rate} / hr (Perfil)</span>}
                    {app.profiles?.rating_count > 0 && (
                      <span style={{ color: '#f39c12', fontWeight: 'bold' }}>
                        ⭐ {app.profiles.rating_avg.toFixed(1)} ({app.profiles.rating_count})
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <span className="badge" style={{
                    background: app.status === 'accepted' ? 'rgba(0, 184, 148, 0.2)' : app.status === 'rejected' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(253, 203, 110, 0.2)',
                    color: app.status === 'accepted' ? 'var(--success)' : app.status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                    fontSize: '0.9rem', padding: '0.4rem 1rem'
                  }}>
                    {app.status.toUpperCase()}
                  </span>
                  
                  {app.ai_score !== null && app.ai_score !== undefined && (
                    <div style={{ background: 'rgba(108, 92, 231, 0.1)', color: 'var(--primary-light)', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      ✨ {app.ai_score}% Match AI
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Propuesta / Cover Letter</h4>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{app.cover_letter || 'Sin comentarios.'}</p>
                
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                  {app.bid_amount && (
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Presupuesto Estimado</span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--text)' }}>${app.bid_amount} USD</strong>
                    </div>
                  )}
                  {app.estimated_days && (
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Tiempo Estimado</span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--text)' }}>{app.estimated_days} Días</strong>
                    </div>
                  )}
                </div>
              </div>

              {app.ai_analysis ? (
                <div style={{ background: 'rgba(108, 92, 231, 0.05)', border: '1px solid rgba(108, 92, 231, 0.2)', padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    🤖 Veredicto del Reclutador AI
                  </h4>
                  <p style={{ fontStyle: 'italic', marginBottom: '1rem', color: 'var(--text)' }}>"{app.ai_analysis.recommendation}"</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <h5 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>👍 Puntos Fuertes</h5>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {app.ai_analysis.pros?.map((p, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h5 style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}>⚠️ Consideraciones</h5>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {app.ai_analysis.cons?.map((p, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{p}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => handleAnalyze(app.id)}
                    disabled={analyzingId === app.id}
                    style={{ width: '100%', borderColor: 'var(--primary-light)', color: 'var(--primary-light)' }}
                  >
                    {analyzingId === app.id ? '⏳ Analizando...' : '✨ Analizar Match con IA'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to={`/talento/${app.user_id}`} target="_blank" className="btn btn-outline btn-sm">
                  👁️ Ver CV Dinámico
                </Link>
                
                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleStatusUpdate(app.id, 'rejected')}>
                      ❌ Rechazar
                    </button>
                    <button className="btn btn-primary btn-sm" style={{ background: 'var(--success)' }} onClick={() => setShowCheckoutModal(app)}>
                      ✅ Aceptar Propuesta (Pagar)
                    </button>
                  </div>
                )}

                {(app.status === 'in_progress' || app.status === 'completed') && (
                  <Link to={`/workspace/${app.id}`} className="btn btn-primary btn-sm" style={{ background: 'var(--primary-light)' }}>
                    💬 Entrar al Workspace
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {renderCheckoutModal()}
    </div>
  );
}
