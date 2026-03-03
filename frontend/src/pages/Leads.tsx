import React, { useState, useEffect, useCallback } from 'react';
import { useCRM, Lead } from '../context/CRMContext';
import KanbanBoard from '../components/leads/KanbanBoard';
import LeadForm from '../components/leads/LeadForm';

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    new: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', dot: '#3b82f6' },
    contacted: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', dot: '#f59e0b' },
    qualified: { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', dot: '#8b5cf6' },
    converted: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', dot: '#10b981' },
};

const Leads: React.FC = () => {
    const {
        leads, leadsPagination, leadsLoading,
        fetchLeads, updateLeadStatus, convertLead, deleteLead, currentUser
    } = useCRM();
    const [view, setView] = useState<'list' | 'kanban'>('list');
    const [showForm, setShowForm] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ type: string; lead: Lead } | null>(null);

    const loadLeads = useCallback(() => {
        fetchLeads(1, { status: statusFilter, search });
    }, [fetchLeads, statusFilter, search]);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    const handleSearch = (value: string) => {
        setSearch(value);
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
    };

    const handlePageChange = (page: number) => {
        fetchLeads(page, { status: statusFilter, search });
    };

    const handleEdit = (lead: Lead) => {
        setEditingLead(lead);
        setShowForm(true);
    };

    const handleDelete = async () => {
        if (confirmAction?.lead) {
            const success = await deleteLead(confirmAction.lead.id);
            if (success) {
                setConfirmAction(null);
            }
        }
    };

    const handleConvert = async () => {
        if (confirmAction?.lead) {
            const success = await convertLead(confirmAction.lead.id);
            if (success) {
                setConfirmAction(null);
            }
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingLead(null);
    };

    return (
        <div className="animate-fade-in">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center space-x-3">
                    {/* View toggle */}
                    <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                        <button onClick={() => setView('list')}
                            className={`px-4 py-2 text-sm font-medium transition-all ${view === 'list' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            style={view === 'list' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}>
                            ☰ List
                        </button>
                        <button onClick={() => setView('kanban')}
                            className={`px-4 py-2 text-sm font-medium transition-all ${view === 'kanban' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            style={view === 'kanban' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}>
                            ▦ Kanban
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <button onClick={() => { setEditingLead(null); setShowForm(true); }}
                        className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 w-full md:w-auto"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        + Add Lead
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                        placeholder="Search by company or email..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border-0 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(148, 163, 184, 0.1)' }}
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2.5 rounded-xl text-sm text-slate-300 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(148, 163, 184, 0.1)' }}
                    value={statusFilter}
                    onChange={e => handleStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                </select>
            </div>

            {/* Loading */}
            {leadsLoading && (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Content */}
            {!leadsLoading && view === 'kanban' ? (
                <KanbanBoard leads={leads} />
            ) : !leadsLoading ? (
                <div className="glass-card overflow-hidden animate-slide-in">
                    <table className="min-w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                {currentUser?.role === 'admin' && (
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Created By</th>
                                )}
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((lead, idx) => (
                                <tr key={lead.id}
                                    className="transition-colors hover:bg-white/[0.02]"
                                    style={{ borderBottom: idx < leads.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none', animationDelay: `${idx * 30}ms` }}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-white">{lead.company_name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-300">{lead.contact_name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{lead.email}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{lead.phone || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                                            style={{ background: statusColors[lead.status]?.bg, color: statusColors[lead.status]?.text }}>
                                            <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ background: statusColors[lead.status]?.dot }}></span>
                                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                        </span>
                                    </td>
                                    {currentUser?.role === 'admin' && (
                                        <td className="px-6 py-4 text-sm text-slate-400">{lead.creator?.name || '—'}</td>
                                    )}
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(lead)}
                                            className="px-3 py-1.5 text-xs font-medium text-indigo-400 rounded-lg transition-all hover:bg-indigo-500/10">
                                            Edit
                                        </button>
                                        {lead.status === 'qualified' && (
                                            <button onClick={() => setConfirmAction({ type: 'convert', lead })}
                                                className="px-3 py-1.5 text-xs font-medium text-emerald-400 rounded-lg transition-all hover:bg-emerald-500/10">
                                                Convert
                                            </button>
                                        )}
                                        <button onClick={() => setConfirmAction({ type: 'delete', lead })}
                                            className="px-3 py-1.5 text-xs font-medium text-red-400 rounded-lg transition-all hover:bg-red-500/10">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                                        <div className="text-4xl mb-3">🎯</div>
                                        <p className="font-medium">No leads found</p>
                                        <p className="text-sm mt-1">Try adjusting your filters or add a new lead</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : null}

            {/* Pagination */}
            {!leadsLoading && leadsPagination.last_page > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-slate-400">
                        Showing {leads.length} of {leadsPagination.total} leads
                    </p>
                    <div className="flex space-x-1">
                        {Array.from({ length: leadsPagination.last_page }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => handlePageChange(page)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${page === leadsPagination.current_page
                                    ? 'text-white font-semibold'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                style={page === leadsPagination.current_page ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Lead Form Modal */}
            {showForm && <LeadForm lead={editingLead} onClose={handleFormClose} />}

            {/* Confirm Dialog */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card p-6 w-full max-w-sm mx-4 animate-slide-in">
                        <h3 className="text-lg font-bold text-white mb-2">
                            {confirmAction?.type === 'delete' ? 'Delete Lead' : 'Convert Lead'}
                        </h3>
                        <p className="text-sm text-slate-400 mb-6">
                            {confirmAction?.type === 'delete'
                                ? `Are you sure you want to delete "${confirmAction?.lead.company_name}"? This action can be undone.`
                                : `Convert "${confirmAction?.lead.company_name}" to a customer? This will create a new customer record.`}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setConfirmAction(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-400 rounded-xl hover:text-white hover:bg-white/5 transition-all">
                                Cancel
                            </button>
                            <button onClick={confirmAction?.type === 'delete' ? handleDelete : handleConvert}
                                className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all"
                                style={{ background: confirmAction?.type === 'delete' ? '#ef4444' : 'linear-gradient(135deg, #10b981, #059669)' }}>
                                {confirmAction?.type === 'delete' ? 'Delete' : 'Convert'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leads;
