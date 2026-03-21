import React, { useState, useEffect, useCallback } from 'react';
import { useCRM } from '../context/CRMContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';
import { Quotation } from '../services/quotationService';
import Skeleton from '../components/common/Skeleton';
import QuotationFormModal from '../components/quotes/QuotationFormModal';
// Trigger rebuild

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'rgba(107, 114, 128, 0.1)', text: '#9ca3af', dot: '#6b7280' },
    sent: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', dot: '#3b82f6' },
    accepted: { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', dot: '#10b981' },
    rejected: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', dot: '#dc2626' },
    expired: { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', dot: '#f59e0b' },
    converted: { bg: 'rgba(139, 92, 246, 0.1)', text: '#a78bfa', dot: '#8b5cf6' },
};

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

const Quotations: React.FC = () => {
    const { formatCurrency } = useCurrency();
    const {
        quotations: crmQuotations, quotationsPagination, quotationsLoading,
        fetchQuotations, currentUser
    } = useCRM();

    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const loadQuotations = useCallback(() => {
        fetchQuotations(1, { status: statusFilter, search });
    }, [fetchQuotations, statusFilter, search]);

    useEffect(() => {
        loadQuotations();
    }, [loadQuotations]);

    const handleSearch = (value: string) => setSearch(value);
    const handleStatusFilter = (value: string) => setStatusFilter(value);

    const handlePageChange = (page: number) => {
        fetchQuotations(page, { status: statusFilter, search });
    };

    const handleEdit = (quotation: Quotation) => {
        setEditingQuotation(quotation);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingQuotation(null);
        // loadQuotations(); // The form should call fetchQuotations inside
    };

    return (
        <div className="animate-fade-in">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <button onClick={() => { setEditingQuotation(null); setShowForm(true); }}
                        className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 w-full md:w-auto"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        + Create Quotation
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
                    <input
                        placeholder="Search by number or title..."
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
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                    <option value="converted">Converted</option>
                </select>
            </div>

            {/* Content Table */}
            <div className="glass-card overflow-hidden animate-slide-in flex-1 h-full min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Client</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Valid Until</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotationsLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skel-${i}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td className="px-6 py-4"><Skeleton height={20} width="80px" borderRadius="6px" /></td>
                                        <td className="px-6 py-4"><Skeleton height={20} width="60%" /></td>
                                        <td className="px-6 py-4"><Skeleton height={20} width="70%" /></td>
                                        <td className="px-6 py-4"><Skeleton height={20} width="40%" /></td>
                                        <td className="px-6 py-4"><Skeleton height={24} width="80px" borderRadius="12px" /></td>
                                        <td className="px-6 py-4"><Skeleton height={20} width="50%" /></td>
                                        <td className="px-6 py-4 flex justify-end gap-2 text-right">
                                            <Skeleton height={28} width="60px" borderRadius="8px" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                quotations.map((quote, idx) => (
                                    <tr key={quote.id}
                                        className="transition-colors hover:bg-[var(--bg-secondary)]"
                                        style={{ borderBottom: idx < quotations.length - 1 ? '1px solid var(--border-subtle)' : 'none', animationDelay: `${idx * 30}ms` }}>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-mono font-bold text-[var(--text-primary)] tracking-widest bg-[var(--bg-card)] px-2 py-1 rounded inline-block border-[var(--border-subtle)] border">
                                                {quote.number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-[var(--text-primary)]">{quote.title}</div>
                                            {quote.description && <div className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{quote.description}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                                            {quote.customer ? quote.customer.name : quote.lead?.company_name || '—'}
                                            {quote.customer ? <span className="ml-2 text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">Customer</span> : <span className="ml-2 text-[10px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">Lead</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(quote.total)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                                                style={{ background: statusColors[quote.status]?.bg, color: statusColors[quote.status]?.text }}>
                                                <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ background: statusColors[quote.status]?.dot }}></span>
                                                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {quote.valid_until ? (
                                                <span className={`text-sm ${new Date(quote.valid_until) < new Date() && quote.status === 'sent' ? 'text-red-400 font-medium' : 'text-[var(--text-secondary)]'}`}>
                                                    {new Date(quote.valid_until).toLocaleDateString()}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEdit(quote)}
                                                className="px-3 py-1.5 text-xs font-medium text-indigo-400 rounded-lg transition-all hover:bg-indigo-500/10">
                                                View / Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {!quotationsLoading && quotations.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-[var(--text-secondary)]">
                                        <div className="mb-3 flex justify-center"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div>
                                        <p className="font-medium">No quotations found</p>
                                        <p className="text-sm mt-1">Try adjusting your filters or create a new quotation</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {!quotationsLoading && quotationsPagination.last_page > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Showing {quotations.length} of {quotationsPagination.total} quotations
                    </p>
                    <div className="flex items-center space-x-1">
                        {getPaginationGroup(quotationsPagination.current_page, quotationsPagination.last_page).map((page, i) => (
                            typeof page === 'number' ? (
                                <button key={i} onClick={() => handlePageChange(page)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${page === quotationsPagination.current_page
                                        ? 'text-white font-semibold'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                        }`}
                                    style={page === quotationsPagination.current_page ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                                    {page}
                                </button>
                            ) : (
                                <span key={i} className="px-2 py-1.5 text-[var(--text-secondary)]">...</span>
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && <QuotationFormModal quotation={editingQuotation} onClose={handleFormClose} />}
        </div>
    );
};

export default Quotations;
