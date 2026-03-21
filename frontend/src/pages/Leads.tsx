import React, { useState, useEffect, useCallback } from 'react';
import { useCRM, Lead } from '../context/CRMContext';
import KanbanBoard from '../components/leads/KanbanBoard';
import LeadForm from '../components/leads/LeadForm';
import Skeleton from '../components/common/Skeleton';

const getPaginationGroup = (current: number, last: number) => {
    const pages: (number | string)[] = [];
    if (last <= 7) {
        for (let i = 1; i <= last; i++) pages.push(i);
    } else {
        pages.push(1);
        if (current > 3) pages.push('...');
        const start = Math.max(2, current - 1);
        const end = Math.min(last - 1, current + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (current < last - 2) pages.push('...');
        pages.push(last);
    }
    return pages;
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    new: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', dot: '#3b82f6' },
    contacted: { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', dot: '#f59e0b' },
    qualified: { bg: 'rgba(139, 92, 246, 0.1)', text: '#a78bfa', dot: '#8b5cf6' },
    hot: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', dot: '#dc2626' },
    converted: { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', dot: '#10b981' },
    expired: { bg: 'rgba(107, 114, 128, 0.1)', text: '#9ca3af', dot: '#6b7280' },
};

const getExpirationBadge = (lead: Lead) => {
    if (!lead.expires_at) return <span className="text-[var(--text-muted)] text-xs">—</span>;
    if (lead.expired || lead.status === 'expired') return <span className="text-red-400 font-medium text-xs">Expired</span>;
    
    const expiryDate = new Date(lead.expires_at);
    const today = new Date();
    const diffTime = Math.abs(expiryDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (expiryDate < today) {
        return <span className="text-red-400 font-medium text-xs">Expired</span>;
    } else if (diffDays <= 3) {
        return <span className="text-orange-400 font-medium text-xs border border-orange-500/30 px-2 py-0.5 rounded">Expiring: {diffDays}d</span>;
    }
    return <span className="text-emerald-400 font-medium text-xs">{diffDays} days</span>;
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
    const [sourceFilter, setSourceFilter] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ type: string; lead: Lead } | null>(null);

    const loadLeads = useCallback(() => {
        fetchLeads(1, { status: statusFilter, search, ...(sourceFilter ? { source: sourceFilter } : {}) });
    }, [fetchLeads, statusFilter, search, sourceFilter]);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    const handleSearch = (value: string) => {
        setSearch(value);
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
    };

    const handleSourceFilter = (value: string) => {
        setSourceFilter(value);
    };

    const handlePageChange = (page: number) => {
        fetchLeads(page, { status: statusFilter, search, ...(sourceFilter ? { source: sourceFilter } : {}) });
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
                    <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                        <button onClick={() => setView('list')}
                            className={`px-4 py-2 text-sm font-medium transition-all ${view === 'list' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            style={view === 'list' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}>
                            ☰ List
                        </button>
                        <button onClick={() => setView('kanban')}
                            className={`px-4 py-2 text-sm font-medium transition-all ${view === 'kanban' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
                    <input
                        placeholder="Search by company or email..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border-0 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                    value={statusFilter}
                    onChange={e => handleStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="hot">Hot</option>
                    <option value="converted">Converted</option>
                    <option value="expired">Expired</option>
                </select>
                <select
                    className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                    value={sourceFilter}
                    onChange={e => handleSourceFilter(e.target.value)}
                >
                    <option value="">All Sources</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="event">Event</option>
                    <option value="nearby">Nearby</option>
                    <option value="manual">Manual</option>
                </select>
            </div>

            {/* Content */}
            {view === 'kanban' ? (
                leadsLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <KanbanBoard leads={leads} />
                )
            ) : (
                <div className="glass-card overflow-hidden animate-slide-in">
                    <table className="min-w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Company</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Source</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Expires</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                                {currentUser?.role === 'admin' && (
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Created By</th>
                                )}
                                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leadsLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skel-${i}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td className="px-6 py-4"><Skeleton height={20} width="70%" /></td>
                                        <td className="px-6 py-4"><Skeleton height={20} width="60%" /></td>
                                        <td className="px-6 py-4"><Skeleton height={20} width="80%" /></td>
                                        <td className="px-6 py-4"><Skeleton height={20} width="60%" /></td>
                                        <td className="px-6 py-4"><Skeleton height={20} width="60%" /></td>
                                        <td className="px-6 py-4"><Skeleton height={24} width="80px" borderRadius="12px" /></td>
                                        {currentUser?.role === 'admin' && (
                                            <td className="px-6 py-4"><Skeleton height={20} width="50%" /></td>
                                        )}
                                        <td className="px-6 py-4 flex justify-end gap-2 text-right">
                                            <Skeleton height={28} width="50px" borderRadius="8px" />
                                            <Skeleton height={28} width="60px" borderRadius="8px" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                leads.map((lead, idx) => (
                                    <tr key={lead.id}
                                        className="transition-colors hover:bg-[var(--bg-secondary)]"
                                        style={{ borderBottom: idx < leads.length - 1 ? '1px solid var(--border-subtle)' : 'none', animationDelay: `${idx * 30}ms` }}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-[var(--text-primary)]">{lead.company_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{lead.contact_name}</td>
                                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{lead.email}</td>
                                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)] capitalize">{lead.source || '—'}</td>
                                        <td className="px-6 py-4">
                                            {getExpirationBadge(lead)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                                                style={{ background: statusColors[lead.status]?.bg, color: statusColors[lead.status]?.text }}>
                                                <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ background: statusColors[lead.status]?.dot }}></span>
                                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                            </span>
                                        </td>
                                        {currentUser?.role === 'admin' && (
                                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{lead.creator?.name || '—'}</td>
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
                                        </td>
                                    </tr>
                                ))
                            )}
                            {!leadsLoading && leads.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center text-[var(--text-secondary)]">
                                        <div className="mb-3 flex justify-center"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg></div>
                                        <p className="font-medium">No leads found</p>
                                        <p className="text-sm mt-1">Try adjusting your filters or add a new lead</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!leadsLoading && leadsPagination.last_page > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Showing {leads.length} of {leadsPagination.total} leads
                    </p>
                    <div className="flex items-center space-x-1">
                        {getPaginationGroup(leadsPagination.current_page, leadsPagination.last_page).map((page, i) => (
                            typeof page === 'number' ? (
                                <button key={i} onClick={() => handlePageChange(page)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${page === leadsPagination.current_page
                                        ? 'text-white font-semibold'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                        }`}
                                    style={page === leadsPagination.current_page ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                                    {page}
                                </button>
                            ) : (
                                <span key={i} className="px-2 py-1.5 text-[var(--text-secondary)]">...</span>
                            )
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
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                            {confirmAction?.type === 'delete' ? 'Delete Lead' : 'Convert Lead'}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">
                            {confirmAction?.type === 'delete'
                                ? `Are you sure you want to delete "${confirmAction?.lead.company_name}"? This action can be undone.`
                                : `Convert "${confirmAction?.lead.company_name}" to a customer? This will create a new customer record.`}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setConfirmAction(null)}
                                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] rounded-xl hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all">
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
