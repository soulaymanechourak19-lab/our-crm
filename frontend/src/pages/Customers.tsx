import React, { useState, useEffect, useCallback } from 'react';
import { useCRM } from '../context/CRMContext';
import LoyaltyBadge from '../components/customers/LoyaltyBadge';

const Customers: React.FC = () => {
    const {
        customers, customersPagination, customersLoading,
        fetchCustomers, deleteCustomer, currentUser
    } = useCRM();
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    const { addCustomer } = useCRM();

    const loadCustomers = useCallback(() => {
        fetchCustomers(1, { search, tier: tierFilter });
    }, [fetchCustomers, search, tierFilter]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const handlePageChange = (page: number) => {
        fetchCustomers(page, { search, tier: tierFilter });
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                        placeholder="Search by name or email..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border-0 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(148, 163, 184, 0.1)' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2.5 rounded-xl text-sm text-slate-300 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(148, 163, 184, 0.1)' }}
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
                    <table className="min-w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Loyalty</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tier</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer, idx) => (
                                <tr key={customer.id}
                                    className="transition-colors hover:bg-white/[0.02]"
                                    style={{ borderBottom: idx < customers.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none' }}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-white">{customer.name}</div>
                                        {customer.converted_from_lead_id && (
                                            <div className="text-xs text-slate-500 mt-0.5">From Lead #{customer.converted_from_lead_id}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{customer.email}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{customer.phone || '—'}</td>
                                    <td className="px-6 py-4">
                                        {/* Loyalty progress bar */}
                                        <div className="flex items-center space-x-2">
                                            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148, 163, 184, 0.15)' }}>
                                                <div className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(customer.loyalty_score, 100)}%`,
                                                        background: customer.loyalty_score >= 71 ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                                                            : customer.loyalty_score >= 31 ? 'linear-gradient(90deg, #94a3b8, #cbd5e1)'
                                                                : 'linear-gradient(90deg, #a16207, #ca8a04)',
                                                    }} />
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">{customer.loyalty_score}</span>
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
                                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                        <div className="text-4xl mb-3">👥</div>
                                        <p className="font-medium">No customers found</p>
                                        <p className="text-sm mt-1">Try adjusting your search or convert a lead</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!customersLoading && customersPagination.last_page > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-slate-400">
                        Showing {customers.length} of {customersPagination.total} customers
                    </p>
                    <div className="flex space-x-1">
                        {Array.from({ length: customersPagination.last_page }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => handlePageChange(page)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${page === customersPagination.current_page
                                    ? 'text-white font-semibold'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                style={page === customersPagination.current_page ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Customer Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card p-6 w-full max-w-md mx-4 animate-slide-in">
                        <h2 className="text-xl font-bold text-white mb-5">Add New Customer</h2>
                        <form onSubmit={handleAddCustomer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name *</label>
                                <input required className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)' }}
                                    value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email *</label>
                                <input required type="email" className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)' }}
                                    value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone</label>
                                <input className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)' }}
                                    value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Address</label>
                                <textarea rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                    style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)' }}
                                    value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-400 rounded-xl hover:text-white hover:bg-white/5 transition-all">
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
                        <h3 className="text-lg font-bold text-white mb-2">Delete Customer</h3>
                        <p className="text-sm text-slate-400 mb-6">Are you sure? This action can be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-400 rounded-xl hover:text-white hover:bg-white/5 transition-all">
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
