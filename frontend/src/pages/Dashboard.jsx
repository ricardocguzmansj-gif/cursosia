import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { parseCourseContent } from "../lib/courseHelper";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";
import GamificationBar from "../components/GamificationBar";
import OnboardingTour from "../components/OnboardingTour";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashboardData, userRole] = await Promise.all([
        api.getDashboardData(),
        api.getUserRole()
      ]);
      setData(dashboardData);
      setRole(userRole);
      
      if (dashboardData && dashboardData.profile && !dashboardData.profile.onboarding_completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (e, courseId) => {
    e.stopPropagation();
    try {
      const pos = await api.getLastPosition(courseId);
      if (pos) {
        navigate(`/course/${courseId}?u=${pos.unit_index}&l=${pos.lesson_index}`);
      } else {
        navigate(`/course/${courseId}`);
      }
    } catch {
      navigate(`/course/${courseId}`);
    }
  };

  const handleDelete = async (e, courseId) => {
    e.stopPropagation();
    toast((t_toast) => (
      <div>
        <p>{t('dash_delete_prompt', '¿Eliminar este curso?')}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-sm btn-accent" onClick={async () => {
            toast.dismiss(t_toast.id);
            try {
              await api.deleteCourse(courseId);
              setData(prev => ({
                ...prev,
                enrollments: prev.enrollments.filter(en => en.course_id !== courseId)
              }));
              toast.success(t('dash_delete_success', 'Curso eliminado'));
            } catch { toast.error(t('dash_delete_error', 'Error eliminando el curso')); }
          }}>Confirmar</button>
          <button className="btn btn-sm" onClick={() => toast.dismiss(t_toast.id)}>Cancelar</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handlePublish = async (e, course) => {
    e.stopPropagation();
    try {
      const slug = course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newStatus = !course.is_published;
      if (newStatus) {
        await api.publishCourse(course.id, slug + '-' + course.id.slice(0, 8));
      } else {
        await api.unpublishCourse(course.id);
      }
      setData(prev => ({
        ...prev,
        enrollments: prev.enrollments.map(en => 
          en.course_id === course.id ? { ...en, courses: { ...en.courses, is_published: newStatus } } : en
        )
      }));
      toast.success('Visibilidad actualizada');
    } catch (err) {
      console.error(err);
      toast.error('Error al cambiar visibilidad');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  if (!data || !data.profile) {
    return (
      <div className="dashboard-page fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', textAlign: 'center' }}>
        <h2>Error cargando tus datos</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Hemos encontrado un problema al cargar tu perfil. Es posible que tu registro no se haya completado correctamente o haya un problema de conexión.
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Recargar página</button>
      </div>
    );
  }

  const { profile, enrollments = [], progress = [] } = data;

  // Process data for the UI
  const totalCourses = enrollments?.length || 0;
  const completedLessons = progress?.length || 0;
  
  const coursesWithProgress = enrollments.map(en => {
    const course = en.courses;
    if (!course) return null; // Guard against deleted or null courses
    const courseContent = parseCourseContent(course);
    let totalInCourse = 0;
    courseContent.unidades?.forEach(u => {
      totalInCourse += u.lecciones?.length || 0;
    });
    const completedInCourse = progress.filter(p => p && p.course_id === course?.id).length;
    const percent = totalInCourse > 0 ? Math.round((completedInCourse / totalInCourse) * 100) : 0;
    const isOwner = en.source === 'free' && course?.user_id === profile.id;
    return { ...course, percent, totalInCourse, completedInCourse, isOwner };
  }).filter(Boolean); // Remove null items

  // Real Activity: compute from progress completed_at dates (last 7 days)
  const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  const activityMap = {};
  dayNames.forEach(d => activityMap[d] = 0);
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  (progress || []).forEach(p => {
    if (!p.completed_at) return;
    const date = new Date(p.completed_at);
    if (date >= weekAgo) {
      const dayKey = dayNames[date.getDay()];
      activityMap[dayKey] = (activityMap[dayKey] || 0) + 10; // 10 XP per lesson
    }
  });

  const activityData = dayNames.map(day => ({ day, value: activityMap[day] || 0 }));
  const maxActivity = Math.max(...activityData.map(d => d.value), 1);

  return (
    <div className="dashboard-page fade-in">
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
      <GamificationBar />

      <div className="dashboard-container">
        
        {/* Header Visual */}
        <header className="dashboard-header glass">
          <div className="user-info">
            <div className="user-avatar-large">
              {profile.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <h1>¡Hola, {profile.full_name?.split(' ')[0]}! 👋</h1>
              <p className="welcome-text">Has acumulado <strong>{profile.total_xp} XP</strong> ¡Sigue así!</p>
            </div>
          </div>
          {role === 'admin' && (
            <div className="header-actions">
              <Link to="/generate" className="btn btn-primary">✨ Generar nuevo curso</Link>
            </div>
          )}
        </header>

        <div className="dashboard-grid">
          <div className="dashboard-main">
            
            {/* Gráfico de Actividad */}
            <section className="activity-section glass">
              <h3>📈 Actividad Semanal</h3>
              <div className="chart-container">
                {activityData.map((d, i) => (
                  <div key={i} className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      style={{ height: `${(d.value / maxActivity) * 100}%` }}
                    >
                      <div className="bar-tooltip">{d.value} XP</div>
                    </div>
                    <span className="chart-label">{d.day}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Listado de Cursos con Progreso */}
            <section className="courses-section">
              <div className="section-header">
                <h2>Mis Cursos</h2>
              </div>
              
              <div className="dashboard-courses-list">
                {coursesWithProgress.length === 0 ? (
                  <div className="empty-state glass">
                    <p>Aún no tienes cursos.</p>
                    <Link to="/catalog" className="btn btn-accent">Explorar Catálogo</Link>
                  </div>
                ) : (
                  coursesWithProgress.map(c => (
                    <div key={c.id} className="dash-course-card glass" onClick={() => navigate(`/course/${c.id}`)}>
                      <div className="dash-course-content">
                        <div className="dash-course-info">
                          <span className="badge badge-level">{c.level}</span>
                          <h3>{c.title || "Curso sin título"}</h3>
                          <p>{c.topic}</p>
                        </div>
                        <div className="dash-course-progress">
                          <div className="progress-info">
                            <span>{c.percent}% completado</span>
                            <span>{c.completedInCourse}/{c.totalInCourse}</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${c.percent}%` }}></div>
                          </div>
                        </div>
                        <div className="dash-course-actions">
                          <button className="btn btn-accent btn-sm" onClick={(e) => handleContinue(e, c.id)}>
                            {c.percent > 0 ? "Continuar" : "Empezar"}
                          </button>
                          {/* Only show management buttons for course creators */}
                          {c.isOwner && (
                          <div className="creator-actions">
                            <button className="btn-icon" title="Visibilidad" onClick={(e) => handlePublish(e, c)}>
                              {c.is_published ? "🌍" : "🔒"}
                            </button>
                            <button className="btn-icon" title="Eliminar" onClick={(e) => handleDelete(e, c.id)}>
                              🗑️
                            </button>
                          </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="dashboard-sidebar">
            {/* Stats Rápidas */}
            <div className="quick-stats glass">
              <div className="q-stat">
                <span className="q-val">🔥 {profile.current_streak}</span>
                <span className="q-label">Racha</span>
              </div>
              <div className="q-stat">
                <span className="q-val">🏆 {profile.badges?.length || 0}</span>
                <span className="q-label">Logros</span>
              </div>
              <div className="q-stat">
                <span className="q-val">📚 {totalCourses}</span>
                <span className="q-label">Cursos</span>
              </div>
            </div>

            {/* Preview de Logros */}
            <div className="achievements-preview glass">
              <h3>🏅 Logros</h3>
              <div className="badges-mini-list">
                {profile.badges && profile.badges.length > 0 ? (
                  profile.badges.slice(-5).map((b, i) => (
                    <div key={i} className="badge-mini-item" title={b.name}>
                      <span className="badge-mini-icon">{b.icon || "⭐"}</span>
                    </div>
                  ))
                ) : (
                   <p className="no-badges">¡Gana tu primer badge!</p>
                )}
              </div>
              <Link to="/leaderboard" className="btn btn-link">Ver Ranking Global</Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
