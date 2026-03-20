import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Quality() {
  useEffect(() => {
    document.title = "CursosIA | Garantía de Excelencia Académica Impulsada por IA";
    return () => {
      document.title = "CursosIA";
    };
  }, []);

  return (
    <div className="quality-page fade-in">
      <div className="quality-hero">
        <div className="container">
          <span className="badge-promo">Excelencia 5.0</span>
          <h1>Calidad Académica en CursosIA</h1>
          <p className="subtitle pink-gradient-text">
            "El Núcleo de Excelencia Académica impulsado por Inteligencia Artificial para el Nuevo Siglo."
          </p>
        </div>
      </div>

      <div className="container">
        <div className="quality-grid">
          {/* Section 1: Source */}
          <div className="quality-card glass">
            <div className="card-icon">🧠</div>
            <h3>Nuestra Fuente</h3>
            <p>
              CursosIA utiliza el motor de razonamiento <strong>Gemini 3.1 Flash-Lite</strong>, la última frontera en 
              modelos de lenguaje con <em>thought signatures</em> para una coherencia académica sin precedentes. 
              No son simples textos estáticos, sino estructuras de conocimiento diseñadas al instante para tus necesidades.
            </p>
          </div>

          {/* Section 2: Reliability */}
          <div className="quality-card glass">
            <div className="card-icon">🔍</div>
            <h3>¿Son confiables?</h3>
            <p>
              Sí. El sistema tiene instrucciones obligatorias de realizar búsquedas en tiempo real para identificar bibliografía real y actualizada, consultando repositorios como <strong>arXiv, IEEE y Google Scholar</strong>. 
              Nuestra IA tiene estrictamente prohibido inventar datos (hallucinations).
            </p>
          </div>

          {/* Section 3: Rigor */}
          <div className="quality-card glass">
            <div className="card-icon">🎓</div>
            <h3>Rigor de Élite</h3>
            <p>
              El "prompt" de diseño académico exige un nivel de profundidad equivalente o superior a las mejores universidades del mundo, como <strong>MIT, Harvard u Oxford</strong>. 
              El contenido es denso, exhaustivo y orientado al mercado laboral corporativo.
            </p>
          </div>
        </div>

        <div className="comparison-section glass">
          <h2 className="section-header">CursosIA vs. Universidad Tradicional</h2>
          <p className="section-desc">Una comparativa técnica sobre la eficiencia en la transferencia de conocimiento en la era de la IA.</p>
          <div className="table-responsive">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Eje de Comparación</th>
                  <th>CursosIA (Ecosistema IA)</th>
                  <th>Universidad Tradicional</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="row-title">Ciclo de Actualización</td>
                  <td className="td-highlight">
                    <strong>Síncrono / Tiempo Real</strong>. Los contenidos se actualizan al ritmo de los avances en IA (días), integrando nuevas librerías y descubrimientos apenas se publican.
                  </td>
                  <td>
                    <strong>Asíncrono / Burocrático</strong>. Los planes de estudio suelen renovarse cada 4-6 años, generando un "gap" de conocimiento crítico en áreas tecnológicas.
                  </td>
                </tr>
                <tr>
                  <td className="row-title">Personalización del Plan</td>
                  <td className="td-highlight">
                    <strong>Granularidad 1:1</strong>. Ajuste dinámico del tono, profundidad técnica y terminología según el perfil del alumno (edad, profesión, experiencia previa).
                  </td>
                  <td>
                    <strong>Estandarización Masiva</strong>. Programa único "talla única" diseñado para grandes grupos, sin considerar trayectorias individuales.
                  </td>
                </tr>
                <tr>
                  <td className="row-title">Feedback y Tutoría</td>
                  <td className="td-highlight">
                    <strong>Capa de Razonamiento 24/7</strong>. Resolución instantánea de dudas complejas mediante modelos con contexto completo de la lección y del progreso del alumno.
                  </td>
                  <td>
                    <strong>Sujeto a Disponibilidad</strong>. Tutorías en horarios rígidos y tiempos de respuesta de correcciones que pueden tardar días o semanas.
                  </td>
                </tr>
                <tr>
                  <td className="row-title">Rigor Académico</td>
                  <td className="td-highlight">
                    <strong>Vanguardia Práctica</strong>. Emulación de estándares de instituciones como <strong>MIT y Stanford</strong>, centrándose en "Research Papers" y casos reales de la industria.
                  </td>
                  <td>
                    <strong>Teórico / Formal</strong>. Enfoque robusto en fundamentos pero frecuentemente desconectado de la velocidad y necesidades del mercado laboral actual.
                  </td>
                </tr>
                <tr>
                  <td className="row-title">Bibliografía y Fuentes</td>
                  <td className="td-highlight">
                    <strong>Validación en Vivo</strong>. Integración de <strong>Google Search</strong> para contrastar datos y citar fuentes oficiales, papers de arXiv y documentación oficial.
                  </td>
                  <td>
                    <strong>Fuentes Estáticas</strong>. Dependencia de manuales y bibliografías que pueden estar descatalogadas o no ser accesibles digitalmente.
                  </td>
                </tr>
                <tr>
                  <td className="row-title">Factor Humano</td>
                  <td>
                    <strong>Empatía Simulada</strong>. Interacciones diseñadas para motivar y guiar, priorizando la eficiencia en el aprendizaje individual.
                  </td>
                  <td className="td-highlight">
                    <strong>Networking Presencial</strong>. La gran ventaja competitiva: el valor de las relaciones cara a cara y el prestigio institucional histórico.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="quality-footer text-center">
          <p className="lead">
            CursosIA no busca reemplazar a la universidad, sino <strong>evolucionar la forma en que el conocimiento se transfiere</strong>.
          </p>
          <div className="cta-group">
            <Link to="/generate" className="btn btn-accent btn-lg">✨ Generar mi primer curso</Link>
            <Link to="/catalog" className="btn btn-outline btn-lg" style={{ marginLeft: '1rem' }}>📚 Ver catálogo</Link>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .quality-page {
          padding-bottom: 5rem;
          color: var(--text);
        }
        .quality-hero {
          padding: 8rem 2rem 6rem;
          text-align: center;
          background: radial-gradient(circle at top right, rgba(108, 92, 231, 0.15) 0%, transparent 60%);
        }
        .quality-hero h1 {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 900;
          margin: 1rem 0;
          letter-spacing: -2px;
          line-height: 1.1;
        }
        .pink-gradient-text {
          background: linear-gradient(135deg, #ff79c6, #bd93f9);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
        }
        .badge-promo {
          background: var(--gradient-primary);
          color: white;
          padding: 0.5rem 1.2rem;
          border-radius: 50px;
          font-weight: 800;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          box-shadow: 0 0 20px rgba(108, 92, 231, 0.3);
        }
        .quality-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2.5rem;
          margin-bottom: 6rem;
        }
        .quality-card {
          padding: 3rem;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid var(--border-light);
        }
        .quality-card:hover {
          transform: translateY(-12px);
          border-color: var(--primary);
          box-shadow: var(--shadow-glow);
        }
        .card-icon {
          font-size: 3.5rem;
          margin-bottom: 2rem;
          display: block;
        }
        .quality-card h3 {
          font-size: 1.75rem;
          margin-bottom: 1.25rem;
          color: var(--primary-light);
          font-weight: 800;
        }
        .quality-card p {
          line-height: 1.8;
          color: var(--text-muted);
          font-size: 1.05rem;
        }
        .comparison-section {
          padding: 4rem;
          margin-bottom: 6rem;
          border: 1px solid var(--border-light);
        }
        .section-header {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 1rem;
          letter-spacing: -1px;
        }
        .section-desc {
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 4rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          font-size: 1.1rem;
        }
        .comparison-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .comparison-table th, .comparison-table td {
          padding: 2rem;
          text-align: left;
          border-bottom: 1px solid var(--border-light);
        }
        .comparison-table th {
          color: var(--primary-light);
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 1.5px;
          background: rgba(255, 255, 255, 0.02);
        }
        .row-title {
          font-weight: 800;
          color: var(--text);
          width: 200px;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .td-highlight {
          background: rgba(108, 92, 231, 0.03);
          border-left: 2px solid var(--primary);
        }
        .td-highlight strong {
          color: var(--accent);
          font-size: 1.1rem;
        }
        .comparison-table td {
          line-height: 1.7;
          font-size: 1rem;
          color: var(--text-muted);
          vertical-align: top;
        }
        .quality-footer {
          margin-top: 6rem;
          padding: 4rem;
          background: linear-gradient(to bottom, transparent, rgba(108, 92, 231, 0.05));
          border-radius: var(--radius-xl);
        }
        .lead {
          font-size: 1.75rem;
          margin-bottom: 3rem;
          font-weight: 700;
          line-height: 1.4;
        }
        @media (max-width: 768px) {
          .quality-hero { padding: 6rem 1.5rem 4rem; }
          .quality-hero h1 { font-size: 2.5rem; }
          .comparison-section { padding: 1.5rem; }
          .comparison-table th, .comparison-table td { padding: 1.25rem; font-size: 0.95rem; }
          .row-title { width: auto; }
        }
      `}} />
    </div>
  );
}
