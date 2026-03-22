import React, { useState, useEffect } from 'react';
import { ticketService, Ticket, TicketComment, Agent } from '../services/ticketService';
import { useAuth } from '../context/AuthContext';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    open:        { label: 'Ouvert',    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  icon: '🔵' },
    in_progress: { label: 'En cours',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '🟡' },
    resolved:    { label: 'Résolu',    color: '#10b981', bg: 'rgba(16,185,129,0.15)',   icon: '🟢' },
    closed:      { label: 'Fermé',     color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: '⚫' },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
    low:      { label: 'Basse',    color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
    medium:   { label: 'Moyenne',  color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    high:     { label: 'Haute',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    critical: { label: 'Critique', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

const statusFlow = ['open', 'in_progress', 'resolved', 'closed'];

const TicketDetail: React.FC = () => {
    const { user } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
    const [newComment, setNewComment] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const ticketId = parseInt(window.location.hash.split('/').pop() || '0');

    const loadTicket = React.useCallback(async () => {
        if (!ticketId) return;
        setLoading(true);
        try {
            const data = await ticketService.getTicket(ticketId);
            setTicket(data);
        } catch (err) {
            console.error('Failed to load ticket:', err);
        }
        setLoading(false);
    }, [ticketId]);

    useEffect(() => { loadTicket(); }, [loadTicket]);
    useEffect(() => {
        ticketService.getAgents().then(setAgents).catch(() => {});
    }, []);

    const handleStatusChange = async (newStatus: string) => {
        if (!ticket || updatingStatus) return;
        setUpdatingStatus(true);
        try {
            await ticketService.updateStatus(ticket.id, newStatus);
            await loadTicket();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
        setUpdatingStatus(false);
    };

    const handleAssign = async (agentId: number) => {
        if (!ticket) return;
        try {
            await ticketService.assignTicket(ticket.id, agentId);
            await loadTicket();
        } catch (err) {
            console.error('Failed to assign ticket:', err);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticket || !newComment.trim()) return;
        setSubmittingComment(true);
        try {
            await ticketService.addComment(ticket.id, newComment, isInternal);
            setNewComment('');
            setIsInternal(false);
            await loadTicket();
        } catch (err) {
            console.error('Failed to add comment:', err);
        }
        setSubmittingComment(false);
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!ticket) return;
        try {
            await ticketService.deleteComment(ticket.id, commentId);
            await loadTicket();
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    if (loading || !ticket) {
        return (
            <div className="p-6 lg:p-8 flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const s = statusConfig[ticket.status] || statusConfig.open;
    const p = priorityConfig[ticket.priority] || priorityConfig.medium;
    const canManage = user && (user.role === 'admin' || user.role === 'agent_sav');

    return (
        <div className="p-6 lg:p-8 animate-fade-in max-w-5xl mx-auto">
            {/* Back link */}
            <a href="#/tickets" className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-indigo-400 transition-colors mb-6">
                ← Retour aux tickets
            </a>

            {/* Ticket header */}
            <div className="glass-card overflow-hidden mb-6 animate-slide-in">
                <div className="h-1.5" style={{ background: `linear-gradient(135deg, ${p.color}, ${s.color})` }}></div>
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-[var(--text-muted)]">{ticket.ticket_number}</span>
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full" style={{ color: s.color, background: s.bg }}>
                                    {s.icon} {s.label}
                                </span>
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full" style={{ color: p.color, background: p.bg }}>
                                    {p.label}
                                </span>
                                {ticket.source && (
                                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-500/15 text-purple-400">
                                        📡 {ticket.source}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl font-bold text-[var(--text-primary)]">{ticket.title}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                                {ticket.customer && <span>👤 Client: <strong>{ticket.customer.name}</strong></span>}
                                {ticket.assigned_agent && <span>🛠️ Agent: <strong>{ticket.assigned_agent.name}</strong></span>}
                                <span>📅 {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                {ticket.category && <span>🏷️ {ticket.category}</span>}
                            </div>
                        </div>

                        {/* Status change actions */}
                        {canManage && (
                            <div className="flex flex-wrap gap-2">
                                {statusFlow.filter(st => st !== ticket.status).map(st => {
                                    const sc = statusConfig[st];
                                    return (
                                        <button
                                            key={st}
                                            onClick={() => handleStatusChange(st)}
                                            disabled={updatingStatus}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:shadow-md disabled:opacity-50"
                                            style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.color}30` }}
                                        >
                                            → {sc.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Assign to agent */}
                    {canManage && (
                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-[var(--text-secondary)]">Assigner à :</span>
                                <select
                                    value={ticket.assigned_to || ''}
                                    onChange={(e) => handleAssign(Number(e.target.value))}
                                    className="px-3 py-1.5 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="">Non assigné</option>
                                    {agents.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.open_tickets_count} tickets ouverts)</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="glass-card p-6 mb-6">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Description</h2>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <button onClick={() => setActiveTab('comments')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'comments' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    style={activeTab === 'comments' ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))' } : {}}>
                    💬 Commentaires ({ticket.comments?.length || 0})
                </button>
                <button onClick={() => setActiveTab('history')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'history' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    style={activeTab === 'history' ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))' } : {}}>
                    📋 Historique ({ticket.history?.length || 0})
                </button>
            </div>

            {/* Comments tab */}
            {activeTab === 'comments' && (
                <div className="glass-card p-6 animate-slide-in">
                    {/* Comment list */}
                    {ticket.comments && ticket.comments.length > 0 ? (
                        <div className="space-y-4 mb-6">
                            {ticket.comments.map((comment: TicketComment) => (
                                <div key={comment.id}
                                    className="p-4 rounded-xl"
                                    style={{
                                        background: comment.is_internal ? 'rgba(245,158,11,0.08)' : 'var(--bg-secondary)',
                                        border: comment.is_internal ? '1px solid rgba(245,158,11,0.2)' : '1px solid var(--border-subtle)',
                                    }}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                                                {comment.user?.name || 'Système'}
                                            </span>
                                            {comment.is_internal && (
                                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-400">
                                                    🔒 Interne
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {new Date(comment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {user && (comment.user_id === user.id || user.role === 'admin') && (
                                                <button onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-xs text-red-400 hover:text-red-300 transition-colors">🗑️</button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{comment.message}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-[var(--text-muted)] mb-6">
                            <div className="text-3xl mb-2">💬</div>
                            <p className="text-sm">Aucun commentaire pour le moment</p>
                        </div>
                    )}

                    {/* Add comment form */}
                    <form onSubmit={handleAddComment} className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                            placeholder="Ajouter un commentaire..."
                            className="w-full px-4 py-3 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-indigo-500 focus:outline-none resize-none"
                        />
                        <div className="flex justify-between items-center mt-3">
                            {canManage && (
                                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isInternal}
                                        onChange={(e) => setIsInternal(e.target.checked)}
                                        className="rounded"
                                    />
                                    🔒 Commentaire interne (non visible par le client)
                                </label>
                            )}
                            <button type="submit" disabled={submittingComment || !newComment.trim()}
                                className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-lg disabled:opacity-50 ml-auto"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                {submittingComment ? 'Envoi...' : 'Envoyer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* History tab */}
            {activeTab === 'history' && (
                <div className="glass-card p-6 animate-slide-in">
                    {ticket.history && ticket.history.length > 0 ? (
                        <div className="space-y-3">
                            {ticket.history.map((entry: any) => (
                                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm flex-shrink-0">
                                        {entry.field === 'status' ? '🔄' : entry.field === 'assigned_to' ? '👤' : '📝'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[var(--text-primary)]">
                                            <strong>{entry.changed_by_user?.name || 'Système'}</strong> a changé <strong>{entry.field}</strong>
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                            {entry.old_value || '(vide)'} → <strong>{entry.new_value || '(vide)'}</strong>
                                        </p>
                                    </div>
                                    <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                                        {new Date(entry.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-[var(--text-muted)]">
                            <div className="text-3xl mb-2">📋</div>
                            <p className="text-sm">Aucun changement enregistré</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TicketDetail;
