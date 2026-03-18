import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (authError) throw authError;
      // Note: Redirects automatically, local storage will be set in main.jsx onAuthStateChange
    } catch (err) {
      setError(err.message || "Error al conectar con Google");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      localStorage.setItem("access_token", data.session.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass fade-in">
        <h1>Bienvenido de vuelta</h1>
        <p className="subtitle">Ingresá a tu cuenta de CursosIA</p>

        {error && <div className="error-msg">{error}</div>}

        <button 
          className="btn btn-google btn-lg" 
          onClick={handleGoogleLogin} 
          disabled={loading} 
          style={{ width: "100%", marginBottom: "1rem" }}
          type="button"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
          Ingresar con Google
        </button>

        <div className="divider">o usar email</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "0.5rem" }}>
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
            <a href="#" className="text-muted" onClick={(e) => { e.preventDefault(); alert("Funcionalidad próximamente disponible."); }}>¿Olvidaste tu contraseña?</a>
          </div>

          <button className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="auth-footer">
          ¿No tenés cuenta? <Link to="/register">Registrate gratis</Link>
        </div>
      </div>
    </div>
  );
}
