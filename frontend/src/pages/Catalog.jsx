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
  const [testModal, setTestModal] = useState({ open: false, course: null, questions: [], currentIndex: 0, score: 0, loading: false });
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchPlacementTest = async (course) => {
    setTestModal(prev => ({ ...prev, loading: true }));
    try {
      const data = await api.generateCourse({
        mode: 'placement-test',
        tema: course.topic,
        nivel: course.level,
        perfil: 'estudiante',
        language: 'es'
      });
      if (!data.preguntas) throw new Error("No se generaron preguntas");
      setTestModal(prev => ({ ...prev, questions: data.preguntas, loading: false }));
    } catch (err) {
      toast.error("Error al generar el test de nivelación.");
      setTestModal({ open: false });
    }
  };

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
    navigate(`/course/${course.id}`);
  };

  const handleEnroll = async (e, course) => {
    e.stopPropagation();
    const isFree = course.level?.toLowerCase() === "principiante" || course.level?.toLowerCase() === "beginner";
    
    // 1. Verificar Prerrequisito
    if (course.prerequisite_id && !myEnrollments.includes(course.prerequisite_id)) {
      toast.error("⚠️ FALTA PRERREQUISITO: Debes aprobar el nivel previo antes de inscribirte.", { duration: 5000 });
      return;
    }

    try {
      if (isFree) {
        setEnrollLoading(course.id);
        const canFree = await api.canEnrollFree();
        if (!canFree) {
          toast.error("Límite alcanzado: El acceso gratuito al nivel Principiante es 1 curso por mes.", { duration: 5000 });
          setEnrollLoading(null);
          return;
        }
        await api.enrollInCourse(course.id, 'free');
        toast.success("Inscripción exitosa");
        navigate(`/course/${course.id}`);
      } else {
        // 2. Interceptar con Placement Test para Niveles Superiores
        setTestModal({ open: true, course: course, questions: [], currentIndex: 0, score: 0 });
        fetchPlacementTest(course);
      }
    } catch (err) {
      if (err.message?.includes("No autorizado")) {
        toast.error("Debes iniciar sesión para inscribirte.");
        navigate("/login");
      } else {
        toast.error(err.message || "Error al procesar la solicitud.");
      }
    } finally {
      setEnrollLoading(null);
    }
  };

  const handleTestAnswer = (correct) => {
    setTestModal(prev => {
      const isCorrect = correct;
      const newScore = isCorrect ? prev.score + 1 : prev.score;
      const nextIndex = prev.currentIndex + 1;

      if (nextIndex >= prev.questions.length) {
        // Fin del cuestionario
        const passed = newScore >= 4; // 80% o más
        if (passed) {
          toast.success(`🎉 ¡Felicidades! Aprobaste con ${newScore}/5. Cargando Pago...`);
          // Redirigir a pago
          triggerPayment(prev.course);
        } else {
          toast.error(`❌ Sacaste ${newScore}/5. Te sugerimos repasar el nivel anterior. Acceso bloqueado.`);
        }
        return { ...prev, open: false };
      }
      return { ...prev, currentIndex: nextIndex, score: newScore };
    });
  };

  const triggerPayment = async (course) => {
    try {
      const payment = await api.createPayment(course.id, 'course');
      window.location.href = payment.init_point;
    } catch (err) {
      toast.error("Error cargando MercadoPago");
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

                  const levelClass = course.level?.toLowerCase() || "principiante";
                  const glowStyles = {
                    principiante: { border: "1px solid rgba(0, 184, 148, 0.3)", boxShadow: "0 4px 15px rgba(0, 184, 148, 0.05)" },
                    intermedio: { border: "1px solid rgba(241, 196, 15, 0.3)", boxShadow: "0 4px 15px rgba(241, 196, 15, 0.05)" },
                    avanzado: { border: "2px solid rgba(155, 89, 182, 0.4)", boxShadow: "0 8px 25px rgba(155, 89, 182, 0.15)" },
                    experto: { border: "2px solid rgba(231, 76, 60, 0.4)", boxShadow: "0 8px 30px rgba(231, 76, 60, 0.2)" }
                  };
                  const currentGlow = glowStyles[levelClass] || glowStyles.principiante;

                  return (
                    <div
                      key={course.id}
                      className="card catalog-card glass"
                      style={{ display: "flex", flexDirection: "column", cursor: "pointer", borderRadius: "20px", overflow: "hidden", padding: 0, ...currentGlow }}
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

      {/* MODAL placement test */}
      {testModal.open && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="modal-card glass fade-in" style={{ padding: "2rem", width: "100%", maxWidth: "550px", borderRadius: "24px", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
            <span style={{ fontSize: "3rem" }}>📋</span>
            <h2 style={{ marginTop: "1rem" }}>Test de Nivelación</h2>
            <p className="subtitle" style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
              Para acceder al nivel {testModal.course?.level}, demuestra que tienes los fundamentos. (Aprobás con 4/5)
            </p>

            {testModal.loading ? (
              <div style={{ margin: "2rem 0" }}>
                <div className="loading-spinner" style={{ margin: "0 auto 1rem auto" }}></div>
                <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>Generando preguntas con el rigor académico de CursosIA...</p>
              </div>
            ) : testModal.questions.length > 0 ? (
              <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--primary-light)", fontWeight: "bold", textTransform: "uppercase" }}>Pregunta {testModal.currentIndex + 1} de 5</p>
                <h4 style={{ margin: "0.5rem 0 1rem 0", color: "white" }}>{testModal.questions[testModal.currentIndex].pregunta}</h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {testModal.questions[testModal.currentIndex].options.map((option, idx) => {
                    const letter = option.substring(0, 1).toUpperCase();
                    const isCorrect = letter === testModal.questions[testModal.currentIndex].respuesta_correcta.toUpperCase();
                    
                    return (
                      <button
                        key={idx}
                        className="btn"
                        style={{ justifyContent: "flex-start", textAlign: "left", padding: "1rem", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                        onClick={() => handleTestAnswer(isCorrect)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p>No se pudo generar el test. Re-intenta o contacta a soporte.</p>
            )}

            <button
              className="btn btn-outline"
              style={{ marginTop: "2rem", width: "100%", borderColor: "rgba(255,255,255,0.2)" }}
              onClick={() => setTestModal({ open: false })}
            >
              Cancelar e irme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
