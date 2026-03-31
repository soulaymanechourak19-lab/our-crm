import React, { useState, useRef, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
    const { user, updateProfile } = useAuth();

    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [address, setAddress] = useState(user?.address ?? '');
    const [city, setCity] = useState(user?.city ?? '');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [success, setSuccess] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    // Profile picture
    const [pictureFile, setPictureFile] = useState<File | null>(null);
    const [picturePreview, setPicturePreview] = useState<string | null>(user?.profile_picture_url ?? null);
    const [removePicture, setRemovePicture] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const roleLabelMap: Record<string, string> = {
        admin: 'Administrator',
        agent_commercial: 'Commercial Agent',
        agent_sav: 'Support Agent',
    };

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setErrors({ profile_picture: ['Image must not exceed 2MB.'] });
                return;
            }
            setPictureFile(file);
            setRemovePicture(false);
            const reader = new FileReader();
            reader.onload = (ev) => setPicturePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePicture = () => {
        setPictureFile(null);
        setPicturePreview(null);
        setRemovePicture(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSuccess(null);
        setSubmitting(true);

        try {
            // If we have a file upload or removal, use FormData
            if (pictureFile || removePicture) {
                const formData = new FormData();
                if (name !== user.name) formData.append('name', name);
                if (email !== user.email) formData.append('email', email);
                if (phone !== (user.phone ?? '')) formData.append('phone', phone);
                if (address !== (user.address ?? '')) formData.append('address', address);
                if (city !== (user.city ?? '')) formData.append('city', city);
                if (password) {
                    formData.append('password', password);
                    formData.append('password_confirmation', passwordConfirmation);
                }
                if (pictureFile) formData.append('profile_picture', pictureFile);
                if (removePicture) formData.append('remove_profile_picture', '1');

                await updateProfile(formData);
            } else {
                // Plain JSON for text-only updates
                const payload: Record<string, string> = {};
                if (name !== user.name) payload.name = name;
                if (email !== user.email) payload.email = email;
                if (phone !== (user.phone ?? '')) payload.phone = phone;
                if (address !== (user.address ?? '')) payload.address = address;
                if (city !== (user.city ?? '')) payload.city = city;
                if (password) {
                    payload.password = password;
                    payload.password_confirmation = passwordConfirmation;
                }

                if (Object.keys(payload).length === 0) {
                    setSuccess('No changes to save.');
                    setSubmitting(false);
                    return;
                }

                await updateProfile(payload);
            }
            setPassword('');
            setPasswordConfirmation('');
            setPictureFile(null);
            setRemovePicture(false);
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
                {user.profile_picture_url ? (
                    <img
                        src={user.profile_picture_url}
                        alt={user.name}
                        style={{
                            width: 80, height: 80, borderRadius: '20px',
                            objectFit: 'cover',
                            boxShadow: '0 4px 20px rgba(108, 92, 231, 0.3)',
                            marginBottom: '4px',
                        }}
                    />
                ) : (
                    <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
                )}
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                {user.phone && <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginBottom: '4px' }}>📞 {user.phone}</p>}
                {user.city && <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginBottom: '8px' }}>📍 {user.city}</p>}
                <span className={`role-pill role-${user.role}`}>{roleLabelMap[user.role]}</span>
            </div>

            {/* Edit Form */}
            <div className="profile-form-card">
                <h3>Edit Profile</h3>

                {success && <div className="alert alert-success">{success}</div>}
                {errors.general && <div className="alert alert-error">{errors.general[0]}</div>}

                <form onSubmit={handleSubmit} className="auth-form">

                    {/* ── Profile Picture ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        marginBottom: '20px', padding: '16px',
                        background: 'var(--bg-secondary)', borderRadius: '14px',
                        border: '1px solid var(--border-subtle)',
                    }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: 72, height: 72, borderRadius: '16px',
                                overflow: 'hidden', cursor: 'pointer',
                                border: '2px dashed var(--border-subtle)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: picturePreview ? 'transparent' : 'var(--bg-tertiary)',
                                transition: 'all 0.2s', flexShrink: 0,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6c5ce7'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                        >
                            {picturePreview ? (
                                <img src={picturePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Profile Picture
                            </p>
                            <p style={{ margin: '2px 0 8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                JPEG, PNG, or WebP — max 2MB
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button" className="btn btn-sm btn-outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                                >
                                    {picturePreview ? 'Change' : 'Upload'}
                                </button>
                                {picturePreview && (
                                    <button
                                        type="button" className="btn btn-sm btn-danger"
                                        onClick={handleRemovePicture}
                                        style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef} type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handlePictureChange}
                                style={{ display: 'none' }}
                            />
                            {firstError('profile_picture') && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>{firstError('profile_picture')}</span>}
                        </div>
                    </div>

                    {/* ── Personal Information ── */}
                    <h4>Personal Information</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

                        <div className="form-group">
                            <label htmlFor="prof-phone">Phone number</label>
                            <input id="prof-phone" type="tel" placeholder="06XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            {firstError('phone') && <span className="field-error">{firstError('phone')}</span>}
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="prof-address">Address</label>
                            <input id="prof-address" type="text" placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} />
                            {firstError('address') && <span className="field-error">{firstError('address')}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="prof-city">City</label>
                            <input id="prof-city" type="text" placeholder="e.g. Casablanca" value={city} onChange={(e) => setCity(e.target.value)} />
                            {firstError('city') && <span className="field-error">{firstError('city')}</span>}
                        </div>
                    </div>

                    {/* ── Change Password ── */}
                    <hr className="divider" />
                    <h4>Change Password</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label htmlFor="prof-pass">New password</label>
                            <input id="prof-pass" type="password" placeholder="Leave blank to keep current" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} />
                            {firstError('password') && <span className="field-error">{firstError('password')}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="prof-pass-confirm">Confirm new password</label>
                            <input id="prof-pass-confirm" type="password" placeholder="Confirm new password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} minLength={8} />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '12px' }}>
                        {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
