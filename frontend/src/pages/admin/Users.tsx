import React, { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
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

const Users: React.FC = () => {
    const { user: currentUser, logout } = useAuth();

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
    const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
    const [formSubmitting, setFormSubmitting] = useState(false);

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
        setFormErrors({});
        setShowModal(true);
    };

    const openEdit = (u: User) => {
        setEditingUser(u);
        setFormName(u.name);
        setFormEmail(u.email);
        setFormPassword('');
        setFormRole(u.role);
        setFormErrors({});
        setShowModal(true);
    };

    const handleSubmitUser = async (e: FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        setFormSubmitting(true);

        try {
            if (editingUser) {
                // Update
                const payload: Record<string, string> = { name: formName, email: formEmail, role: formRole };
                if (formPassword) payload.password = formPassword;
                await api.put(`/users/${editingUser.id}`, payload);
            } else {
                // Create
                await api.post('/users', { name: formName, email: formEmail, password: formPassword, role: formRole });
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
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users?.data.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.id}</td>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
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
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingUser ? 'Edit User' : 'Create User'}</h3>
                        {formErrors.general && <div className="alert alert-error">{formErrors.general[0]}</div>}
                        <form onSubmit={handleSubmitUser} className="auth-form">
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
                                <label>Password {editingUser && '(leave blank to keep)'}</label>
                                <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} minLength={8} {...(!editingUser ? { required: true } : {})} />
                                {formErrors.password && <span className="field-error">{formErrors.password[0]}</span>}
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
