import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function Workspace() {
  const { applicationId } = useParams();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  const bottomRef = useRef(null);

  useEffect(() => {
    loadData();
    
    // Subscribe to realtime messages
    const channel = supabase.channel(`workspace_${applicationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'workspace_messages',
        filter: `application_id=eq.${applicationId}`
      }, (payload) => {
        // Fetch sender info for the new message
        fetchNewMessageData(payload.new.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId]);

  useEffect(() => {
    // Scroll to bottom when messages update
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchNewMessageData = async (msgId) => {
    const { data } = await supabase
      .from('workspace_messages')
      .select('*, sender:profiles!workspace_messages_sender_id_fkey(full_name)')
      .eq('id', msgId)
      .single();
    if (data) {
      setMessages(prev => [...prev, data]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      // Load Application details (to know roles and status)
      const { data: appData, error: appError } = await supabase
        .from('job_applications')
        .select('*, job_postings(*, employer_profiles:profiles!job_postings_employer_id_fkey(full_name, is_verified)), talent:profiles!job_applications_user_id_fkey(full_name, is_verified)')
        .eq('id', applicationId)
        .single();
        
      if (appError) throw new Error("No se pudo cargar el espacio de trabajo.");
      setApplication(appData);

      // Load Messages
      const msgs = await api.getWorkspaceMessages(applicationId);
      setMessages(msgs || []);

      // Check if reviewed
      if (currentSession?.user?.id) {
        const { data: rev } = await supabase
          .from('job_reviews')
          .select('id')
          .eq('application_id', applicationId)
          .eq('reviewer_id', currentSession.user.id)
          .maybeSingle();
        setReviewed(!!rev);
      }

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(applicationId, text.trim(), false);
      setText('');
    } catch (error) {
      toast.error('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleDelivery = async () => {
    if (!window.confirm("¿Seguro que deseas entregar el trabajo final?")) return;
    setSending(true);
    try {
      await api.sendMessage(applicationId, "He enviado el trabajo final para su revisión. Quedo atento a tus comentarios.", true);
      toast.success("Entrega notificada al empleador");
    } catch (err) {
      toast.error("Error al enviar entrega");
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm("¿Estás seguro de aprobar esta entrega? Los fondos serán liberados irreversiblemente al talento.")) return;
    try {
      await api.approveDelivery(applicationId);
      toast.success("¡Pago liberado exitosamente!");
      setApplication(prev => ({ ...prev, status: 'completed' }));
    } catch (err) {
      toast.error(err.message || "Error al liberar fondos");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.submitReview(applicationId, rating, comment);
      toast.success("¡Gracias por tu calificación!");
      setReviewed(true);
    } catch (err) {
      toast.error(err.message || "Error al enviar reseña");
    }
  };

  const handleDispute = async (reason) => {
    try {
      await api.openDispute(applicationId, reason);
      toast.success("Disputa abierta. Un administrador revisará el caso.");
      setApplication(prev => ({ ...prev, status: 'disputed' }));
    } catch (err) {
      toast.error(err.message || "Error al abrir disputa");
    }
  };

  if (loading) return <div className="loading-spinner" style={{ margin: "4rem auto" }}></div>;
  if (!application) return <div className="dashboard"><h2>Acceso Denegado</h2></div>;

  const isEmployer = session?.user?.id === application.job_postings.employer_id;
  const isTalent = session?.user?.id === application.user_id;

  return (
    <div className="dashboard" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', paddingBottom: '2rem' }}>
      
      {/* HEADER INFO */}
      <div className="card glass" style={{ padding: '1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Workspace: {application.job_postings.title}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {isEmployer ? (
              <>Talento: {application.talent.full_name} {application.talent.is_verified && <span title="Verificado" style={{ color: "var(--accent)" }}>✔️</span>}</>
            ) : (
              <>Cliente: {application.job_postings.employer_profiles.full_name} {application.job_postings.employer_profiles.is_verified && <span title="Verificado" style={{ color: "var(--accent)" }}>✔️</span>}</>
            )}
          </p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <span className="badge" style={{ 
            background: application.status === 'completed' ? 'rgba(0,184,148,0.2)' : application.status === 'disputed' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(108, 92, 231, 0.2)', 
            color: application.status === 'completed' ? 'var(--success)' : application.status === 'disputed' ? 'var(--danger)' : 'var(--primary-light)',
            padding: '0.4rem 1rem', fontSize: '1rem' 
          }}>
            {application.status === 'completed' ? 'COMPLETADO ✅' : application.status === 'disputed' ? '⚠️ EN DISPUTA' : 'EN DESARROLLO 🚧'}
          </span>
          {application.status === 'in_progress' && (
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              {isTalent && (
                <button className="btn btn-accent btn-sm" onClick={handleDelivery} disabled={sending}>
                  📦 Entregar Trabajo Final
                </button>
              )}
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => {
                const reason = window.prompt("Describe brevemente el motivo de la disputa:");
                if (reason) handleDispute(reason);
              }}>
                ⚠️ Abrir Disputa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="card glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* MESSAGES LIST */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              🔒 El pago de ${application.bid_amount} USD está protegido en Escrow.
            </span>
          </div>

          {application.status === 'disputed' && (
            <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: '1rem' }}>
              <strong>⚠️ Sala bajo revisión del Administrador.</strong><br/>
              <span style={{ fontSize: '0.9rem' }}>Se ha abierto una disputa. El chat continúa abierto para llegar a acuerdos de buena fe.</span>
            </div>
          )}

          {messages.map(msg => {
            const isMe = msg.sender_id === session?.user?.id;
            
            return (
              <div key={msg.id} style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', padding: '0 0.5rem' }}>
                  {msg.sender.full_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                <div style={{
                  background: msg.is_delivery 
                    ? 'linear-gradient(135deg, rgba(0, 184, 148, 0.1) 0%, rgba(9, 132, 227, 0.1) 100%)' 
                    : isMe ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: isMe && !msg.is_delivery ? '#fff' : 'var(--text)',
                  padding: msg.is_delivery ? '1.5rem' : '0.8rem 1.2rem',
                  borderRadius: '1rem',
                  border: msg.is_delivery ? '1px solid var(--success)' : '1px solid var(--border-light)',
                  borderBottomRightRadius: isMe ? '0.2rem' : '1rem',
                  borderBottomLeftRadius: isMe ? '1rem' : '0.2rem',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {msg.is_delivery && (
                    <div style={{ fontWeight: 'bold', color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📦 SOLICITUD DE REVISIÓN FINAL
                    </div>
                  )}
                  
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.content}</div>

                  {msg.is_delivery && isEmployer && application.status === 'in_progress' && (
                    <button 
                      className="btn btn-primary" 
                      style={{ marginTop: '1rem', width: '100%', background: 'var(--success)' }}
                      onClick={handleApprove}
                    >
                      ✅ Aprobar y Liberar Fondos
                    </button>
                  )}
                  {msg.is_delivery && application.status === 'completed' && (
                    <div style={{ marginTop: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>
                      ✅ Entrega Aprobada. Fondos Liberados.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* REVIEW MODAL OVERLAY */}
        {application.status === 'completed' && !reviewed && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10
          }}>
            <div className="card glass" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '0.5rem' }}>⭐️ Evalúa la Experiencia</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Tu opinión es clave para la comunidad de CursosIA.
              </p>
              
              <form onSubmit={handleReviewSubmit}>
                <div style={{ fontSize: '2rem', color: 'var(--accent)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  {[1,2,3,4,5].map(star => (
                    <span key={star} onClick={() => setRating(star)}>
                      {star <= rating ? '★' : '☆'}
                    </span>
                  ))}
                </div>

                <textarea
                  rows="3"
                  placeholder="Deja un breve comentario sobre el trabajo o comunicación..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  style={{ width: '100%', marginBottom: '1rem', background: 'var(--bg-subtle)' }}
                  required
                />

                <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>
                  Enviar Calificación
                </button>
              </form>
            </div>
          </div>
        )}

        {/* INPUT AREA */}
        {application.status === 'in_progress' && (
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-subtle)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Escribe un mensaje..." 
                value={text}
                onChange={e => setText(e.target.value)}
                style={{ flex: 1, background: 'var(--bg-main)' }}
                disabled={sending}
              />
              <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
                Enviar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
