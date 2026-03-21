import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

interface Task {
    id: number;
    title: string;
    description?: string;
    type: 'call' | 'email' | 'meeting' | 'follow_up' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    due_date?: string;
    completed_at?: string;
    lead_id?: number;
    customer_id?: number;
    assigned_to: number;
    created_by: number;
    lead?: { id: number; company_name: string; contact_name: string };
    customer?: { id: number; name: string };
    assignee?: { id: number; name: string };
    creator?: { id: number; name: string };
    created_at: string;
}

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
    urgent: { color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)', label: 'Urgent' },
    high: { color: '#ffa502', bg: 'rgba(255,165,2,0.12)', label: 'High' },
    medium: { color: '#1e90ff', bg: 'rgba(30,144,255,0.12)', label: 'Medium' },
    low: { color: '#7bed9f', bg: 'rgba(123,237,159,0.12)', label: 'Low' },
};

const typeIcons: Record<string, React.ReactNode> = {
    call: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
    email: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
    meeting: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    follow_up: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
    other: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
};

const statusColumns = [
    { key: 'pending', label: 'Pending', color: '#a29bfe' },
    { key: 'in_progress', label: 'In Progress', color: '#fdcb6e' },
    { key: 'completed', label: 'Completed', color: '#00b894' },
];

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'kanban' | 'list'>('kanban');
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [filter, setFilter] = useState({ priority: '', type: '', search: '' });

    const [form, setForm] = useState({
        title: '', description: '', type: 'follow_up', priority: 'medium',
        due_date: '', lead_id: '', customer_id: '',
    });

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('per_page', '100');
            if (filter.priority) params.set('priority', filter.priority);
            if (filter.type) params.set('type', filter.type);
            if (filter.search) params.set('search', filter.search);
            const { data } = await api.get(`/tasks?${params.toString()}`);
            setTasks(data.data || []);
        } catch { setTasks([]); }
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...form };
            if (!payload.lead_id) delete payload.lead_id;
            if (!payload.customer_id) delete payload.customer_id;
            if (!payload.due_date) delete payload.due_date;
            if (editingTask) {
                await api.put(`/tasks/${editingTask.id}`, payload);
            } else {
                await api.post('/tasks', payload);
            }
            setShowForm(false);
            setEditingTask(null);
            setForm({ title: '', description: '', type: 'follow_up', priority: 'medium', due_date: '', lead_id: '', customer_id: '' });
            fetchTasks();
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (taskId: number, status: string) => {
        try {
            await api.put(`/tasks/${taskId}`, { status });
            fetchTasks();
        } catch { }
    };

    const deleteTask = async (taskId: number) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            fetchTasks();
        } catch { }
    };

    const openEdit = (task: Task) => {
        setEditingTask(task);
        setForm({
            title: task.title, description: task.description || '',
            type: task.type, priority: task.priority,
            due_date: task.due_date ? task.due_date.slice(0, 16) : '',
            lead_id: task.lead_id?.toString() || '', customer_id: task.customer_id?.toString() || '',
        });
        setShowForm(true);
    };

    const isOverdue = (task: Task) =>
        task.due_date && new Date(task.due_date) < new Date() && !['completed', 'cancelled'].includes(task.status);

    const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

    const cs = (base: string, styles: React.CSSProperties) =>
        ({ className: base, style: styles });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Tasks & Activities</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                        {tasks.length} tasks · {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length} active
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* View Toggle */}
                    <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                        {(['kanban', 'list'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)} style={{
                                padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                                background: view === v ? 'var(--primary-500, #6c5ce7)' : 'var(--bg-primary)',
                                color: view === v ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s',
                            }}>{v === 'kanban' ? '▦ Board' : '☰ List'}</button>
                        ))}
                    </div>
                    <button onClick={() => { setEditingTask(null); setForm({ title: '', description: '', type: 'follow_up', priority: 'medium', due_date: '', lead_id: '', customer_id: '' }); setShowForm(true); }}
                        style={{
                            padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: '#fff',
                            fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 4px 15px rgba(108,92,231,0.3)',
                        }}>+ New Task</button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input placeholder="Search tasks..." value={filter.search}
                    onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                    style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.82rem', width: '200px', fontFamily: 'inherit' }} />
                <select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}
                    style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                    <option value="">All Priorities</option>
                    {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
                    style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                    <option value="">All Types</option>
                    {Object.entries(typeIcons).map(([k]) => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading tasks...</div>
            ) : view === 'kanban' ? (
                /* ── Kanban View ── */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', minHeight: '400px' }}>
                    {statusColumns.map(col => (
                        <div key={col.key} style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color }} />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{col.label}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: col.color, background: `${col.color}22`, padding: '2px 8px', borderRadius: '10px' }}>
                                    {getTasksByStatus(col.key).length}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <AnimatePresence>
                                    {getTasksByStatus(col.key).map(task => (
                                        <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                            style={{
                                                padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                                                border: isOverdue(task) ? '1px solid rgba(255,107,107,0.4)' : '1px solid var(--border-subtle)',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                            }}
                                            onClick={() => openEdit(task)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '1rem' }}>{typeIcons[task.type]}</span>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{task.title}</span>
                                            </div>
                                            {task.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.4 }}>{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</p>}
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', color: priorityConfig[task.priority]?.color, background: priorityConfig[task.priority]?.bg }}>{priorityConfig[task.priority]?.label}</span>
                                                {task.due_date && <span style={{ fontSize: '0.65rem', color: isOverdue(task) ? '#ff6b6b' : 'var(--text-secondary)', fontWeight: 600 }}>
                                                    {isOverdue(task) ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle'}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> Overdue</> : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> {new Date(task.due_date).toLocaleDateString()}</>}
                                                </span>}
                                                {(task.lead || task.customer) && <span style={{ fontSize: '0.65rem', color: '#a29bfe', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg> {task.lead?.company_name || task.customer?.name}</span>}
                                            </div>
                                            {task.assignee && <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '3px' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> {task.assignee.name}</div>}
                                            {/* Quick actions */}
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                                                {col.key === 'pending' && <button onClick={() => updateStatus(task.id, 'in_progress')} style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'rgba(253,203,110,0.15)', color: '#fdcb6e', fontWeight: 600 }}>▶ Start</button>}
                                                {col.key === 'in_progress' && <button onClick={() => updateStatus(task.id, 'completed')} style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'rgba(0,184,148,0.15)', color: '#00b894', fontWeight: 600 }}>✓ Done</button>}
                                                <button onClick={() => deleteTask(task.id)} style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontWeight: 600 }}>✕</button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {getTasksByStatus(col.key).length === 0 && <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)', fontSize: '0.78rem', opacity: 0.6 }}>No tasks</div>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* ── List View ── */
                <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                {['Type', 'Title', 'Priority', 'Status', 'Due Date', 'Linked To', 'Assignee', 'Actions'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.id} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => openEdit(task)}>
                                    <td style={{ padding: '12px 14px', fontSize: '1.1rem' }}>{typeIcons[task.type]}</td>
                                    <td style={{ padding: '12px 14px' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{task.title}</span>
                                        {task.description && <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{task.description.slice(0, 60)}</p>}
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '8px', color: priorityConfig[task.priority]?.color, background: priorityConfig[task.priority]?.bg }}>{priorityConfig[task.priority]?.label}</span>
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: statusColumns.find(s => s.key === task.status)?.color }}>{task.status.replace('_', ' ')}</span>
                                    </td>
                                    <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: isOverdue(task) ? '#ff6b6b' : 'var(--text-secondary)', fontWeight: isOverdue(task) ? 700 : 400 }}>
                                        {task.due_date ? <span style={{display:'inline-flex',alignItems:'center',gap:'4px'}}>{isOverdue(task) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>} {new Date(task.due_date).toLocaleDateString()}</span> : '—'}
                                    </td>
                                    <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#a29bfe' }}>{task.lead?.company_name || task.customer?.name || '—'}</td>
                                    <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{task.assignee?.name || '—'}</td>
                                    <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {task.status !== 'completed' && <button onClick={() => updateStatus(task.id, 'completed')} style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'rgba(0,184,148,0.15)', color: '#00b894', fontWeight: 600 }}>✓</button>}
                                            <button onClick={() => deleteTask(task.id)} style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontWeight: 600 }}>✕</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tasks.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No tasks found</div>}
                </div>
            )}

            {/* ── Create/Edit Modal ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setShowForm(false)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-primary)', borderRadius: '20px', padding: '28px', border: '1px solid var(--border-subtle)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px' }}>{editingTask ? 'Edit Task' : 'New Task'}</h2>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title"
                                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit' }} />
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" rows={3}
                                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                                        {Object.entries(typeIcons).map(([k]) => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
                                    </select>
                                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                                        {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                                <input type="datetime-local" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit' }} />
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                                    <button type="button" onClick={() => setShowForm(false)}
                                        style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                                    <button type="submit"
                                        style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 15px rgba(108,92,231,0.3)' }}>
                                        {editingTask ? 'Update' : 'Create'} Task
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Tasks;
