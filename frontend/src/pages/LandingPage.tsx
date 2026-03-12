import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className={`lp-navbar ${scrolled ? 'scrolled' : ''}`}>
        <span className="lp-logo">OurCRM</span>

        <button
          className="lp-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              : <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
            }
          </svg>
        </button>

        <ul className={`lp-nav-links ${menuOpen ? 'open' : ''}`}>
          <li><a href="#home" className="active" onClick={() => setMenuOpen(false)}>Home</a></li>
          <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
          <li><a href="#features" onClick={() => setMenuOpen(false)}>Features</a></li>
          <li><a href="#stats" onClick={() => setMenuOpen(false)}>Implementation</a></li>
          <li><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
        </ul>

        <div className="lp-nav-right">
          <button className="lp-btn-signin" onClick={() => navigate('/login')}>
            Sign In
          </button>
          <div className="lp-avatar-placeholder" onClick={() => navigate('/login')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────── */}
      <section className="lp-hero" id="home">
        <div className="lp-hero-content">
          <div className="lp-hero-badge lp-fade-in-up">
            <span className="lp-hero-badge-dot" />
            Intelligent CRM Platform
          </div>

          <h1 className="lp-hero-title lp-fade-in-up-delay-1">CRM</h1>

          <p className="lp-hero-subtitle lp-fade-in-up-delay-2">
            Streamline your customer relationships with AI-powered insights.
            Manage leads, track interactions, and grow revenue — all from
            one intelligent platform built for modern teams.
          </p>

          <div className="lp-hero-buttons lp-fade-in-up-delay-3">
            <button className="lp-btn-primary" onClick={scrollToFeatures}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="8" />
                <line x1="8" y1="12" x2="12" y2="8" />
                <line x1="16" y1="12" x2="12" y2="8" />
              </svg>
              More details
            </button>
            <button className="lp-btn-outline" onClick={() => navigate('/login')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              View demo
            </button>
          </div>
        </div>

        <div className="lp-hero-image lp-fade-in-up-delay-2">
          <img
            src={`${process.env.PUBLIC_URL}/images/crm-hero.png`}
            alt="CRM Dashboard Illustration"
            className="lp-float"
          />
        </div>
      </section>

      {/* ── Features Section ──────────────────────────── */}
      <section className="lp-features" id="features">
        <div className="lp-section-header">
          <span className="lp-section-tag">Features</span>
          <h2 className="lp-section-title">Everything you need to scale</h2>
          <p className="lp-section-desc">
            Powerful tools designed to help your team convert more leads,
            delight customers, and make smarter decisions.
          </p>
        </div>

        <div className="lp-features-grid">
          {/* Card 1 */}
          <div className="lp-feature-card">
            <div className="lp-feature-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="lp-feature-title">Lead Management</h3>
            <p className="lp-feature-desc">
              Capture, score, and nurture leads through your pipeline.
              Automated workflows ensure no opportunity slips through the cracks.
            </p>
          </div>

          {/* Card 2 */}
          <div className="lp-feature-card">
            <div className="lp-feature-icon teal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="lp-feature-title">Customer Insights</h3>
            <p className="lp-feature-desc">
              Deep-dive into customer behavior and preferences.
              360° profiles give your team the context they need to personalize every interaction.
            </p>
          </div>

          {/* Card 3 */}
          <div className="lp-feature-card">
            <div className="lp-feature-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="lp-feature-title">AI-Powered Analytics</h3>
            <p className="lp-feature-desc">
              Machine learning models predict churn, forecast revenue, and surface
              actionable insights — so you can act before problems arise.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats Section ─────────────────────────────── */}
      <section className="lp-stats" id="stats">
        <div className="lp-stat-card">
          <div className="lp-stat-number">10K+</div>
          <div className="lp-stat-label">Active Users</div>
        </div>
        <div className="lp-stat-card">
          <div className="lp-stat-number">98%</div>
          <div className="lp-stat-label">Uptime SLA</div>
        </div>
        <div className="lp-stat-card">
          <div className="lp-stat-number">3x</div>
          <div className="lp-stat-label">Faster Conversions</div>
        </div>
        <div className="lp-stat-card">
          <div className="lp-stat-number">24/7</div>
          <div className="lp-stat-label">AI Support</div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="lp-footer" id="contact">
        <span className="lp-footer-text">
          © {new Date().getFullYear()} OurCRM. All rights reserved.
        </span>
        <ul className="lp-footer-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#stats">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </footer>
    </div>
  );
};

export default LandingPage;
