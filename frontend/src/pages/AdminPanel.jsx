import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, coursesData] = await Promise.all([
        api.adminGetStats(),
        api.adminListUsers(),
        api.adminListCourses()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setCourses(coursesData);
    } catch (err) {
      console.error("Admin load error:", err);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentBlocked) => {
    const action = currentBlocked ? "desbloquear" : "bloquear";
    toast((t_toast) => (
      <div>
        <p>¿Estás seguro de {action} este usuario?</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-accent btn-sm" onClick={async () => {
             toast.dismiss(t_toast.id);
             setActionLoading(userId);
             try {
               await api.adminToggleUserStatus(userId, !currentBlocked);
               setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: !currentBlocked } : u));
               toast.success(`Usuario ${action === "bloquear" ? "bloqueado" : "desbloqueado"}`);
             } catch (err) {
               toast.error(err.message || "Error al cambiar estado");
             } finally {
               setActionLoading(null);
             }
          }}>Sí, {action}</button>
          <button className="btn btn-sm" onClick={() => toast.dismiss(t_toast.id)}>Cancelar</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleRoleChange = async (userId, newRole, userName) => {
    const action = newRole === "admin" ? t("admin_promote", "promover a Admin") : t("admin_demote", "cambiar a Alumno");
    toast((t_toast) => (
      <div>
        <p>¿Estás seguro de {action} a {userName}?</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-accent btn-sm" onClick={async () => {
             toast.dismiss(t_toast.id);
             setActionLoading(userId);
             try {
               await api.adminSetUserRole(userId, newRole);
               setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
               toast.success(`Rol actualizado a ${newRole}`);
             } catch (err) {
               toast.error(err.message || "Error al cambiar rol");
             } finally {
               setActionLoading(null);
             }
          }}>Sí, {action}</button>
          <button className="btn btn-sm" onClick={() => toast.dismiss(t_toast.id)}>Cancelar</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleApproveCourse = async (courseId, currentApproved) => {
    setActionLoading(courseId);
    try {
      await api.adminApproveCourse(courseId, !currentApproved);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_approved: !currentApproved } : c));
      toast.success(currentApproved ? "Curso desaprobado" : "Curso aprobado");
    } catch (err) {
      toast.error(err.message || "Error al aprobar curso");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleCourseStatus = async (courseId, currentBlocked) => {
    setActionLoading(courseId);
    try {
      await api.adminToggleCourseStatus(courseId, !currentBlocked);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_blocked: !currentBlocked } : c));
      toast.success(currentBlocked ? "Curso activado" : "Curso bloqueado");
    } catch (err) {
      toast.error(err.message || "Error al cambiar estado");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCourses = courses.filter(c =>
    (c.title || "").toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    (c.topic || "").toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  const roleBadge = (role) => {
    const map = { admin: "🛡️", alumno: "🎓", afiliado: "🤝" };
    return map[role] || "❓";
  };

  const roleClass = (role) => {
    const map = { admin: "role-admin", alumno: "role-alumno", afiliado: "role-afiliado" };
    return map[role] || "";
  };

  return (
    <div className="admin-page fade-in">
      <div className="admin-container">

        <header className="admin-header glass">
          <div>
            <h1>🛡️ {t("admin_panel_title", "Panel de Administración")}</h1>
            <p className="subtitle">{t("admin_panel_subtitle", "Gestiona CursosIA desde aquí")}</p>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === "dashboard" ? "active" : ""}`}
            onClick={() => setTab("dashboard")}
          >
            📊 {t("admin_tab_dashboard", "Dashboard")}
          </button>
          <button
            className={`admin-tab ${tab === "users" ? "active" : ""}`}
            onClick={() => setTab("users")}
          >
            👥 {t("admin_tab_users", "Usuarios")} ({users.length})
          </button>
          <button
            className={`admin-tab ${tab === "courses" ? "active" : ""}`}
            onClick={() => setTab("courses")}
          >
            📚 {t("admin_tab_courses", "Cursos")} ({courses.length})
          </button>
        </div>

        {/* ===== DASHBOARD TAB ===== */}
        {tab === "dashboard" && stats && (
          <div className="admin-dashboard">

            {/* Key Metrics */}
            <div className="admin-metrics-grid">
              <div className="admin-metric-card glass">
                <span className="metric-icon">👥</span>
                <div className="metric-data">
                  <span className="metric-value">{stats.total_users}</span>
                  <span className="metric-label">{t("admin_total_users", "Usuarios Totales")}</span>
                </div>
                {stats.new_users_7d > 0 && (
                  <span className="metric-badge positive">+{stats.new_users_7d} esta semana</span>
                )}
              </div>

              <div className="admin-metric-card glass">
                <span className="metric-icon">📚</span>
                <div className="metric-data">
                  <span className="metric-value">{stats.total_courses}</span>
                  <span className="metric-label">{t("admin_total_courses", "Cursos Generados")}</span>
                </div>
                <span className="metric-badge neutral">{stats.published_courses} publicados</span>
              </div>

              <div className="admin-metric-card glass">
                <span className="metric-icon">📝</span>
                <div className="metric-data">
                  <span className="metric-value">{stats.total_enrollments}</span>
                  <span className="metric-label">{t("admin_enrollments", "Inscripciones")}</span>
                </div>
              </div>

              <div className="admin-metric-card glass">
                <span className="metric-icon">🏅</span>
                <div className="metric-data">
                  <span className="metric-value">{stats.total_certificates}</span>
                  <span className="metric-label">{t("admin_certificates", "Certificados")}</span>
                </div>
              </div>

              <div className="admin-metric-card glass">
                <span className="metric-icon">⭐</span>
                <div className="metric-data">
                  <span className="metric-value">{stats.avg_rating || "—"}</span>
                  <span className="metric-label">{t("admin_avg_rating", "Rating Promedio")}</span>
                </div>
                <span className="metric-badge neutral">{stats.total_reviews} reviews</span>
              </div>

              <div className="admin-metric-card glass">
                <span className="metric-icon">✅</span>
                <div className="metric-data">
                  <span className="metric-value">{stats.total_completions}</span>
                  <span className="metric-label">{t("admin_completions", "Lecciones Completadas")}</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="admin-charts-row">

              {/* Role Distribution */}
              <div className="admin-chart-card glass">
                <h3>👥 {t("admin_role_dist", "Distribución de Roles")}</h3>
                <div className="admin-bar-chart">
                  {stats.role_distribution?.map((r, i) => {
                    const maxCount = Math.max(...stats.role_distribution.map(x => x.count));
                    const pct = maxCount > 0 ? (r.count / maxCount) * 100 : 0;
                    return (
                      <div key={i} className="admin-bar-item">
                        <div className="admin-bar-label">
                          <span>{roleBadge(r.role)} {r.role}</span>
                          <span className="admin-bar-count">{r.count}</span>
                        </div>
                        <div className="admin-bar-track">
                          <div className={`admin-bar-fill ${roleClass(r.role)}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Level Distribution */}
              <div className="admin-chart-card glass">
                <h3>📊 {t("admin_level_dist", "Cursos por Nivel")}</h3>
                <div className="admin-bar-chart">
                  {stats.level_distribution?.map((l, i) => {
                    const maxCount = Math.max(...stats.level_distribution.map(x => x.count));
                    const pct = maxCount > 0 ? (l.count / maxCount) * 100 : 0;
                    const levelEmoji = { principiante: "🟢", intermedio: "🟡", avanzado: "🔴" };
                    return (
                      <div key={i} className="admin-bar-item">
                        <div className="admin-bar-label">
                          <span>{levelEmoji[l.level] || "⚪"} {l.level}</span>
                          <span className="admin-bar-count">{l.count}</span>
                        </div>
                        <div className="admin-bar-track">
                          <div className="admin-bar-fill level-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Language Distribution */}
              <div className="admin-chart-card glass">
                <h3>🌐 {t("admin_lang_dist", "Cursos por Idioma")}</h3>
                <div className="admin-bar-chart">
                  {stats.language_distribution?.map((l, i) => {
                    const maxCount = Math.max(...stats.language_distribution.map(x => x.count));
                    const pct = maxCount > 0 ? (l.count / maxCount) * 100 : 0;
                    const langLabels = { es: "🇪🇸 Español", en: "🇺🇸 English", pt: "🇧🇷 Português" };
                    return (
                      <div key={i} className="admin-bar-item">
                        <div className="admin-bar-label">
                          <span>{langLabels[l.language] || l.language}</span>
                          <span className="admin-bar-count">{l.count}</span>
                        </div>
                        <div className="admin-bar-track">
                          <div className="admin-bar-fill lang-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tables Row */}
            <div className="admin-tables-row">
              {/* Top Courses */}
              <div className="admin-table-card glass">
                <h3>🏆 {t("admin_top_courses", "Top Cursos por Inscripciones")}</h3>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t("admin_col_title", "Título")}</th>
                        <th>{t("admin_col_level", "Nivel")}</th>
                        <th>{t("admin_col_enrollments", "Inscritos")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_courses?.map((c, i) => (
                        <tr key={c.id}>
                          <td className="rank-cell">{i + 1}</td>
                          <td className="title-cell">{c.title}</td>
                          <td><span className="badge badge-level">{c.level}</span></td>
                          <td className="count-cell">{c.enrollment_count}</td>
                        </tr>
                      ))}
                      {(!stats.top_courses || stats.top_courses.length === 0) && (
                        <tr><td colSpan={4} className="empty-cell">Sin cursos aún</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Courses */}
              <div className="admin-table-card glass">
                <h3>🆕 {t("admin_recent_courses", "Cursos Recientes")}</h3>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>{t("admin_col_title", "Título")}</th>
                        <th>{t("admin_col_creator", "Creador")}</th>
                        <th>{t("admin_col_date", "Fecha")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_courses?.map((c) => (
                        <tr key={c.id} className="clickable-row" onClick={() => navigate(`/course/${c.id}`)}>
                          <td className="title-cell">{c.title}</td>
                          <td className="email-cell">{c.creator_email}</td>
                          <td className="date-cell">{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {(!stats.recent_courses || stats.recent_courses.length === 0) && (
                        <tr><td colSpan={3} className="empty-cell">Sin cursos aún</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== USERS TAB ===== */}
        {tab === "users" && (
          <div className="admin-users">
            <div className="admin-search-bar glass">
              <input
                type="text"
                placeholder={t("admin_search_users", "🔍 Buscar por nombre o email...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="admin-table-card glass">
              <div className="admin-table-wrapper">
                <table className="admin-table users-table">
                  <thead>
                    <tr>
                      <th>{t("admin_col_name", "Nombre")}</th>
                      <th>{t("admin_col_email", "Email")}</th>
                      <th>{t("admin_col_role", "Rol")}</th>
                      <th>XP</th>
                      <th>🔥</th>
                      <th>{t("admin_col_date", "Fecha")}</th>
                      <th>{t("admin_col_actions", "Acciones")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="name-cell">
                          <div className="user-avatar-sm">{(u.full_name || "?").charAt(0)}</div>
                          {u.full_name || "—"}
                        </td>
                        <td className="email-cell">{u.email}</td>
                        <td>
                          <span className={`role-badge ${roleClass(u.role)}`}>
                            {roleBadge(u.role)} {u.role}
                          </span>
                        </td>
                        <td className="xp-cell">{u.total_xp || 0}</td>
                        <td className="streak-cell">{u.current_streak || 0}</td>
                        <td className="date-cell">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                         <td className="actions-cell">
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            {u.role !== "admin" ? (
                              <button
                                className="btn btn-sm btn-promote"
                                onClick={() => handleRoleChange(u.id, "admin", u.full_name || u.email)}
                                disabled={actionLoading === u.id}
                              >
                                {actionLoading === u.id ? "..." : `🛡️ Admin`}
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-demote"
                                onClick={() => handleRoleChange(u.id, "alumno", u.full_name || u.email)}
                                disabled={actionLoading === u.id}
                              >
                                {actionLoading === u.id ? "..." : `🎓 Alumno`}
                              </button>
                            )}
                            <button
                              className={`btn btn-sm ${u.is_blocked ? "btn-success" : "btn-danger"}`}
                              onClick={() => handleToggleUserStatus(u.id, u.is_blocked)}
                              disabled={actionLoading === u.id || u.role === "admin"}
                            >
                              {u.is_blocked ? "Desbloquear" : "Bloquear"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={7} className="empty-cell">{t("admin_no_results", "Sin resultados")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== COURSES TAB ===== */}
        {tab === "courses" && (
          <div className="admin-courses">
            <div className="admin-search-bar glass">
              <input
                type="text"
                placeholder={t("admin_search_courses", "🔍 Buscar por título o especialidad...")}
                value={courseSearchTerm}
                onChange={(e) => setCourseSearchTerm(e.target.value)}
              />
            </div>

            <div className="admin-table-card glass">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t("admin_col_title", "Título/Temática")}</th>
                      <th>{t("admin_col_topic", "Especialidad")}</th>
                      <th>{t("admin_col_level", "Nivel")}</th>
                      <th>{t("admin_col_creator", "Creador")}</th>
                      <th>{t("admin_col_status", "Estado")}</th>
                      <th>Inscritos</th>
                      <th>{t("admin_col_actions", "Acciones")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((c) => (
                      <tr key={c.id}>
                        <td className="title-cell" onClick={() => navigate(`/course/${c.id}`)} style={{ cursor: "pointer" }}>
                          <strong>{c.title}</strong>
                        </td>
                        <td>{c.topic}</td>
                        <td><span className="badge badge-level">{c.level}</span></td>
                        <td className="email-cell">{c.creator_email}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                            {c.is_approved ? <span className="badge badge-success">Aprobado</span> : <span className="badge badge-warning">Pediente</span>}
                            {c.is_published ? <span className="badge badge-info">Publicado</span> : <span className="badge badge-neutral">Borrador</span>}
                            {c.is_blocked && <span className="badge badge-danger">Bloqueado</span>}
                          </div>
                        </td>
                        <td>{c.enrollment_count}</td>
                        <td className="actions-cell">
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className={`btn btn-sm ${c.is_approved ? "btn-warning" : "btn-success"}`}
                              onClick={() => handleApproveCourse(c.id, c.is_approved)}
                              disabled={actionLoading === c.id}
                            >
                              {c.is_approved ? "Desaprobar" : "Aprobar"}
                            </button>
                            <button
                              className={`btn btn-sm ${c.is_blocked ? "btn-success" : "btn-danger"}`}
                              onClick={() => handleToggleCourseStatus(c.id, c.is_blocked)}
                              disabled={actionLoading === c.id}
                            >
                              {c.is_blocked ? "Desbloquear" : "Bloquear"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCourses.length === 0 && (
                      <tr><td colSpan={7} className="empty-cell">Sin cursos encontrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
