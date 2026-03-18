import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { parseCourseContent } from "../lib/courseHelper";

// Helper: extract units from JSONB content
function getCursoData(course) {
  const curso = parseCourseContent(course);
  const unidades = curso.unidades || [];
  const totalLessons = unidades.reduce((acc, u) => acc + (u.lecciones?.length || 0), 0);
  return { unidades, totalLessons };
}

export default function Catalog() {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ level: "", search: "" });
  const [expandedId, setExpandedId] = useState(null);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getPublishedCourses();
      setCourses(data);
      setFiltered(data);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const enrolls = await api.getMyCourses();
        setMyEnrollments(enrolls.map(e => e.course_id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...courses];
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
    // DB already orders by topic → title alphabetically
    setFiltered(result);
  }, [filter, courses]);

  const [enrollLoading, setEnrollLoading] = useState(null);

  const handleCardClick = (course) => {
    if (myEnrollments.includes(course.id)) {
      navigate(`/course/${course.id}`);
    } else {
      toast("Para ingresar, primero haz clic en 'Inscribirme'", { icon: "ℹ️" });
    }
  };

  const handleEnroll = async (e, course) => {
    e.stopPropagation();
    setEnrollLoading(course.id);
    try {
      if (course.level === "Principiante" || course.level === "Beginner") {
        const canFree = await api.canEnrollFree();
        if (!canFree) {
          toast.error("Límite alcanzado: El acceso gratuito al nivel Principiante es 1 curso por mes.\n\nPrueba con otro nivel o espera al próximo mes.", { duration: 5000 });
          return;
        }
        await api.enrollInCourse(course.id, 'free');
        toast.success("Inscripción exitosa");
        navigate(`/course/${course.id}`);
      } else {
        // Real MercadoPago payment
        const payment = await api.createPayment(course.id, 'course');
        toast.success("Cargando MercadoPago...");
        // Redirect to MercadoPago checkout
        window.location.href = payment.init_point;
      }
    } catch (err) {
      if (err.message?.includes("No autorizado")) {
        toast.error("Debes iniciar sesión para inscribirte.");
        navigate("/login");
      } else {
        toast.error(err.message || "Error al procesar el pago.");
      }
    } finally {
      setEnrollLoading(null);
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
        <p className="subtitle">Especialidades ordenadas alfabéticamente · Progreso y seguimiento incluidos</p>
      </div>

      {/* Filters */}
      <div className="catalog-filters glass" style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "16px" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", width: "100%" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por tema o especialidad..."
            value={filter.search}
            onChange={e => setFilter({ ...filter, search: e.target.value })}
            className="catalog-search"
            style={{ flex: 1, minWidth: "250px" }}
          />
          <select
            value={filter.level}
            onChange={e => setFilter({ ...filter, level: e.target.value })}
            className="catalog-select"
            style={{ width: "220px" }}
          >
            <option value="">Todos los niveles</option>
            <option value="principiante">🟢 Principiante (Gratis)</option>
            <option value="intermedio">🟡 Intermedio</option>
            <option value="avanzado">🔴 Avanzado</option>
            <option value="experto">⚫ Experto</option>
          </select>
          <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>
            {filtered.length} curso{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Cards grid grouped by Specialty */}
      <div className="catalog-content">
        {filtered.length === 0 ? (
          <div className="empty-state glass" style={{ padding: "4rem", textAlign: "center" }}>
            <span style={{ fontSize: "4rem", marginBottom: "1rem", display: "block" }}>🔍</span>
            <h3>No hay cursos disponibles</h3>
            <p>Aún no se han publicado cursos en el catálogo público.</p>
          </div>
        ) : (
          Object.entries(
            filtered.reduce((acc, c) => {
              const topic = c.topic || "General";
              if (!acc[topic]) acc[topic] = [];
              acc[topic].push(c);
              return acc;
            }, {})
          )
          .sort(([a], [b]) => a.localeCompare(b)) // Sort Specialties alphabetically
          .map(([topic, topicCourses]) => (
            <div key={topic} className="catalog-category-section" style={{ marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.5rem", color: "var(--primary-light)", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
                🏷️ {topic}
              </h2>
              <div className="courses-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.5rem" }}>
                {topicCourses.map(course => {
                  const { unidades, totalLessons } = getCursoData(course);
                  const isExpanded = expandedId === course.id;
                  const isFree = course.level?.toLowerCase() === "principiante";
                  const previewUnits = isExpanded ? unidades : unidades.slice(0, 3);

                  return (
                    <div
                      key={course.id}
                      className="card catalog-card glass"
                      style={{ display: "flex", flexDirection: "column", cursor: "pointer", borderRadius: "20px", overflow: "hidden", padding: 0 }}
                    >
                      {/* Clickable body */}
                      <div
                        style={{ padding: "1.5rem", flex: 1 }}
                        onClick={() => handleCardClick(course)}
                      >
                        {/* Badges */}
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                          <span className="badge badge-level">{course.level}</span>
                          {isFree ? (
                            <span className="badge" style={{ background: "rgba(0,184,148,0.2)", color: "var(--success)" }}>
                              🆓 Gratis (1 por mes)
                            </span>
                          ) : (
                            <span className="badge" style={{ background: "rgba(253,121,168,0.2)", color: "var(--accent)" }}>
                              💰 {course.currency || "USD"} {Number(course.price || 49.99).toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.35rem 0", color: "white", lineHeight: 1.3 }}>
                          {course.title}
                        </h3>

                        {/* Ratings/Stars */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.15rem", color: "#f1c40f", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                          {course.avg_rating > 0 ? (
                            <>
                              {"★".repeat(Math.round(course.avg_rating))}
                              {"☆".repeat(5 - Math.round(course.avg_rating))}
                              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginLeft: "0.25rem" }}>
                                ({course.avg_rating.toFixed(1)})
                              </span>
                            </>
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>⭐ Nuevo</span>
                          )}
                        </div>

                        {/* Stats row */}
                        {unidades.length > 0 && (
                          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", opacity: 0.75, marginBottom: "1rem" }}>
                            <span>📦 {unidades.length} Unidades</span>
                            <span>📖 {totalLessons} Lecciones</span>
                          </div>
                        )}

                        {/* Plan de Estudios */}
                        {unidades.length > 0 && (
                          <div style={{ marginBottom: "0.5rem" }}>
                            <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary-light)", marginBottom: "0.5rem" }}>
                              Plan de Estudios
                            </p>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                              {previewUnits.map((u, i) => (
                                <li key={i} style={{ fontSize: "0.83rem", padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                                  <span style={{ color: "var(--primary)", fontWeight: 700, minWidth: "1.5rem" }}>{i + 1}.</span>
                                  <span style={{ opacity: 0.85 }}>{u.titulo || u.title || `Unidad ${i + 1}`}</span>
                                </li>
                              ))}
                              {unidades.length > 3 && (
                                <li>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : course.id); }}
                                    style={{ background: "none", border: "none", color: "var(--primary-light)", fontSize: "0.8rem", cursor: "pointer", padding: "0.5rem 0", textDecoration: "underline" }}
                                  >
                                    {isExpanded ? "▲ Ver menos" : `▼ Ver las ${unidades.length - 3} unidades restantes`}
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Objective if no units */}
                        {unidades.length === 0 && course.objective && (
                          <p style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: "1rem" }}>
                            {course.objective.slice(0, 140)}{course.objective.length > 140 ? "…" : ""}
                          </p>
                        )}
                      </div>

                      {/* Footer */}
                      <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.15)" }}>
                        <p style={{ fontSize: "0.78rem", opacity: 0.6, margin: "0 0 0.75rem 0" }}>
                          📜 Certificado de Aprobación Oficial: +$20 USD (opcional)
                        </p>
                        <button
                          className="btn btn-primary"
                          style={{ width: "100%", fontSize: "0.95rem" }}
                          onClick={(e) => handleEnroll(e, course)}
                          disabled={enrollLoading === course.id}
                        >
                          {enrollLoading === course.id
                            ? "⏳ Procesando..."
                            : `🚀 ${isFree ? "Empezar Gratis" : "Inscribirme Ahora"}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
