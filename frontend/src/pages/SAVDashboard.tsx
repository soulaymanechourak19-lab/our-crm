import React, { useState, useEffect } from 'react';
import { ticketService, TicketStats } from '../services/ticketService';

const SAVDashboard: React.FC = () => {
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await ticketService.getStats();
                setStats(data);
            } catch (err) {
                console.error('Failed to load SAV stats:', err);
            }
            setLoading(false);
        };
        load();
    }, []);

    if (loading || !stats) {
        return (
            <div className="p-6 lg:p-8 flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Tickets',   value: stats.total,       icon: '🎫', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
        { label: 'Ouverts',         value: stats.open,        icon: '🔵', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
        { label: 'En cours',        value: stats.in_progress, icon: '🟡', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
        { label: 'Résolus',         value: stats.resolved,    icon: '🟢', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
        { label: 'Fermés',          value: stats.closed,      icon: '⚫', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)' },
        { label: 'Cette semaine',   value: stats.recent_count, icon: '📅', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    ];

    return (
        <div className="p-6 lg:p-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">📊 Dashboard SAV</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Vue d'ensemble du support client</p>
                </div>
                <a href="#/tickets"
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    Voir tous les tickets →
                </a>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {statCards.map((card, i) => (
                    <div key={i} className="glass-card p-5 relative overflow-hidden group hover:shadow-lg transition-all animate-slide-in"
                        style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">{card.icon}</div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{card.label}</p>
                        <p className="text-3xl font-bold mt-2" style={{ color: card.color }}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Average resolution time */}
                <div className="glass-card p-6">
                    <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">⏱️ Temps moyen de résolution</h2>
                    <div className="flex items-end gap-2">
                        <span className="text-5xl font-bold text-[var(--text-primary)]">{stats.avg_resolution_hours}</span>
                        <span className="text-lg text-[var(--text-secondary)] mb-1">heures</span>
                    </div>
                    <div className="w-full h-2 rounded-full mt-4 overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${Math.min(100, (stats.avg_resolution_hours / 72) * 100)}%`,
                                background: stats.avg_resolution_hours <= 24 ? '#10b981' : stats.avg_resolution_hours <= 48 ? '#f59e0b' : '#ef4444',
                            }}>
                        </div>
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-[var(--text-muted)]">Excellent (&lt;24h)</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Moyen (24-48h)</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Lent (&gt;48h)</span>
                    </div>
                </div>

                {/* Priority breakdown */}
                <div className="glass-card p-6">
                    <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">🎯 Répartition par priorité</h2>
                    <div className="space-y-3">
                        {[
                            { key: 'critical', label: 'Critique', color: '#ef4444', icon: '🔴' },
                            { key: 'high', label: 'Haute', color: '#f59e0b', icon: '▲' },
                            { key: 'medium', label: 'Moyenne', color: '#3b82f6', icon: '◆' },
                            { key: 'low', label: 'Basse', color: '#6b7280', icon: '▽' },
                        ].map((p) => {
                            const count = stats.by_priority[p.key as keyof typeof stats.by_priority] || 0;
                            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                                <div key={p.key}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-[var(--text-primary)]">{p.icon} {p.label}</span>
                                        <span className="text-sm font-semibold" style={{ color: p.color }}>{count}</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: p.color }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tickets par agent */}
            <div className="glass-card p-6 mt-6">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">👥 Tickets ouverts par agent</h2>
                {stats.by_agent && stats.by_agent.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {stats.by_agent.map((agent, i) => {
                            const maxTickets = Math.max(...stats.by_agent.map(a => a.total), 1);
                            return (
                                <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">🛠️ {agent.name}</span>
                                        <span className="text-lg font-bold text-indigo-400">{agent.total}</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${(agent.total / maxTickets) * 100}%`, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6 text-[var(--text-muted)]">
                        <p className="text-sm">Aucun ticket ouvert actuellement</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SAVDashboard;
