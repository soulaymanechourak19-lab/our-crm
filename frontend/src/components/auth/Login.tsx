import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import AuthSidePanel from './AuthSidePanel';
import ThemeToggleBtn from '../common/ThemeToggleBtn';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.email?.[0] ||
                'Invalid credentials. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '32px', right: '40px', zIndex: 50, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LanguageSwitcher />
                <ThemeToggleBtn />
            </div>
            
            {/* Left decorative panel */}
            <AuthSidePanel />

            {/* Right form panel */}
            <div className="auth-form-panel">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.1 }}
                    className="auth-card-v2"
                >
                    <div className="auth-header-v2">
                        <div className="auth-icon-wrap">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </div>
                        <h1>{t('login.welcomeBack')}</h1>
                        <p>{t('login.subtitle')}</p>
                    </div>

                    {error && <div className="auth-error-v2">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form-v2">
                        <div className="auth-field">
                            <label htmlFor="email">{t('login.emailLabel')}</label>
                            <div className="auth-input-wrap">
                                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder={t('login.emailPlaceholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="password">{t('login.passwordLabel')}</label>
                            <div className="auth-input-wrap">
                                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={submitting}>
                            {submitting ? (
                                <><span className="auth-spinner" /> {t('login.signingIn')}</>
                            ) : (
                                t('login.signIn')
                            )}
                        </button>
                    </form>


                </motion.div>
            </div>
        </div>
    );
};

export default Login;
