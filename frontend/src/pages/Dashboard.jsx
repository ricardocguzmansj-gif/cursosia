import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";
import GamificationBar from "../components/GamificationBar";
import OnboardingTour from "../components/OnboardingTour";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await api.getDashboardData();
      setData(dashboardData);
      
      if (!dashboardData.profile.onboarding_completed) {
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

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t('dash_delete_prompt', '¿Eliminar este curso?'))) return;
    try {
      await api.deleteCourse(id);
      setData(prev => ({
        ...prev,
        enrollments: prev.enrollments.filter(en => en.course_id !== id)
      }));
    } catch { alert(t('dash_delete_error', 'Error eliminando el curso')); }
  };

  const handlePublish = async (e, course) => {
    e.stopPropagation();
    try {
      const slug = course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (course.is_published) {
        await api.unpublishCourse(course.id);
        loadDashboard(); // Reload to update UI
      } else {
        await api.publishCourse(course.id, slug + '-' + course.id.slice(0, 8));
        loadDashboard();
      }
    } catch (err) {
      console.error(err);
      alert('Error al cambiar visibilidad');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  const { profile, enrollments, progress } = data;

  // Process data for the UI
  const totalCourses = enrollments?.length || 0;
  const completedLessons = progress?.length || 0;
  
  const coursesWithProgress = enrollments.map(en => {
    const course = en.courses;
    const courseContent = course.content?.curso || course.content;
    let totalInCourse = 0;
    courseContent.unidades?.forEach(u => {
      totalInCourse += u.lecciones?.length || 0;
    });
    const completedInCourse = progress.filter(p => p.course_id === course.id).length;
    const percent = totalInCourse > 0 ? Math.round((completedInCourse / totalInCourse) * 100) : 0;
    return { ...course, percent, totalInCourse, completedInCourse, is_owner: en.is_owner }; // Assuming is_owner exists or derived
  });

  // Mock Activity
  const activityData = [
    { day: "Lun", value: 30 }, { day: "Mar", value: 45 }, { day: "Mie", value: 15 },
    { day: "Jue", value: 60 }, { day: "Vie", value: 75 }, { day: "Sab", value: 20 }, { day: "Dom", value: 10 },
  ];
  const maxActivity = Math.max(...activityData.map(d => d.value));

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
          <div className="header-actions">
            <Link to="/generate" className="btn btn-primary">✨ Generar nuevo curso</Link>
          </div>
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
                          <h3>{c.title}</h3>
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
                          {/* Options for course management (creator view) */}
                          <div className="creator-actions">
                            <button className="btn-icon" title="Visibilidad" onClick={(e) => handlePublish(e, c)}>
                              {c.is_published ? "🌍" : "🔒"}
                            </button>
                            <button className="btn-icon" title="Eliminar" onClick={(e) => handleDelete(e, c.id)}>
                              🗑️
                            </button>
                          </div>
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
