import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      setError(err.message || "Error");
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
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass fade-in">
        <h1>{t('login_title')}</h1>
        <p className="subtitle">{t('login_subtitle')}</p>

        {error && <div className="error-msg">{error}</div>}

        <button 
          className="btn btn-google btn-lg" 
          onClick={handleGoogleLogin} 
          disabled={loading} 
          style={{ width: "100%", marginBottom: "1rem" }}
          type="button"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
          {t('login_google')}
        </button>

        <div className="divider">{t('login_or')}</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('login_email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "0.5rem" }}>
            <label>{t('login_password')}</label>
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
            <a href="#" className="text-muted" onClick={(e) => { e.preventDefault(); }}>¿Olvidaste tu contraseña?</a>
          </div>

          <button className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%" }}>
            {loading ? "..." : t('login_btn')}
          </button>
        </form>

        <div className="auth-footer">
          {t('login_no_account')} <Link to="/register">{t('login_register_link')}</Link>
        </div>
      </div>
    </div>
  );
}
