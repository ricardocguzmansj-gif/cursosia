import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Listen for theme changes from other tabs if needed, or simply initialize
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

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
      <Link to="/dashboard" className="navbar-brand">CursosIA</Link>
      
      <button 
        className="menu-toggle" 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle Menu"
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>

      <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
        <select 
          value={i18n.language.split('-')[0] || 'es'} 
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
        <Link to="/dashboard" className="nav-item">🏠 {t("nav_dashboard", "Dashboard")}</Link>
        <Link to="/generate" className="nav-item">✨ {t("nav_generate", "Generar")}</Link>
        <Link to="/catalog" className="nav-item">📚 {t("nav_catalog", "Catálogo")}</Link>
        <Link to="/leaderboard" className="nav-item" title="Ranking">🏆</Link>
        <Link to="/analytics" className="nav-item" title="Estadísticas">📊</Link>
        <Link to="/affiliates" className="nav-item" title="Afiliados">🤝</Link>
        <NotificationBell />
        <button onClick={handleLogout}>{t("nav_logout")}</button>
      </div>
    </nav>
  );
}
