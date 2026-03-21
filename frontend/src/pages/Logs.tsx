import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

interface AuditEntry {
    id: number;
    user_id: number;
    action: string;
    auditable_type: string;
    auditable_id: number;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string;
    user_agent: string;
    created_at: string;
    entity_label: string;
    changed_fields: Record<string, { old: any; new: any }>;
    user?: { id: number; name: string; email: string };
}

const actionConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    created: { color: '#00b894', bg: 'rgba(0,184,148,0.12)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> },
    updated: { color: '#fdcb6e', bg: 'rgba(253,203,110,0.12)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> },
    deleted: { color: '#ff7675', bg: 'rgba(255,118,117,0.12)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> },
    viewed: { color: '#74b9ff', bg: 'rgba(116,185,255,0.12)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg> },
    exported: { color: '#a29bfe', bg: 'rgba(162,155,254,0.12)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> },
};

const Logs: React.FC = () => {
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [filters, setFilters] = useState({
        action: '', entity_type: '', search: '', from: '', to: '',
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('per_page', '20');
            if (filters.action) params.set('action', filters.action);
            if (filters.entity_type) params.set('entity_type', filters.entity_type);
            if (filters.search) params.set('search', filters.search);
            if (filters.from) params.set('from', filters.from);
            if (filters.to) params.set('to', filters.to);
            const { data } = await api.get(`/audit-logs?${params.toString()}`);
            setLogs(data.data || []);
            setLastPage(data.last_page || 1);
        } catch { setLogs([]); }
        setLoading(false);
    }, [page, filters]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.from) params.set('from', filters.from);
            if (filters.to) params.set('to', filters.to);
            const { data } = await api.get(`/audit-logs/export?${params.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
        } catch { alert('Export failed'); }
    };

    const inputStyle: React.CSSProperties = {
        padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)',
        background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Audit Trail</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Complete log of all system events</p>
                </div>
                <button onClick={handleExport}
                    style={{
                        padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #00b894, #55efc4)', color: '#1a1f35',
                        fontWeight: 700, fontSize: '0.85rem',
                    }}>Export CSV</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input placeholder="Search by user name or ID..." value={filters.search}
                    onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
                    style={{ ...inputStyle, width: '200px' }} />
                <select value={filters.action} onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1); }} style={inputStyle}>
                    <option value="">All Actions</option>
                    {Object.keys(actionConfig).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filters.entity_type} onChange={e => { setFilters(f => ({ ...f, entity_type: e.target.value })); setPage(1); }} style={inputStyle}>
                    <option value="">All Entities</option>
                    {['Lead', 'Customer', 'Task', 'User', 'Quotation', 'Discount', 'EmailTemplate'].map(e => (
                        <option key={e} value={e}>{e}</option>
                    ))}
                </select>
                <input type="date" value={filters.from} onChange={e => { setFilters(f => ({ ...f, from: e.target.value })); setPage(1); }} style={inputStyle} />
                <input type="date" value={filters.to} onChange={e => { setFilters(f => ({ ...f, to: e.target.value })); setPage(1); }} style={inputStyle} />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading audit logs...</div>
            ) : (
                <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                    {logs.map(log => {
                        const ac = actionConfig[log.action] || actionConfig.updated;
                        const isExpanded = expandedId === log.id;
                        const hasChanges = log.changed_fields && Object.keys(log.changed_fields).length > 0;

                        return (
                            <div key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <div onClick={() => hasChanges && setExpandedId(isExpanded ? null : log.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px',
                                        cursor: hasChanges ? 'pointer' : 'default', transition: 'background 0.2s',
                                    }}>
                                    <span style={{ fontSize: '1.1rem' }}>{ac.icon}</span>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '8px',
                                        color: ac.color, background: ac.bg, textTransform: 'uppercase',
                                    }}>{log.action}</span>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {log.entity_label} #{log.auditable_id}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>by {log.user?.name || 'System'}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                    {log.ip_address && <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.6 }}>{log.ip_address}</span>}
                                    {hasChanges && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>}
                                </div>
                                <AnimatePresence>
                                    {isExpanded && hasChanges && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: 'hidden', borderTop: '1px solid var(--border-subtle)' }}>
                                            <div style={{ padding: '14px 18px 14px 52px' }}>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Changed Fields</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {Object.entries(log.changed_fields).map(([field, vals]) => (
                                                        <div key={field} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.8rem' }}>
                                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', minWidth: '120px', fontFamily: 'monospace' }}>{field}</span>
                                                            <span style={{ color: '#ff7675', textDecoration: 'line-through', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                                {vals.old !== null && vals.old !== undefined ? String(vals.old) : '—'}
                                                            </span>
                                                            <span style={{ color: 'var(--text-secondary)' }}>→</span>
                                                            <span style={{ color: '#00b894', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>
                                                                {vals.new !== null && vals.new !== undefined ? String(vals.new) : '—'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                    {logs.length === 0 && <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>No audit logs found</div>}
                </div>
            )}

            {/* Pagination */}
            {lastPage > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: '0.82rem' }}>← Prev</button>
                    <span style={{ padding: '8px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>Page {page} of {lastPage}</span>
                    <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 600, cursor: page === lastPage ? 'not-allowed' : 'pointer', opacity: page === lastPage ? 0.4 : 1, fontSize: '0.82rem' }}>Next →</button>
                </div>
            )}
        </motion.div>
    );
};

export default Logs;
