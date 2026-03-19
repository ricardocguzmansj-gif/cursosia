import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function MyProfile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    headline: '',
    bio: '',
    skills: '', // we will store as comma separated text in state
    location: '',
    portfolio_url: '',
    hourly_rate: ''
  });
  const [wallet, setWallet] = useState({ available: 0, escrow: 0 });
  const [myApps, setMyApps] = useState([]);

  useEffect(() => {
    loadProfile();
    loadWallet();
    loadMyApplications();
  }, []);

  const loadMyApplications = async () => {
    try {
      const data = await api.getMyApplications();
      setMyApps(data || []);
    } catch (e) {
      console.error("Error loading applications", e);
    }
  };

  const loadWallet = async () => {
    try {
      const stats = await api.getWalletStats();
      setWallet(stats);
    } catch (e) {
      console.error("Error loading wallet", e);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
      setFormData({
        headline: data.headline || '',
        bio: data.bio || '',
        skills: data.skills ? data.skills.join(', ') : '',
        location: data.location || '',
        portfolio_url: data.portfolio_url || '',
        hourly_rate: data.hourly_rate || ''
      });
    } catch (error) {
      toast.error("Error cargando perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {
        headline: formData.headline,
        bio: formData.bio,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        location: formData.location,
        portfolio_url: formData.portfolio_url,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
      };
      await api.updateUserProfile(updates);
      toast.success("Perfil actualizado con éxito");
      loadProfile();
    } catch (error) {
      toast.error(error.message || "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner" style={{ margin: "4rem auto" }}></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Tu Perfil Profesional</h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)' }}>
            Completa tu información para que las empresas puedan encontrarte.
          </p>
        </div>
        {profile?.id && (
          <a href={`/talento/${profile.id}`} target="_blank" rel="noreferrer" className="btn btn-primary">
            👁️ Ver mi Perfil Público
          </a>
        )}
      </div>

      <div className="generate-card glass">
        <form className="generate-form" onSubmit={handleSave}>
          <div className="form-group">
            <label>Titular Profesional (Ej. "Desarrollador React")</label>
            <input 
              name="headline" 
              value={formData.headline} 
              onChange={handleChange} 
              placeholder="¿Cómo te describes profesionalmente en una línea?"
              required 
            />
          </div>

          <div className="form-group">
            <label>Biografía / Sobre Mí</label>
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              rows="5"
              placeholder="Habla sobre tu experiencia, pasión y objetivos..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Habilidades (Separadas por Comas)</label>
              <input 
                name="skills" 
                value={formData.skills} 
                onChange={handleChange} 
                placeholder="JavaScript, Python, Diseño UI..." 
              />
            </div>
            <div className="form-group">
              <label>Ubicación</label>
              <input 
                name="location" 
                value={formData.location} 
                onChange={handleChange} 
                placeholder="Ciudad, País o 'Remoto'" 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Enlace al Portafolio (LinkedIn, GitHub, Web)</label>
              <input 
                type="url"
                name="portfolio_url" 
                value={formData.portfolio_url} 
                onChange={handleChange} 
                placeholder="https://..." 
              />
            </div>
            <div className="form-group">
              <label>Tarifa por Hora (USD) - Opcional</label>
              <input 
                type="number"
                step="0.1"
                min="0"
                name="hourly_rate" 
                value={formData.hourly_rate} 
                onChange={handleChange} 
                placeholder="Ej. 25.00" 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? "Guardando..." : "💾 Guardar Perfil"}
          </button>
        </form>
      </div>

      <div className="courses-grid" style={{ marginTop: '3rem' }}>
        
        <div className="card glass" style={{ background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.1) 0%, rgba(0, 184, 148, 0.1) 100%)', border: '1px solid rgba(108, 92, 231, 0.2)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>💼 Tu Billetera Escrow</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Los fondos retenidos de trabajos en curso se liberarán a tu Balance Disponible al terminar.</p>
          
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fondos Retenidos</span>
              <strong style={{ fontSize: '1.8rem', display: 'block', color: 'var(--warning)' }}>${wallet.escrow.toFixed(2)}</strong>
            </div>
            <div style={{ flex: 1, paddingLeft: '1.5rem', borderLeft: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance Disponible</span>
              <strong style={{ fontSize: '1.8rem', display: 'block', color: 'var(--success)' }}>${wallet.available.toFixed(2)}</strong>
            </div>
          </div>
          
          <button className="btn btn-outline" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => toast("Función de retiros en desarrollo para Fase 6.")} disabled={wallet.available <= 0}>
            📤 Solicitar Retiro a Cuenta Bancaria
          </button>
        </div>

        <div className="card glass">
          <h3>🏆 Estadísticas de la Plataforma</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Estas métricas son visibles en tu perfil público automáticamente.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             <div><strong>Total XP:</strong> {profile?.total_xp || 0} XP</div>
             <div><strong>Nombre Registrado:</strong> {profile?.full_name}</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN TRABAJOS (FASE 5) */}
      <div className="card glass" style={{ marginTop: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>📂 Mis Postulaciones & Trabajos</h3>
        {myApps.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No has aplicado a ninguna oferta laboral todavía.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myApps.map(app => (
              <div key={app.id} style={{
                background: 'var(--bg-subtle)', 
                padding: '1.2rem', 
                borderRadius: 'var(--radius)', 
                border: '1px solid var(--border-light)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{app.job_postings?.title}</h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Cliente: {app.job_postings?.employer_profiles?.full_name || 'Desconocido'}
                  </p>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 'bold' }}>
                    💰 Oferta: ${app.bid_amount} USD
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="badge" style={{
                    background: app.status === 'completed' ? 'rgba(0,184,148,0.2)' : app.status === 'in_progress' ? 'rgba(108, 92, 231, 0.2)' : 'rgba(253,203,110,0.2)',
                    color: app.status === 'completed' ? 'var(--success)' : app.status === 'in_progress' ? 'var(--primary-light)' : 'var(--warning)',
                    fontSize: '0.8rem'
                  }}>
                    {app.status === 'in_progress' ? '⚡ ACTIVADO' : app.status.toUpperCase()}
                  </span>
                  
                  {(app.status === 'in_progress' || app.status === 'completed') && (
                    <Link to={`/workspace/${app.id}`} className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }}>
                      💬 Workspace
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
