import React, { useState, useEffect } from 'react';
import { ticketService, Ticket, Agent } from '../services/ticketService';
    // Removed unused useAuth import

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    open:        { label: 'Ouvert',    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  icon: '🔵' },
    in_progress: { label: 'En cours',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '🟡' },
    resolved:    { label: 'Résolu',    color: '#10b981', bg: 'rgba(16,185,129,0.15)',   icon: '🟢' },
    closed:      { label: 'Fermé',     color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: '⚫' },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    low:      { label: 'Basse',    color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: '▽' },
    medium:   { label: 'Moyenne',  color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  icon: '◆' },
    high:     { label: 'Haute',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '▲' },
    critical: { label: 'Critique', color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: '🔴' },
};

const TicketsList: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [filters, setFilters] = useState({ status: '', priority: '', search: '', assigned_to: '' });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);

    // Form state
    const [formData, setFormData] = useState({ title: '', description: '', customer_id: '', priority: '', category: '' });
    const [submitting, setSubmitting] = useState(false);

    const loadTickets = async (page = 1) => {
        setLoading(true);
        try {
            const data = await ticketService.getTickets({ page, ...filters });
            setTickets(data.data || []);
            setPagination({ current_page: data.current_page, last_page: data.last_page, total: data.total });
        } catch (err) {
            console.error('Failed to load tickets:', err);
        }
        setLoading(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadTickets(); }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadTickets(1); }, [filters.status, filters.priority, filters.assigned_to]);
    useEffect(() => {
        ticketService.getAgents().then(setAgents).catch(() => {});
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadTickets(1);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await ticketService.createTicket({
                title: formData.title,
                description: formData.description,
                customer_id: formData.customer_id ? Number(formData.customer_id) : null,
                priority: formData.priority || undefined,
                category: formData.category || undefined,
            });
            setShowCreateForm(false);
            setFormData({ title: '', description: '', customer_id: '', priority: '', category: '' });
            loadTickets(1);
        } catch (err) {
            console.error('Failed to create ticket:', err);
        }
        setSubmitting(false);
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}j`;
    };

    return (
        <div className="p-6 lg:p-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">🎫 Tickets Support</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{pagination.total} tickets au total</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                    + Nouveau Ticket
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                    <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="🔍 Rechercher par titre, numéro..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full px-4 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                    </form>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="open">🔵 Ouvert</option>
                        <option value="in_progress">🟡 En cours</option>
                        <option value="resolved">🟢 Résolu</option>
                        <option value="closed">⚫ Fermé</option>
                    </select>
                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                    >
                        <option value="">Toutes priorités</option>
                        <option value="low">▽ Basse</option>
                        <option value="medium">◆ Moyenne</option>
                        <option value="high">▲ Haute</option>
                        <option value="critical">🔴 Critique</option>
                    </select>
                    <select
                        value={filters.assigned_to}
                        onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })}
                        className="px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                    >
                        <option value="">Tous les agents</option>
                        {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.open_tickets_count})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tickets Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : tickets.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <div className="text-5xl mb-4">🎫</div>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">Aucun ticket trouvé</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Créez votre premier ticket ou modifiez les filtres</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tickets.map((ticket) => {
                        const s = statusConfig[ticket.status] || statusConfig.open;
                        const p = priorityConfig[ticket.priority] || priorityConfig.medium;
                        return (
                            <a
                                key={ticket.id}
                                href={`#/tickets/${ticket.id}`}
                                className="glass-card p-4 flex items-center gap-4 transition-all hover:border-indigo-500/30 hover:shadow-lg cursor-pointer group block"
                            >
                                {/* Priority indicator */}
                                <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }}></div>

                                {/* Main info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-[var(--text-muted)]">{ticket.ticket_number}</span>
                                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ color: s.color, background: s.bg }}>
                                            {s.icon} {s.label}
                                        </span>
                                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ color: p.color, background: p.bg }}>
                                            {p.icon} {p.label}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-indigo-400 transition-colors">
                                        {ticket.title}
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{ticket.description}</p>
                                </div>

                                {/* Meta */}
                                <div className="flex items-center gap-4 flex-shrink-0 text-xs text-[var(--text-secondary)]">
                                    {ticket.customer && (
                                        <span className="hidden sm:block">👤 {ticket.customer.name}</span>
                                    )}
                                    {ticket.assigned_agent && (
                                        <span className="hidden md:block">🛠️ {ticket.assigned_agent.name}</span>
                                    )}
                                    <span>{timeAgo(ticket.created_at)}</span>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="flex justify-center mt-6 space-x-1">
                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => loadTickets(page)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                                page === pagination.current_page
                                    ? 'text-white font-semibold'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                            style={page === pagination.current_page ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}

            {/* Create Ticket Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateForm(false)} />
                    <div className="relative w-full max-w-lg glass-card p-6 animate-slide-in" style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
                        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">🎫 Nouveau Ticket</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Titre *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                                    placeholder="Décrivez brièvement le problème"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Description *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none resize-none"
                                    placeholder="Détails du problème..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Priorité</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-3 py-2.5 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                                    >
                                        <option value="">Auto-détection</option>
                                        <option value="low">Basse</option>
                                        <option value="medium">Moyenne</option>
                                        <option value="high">Haute</option>
                                        <option value="critical">Critique</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Catégorie</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2.5 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                                        placeholder="Ex: technique, facturation"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">ID Client (optionnel)</label>
                                <input
                                    type="number"
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                                    placeholder="ID du client dans le CRM"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateForm(false)}
                                    className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                    Annuler
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-lg disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                    {submitting ? 'Création...' : 'Créer le ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketsList;
