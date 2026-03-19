import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthSidePanel from './AuthSidePanel';
import ThemeToggleBtn from '../common/ThemeToggleBtn';

const Register: React.FC = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);
        try {
            await register(name, email, password, passwordConfirmation);
            navigate('/dashboard');
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: [err.response?.data?.message || 'Registration failed.'] });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const firstError = (field: string) => errors[field]?.[0];

    return (
        <div className="auth-page" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '32px', right: '40px', zIndex: 50 }}>
                <ThemeToggleBtn />
            </div>
            
            {/* Left decorative panel */}
            <AuthSidePanel />

            {/* Right form panel */}
            <div className="auth-form-panel">
                <div className="auth-card-v2">
                    <div className="auth-header-v2">
        <div className="auth-icon-wrap">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="8.5" cy="7" r="4"/>
                                <line x1="20" y1="8" x2="20" y2="14"/>
                                <line x1="23" y1="11" x2="17" y2="11"/>
                            </svg>
                        </div>
                        <h1>Create your account</h1>
                        <p>Get started with OurCRM today</p>
                    </div>

                    {errors.general && <div className="auth-error-v2">{errors.general[0]}</div>}

                    <form onSubmit={handleSubmit} className="auth-form-v2">
                        <div className="auth-field">
                            <label htmlFor="name">FULL NAME</label>
                            <div className="auth-input-wrap">
                                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            {firstError('name') && <span className="auth-field-error">{firstError('name')}</span>}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="reg-email">EMAIL ADDRESS</label>
                            <div className="auth-input-wrap">
                                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                <input
                                    id="reg-email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            {firstError('email') && <span className="auth-field-error">{firstError('email')}</span>}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="reg-password">PASSWORD</label>
                            <div className="auth-input-wrap">
                                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                <input
                                    id="reg-password"
                                    type="password"
                                    placeholder="Minimum 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>
                            {firstError('password') && <span className="auth-field-error">{firstError('password')}</span>}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="reg-password-confirm">CONFIRM PASSWORD</label>
                            <div className="auth-input-wrap">
                                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <input
                                    id="reg-password-confirm"
                                    type="password"
                                    placeholder="Re-enter your password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={submitting}>
                            {submitting ? (
                                <><span className="auth-spinner" /> Creating account…</>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>

                    <p className="auth-footer-v2">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
