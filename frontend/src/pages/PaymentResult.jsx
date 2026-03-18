import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || searchParams.get("collection_status") || "unknown";
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id") || "";
  const externalRef = searchParams.get("external_reference") || "";
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (status === "success" || status === "approved") {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = "/dashboard";
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  const statusConfig = {
    success: {
      icon: "✅",
      title: "¡Pago Exitoso!",
      desc: "Tu pago ha sido procesado correctamente. Ya tienes acceso al contenido.",
      gradient: "linear-gradient(135deg, #00b894, #00cec9)",
      accent: "var(--success)",
    },
    approved: {
      icon: "✅",
      title: "¡Pago Aprobado!",
      desc: "Tu pago ha sido procesado correctamente. Ya tienes acceso al contenido.",
      gradient: "linear-gradient(135deg, #00b894, #00cec9)",
      accent: "var(--success)",
    },
    failure: {
      icon: "❌",
      title: "Pago no procesado",
      desc: "No pudimos completar tu pago. Intenta nuevamente o utiliza otro medio de pago.",
      gradient: "linear-gradient(135deg, #e17055, #d63031)",
      accent: "var(--danger, #e74c3c)",
    },
    rejected: {
      icon: "❌",
      title: "Pago rechazado",
      desc: "Tu pago fue rechazado. Verifica los datos e intenta nuevamente.",
      gradient: "linear-gradient(135deg, #e17055, #d63031)",
      accent: "var(--danger, #e74c3c)",
    },
    pending: {
      icon: "⏳",
      title: "Pago en proceso",
      desc: "Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.",
      gradient: "linear-gradient(135deg, #f39c12, #fdcb6e)",
      accent: "#f39c12",
    },
    in_process: {
      icon: "⏳",
      title: "Pago en proceso",
      desc: "Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.",
      gradient: "linear-gradient(135deg, #f39c12, #fdcb6e)",
      accent: "#f39c12",
    },
    unknown: {
      icon: "❓",
      title: "Estado desconocido",
      desc: "No pudimos determinar el estado de tu pago. Revisa tu correo electrónico.",
      gradient: "linear-gradient(135deg, #636e72, #b2bec3)",
      accent: "#b2bec3",
    },
  };

  const config = statusConfig[status] || statusConfig.unknown;
  const isSuccess = status === "success" || status === "approved";

  return (
    <div className="fade-in" style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-dark)",
      padding: "2rem",
    }}>
      <div className="glass" style={{
        maxWidth: "520px",
        width: "100%",
        borderRadius: "24px",
        overflow: "hidden",
        textAlign: "center",
      }}>
        {/* Header */}
        <div style={{
          background: config.gradient,
          padding: "50px 30px 40px",
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>{config.icon}</div>
          <h1 style={{ color: "white", margin: 0, fontSize: "1.8rem" }}>{config.title}</h1>
        </div>

        {/* Body */}
        <div style={{ padding: "30px" }}>
          <p style={{ fontSize: "1.05rem", opacity: 0.85, marginBottom: "1.5rem", lineHeight: 1.6 }}>
            {config.desc}
          </p>

          {paymentId && (
            <div style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "1.5rem",
              fontSize: "0.85rem",
              opacity: 0.6,
            }}>
              ID de pago: <strong>{paymentId}</strong>
            </div>
          )}

          {isSuccess && (
            <p style={{ fontSize: "0.9rem", opacity: 0.6 }}>
              Redirigiendo al Dashboard en {countdown}s...
            </p>
          )}

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
            {isSuccess ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                🎓 Ir a Mis Cursos
              </Link>
            ) : (
              <>
                <Link to="/catalog" className="btn btn-primary btn-lg">
                  📚 Volver al Catálogo
                </Link>
                <Link to="/dashboard" className="btn btn-outline btn-lg">
                  🏠 Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
