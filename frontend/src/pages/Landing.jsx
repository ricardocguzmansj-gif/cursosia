import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main>
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-brand">CursosIA</span>
        <div className="navbar-links">
          <a href="#features">Funciones</a>
          <a href="#pricing">Precios</a>
          <Link to="/login" className="btn btn-outline btn-sm">Iniciar sesión</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Registrarse</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content fade-in">
          <div className="hero-badge">🤖 Potenciado por Inteligencia Artificial</div>
          <h1>
            Genera cursos completos <br />
            <span className="gradient-text">con un solo clic</span>
          </h1>
          <p>
            CursosIA crea cursos personalizados con IA: lecciones progresivas,
            tests interactivos, proyectos finales y certificados. Adaptados
            a tu nivel y tiempo disponible.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Empezar gratis →
            </Link>
            <a href="#features" className="btn btn-outline btn-lg">
              Ver cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-title">
          <h2>¿Cómo funciona?</h2>
          <p>Tres pasos simples para tener tu curso listo</p>
        </div>
        <div className="features-grid">
          <div className="card feature-card">
            <span className="feature-icon">📝</span>
            <h3>1. Describe tu curso</h3>
            <p>
              Ingresa el tema, tu nivel de experiencia, perfil y cuánto tiempo
              tenés para aprender. La IA se adapta a vos.
            </p>
          </div>
          <div className="card feature-card">
            <span className="feature-icon">🧠</span>
            <h3>2. La IA genera todo</h3>
            <p>
              En segundos, nuestra IA crea unidades, lecciones, ejemplos reales,
              actividades prácticas y tests con corrección automática.
            </p>
          </div>
          <div className="card feature-card">
            <span className="feature-icon">🚀</span>
            <h3>3. Aprendé a tu ritmo</h3>
            <p>
              Navega por las lecciones, resolvé los tests, seguí tu progreso
              y completá el proyecto final para certificarte.
            </p>
          </div>
        </div>
      </section>

      {/* More Features */}
      <section className="features">
        <div className="features-grid">
          <div className="card feature-card">
            <span className="feature-icon">🎯</span>
            <h3>Adaptación inteligente</h3>
            <p>
              Principiante, intermedio o avanzado. Secundario, universitario
              o profesional. El contenido se ajusta a vos.
            </p>
          </div>
          <div className="card feature-card">
            <span className="feature-icon">📊</span>
            <h3>Tests interactivos</h3>
            <p>
              Cada lección incluye preguntas de opción múltiple con
              corrección instantánea y seguimiento de puntaje.
            </p>
          </div>
          <div className="card feature-card">
            <span className="feature-icon">💼</span>
            <h3>Proyecto final</h3>
            <p>
              Cada curso incluye un proyecto integrador que conecta
              todo lo aprendido con aplicaciones reales.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="section-title">
          <h2>Planes</h2>
          <p>Empezá gratis, escalá cuando quieras</p>
        </div>
        <div className="pricing-grid">
          <div className="card pricing-card">
            <div className="plan-name">Gratis</div>
            <div className="price">$0</div>
            <div className="price-period">para siempre</div>
            <ul>
              <li>3 cursos por mes</li>
              <li>Hasta 4 unidades por curso</li>
              <li>Tests interactivos</li>
              <li>Historial de cursos</li>
            </ul>
            <Link to="/register" className="btn btn-outline" style={{ width: "100%" }}>
              Empezar gratis
            </Link>
          </div>
          <div className="card pricing-card featured">
            <div className="plan-name">Pro</div>
            <div className="price">$9.99</div>
            <div className="price-period">por mes</div>
            <ul>
              <li>Cursos ilimitados</li>
              <li>Hasta 8 unidades por curso</li>
              <li>Tests + proyecto final</li>
              <li>Certificados descargables</li>
              <li>Soporte prioritario</li>
            </ul>
            <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); alert("Planes Pro próximamente disponibles."); }} style={{ width: "100%" }}>
              Comenzar Pro
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} CursosIA — Plataforma educativa potenciada por IA</p>
      </footer>
    </main>
  );
}
