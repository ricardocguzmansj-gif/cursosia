import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getPublicProfile(id);
        setProfile(data);
        const revs = await api.getReviews(id);
        setReviews(revs || []);
      } catch (err) {
        console.error(err);
        setError("Usuario no encontrado o no disponible.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchProfile();
  }, [id]);

  if (loading) return <div className="loading-overlay"><div className="loading-spinner"></div><p>Cargando Perfil...</p></div>;
  
  if (error || !profile) {
    return (
      <div className="hero">
        <div className="hero-content">
          <h1>Perfil No Encontrado</h1>
          <p>{error}</p>
          <Link to="/" className="btn btn-primary">Volver al Inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ maxWidth: '900px', paddingTop: '6rem' }}>
      
      {/* Header Card */}
      <div className="card glass" style={{ marginBottom: '2rem', padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '100px',
          background: 'var(--gradient-primary)', opacity: 0.1
        }} />
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {profile.full_name}
          {profile.is_verified && <span title="Verificado Oficial" style={{ color: 'var(--accent)', fontSize: '1.6rem' }}>✔️</span>}
        </h1>
        
        {profile.headline && (
          <h2 style={{ fontSize: '1.2rem', color: 'var(--accent)', fontWeight: '500', marginBottom: '0.5rem' }}>
            {profile.headline}
          </h2>
        )}

        {profile.company_name && (
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: '400', marginBottom: '1.5rem' }}>
            🏢 {profile.company_name}
          </h3>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {profile.location && (
            <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
              📍 {profile.location}
            </span>
          )}
          {profile.hourly_rate && (
            <span className="badge" style={{ background: 'rgba(0, 206, 201, 0.15)', color: 'var(--accent)' }}>
              💲 {profile.hourly_rate} / hora
            </span>
          )}
          {profile.total_xp > 0 && (
            <span className="badge badge-level">
              ✨ {profile.total_xp} XP en CursosIA
            </span>
          )}
          {profile.rating_count > 0 && (
            <span className="badge" style={{ background: 'rgba(255, 159, 24, 0.15)', color: '#f39c12', fontWeight: 'bold' }}>
              ⭐ {profile.rating_avg.toFixed(1)} ({profile.rating_count})
            </span>
          )}
        </div>

        {profile.portfolio_url && (
          <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            🔗 Ver Portafolio Externo
          </a>
        )}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Bio Section */}
        {profile.bio && (
          <div className="card glass">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Sobre Mí</h3>
            <p style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
              {profile.bio}
            </p>
          </div>
        )}

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="card glass">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Habilidades Técnicas</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {profile.skills.map((skill, idx) => (
                <span key={idx} className="badge" style={{ background: 'rgba(108, 92, 231, 0.2)', color: 'var(--primary-light)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications from CursosIA */}
        <div className="card glass">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>🎓 Certificaciones en CursosIA</h3>
          {profile.certificates && profile.certificates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {profile.certificates.map((cert, idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text)' }}>Top Secret Course ID: {cert.course_id.substring(0,8)}...</strong>
                      <div style={{ color: 'var(--success)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        ✅ Cursos Completado
                      </div>
                    </div>
                    {cert.score && (
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                        {cert.score}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-dim)' }}>Este talento aún no tiene certificados públicos disponibles en la plataforma.</p>
          )}
        </div>

        {/* REVIEWS SECTION */}
        <div className="card glass">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>⭐️ Evaluaciones de Clientes</h3>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Este talento aún no tiene evaluaciones públicas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(rev => (
                <div key={rev.id} style={{ padding: '1.2rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text)' }}>{rev.reviewer?.full_name || "Usuario"}</strong>
                      <div style={{ color: '#f39c12', fontSize: '1.1rem', marginTop: '0.2rem' }}>
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rev.comment && (
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic' }}>
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
