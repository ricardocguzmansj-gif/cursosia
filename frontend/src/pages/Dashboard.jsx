import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const coursesData = await api.getCourses();
      setCourses(coursesData);

      // Load progress for each course
      const progMap = {};
      await Promise.all(
        coursesData.map(async (c) => {
          try {
            const prog = await api.getProgress(c.id);
            progMap[c.id] = prog;
          } catch { progMap[c.id] = []; }
        })
      );
      setProgressMap(progMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercent = (course) => {
    const prog = progressMap[course.id] || [];
    const completed = prog.filter(p => p.completed).length;
    // We don't have total lessons count from the list query, estimate from progress
    // For a proper implementation we'd need the content, but we can show completed count
    return { completed, total: null };
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t('dash_delete_prompt', '¿Eliminar este curso?'))) return;
    try {
      await api.deleteCourse(id);
      setCourses(courses.filter(c => c.id !== id));
    } catch { alert(t('dash_delete_error', 'Error eliminando el curso')); }
  };

  const handlePublish = async (e, course) => {
    e.stopPropagation();
    try {
      const slug = course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (course.is_published) {
        await api.unpublishCourse(course.id);
        setCourses(courses.map(c => c.id === course.id ? { ...c, is_published: false } : c));
      } else {
        await api.publishCourse(course.id, slug + '-' + course.id.slice(0, 8));
        setCourses(courses.map(c => c.id === course.id ? { ...c, is_published: true } : c));
      }
    } catch (err) {
      console.error(err);
      alert('Error al cambiar visibilidad');
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(i18n.language || "es", {
      day: "numeric", month: "long", year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-spinner" style={{ margin: "4rem auto" }}></div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1>{t('dashboard_title')}</h1>
        <Link to="/generate" className="btn btn-primary">
          ✨ {t('dashboard_new_course')}
        </Link>
      </div>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <h3>{t('dashboard_empty')}</h3>
            <p>{t('dash_empty_sub', 'Crea tu primer curso con IA en menos de un minuto')}</p>
            <Link to="/generate" className="btn btn-primary btn-lg">
              ✨ {t('dash_empty_cta', 'Generar mi primer curso')}
            </Link>
          </div>
        ) : (
          courses.map(course => {
            const { completed } = getProgressPercent(course);
            return (
              <div
                key={course.id}
                className="card course-card"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="course-meta">
                  <span className="badge badge-level">{course.level}</span>
                  <span className="badge badge-profile">{course.profile}</span>
                  {course.is_published && (
                    <span className="badge" style={{ background: 'rgba(0,184,148,0.15)', color: 'var(--success)' }}>
                      🌍 Publicado
                    </span>
                  )}
                </div>
                <h3>{course.title}</h3>
                <p className="course-topic">📖 {course.topic}</p>

                {/* Progress indicator */}
                {completed > 0 && (
                  <div style={{ margin: '0.75rem 0' }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(completed * 10, 100)}%` }}></div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      {completed} lecciones completadas
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <span className="course-date">{formatDate(course.created_at)}</span>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {completed > 0 && (
                      <button className="btn btn-accent btn-sm" onClick={(e) => handleContinue(e, course.id)}>
                        ▶ Continuar
                      </button>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={(e) => handlePublish(e, course)}
                    >
                      {course.is_published ? '🔒 Despublicar' : '🌍 Publicar'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, course.id)}>
                      {t('dash_delete_btn', 'Eliminar')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
