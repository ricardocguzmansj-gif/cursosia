import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import LinkedInShare from "../components/LinkedInShare";

export default function Certificate() {
  const { code } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCertificate();
  }, [code]);

  const loadCertificate = async () => {
    try {
      const { data, error: err } = await supabase
        .from("certificates")
        .select("*, courses(title, content, level), profiles(full_name)")
        .eq("verification_code", code)
        .single();

      if (err || !data) {
        setError("Certificado no encontrado o código inválido.");
        return;
      }
      setCert(data);
    } catch {
      setError("Error verificando certificado.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "6rem" }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="certificate-page fade-in">
        <div className="cert-card glass" style={{ textAlign: "center" }}>
          <span style={{ fontSize: "3rem" }}>❌</span>
          <h1>Verificación fallida</h1>
          <p>{error}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const courseTitle = cert.courses?.content?.curso?.titulo || cert.courses?.title || "Curso";
  const studentName = cert.profiles?.full_name || "Estudiante";
  const issuedDate = new Date(cert.issued_at).toLocaleDateString("es", {
    day: "numeric", month: "long", year: "numeric"
  });

  return (
    <div className="certificate-page fade-in">
      <div className="cert-card glass">
        <div className="cert-badge">🎓</div>
        <h1 className="cert-title">Certificado de Finalización</h1>
        <p className="cert-subtitle">Se certifica que</p>
        <h2 className="cert-student">{studentName}</h2>
        <p className="cert-subtitle">ha completado satisfactoriamente el curso</p>
        <h3 className="cert-course">{courseTitle}</h3>

        {cert.score && (
          <div className="cert-score">
            <span className="cert-score-num">{cert.score}%</span>
            <span className="cert-score-label">Nota promedio</span>
          </div>
        )}

        <div className="cert-meta">
          <span>📅 {issuedDate}</span>
          <span>📊 {cert.courses?.level}</span>
        </div>

        <div className="cert-verification">
          <span>✅ Certificado verificado</span>
          <code>{cert.verification_code}</code>
        </div>

        <div className="cert-footer">
          <p>CursosIA — Plataforma de cursos generados con Inteligencia Artificial</p>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
          <LinkedInShare title={courseTitle} summary={`He completado el curso "${courseTitle}" con una puntuación de ${cert.score || 100}% en CursosIA.`} />
        </div>
      </div>
    </div>
  );
}
