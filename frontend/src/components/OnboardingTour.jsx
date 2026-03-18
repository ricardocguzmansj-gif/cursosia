import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

const STEPS = [
  {
    target: ".navbar-brand",
    title: "¡Bienvenido a CursosIA! 🎉",
    text: "Tu plataforma de cursos generados por Inteligencia Artificial. Vamos a darte un tour rápido.",
    position: "bottom"
  },
  {
    target: "a[href='/generate']",
    title: "✨ Genera tu primer curso",
    text: "Elige un tema, nivel y perfil. La IA creará un curso completo con lecciones, quizzes y proyectos en menos de 1 minuto.",
    position: "bottom"
  },
  {
    target: "a[href='/catalog']",
    title: "📚 Catálogo público",
    text: "Explora cursos publicados por otros creadores. Puedes inscribirte y aprender gratis o comprando el curso.",
    position: "bottom"
  },
  {
    target: ".gamification-bar",
    title: "⭐ Sistema de XP y Rachas",
    text: "Gana puntos XP completando lecciones y quizzes. Mantén tu racha diaria para desbloquear badges exclusivos.",
    position: "bottom"
  },
  {
    target: "a[href='/analytics']",
    title: "📊 Tu panel de analytics",
    text: "Aquí verás estadísticas de tus cursos: ingresos, inscripciones, certificados y más.",
    position: "bottom"
  }
];

export default function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    highlightTarget();
  }, [step]);

  const highlightTarget = () => {
    // Remove previous highlights
    document.querySelectorAll(".onboarding-highlight").forEach(el => {
      el.classList.remove("onboarding-highlight");
    });

    const target = document.querySelector(STEPS[step]?.target);
    if (target) {
      target.classList.add("onboarding-highlight");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    document.querySelectorAll(".onboarding-highlight").forEach(el => {
      el.classList.remove("onboarding-highlight");
    });
    setVisible(false);
    try { await api.setOnboardingCompleted(); } catch {}
    if (onComplete) onComplete();
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-tooltip glass">
        <div className="onboarding-step-count">
          {step + 1} / {STEPS.length}
        </div>
        <h3 className="onboarding-title">{current.title}</h3>
        <p className="onboarding-text">{current.text}</p>
        <div className="onboarding-actions">
          <button className="btn btn-outline btn-sm" onClick={finish}>
            Saltar
          </button>
          <button className="btn btn-primary btn-sm" onClick={next}>
            {step < STEPS.length - 1 ? "Siguiente →" : "¡Empezar! 🚀"}
          </button>
        </div>
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? "active" : ""}`}></span>
          ))}
        </div>
      </div>
    </div>
  );
}
