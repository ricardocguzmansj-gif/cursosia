import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">CursosIA</Link>
      <div className="navbar-links">
        <Link to="/dashboard">Mis Cursos</Link>
        <Link to="/generate">✨ Generar</Link>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </nav>
  );
}
