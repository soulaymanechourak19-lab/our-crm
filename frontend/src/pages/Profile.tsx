import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
    const { user, updateProfile, logout } = useAuth();

    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [success, setSuccess] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    if (!user) return null;

    const roleLabelMap: Record<string, string> = {
        admin: 'Administrator',
        agent_commercial: 'Commercial Agent',
        agent_sav: 'Support Agent',
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSuccess(null);
        setSubmitting(true);

        const payload: Record<string, string> = {};
        if (name !== user.name) payload.name = name;
        if (email !== user.email) payload.email = email;
        if (password) {
            payload.password = password;
            payload.password_confirmation = passwordConfirmation;
        }

        if (Object.keys(payload).length === 0) {
            setSuccess('No changes to save.');
            setSubmitting(false);
            return;
        }

        try {
            await updateProfile(payload);
            setPassword('');
            setPasswordConfirmation('');
            setSuccess('Profile updated successfully!');
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: [err.response?.data?.message || 'Update failed.'] });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const firstError = (field: string) => errors[field]?.[0];

    return (
        <div className="profile-container">
            {/* Info Card */}
            <div className="profile-info-card">
                <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <span className={`role-pill role-${user.role}`}>{roleLabelMap[user.role]}</span>
            </div>

            {/* Edit Form */}
            <div className="profile-form-card">
                <h3>Edit Profile</h3>

                {success && <div className="alert alert-success">{success}</div>}
                {errors.general && <div className="alert alert-error">{errors.general[0]}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="prof-name">Full name</label>
                        <input id="prof-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        {firstError('name') && <span className="field-error">{firstError('name')}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="prof-email">Email address</label>
                        <input id="prof-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        {firstError('email') && <span className="field-error">{firstError('email')}</span>}
                    </div>

                    <hr className="divider" />
                    <h4>Change Password</h4>

                    <div className="form-group">
                        <label htmlFor="prof-pass">New password</label>
                        <input id="prof-pass" type="password" placeholder="Leave blank to keep current" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} />
                        {firstError('password') && <span className="field-error">{firstError('password')}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="prof-pass-confirm">Confirm new password</label>
                        <input id="prof-pass-confirm" type="password" placeholder="Confirm new password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} minLength={8} />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
