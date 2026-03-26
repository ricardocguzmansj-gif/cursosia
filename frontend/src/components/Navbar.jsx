import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) api.getUserRole().then(r => setRole(r)).catch(() => setRole('alumno'));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) api.getUserRole().then(r => setRole(r)).catch(() => setRole('alumno'));
      else setRole(null);
    });

    return () => subscription.unsubscribe();
  }, [theme]);

  const isAdmin = role === 'admin';

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    navigate("/");
  };

  const changeLanguage = (e) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">CursosIA</Link>
      
      <button 
        className="menu-toggle" 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle Menu"
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>

      <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
        <select 
          value={i18n.language?.split('-')[0] || 'es'} 
          onChange={changeLanguage}
          className="lang-select"
        >
          <option value="es">🇪🇸 ES</option>
          <option value="en">🇺🇸 EN</option>
          <option value="pt">🇧🇷 PT</option>
        </select>
        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme" style={{ background: 'transparent', transition: 'transform 0.3s' }}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {session ? (
          <>
            <Link to="/dashboard" className="nav-item">🏠 {t("nav_dashboard", "Dashboard")}</Link>
            <Link to="/paths" className="nav-item">🗺️ Rutas</Link>
            <Link to="/quality" className="nav-item" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>⭐ {t("nav_quality")}</Link>
            {isAdmin && <Link to="/generate" className="nav-item">✨ {t("nav_generate", "Generar")}</Link>}
            <Link to="/my-profile" className="nav-item">👔 Mi Perfil</Link>
            <Link to="/catalog" className="nav-item">📚 {t("nav_catalog", "Catálogo")}</Link>
            <Link to="/jobs" className="nav-item" title="Bolsa de Trabajo">💼</Link>
            <Link to="/manage-jobs" className="nav-item" title="Mis Ofertas Publicadas">📋 Mis Ofertas</Link>
            <Link to="/post-job" className="nav-item btn btn-outline" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", borderColor: "var(--accent-glow)", color: "var(--accent-glow)" }}>Publicar Empleo</Link>
            <Link to="/leaderboard" className="nav-item" title="Ranking">🏆 {t("nav_ranking", "Ranking")}</Link>
            <Link to="/analytics" className="nav-item" title="Estadísticas">📊 {t("nav_stats", "Estadísticas")}</Link>
            <Link to="/affiliates" className="nav-item" title="Afiliados">🤝 {t("nav_affiliates", "Afiliados")}</Link>
            <Link to="/my-certificates" className="nav-item">🎓 {t("nav_certificates", "Certificados")}</Link>
            {isAdmin && <Link to="/admin" className="nav-item nav-admin">🛡️ {t("nav_admin", "Admin")}</Link>}
            <NotificationBell />
            <button onClick={handleLogout}>{t("nav_logout")}</button>
          </>
        ) : (
          <>
            <Link to="/quality" className="nav-item" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>⭐ {t("nav_quality")}</Link>
            <Link to="/paths" className="nav-item">🗺️ Rutas</Link>
            <Link to="/catalog" className="nav-item">📚 {t("nav_catalog", "Catálogo")}</Link>
            <Link to="/jobs" className="nav-item">💼 Empleos</Link>
            <Link to="/post-job" className="nav-item btn btn-outline" style={{ padding: "0.3rem 0.6rem", fontSize: "0.85rem", borderColor: "var(--accent-glow)", color: "var(--accent-glow)", margin: "0 0.5rem" }}>Publicar Empleo</Link>
            <Link to="/login" className="nav-item">🔑 {t("nav_login", "Iniciar Sesión")}</Link>
            <Link to="/register" className="nav-item btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              {t("nav_register", "Crear Cuenta")}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
