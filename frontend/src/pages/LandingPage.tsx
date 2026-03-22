import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { motion, Variants } from 'framer-motion';
import ThemeToggleBtn from '../components/common/ThemeToggleBtn';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import './LandingPage.css';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
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
          <li><a href="#home" className="active" onClick={() => setMenuOpen(false)}>{t('landing.nav.home')}</a></li>
          <li><a href="#about" onClick={() => setMenuOpen(false)}>{t('landing.nav.about')}</a></li>
          <li><a href="#features" onClick={() => setMenuOpen(false)}>{t('landing.nav.features')}</a></li>
          <li><a href="#implementation" onClick={() => setMenuOpen(false)}>{t('landing.nav.implementation')}</a></li>
          <li><a href="#/support" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>💬 Support</a></li>
          <li><a href="#contact" onClick={() => setMenuOpen(false)}>{t('landing.nav.contact')}</a></li>
        </ul>

        <div className="lp-nav-right">
          <LanguageSwitcher />
          <ThemeToggleBtn />
          
          <button className="lp-btn-signin" onClick={() => navigate('/login')}>
            {t('landing.signIn')}
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
      <motion.section 
        className="lp-hero" 
        id="home"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <div className="lp-hero-content">
          <motion.div variants={fadeInUp} className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            {t('landing.hero.badge')}
          </motion.div>

          <motion.h1 variants={fadeInUp} className="lp-hero-title">{t('landing.hero.title')}</motion.h1>

          <motion.p variants={fadeInUp} className="lp-hero-subtitle">
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div variants={fadeInUp} className="lp-hero-buttons">
            <button className="lp-btn-primary" onClick={scrollToFeatures}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="8" />
                <line x1="8" y1="12" x2="12" y2="8" />
                <line x1="16" y1="12" x2="12" y2="8" />
              </svg>
              {t('landing.hero.moreDetails')}
            </button>
            <button className="lp-btn-outline" onClick={() => navigate('/login')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {t('landing.hero.viewDemo')}
            </button>
          </motion.div>
        </div>

        <motion.div variants={slideInRight} className="lp-hero-image">
          {theme === 'light' ? (
            <img
              src={`${process.env.PUBLIC_URL}/images/crm-hero-light.png`}
              alt="CRM Dashboard Illustration"
              className="lp-float"
              onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/images/crm-hero.png`; }}
            />
          ) : (
            <img
              src={`${process.env.PUBLIC_URL}/images/crm-hero.png`}
              alt="CRM Dashboard Illustration"
              className="lp-float"
            />
          )}
        </motion.div>
      </motion.section>

      {/* ── About Section ─────────────────────────────── */}
      <motion.section 
        className="lp-about" 
        id="about"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div variants={fadeInUp} className="lp-about-image">
          <div className="lp-about-mockup-wrapper">
            {theme === 'light' ? (
              <img
                src={`${process.env.PUBLIC_URL}/images/crm-dashboard-light.png`}
                alt="CRM Dashboard App"
                onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/images/crm-dashboard.png`; }}
                className="lp-float"
              />
            ) : (
              <img
                src={`${process.env.PUBLIC_URL}/images/crm-dashboard.png`}
                alt="CRM Dashboard App"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="lp-float"
              />
            )}
          </div>
        </motion.div>
        
        <motion.div variants={staggerContainer} className="lp-about-content">
          <motion.span variants={fadeInUp} className="lp-section-tag text-left">{t('landing.about.tag')}</motion.span>
          <motion.h2 variants={fadeInUp} className="lp-section-title text-left">{t('landing.about.title')}</motion.h2>
          <motion.p variants={fadeInUp} className="lp-section-desc text-left">
            {t('landing.about.desc')}
          </motion.p>
          
          <ul className="lp-about-list">
            <motion.li variants={fadeInUp}>
              <div className="lp-about-check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span>{t('landing.about.point1')}</span>
            </motion.li>
            <motion.li variants={fadeInUp}>
              <div className="lp-about-check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span>{t('landing.about.point2')}</span>
            </motion.li>
            <motion.li variants={fadeInUp}>
              <div className="lp-about-check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span>{t('landing.about.point3')}</span>
            </motion.li>
          </ul>
        </motion.div>
      </motion.section>

      {/* ── Features Section ──────────────────────────── */}
      <motion.section 
        className="lp-features" 
        id="features"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeInUp} className="lp-section-header">
          <span className="lp-section-tag">{t('landing.features.tag')}</span>
          <h2 className="lp-section-title">{t('landing.features.title')}</h2>
          <p className="lp-section-desc">
            {t('landing.features.desc')}
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="lp-features-grid">
          {/* Card 1 */}
          <motion.div variants={fadeInUp} className="lp-feature-card">
            <div className="lp-feature-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="lp-feature-title">{t('landing.features.leadMgmt')}</h3>
            <p className="lp-feature-desc">
              {t('landing.features.leadMgmtDesc')}
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={fadeInUp} className="lp-feature-card">
            <div className="lp-feature-icon teal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="lp-feature-title">{t('landing.features.customerInsights')}</h3>
            <p className="lp-feature-desc">
              {t('landing.features.customerInsightsDesc')}
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={fadeInUp} className="lp-feature-card">
            <div className="lp-feature-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="lp-feature-title">{t('landing.features.aiAnalytics')}</h3>
            <p className="lp-feature-desc">
              {t('landing.features.aiAnalyticsDesc')}
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Implementation Section ────────────────────── */}
      <motion.section 
        className="lp-implementation" 
        id="implementation"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeInUp} className="lp-section-header">
          <span className="lp-section-tag">{t('landing.implementation.tag')}</span>
          <h2 className="lp-section-title">{t('landing.implementation.title')}</h2>
          <p className="lp-section-desc">
            {t('landing.implementation.desc')}
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="lp-steps-grid">
          <motion.div variants={fadeInUp} className="lp-step-card">
            <div className="lp-step-number">1</div>
            <h3 className="lp-feature-title">{t('landing.implementation.step1Title')}</h3>
            <p className="lp-feature-desc">{t('landing.implementation.step1Desc')}</p>
          </motion.div>
          <motion.div variants={fadeInUp} className="lp-step-card">
            <div className="lp-step-number">2</div>
            <h3 className="lp-feature-title">{t('landing.implementation.step2Title')}</h3>
            <p className="lp-feature-desc">{t('landing.implementation.step2Desc')}</p>
          </motion.div>
          <motion.div variants={fadeInUp} className="lp-step-card">
            <div className="lp-step-number">3</div>
            <h3 className="lp-feature-title">{t('landing.implementation.step3Title')}</h3>
            <p className="lp-feature-desc">{t('landing.implementation.step3Desc')}</p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Stats Section ─────────────────────────────── */}
      <motion.section 
        className="lp-stats" 
        id="stats"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div variants={fadeInUp} className="lp-stat-card">
          <div className="lp-stat-number">10K+</div>
          <div className="lp-stat-label">{t('landing.stats.activeUsers')}</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="lp-stat-card">
          <div className="lp-stat-number">98%</div>
          <div className="lp-stat-label">{t('landing.stats.uptimeSLA')}</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="lp-stat-card">
          <div className="lp-stat-number">3x</div>
          <div className="lp-stat-label">{t('landing.stats.fasterConversions')}</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="lp-stat-card">
          <div className="lp-stat-number">24/7</div>
          <div className="lp-stat-label">{t('landing.stats.aiSupport')}</div>
        </motion.div>
      </motion.section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="lp-footer" id="contact">
        <span className="lp-footer-text">
          {t('landing.footer.copyright', { year: new Date().getFullYear() })}
        </span>
        <ul className="lp-footer-links">
          <li><a href="#home">{t('landing.nav.home')}</a></li>
          <li><a href="#features">{t('landing.nav.features')}</a></li>
          <li><a href="#implementation">{t('landing.nav.implementation')}</a></li>
          <li><a href="#contact">{t('landing.nav.contact')}</a></li>
        </ul>
      </footer>

      {/* ── Support Chatbot Float ────────────────────── */}
      <div 
        className="fixed bottom-6 right-6 z-50 cursor-pointer w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5)' }}
        onClick={() => navigate('/support')}
        title="Contactez le support"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
      </div>
    </div>
  );
};

export default LandingPage;
