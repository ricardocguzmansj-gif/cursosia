import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Landing() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <main>
      {/* Navbar segmentado para Landing */}
      <nav className="navbar">
        <Link to="/" className="navbar-brand">CursosIA</Link>
        <div className="navbar-links">
          <select 
            value={i18n.language.split('-')[0] || 'es'} 
            onChange={(e) => changeLanguage(e.target.value)}
            className="lang-select"
            style={{ marginRight: '1rem', background: 'transparent', border: 'none', color: 'inherit', fontWeight: 'bold' }}
          >
            <option value="es" style={{color: '#000'}}>ES</option>
            <option value="en" style={{color: '#000'}}>EN</option>
            <option value="pt" style={{color: '#000'}}>PT</option>
          </select>
          <Link to="/catalog">📚 {t('nav_catalog', 'Catálogo')}</Link>
          <Link to="/jobs">💼 Empleos</Link>
          <Link to="/quality" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>⭐ {t('nav_quality')}</Link>
          <a href="#features">{t('nav_features')}</a>
          <a href="#pricing">{t('nav_pricing')}</a>
          <Link to="/login" className="btn btn-outline btn-sm">{t('nav_login')}</Link>
          <Link to="/register" className="btn btn-primary btn-sm">{t('nav_register')}</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content fade-in">
          <div className="hero-badge">{t('hero_badge')}</div>
          <h1>
            {t('hero_title_1')} <br />
            <span className="gradient-text">{t('hero_title_2')}</span>
          </h1>
          <p>{t('hero_desc')}</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              {t('hero_cta_free')}
            </Link>
            <a href="#features" className="btn btn-outline btn-lg">
              {t('hero_cta_how')}
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-title">
          <h2>{t('feat_title')}</h2>
          <p>{t('feat_subtitle')}</p>
        </div>
        <div className="features-grid">
          <div className="card feature-card">
            <span className="feature-icon">📝</span>
            <h3>{t('feat_1_title')}</h3>
            <p>{t('feat_1_desc')}</p>
          </div>
          <div className="card feature-card">
            <span className="feature-icon">🧠</span>
            <h3>{t('feat_2_title')}</h3>
            <p>{t('feat_2_desc')}</p>
          </div>
          <div className="card feature-card">
            <span className="feature-icon">🚀</span>
            <h3>{t('feat_3_title')}</h3>
            <p>{t('feat_3_desc')}</p>
          </div>
        </div>
      </section>

      {/* More Features */}
      <section className="features">
        <div className="features-grid">
          <div className="card feature-card">
            <span className="feature-icon">🎯</span>
            <h3>{t('feat_4_title')}</h3>
            <p>{t('feat_4_desc')}</p>
          </div>
          <div className="card feature-card">
            <span className="feature-icon">📊</span>
            <h3>{t('feat_5_title')}</h3>
            <p>{t('feat_5_desc')}</p>
          </div>
          <div className="card feature-card">
            <span className="feature-icon">💼</span>
            <h3>{t('feat_6_title')}</h3>
            <p>{t('feat_6_desc')}</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="section-title">
          <h2>{t('pricing_title')}</h2>
          <p>{t('pricing_subtitle')}</p>
        </div>
        <div className="pricing-grid">
          <div className="card pricing-card">
            <div className="plan-name">{t('pricing_free')}</div>
            <div className="price">$0</div>
            <div className="price-period">{t('pricing_forever')}</div>
            <ul>
              <li>{t('pricing_free_1')}</li>
              <li>{t('pricing_free_2')}</li>
              <li>{t('pricing_free_3')}</li>
              <li>{t('pricing_free_4')}</li>
            </ul>
            <Link to="/register" className="btn btn-outline" style={{ width: "100%" }}>
              {t('pricing_free_cta')}
            </Link>
          </div>
          <div className="card pricing-card featured">
            <div className="plan-name">{t('pricing_pro')}</div>
            <div className="price">$9.99</div>
            <div className="price-period">{t('pricing_month')}</div>
            <ul>
              <li>{t('pricing_pro_1')}</li>
              <li>{t('pricing_pro_2')}</li>
              <li>{t('pricing_pro_3')}</li>
              <li>{t('pricing_pro_4')}</li>
              <li>{t('pricing_pro_5')}</li>
            </ul>
            <Link to="/register" className="btn btn-primary" style={{ width: "100%" }}>
              {t('pricing_pro_cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} {t('footer_text')}</p>
      </footer>
    </main>
  );
}
