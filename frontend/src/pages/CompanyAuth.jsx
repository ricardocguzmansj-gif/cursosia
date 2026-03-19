import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function CompanyAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname.includes("registro");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // 1. Registro
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (authError) throw authError;

        if (data?.user) {
          // 2. Forzar rol a Reclutador y actualizar datos de empresa
          await supabase
            .from('profiles')
            .update({ 
              role: 'reclutador', 
              company_name: companyName,
              whatsapp: whatsapp 
            })
            .eq('id', data.user.id);

          toast.success("¡Cuenta corporativa creada! Revisa tu email.");
          navigate("/login");
        } else {
           toast.success("¡Cuenta creada! Revisa tu email para activar.");
           navigate("/login");
        }
      } else {
        // 1. Login
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) throw authError;

        localStorage.setItem("access_token", data.session.access_token);
        
        // 2. Redirección dinámica basada en Rol
        const role = await api.getUserRole();
        if (role === 'reclutador' || role === 'admin') {
          navigate("/manage-jobs");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass fade-in" style={{ maxWidth: "450px" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <span className="badge badge-accent" style={{ fontSize: "0.8rem" }}>🏢 Módulo Empresas</span>
        </div>
        
        <h1>{isRegister ? "Crea tu Cuenta Corporativa" : "Acceso para Empresas"}</h1>
        <p className="subtitle">
          {isRegister 
            ? "Publica vacantes, gestiona talentos y automatiza contrataciones." 
            : "Gestiona tus búsquedas de talento y requerimientos."}
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label>Nombre de la Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej: TechCorp S.A."
                  required={isRegister}
                />
              </div>
              <div className="form-group">
                <label>Nombre del Representante</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  required={isRegister}
                />
              </div>
              <div className="form-group">
                <label>WhatsApp Corporativo</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+54 9 11 1234 5678"
                  required={isRegister}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Corporativo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rrhh@tuempresa.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%", marginTop: "1rem" }}>
            {loading ? "Procesando..." : isRegister ? "Registrar Empresa" : "Iniciar Sesión"}
          </button>
        </form>

        <div className="auth-footer">
          {isRegister ? (
            <>¿Ya tienes cuenta? <Link to="/empresas/login" className="text-secondary">Inicia sesión</Link></>
          ) : (
            <>¿Eres nuevo? <Link to="/empresas/registro" className="text-secondary">Crea una cuenta para tu empresa</Link></>
          )}
          <div style={{ marginTop: "1rem" }}>
            <Link to="/login" className="text-muted" style={{ fontSize: "0.85rem" }}>¿No eres una empresa? Ir al Login de Usuarios</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
