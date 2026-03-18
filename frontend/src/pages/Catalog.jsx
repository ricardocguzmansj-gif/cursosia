import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";

export default function Catalog() {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ level: "", search: "" });
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getPublishedCourses();
      setCourses(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = courses;
    if (filter.level) {
      result = result.filter(c => c.level?.toLowerCase().includes(filter.level.toLowerCase()));
    }
    if (filter.search) {
      const s = filter.search.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(s) ||
        c.topic?.toLowerCase().includes(s)
      );
    }
    setFiltered(result);
  }, [filter, courses]);

  const handleEnroll = async (e, courseId) => {
    e.stopPropagation();
    try {
      await api.enrollInCourse(courseId);
      navigate(`/course/${courseId}`);
    } catch (err) {
      alert("Debes iniciar sesión para inscribirte");
      navigate("/login");
    }
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
        <h1>📚 {t('catalog_title', 'Catálogo de Cursos')}</h1>
      </div>

      {/* Filters */}
      <div className="catalog-filters">
        <input
          type="text"
          placeholder={t('catalog_search', 'Buscar cursos...')}
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          className="catalog-search"
        />
        <select
          value={filter.level}
          onChange={e => setFilter({ ...filter, level: e.target.value })}
          className="catalog-select"
        >
          <option value="">{t('catalog_all_levels', 'Todos los niveles')}</option>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
          <option value="experto">Experto</option>
        </select>
      </div>

      <div className="courses-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>{t('catalog_empty', 'No hay cursos disponibles')}</h3>
            <p>Aún no se han publicado cursos. ¡Sé el primero!</p>
          </div>
        ) : (
          filtered.map(course => (
            <div
              key={course.id}
              className="card course-card catalog-card"
              onClick={() => navigate(`/course/${course.id}`)}
            >
              <div className="course-meta">
                <span className="badge badge-level">{course.level}</span>
                {course.price > 0 ? (
                  <span className="badge" style={{ background: 'rgba(0,184,148,0.2)', color: 'var(--success)' }}>
                    💰 {course.currency} {course.price}
                  </span>
                ) : (
                  <span className="badge" style={{ background: 'rgba(108,92,231,0.2)', color: 'var(--primary)' }}>
                    🆓 Gratis
                  </span>
                )}
              </div>
              <h3>{course.title}</h3>
              <p className="course-topic">📖 {course.topic}</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ width: "100%", marginTop: "0.75rem" }}
                onClick={(e) => handleEnroll(e, course.id)}
              >
                🚀 Inscribirme
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
