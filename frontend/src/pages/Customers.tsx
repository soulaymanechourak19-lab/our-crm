import React, { useState, useEffect, useCallback } from 'react';
import { useCRM } from '../context/CRMContext';
import LoyaltyBadge from '../components/customers/LoyaltyBadge';

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

const Customers: React.FC = () => {
    const {
        customers, customersPagination, customersLoading,
        fetchCustomers, deleteCustomer, currentUser
    } = useCRM();
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    const { addCustomer } = useCRM();

    const loadCustomers = useCallback(() => {
        fetchCustomers(1, { search, tier: tierFilter, per_page: pageSize });
    }, [fetchCustomers, search, tierFilter, pageSize]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const handlePageChange = (page: number) => {
        fetchCustomers(page, { search, tier: tierFilter, per_page: pageSize });
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await addCustomer(newCustomer);
        if (success) {
            setShowAddForm(false);
            setNewCustomer({ name: '', email: '', phone: '', address: '' });
        }
    };

    const handleDelete = async () => {
        if (confirmDelete) {
            const success = await deleteCustomer(confirmDelete);
            if (success) {
                setConfirmDelete(null);
            }
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Toolbar */}
            <div className="flex justify-end mb-6">
                {currentUser?.role === 'admin' && (
                    <button onClick={() => setShowAddForm(true)}
                        className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        + Add Customer
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">🔍</span>
                    <input
                        placeholder="Search by name or email..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border-0 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                    value={tierFilter}
                    onChange={e => setTierFilter(e.target.value)}
                >
                    <option value="">All Tiers</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                </select>
            </div>

            {/* Loading */}
            {customersLoading && (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Table */}
            {!customersLoading && (
                <div className="glass-card overflow-hidden animate-slide-in">
                    <div className="overflow-x-auto">
                        <table className="min-w-full whitespace-nowrap">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">AI Segment</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Churn Risk</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Tier</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer, idx) => (
                                    <tr key={customer.id}
                                        className="transition-colors hover:bg-[var(--bg-secondary)]"
                                        style={{ borderBottom: idx < customers.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-[var(--text-primary)]">{customer.name}</div>
                                            {customer.converted_from_lead_id && (
                                                <div className="text-xs text-[var(--text-muted)] mt-0.5">From Lead #{customer.converted_from_lead_id}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{customer.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full ${
                                                (customer as any).segment === 'VIP' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                (customer as any).segment === 'Nouveau' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                (customer as any).segment === 'Occasionnel' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                'bg-slate-500/10 text-[var(--text-secondary)] border border-slate-500/20'
                                            }`}>
                                                {(customer as any).segment || 'Standard'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Dynamic Churn Risk mockup (since live churn is per-customer fetch, we derive a mock score proportional to loyalty/segment for the list view or use the DB segment) */}
                                            <div className="flex items-center space-x-2">
                                                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                                                    <div className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.max(10, 100 - (customer.loyalty_score / 5))}%`,
                                                            background: (100 - (customer.loyalty_score / 5)) >= 60 ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                                                : (100 - (customer.loyalty_score / 5)) >= 30 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                                                    : 'linear-gradient(90deg, #10b981, #34d399)',
                                                        }} />
                                                </div>
                                                <span className={`text-xs font-bold ${
                                                    (100 - (customer.loyalty_score / 5)) >= 60 ? 'text-red-400' :
                                                    (100 - (customer.loyalty_score / 5)) >= 30 ? 'text-amber-400' : 'text-emerald-400'
                                                }`}>
                                                    {Math.round(Math.max(5, 100 - (customer.loyalty_score / 5)))}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <LoyaltyBadge tier={customer.tier || 'Bronze'} score={customer.loyalty_score} />
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <a href={`#/customers/${customer.id}`}
                                                className="px-3 py-1.5 text-xs font-medium text-indigo-400 rounded-lg transition-all hover:bg-indigo-500/10 inline-block">
                                                View
                                            </a>
                                            {currentUser?.role === 'admin' && (
                                                <button onClick={() => setConfirmDelete(customer.id)}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-400 rounded-lg transition-all hover:bg-red-500/10">
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {customers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-[var(--text-secondary)]">
                                            <div className="text-4xl mb-3">👥</div>
                                            <p className="font-medium">No customers found</p>
                                            <p className="text-sm mt-1">Try adjusting your search or convert a lead</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!customersLoading && customersPagination.total > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                    <div className="flex items-center space-x-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Showing {customers.length} of {customersPagination.total} customers
                        </p>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm text-[var(--text-secondary)]">Rows per page:</label>
                            <select
                                className="text-sm rounded border-0 text-[var(--text-secondary)] outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/50 py-1 px-2"
                                style={{ background: 'var(--bg-secondary)' }}
                                value={pageSize}
                                onChange={e => setPageSize(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                    {customersPagination.last_page > 1 && (
                        <div className="flex items-center space-x-1">
                            {getPaginationGroup(customersPagination.current_page, customersPagination.last_page).map((page, i) => (
                                typeof page === 'number' ? (
                                    <button key={i} onClick={() => handlePageChange(page)}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${page === customersPagination.current_page
                                            ? 'text-white font-semibold'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                            }`}
                                        style={page === customersPagination.current_page ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                                        {page}
                                    </button>
                                ) : (
                                    <span key={i} className="px-2 py-1.5 text-[var(--text-secondary)]">...</span>
                                )
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Customer Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card p-6 w-full max-w-md mx-4 animate-slide-in">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">Add New Customer</h2>
                        <form onSubmit={handleAddCustomer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Full Name *</label>
                                <input required className="w-full px-4 py-2.5 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                                    value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email *</label>
                                <input required type="email" className="w-full px-4 py-2.5 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                                    value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Phone</label>
                                <input className="w-full px-4 py-2.5 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                                    value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Address</label>
                                <textarea rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                                    value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] rounded-xl hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white rounded-xl"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                    Create Customer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card p-6 w-full max-w-sm mx-4 animate-slide-in">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Customer</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">Are you sure? This action can be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] rounded-xl hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600 transition-all">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
