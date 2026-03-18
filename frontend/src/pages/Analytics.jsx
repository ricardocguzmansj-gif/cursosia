import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";

export default function Analytics() {
  const [stats, setStats] = useState([]);
  const [eventCounts, setEventCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Course stats from view
      const { data: courseStats } = await supabase
        .from("course_stats")
        .select("*")
        .eq("creator_id", user.id);
      setStats(courseStats || []);

      // Event counts
      const { data: events } = await supabase
        .from("events")
        .select("event_type")
        .eq("user_id", user.id);

      const counts = {};
      (events || []).forEach(e => {
        counts[e.event_type] = (counts[e.event_type] || 0) + 1;
      });
      setEventCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = stats.reduce((acc, s) => acc + (parseFloat(s.total_revenue) || 0), 0);
  const totalEnrollments = stats.reduce((acc, s) => acc + (s.total_enrollments || 0), 0);
  const totalCerts = stats.reduce((acc, s) => acc + (s.certificates_issued || 0), 0);
  const totalStudents = stats.reduce((acc, s) => acc + (s.active_students || 0), 0);

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
        <h1>📊 {t("analytics_title", "Analytics")}</h1>
      </div>

      {/* KPI Cards */}
      <div className="analytics-kpis">
        <div className="kpi-card glass">
          <span className="kpi-icon">💰</span>
          <div className="kpi-value">${totalRevenue.toFixed(2)}</div>
          <div className="kpi-label">Ingresos totales</div>
        </div>
        <div className="kpi-card glass">
          <span className="kpi-icon">👥</span>
          <div className="kpi-value">{totalEnrollments}</div>
          <div className="kpi-label">Inscripciones</div>
        </div>
        <div className="kpi-card glass">
          <span className="kpi-icon">🎓</span>
          <div className="kpi-value">{totalCerts}</div>
          <div className="kpi-label">Certificados emitidos</div>
        </div>
        <div className="kpi-card glass">
          <span className="kpi-icon">📚</span>
          <div className="kpi-value">{totalStudents}</div>
          <div className="kpi-label">Alumnos activos</div>
        </div>
      </div>

      {/* Course Performance Table */}
      <div className="analytics-section glass">
        <h2>📈 Rendimiento por Curso</h2>
        {stats.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No tienes cursos creados aún.</p>
        ) : (
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Inscritos</th>
                  <th>Activos</th>
                  <th>Certificados</th>
                  <th>Ingresos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(s => (
                  <tr key={s.course_id}>
                    <td><strong>{s.title}</strong></td>
                    <td>{s.total_enrollments}</td>
                    <td>{s.active_students}</td>
                    <td>{s.certificates_issued}</td>
                    <td>${(parseFloat(s.total_revenue) || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${s.is_published ? 'badge-level' : ''}`}
                        style={s.is_published ? { background: 'rgba(0,184,148,0.15)', color: 'var(--success)' } : {}}>
                        {s.is_published ? "🟢 Publicado" : "🔒 Borrador"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Events Summary */}
      <div className="analytics-section glass">
        <h2>🔔 Eventos Recientes</h2>
        <div className="events-grid">
          {Object.entries(eventCounts).length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No hay eventos registrados.</p>
          ) : (
            Object.entries(eventCounts).map(([type, count]) => (
              <div key={type} className="event-card">
                <span className="event-type">{formatEventType(type)}</span>
                <span className="event-count">{count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatEventType(type) {
  const map = {
    certificate_issued: "🎓 Certificados",
    tutor_message: "🤖 Mensajes tutor",
    course_exported_pdf: "📄 Exportaciones PDF",
    course_start: "▶️ Inicios de curso",
    lesson_view: "📖 Lecciones vistas",
    quiz_submit: "📝 Tests completados",
    purchase: "💳 Compras",
  };
  return map[type] || type;
}
