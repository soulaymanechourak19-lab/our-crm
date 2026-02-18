import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="10" fill="url(#grad2)" />
                            <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="18" fontWeight="700">C</text>
                            <defs><linearGradient id="grad2" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
                        </svg>
                    </div>
                    <h1>Create your account</h1>
                    <p>Get started with CRM today</p>
                </div>

                {errors.general && <div className="alert alert-error">{errors.general[0]}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full name</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                        {firstError('name') && <span className="field-error">{firstError('name')}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">Email address</label>
                        <input
                            id="reg-email"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {firstError('email') && <span className="field-error">{firstError('email')}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                        {firstError('password') && <span className="field-error">{firstError('password')}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password-confirm">Confirm password</label>
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

                    <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                        {submitting ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
