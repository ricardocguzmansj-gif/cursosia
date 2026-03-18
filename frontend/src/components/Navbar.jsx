import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";

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
        <Link to="/dashboard">{t("nav_dashboard")}</Link>
        <Link to="/generate">✨ {t("nav_dashboard") === "Mis Cursos" ? "Generar" : t("nav_dashboard") === "My Courses" ? "Generate" : "Gerar"}</Link>
        <Link to="/catalog">📚 {t("nav_dashboard") === "Mis Cursos" ? "Catálogo" : t("nav_dashboard") === "My Courses" ? "Catalog" : "Catálogo"}</Link>
        <Link to="/analytics">📊</Link>
        <Link to="/affiliates">🤝</Link>
        <button onClick={handleLogout}>{t("nav_logout")}</button>
      </div>
    </nav>
  );
}
