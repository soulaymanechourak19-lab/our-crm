import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useAuth, User } from '../../context/AuthContext';
import api from '../../services/api';

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    total: number;
}

const roleLabelMap: Record<string, string> = {
    admin: 'Administrator',
    agent_commercial: 'Commercial Agent',
    agent_sav: 'Support Agent',
};

const roleColorMap: Record<string, string> = {
    admin: '#6c5ce7',
    agent_commercial: '#00b894',
    agent_sav: '#0984e3',
};

const Users: React.FC = () => {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState<PaginatedUsers | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formRole, setFormRole] = useState<string>('agent_commercial');
    const [formPhone, setFormPhone] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [formCity, setFormCity] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Profile picture state
    const [formPictureFile, setFormPictureFile] = useState<File | null>(null);
    const [formPicturePreview, setFormPicturePreview] = useState<string | null>(null);
    const [removePicture, setRemovePicture] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    const fetchUsers = async (p: number) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/users?page=${p}`);
            setUsers(data);
        } catch {
            // handled globally
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(page);
    }, [page]);

    // ── Open modal for create / edit ──
    const openCreate = () => {
        setEditingUser(null);
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormRole('agent_commercial');
        setFormPhone('');
        setFormAddress('');
        setFormCity('');
        setFormPictureFile(null);
        setFormPicturePreview(null);
        setRemovePicture(false);
        setFormErrors({});
        setShowModal(true);
    };

    const openEdit = (u: User) => {
        setEditingUser(u);
        setFormName(u.name);
        setFormEmail(u.email);
        setFormPassword('');
        setFormRole(u.role);
        setFormPhone(u.phone ?? '');
        setFormAddress(u.address ?? '');
        setFormCity(u.city ?? '');
        setFormPictureFile(null);
        setFormPicturePreview(u.profile_picture_url ?? null);
        setRemovePicture(false);
        setFormErrors({});
        setShowModal(true);
    };

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate size client-side (2MB)
            if (file.size > 2 * 1024 * 1024) {
                setFormErrors({ profile_picture: ['Image must not exceed 2MB.'] });
                return;
            }
            setFormPictureFile(file);
            setRemovePicture(false);
            // Create preview
            const reader = new FileReader();
            reader.onload = (ev) => setFormPicturePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePicture = () => {
        setFormPictureFile(null);
        setFormPicturePreview(null);
        setRemovePicture(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmitUser = async (e: FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        setFormSubmitting(true);

        try {
            // Use FormData for multipart/form-data (file upload)
            const formData = new FormData();
            formData.append('name', formName);
            formData.append('email', formEmail);
            formData.append('role', formRole);
            if (formPhone) formData.append('phone', formPhone);
            if (formAddress) formData.append('address', formAddress);
            if (formCity) formData.append('city', formCity);

            if (formPictureFile) {
                formData.append('profile_picture', formPictureFile);
            }

            if (editingUser) {
                if (formPassword) formData.append('password', formPassword);
                if (removePicture) formData.append('remove_profile_picture', '1');

                // Laravel doesn't handle PUT with FormData well, use POST with _method
                formData.append('_method', 'PUT');
                await api.post(`/users/${editingUser.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                formData.append('password', formPassword);
                await api.post('/users', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            setShowModal(false);
            fetchUsers(page);
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            } else {
                setFormErrors({ general: [err.response?.data?.message || 'Operation failed.'] });
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/users/${deleteTarget.id}`);
            setDeleteTarget(null);
            fetchUsers(page);
        } catch {
            // handled globally
        }
    };

    // Avatar component
    const UserAvatar: React.FC<{ user: User; size?: number }> = ({ user, size = 38 }) => {
        if (user.profile_picture_url) {
            return (
                <img
                    src={user.profile_picture_url}
                    alt={user.name}
                    style={{
                        width: size, height: size, borderRadius: '12px',
                        objectFit: 'cover',
                        border: '2px solid var(--border-subtle)',
                    }}
                />
            );
        }
        const color = roleColorMap[user.role] || '#6c5ce7';
        return (
            <div style={{
                width: size, height: size, borderRadius: '12px',
                background: `linear-gradient(135deg, ${color}, ${color}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: size * 0.4,
                flexShrink: 0,
            }}>
                {user.name.charAt(0).toUpperCase()}
            </div>
        );
    };

    if (!currentUser) return null;

    return (
        <div style={{ height: '100%', overflowY: 'auto' }}>

            <div className="table-toolbar">
                <p className="table-count">{users?.total ?? 0} users total</p>
                <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
            </div>

            {loading ? (
                <div className="loading-screen"><div className="spinner" /><p>Loading users…</p></div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>City</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users?.data.map((u) => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <UserAvatar user={u} size={36} />
                                                <span style={{ fontWeight: 600 }}>{u.name}</span>
                                            </div>
                                        </td>
                                        <td>{u.email}</td>
                                        <td>{u.phone || '—'}</td>
                                        <td>{u.city || '—'}</td>
                                        <td><span className={`role-pill role-${u.role}`}>{roleLabelMap[u.role]}</span></td>
                                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td className="actions-cell">
                                            <button className="btn btn-sm btn-outline" onClick={() => openEdit(u)}>Edit</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(u)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users && users.last_page > 1 && (
                        <div className="pagination">
                            <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
                            <span className="page-info">Page {users.current_page} of {users.last_page}</span>
                            <button className="btn btn-sm btn-outline" disabled={page >= users.last_page} onClick={() => setPage(page + 1)}>Next →</button>
                        </div>
                    )}
                </>
            )}

            {/* ── Create / Edit Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
                        <h3>{editingUser ? 'Edit User' : 'Create User'}</h3>
                        {formErrors.general && <div className="alert alert-error">{formErrors.general[0]}</div>}
                        <form onSubmit={handleSubmitUser} className="auth-form">

                            {/* Profile Picture Upload */}
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
                                        background: formPicturePreview ? 'transparent' : 'var(--bg-tertiary)',
                                        transition: 'all 0.2s',
                                        flexShrink: 0,
                                        position: 'relative',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6c5ce7'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                                >
                                    {formPicturePreview ? (
                                        <img
                                            src={formPicturePreview}
                                            alt="Preview"
                                            style={{
                                                width: '100%', height: '100%', objectFit: 'cover',
                                            }}
                                        />
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
                                            type="button"
                                            className="btn btn-sm btn-outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                                        >
                                            {formPicturePreview ? 'Change' : 'Upload'}
                                        </button>
                                        {formPicturePreview && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger"
                                                onClick={handleRemovePicture}
                                                style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handlePictureChange}
                                        style={{ display: 'none' }}
                                    />
                                    {formErrors.profile_picture && <span className="field-error" style={{ marginTop: '4px', display: 'block' }}>{formErrors.profile_picture[0]}</span>}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                                    {formErrors.name && <span className="field-error">{formErrors.name[0]}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
                                    {formErrors.email && <span className="field-error">{formErrors.email[0]}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input type="tel" placeholder="06XXXXXXXX" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                                    {formErrors.phone && <span className="field-error">{formErrors.phone[0]}</span>}
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Address</label>
                                    <input type="text" placeholder="Street address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
                                    {formErrors.address && <span className="field-error">{formErrors.address[0]}</span>}
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" placeholder="e.g. Casablanca" value={formCity} onChange={(e) => setFormCity(e.target.value)} />
                                    {formErrors.city && <span className="field-error">{formErrors.city[0]}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <select value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                                        <option value="admin">Administrator</option>
                                        <option value="agent_commercial">Commercial Agent</option>
                                        <option value="agent_sav">Support Agent</option>
                                    </select>
                                    {formErrors.role && <span className="field-error">{formErrors.role[0]}</span>}
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Password {editingUser && '(leave blank to keep)'}</label>
                                    <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} minLength={8} {...(!editingUser ? { required: true } : {})} />
                                    {formErrors.password && <span className="field-error">{formErrors.password[0]}</span>}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                                    {formSubmitting ? 'Saving…' : editingUser ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirm Delete</h3>
                        <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action can be undone by an administrator.</p>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
