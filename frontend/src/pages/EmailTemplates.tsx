import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

interface Template {
    id: number; name: string; subject: string; body: string;
    category: string; is_active: boolean; created_at: string;
    creator?: { id: number; name: string };
}

interface MergeTag {
    tag: string; label: string;
}

const categoryConfig: Record<string, { color: string; bg: string; label: string }> = {
    follow_up: { color: '#a29bfe', bg: 'rgba(162,155,254,0.12)', label: 'Follow-up' },
    welcome: { color: '#00b894', bg: 'rgba(0,184,148,0.12)', label: 'Welcome' },
    proposal: { color: '#fdcb6e', bg: 'rgba(253,203,110,0.12)', label: 'Proposal' },
    reminder: { color: '#e84393', bg: 'rgba(232,67,147,0.12)', label: 'Reminder' },
    custom: { color: '#74b9ff', bg: 'rgba(116,185,255,0.12)', label: 'Custom' },
};

const EmailTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [mergeTags, setMergeTags] = useState<MergeTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editing, setEditing] = useState<Template | null>(null);
    const [showSend, setShowSend] = useState<Template | null>(null);
    const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);

    const [form, setForm] = useState({
        name: '', subject: '', body: '', category: 'custom',
    });
    const [sendForm, setSendForm] = useState({ to_email: '', lead_id: '', customer_id: '' });

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const [tRes, mRes] = await Promise.all([
                api.get('/email-templates?per_page=50'),
                api.get('/email-templates/merge-tags'),
            ]);
            setTemplates(tRes.data.data || []);
            setMergeTags(mRes.data || []);
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/email-templates/${editing.id}`, form);
            } else {
                await api.post('/email-templates', form);
            }
            setShowEditor(false);
            setEditing(null);
            setForm({ name: '', subject: '', body: '', category: 'custom' });
            fetchTemplates();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this template?')) return;
        try {
            await api.delete(`/email-templates/${id}`);
            fetchTemplates();
        } catch { }
    };

    const openEdit = (t: Template) => {
        setEditing(t);
        setForm({ name: t.name, subject: t.subject, body: t.body, category: t.category });
        setShowEditor(true);
    };

    const openSend = (t: Template) => {
        setShowSend(t);
        setSendForm({ to_email: '', lead_id: '', customer_id: '' });
        setPreview(null);
    };

    const handlePreview = async () => {
        if (!showSend) return;
        try {
            const { data } = await api.post(`/email-templates/${showSend.id}/preview`, sendForm);
            setPreview(data);
        } catch { }
    };

    const handleSend = async () => {
        if (!showSend) return;
        try {
            await api.post(`/email-templates/${showSend.id}/send`, sendForm);
            alert('Email sent successfully!');
            setShowSend(null);
        } catch { alert('Failed to send email'); }
    };

    const insertTag = (tag: string) => {
        setForm(f => ({ ...f, body: f.body + tag }));
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Email Templates</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>{templates.length} templates available</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ name: '', subject: '', body: '', category: 'custom' }); setShowEditor(true); }}
                    style={{
                        padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: '#fff',
                        fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 4px 15px rgba(108,92,231,0.3)',
                    }}>+ New Template</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                    {templates.map(t => (
                        <motion.div key={t.id} whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}
                            style={{
                                background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px',
                                border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s',
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{t.name}</h3>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 700, padding: '2px 10px', borderRadius: '8px',
                                        color: categoryConfig[t.category]?.color || '#74b9ff',
                                        background: categoryConfig[t.category]?.bg || 'rgba(116,185,255,0.12)',
                                    }}>{categoryConfig[t.category]?.label || t.category}</span>
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString()}</span>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#a29bfe', fontWeight: 600, marginBottom: '8px' }}>Subject: {t.subject}</div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px', maxHeight: '60px', overflow: 'hidden' }}>{t.body}</p>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => openSend(t)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(0,184,148,0.12)', color: '#00b894', fontWeight: 700, fontSize: '0.78rem' }}>✉ Send</button>
                                <button onClick={() => openEdit(t)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(108,92,231,0.12)', color: '#6c5ce7', fontWeight: 700, fontSize: '0.78rem' }}>Edit</button>
                                <button onClick={() => handleDelete(t.id)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontWeight: 700, fontSize: '0.78rem' }}>✕</button>
                            </div>
                        </motion.div>
                    ))}
                    {templates.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                            No templates yet. Create your first email template!
                        </div>
                    )}
                </div>
            )}

            {/* ── Editor Modal ── */}
            <AnimatePresence>
                {showEditor && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setShowEditor(false)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '20px', padding: '28px', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px' }}>{editing ? 'Edit Template' : 'New Email Template'}</h2>
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Template name"
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit' }} />
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                                        {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                                <input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Email subject line (supports {{merge_tags}})"
                                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit' }} />

                                {/* Merge Tags */}
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Insert Merge Tag:</div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {mergeTags.map(mt => (
                                            <button key={mt.tag} type="button" onClick={() => insertTag(mt.tag)}
                                                style={{
                                                    padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)',
                                                    background: 'rgba(108,92,231,0.08)', color: '#a29bfe', fontSize: '0.7rem', fontWeight: 600,
                                                    cursor: 'pointer', fontFamily: 'monospace',
                                                }}>{mt.tag}</button>
                                        ))}
                                    </div>
                                </div>

                                <textarea required value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Email body content..." rows={10}
                                    style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowEditor(false)}
                                        style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                                    <button type="submit"
                                        style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                        {editing ? 'Update' : 'Create'} Template
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Send Modal ── */}
            <AnimatePresence>
                {showSend && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setShowSend(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '20px', padding: '28px', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Send: {showSend.name}</h2>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Using template "{showSend.subject}"</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input value={sendForm.to_email} onChange={e => setSendForm(f => ({ ...f, to_email: e.target.value }))} placeholder="Recipient email (or link to lead/customer)"
                                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input value={sendForm.lead_id} onChange={e => setSendForm(f => ({ ...f, lead_id: e.target.value }))} placeholder="Lead ID (optional)"
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit' }} />
                                    <input value={sendForm.customer_id} onChange={e => setSendForm(f => ({ ...f, customer_id: e.target.value }))} placeholder="Customer ID (optional)"
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit' }} />
                                </div>

                                <button type="button" onClick={handlePreview}
                                    style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'rgba(108,92,231,0.08)', color: '#a29bfe', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>Preview Email</button>

                                {preview && (
                                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Preview</div>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#a29bfe', marginBottom: '8px' }}>Subject: {preview.subject}</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{preview.body}</div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                                    <button onClick={() => setShowSend(null)}
                                        style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                                    <button onClick={handleSend}
                                        style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #00b894, #55efc4)', color: '#1a1f35', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                        ✉ Send Email
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default EmailTemplates;
