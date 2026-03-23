import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const generatePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const symbols = '!@#$%&*_+-=';
    const all = upper + lower + digits + symbols;
    let pwd = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];
    for (let i = 4; i < 16; i++) {
      pwd.push(all[Math.floor(Math.random() * all.length)]);
    }
    // Shuffle
    for (let i = pwd.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
    }
    const generated = pwd.join('');
    setPassword(generated);
    setShowPassword(true); // Show it so user can see/copy
  };

  const handleGoogleSignup = async () => {
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
    } catch (err) {
      setError(err.message || "Error");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un email válido.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (authError) throw authError;

      if (data.session) {
        localStorage.setItem("access_token", data.session.access_token);
        navigate("/dashboard");
      } else {
        toast.success(t('register_success_msg', '¡Cuenta creada! Revisa tu email.'), { duration: 6000 });
        navigate("/login");
      }
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass fade-in">
        <h1>{t('register_title')}</h1>
        <p className="subtitle">{t('register_subtitle')}</p>

        {error && <div className="error-msg">{error}</div>}

        <button 
          className="btn btn-google btn-lg" 
          onClick={handleGoogleSignup} 
          disabled={loading} 
          style={{ width: "100%", marginBottom: "1rem" }}
          type="button"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
          {t('register_google')}
        </button>

        <div className="divider">{t('login_or', 'o usar email')}</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('register_name', 'Nombre completo')}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('register_name_ph', 'Tu nombre')}
              required
            />
          </div>

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

          <div className="form-group">
            <label>{t('login_password')}</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('register_pass_ph', 'Mínimo 6 caracteres')}
                minLength={6}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <button
              type="button"
              className="btn-suggest-password"
              onClick={generatePassword}
            >
              🎲 {t('register_suggest_pass', 'Sugerir contraseña segura')}
            </button>
          </div>

          <button className="btn btn-accent btn-lg" disabled={loading} style={{ width: "100%" }}>
            {loading ? "..." : t('register_btn', 'Registrarse')}
          </button>
        </form>

        <div className="auth-footer">
          {t('register_has_account')} <Link to="/login">{t('register_login_link')}</Link>
        </div>
      </div>
    </div>
  );
}
