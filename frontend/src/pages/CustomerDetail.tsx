import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import LoyaltyBadge from '../components/customers/LoyaltyBadge';
import InteractionForm from '../components/customers/InteractionForm';

const typeIcons: Record<string, string> = {
    call: '📞',
    email: '📧',
    meeting: '👥',
};

const typeColors: Record<string, { bg: string; border: string }> = {
    call: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' },
    email: { bg: 'rgba(139, 92, 246, 0.1)', border: '#8b5cf6' },
    meeting: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
};

const CustomerDetail: React.FC = () => {
    const { selectedCustomer, fetchCustomerDetail, fetchInteractions, currentUser } = useCRM();
    const [showInteractionForm, setShowInteractionForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'interactions'>('info');
    const [interactions, setInteractions] = useState<any[]>([]);
    const [interactionsPagination, setInteractionsPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
    const [loadingInteractions, setLoadingInteractions] = useState(false);

    const id = parseInt(window.location.hash.split('/').pop() || '0');

    useEffect(() => {
        if (id) {
            fetchCustomerDetail(id);
        }
    }, [id, fetchCustomerDetail]);

    useEffect(() => {
        if (id && activeTab === 'interactions') {
            loadInteractions(1);
        }
    }, [id, activeTab]);

    const loadInteractions = async (page: number) => {
        setLoadingInteractions(true);
        try {
            const result = await fetchInteractions(id, page);
            setInteractions(result.data);
            setInteractionsPagination(result.meta);
        } catch { }
        setLoadingInteractions(false);
    };

    const handleInteractionAdded = () => {
        setShowInteractionForm(false);
        fetchCustomerDetail(id);
        if (activeTab === 'interactions') {
            loadInteractions(1);
        }
    };

    const customer = selectedCustomer;

    if (!customer) {
        return (
            <div className="p-6 lg:p-8 flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const loyaltyPercent = Math.min(customer.loyalty_score, 100);
    const tierGradient = customer.tier === 'Gold' ? 'linear-gradient(135deg, #f59e0b, #eab308)'
        : customer.tier === 'Silver' ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
            : 'linear-gradient(135deg, #a16207, #ca8a04)';

    return (
        <div className="p-6 lg:p-8 animate-fade-in max-w-5xl mx-auto">
            {/* Back link */}
            <a href="#/customers" className="inline-flex items-center text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-6">
                ← Back to Customers
            </a>

            {/* Customer header card */}
            <div className="glass-card overflow-hidden mb-6 animate-slide-in">
                <div className="h-1.5" style={{ background: tierGradient }}></div>
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                                style={{ background: tierGradient }}>
                                {customer.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
                                <p className="text-slate-400">{customer.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <LoyaltyBadge tier={customer.tier || 'Bronze'} score={customer.loyalty_score} />
                            {(currentUser?.role === 'admin' || currentUser?.role === 'agent_sav') && (
                                <button onClick={() => setShowInteractionForm(true)}
                                    className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                    + Log Interaction
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Loyalty progress */}
                    <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-slate-400">Loyalty Progress</span>
                            <span className="text-xs font-semibold" style={{ color: customer.tier === 'Gold' ? '#eab308' : customer.tier === 'Silver' ? '#94a3b8' : '#ca8a04' }}>
                                {customer.loyalty_score} / 100
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(148, 163, 184, 0.1)' }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${loyaltyPercent}%`, background: tierGradient }}></div>
                        </div>
                        <div className="flex justify-between mt-1.5">
                            <span className="text-[10px] text-slate-500">Bronze (0-30)</span>
                            <span className="text-[10px] text-slate-500">Silver (31-70)</span>
                            <span className="text-[10px] text-slate-500">Gold (71-100)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <button onClick={() => setActiveTab('info')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'info' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    style={activeTab === 'info' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}>
                    ℹ️ Info
                </button>
                <button onClick={() => setActiveTab('interactions')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'interactions' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    style={activeTab === 'interactions' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}>
                    💬 Interactions
                </button>
            </div>

            {/* Info tab */}
            {activeTab === 'info' && (
                <div className="glass-card p-6 animate-slide-in">
                    <h2 className="text-lg font-bold text-white mb-4">Customer Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                            <span className="text-xs font-medium text-slate-500 uppercase">Phone</span>
                            <p className="text-sm text-white mt-1">{customer.phone || 'Not provided'}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                            <span className="text-xs font-medium text-slate-500 uppercase">Address</span>
                            <p className="text-sm text-white mt-1">{customer.address || 'Not provided'}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                            <span className="text-xs font-medium text-slate-500 uppercase">Loyalty Tier</span>
                            <p className="text-sm text-white mt-1">{customer.tier || 'Bronze'}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
                            <span className="text-xs font-medium text-slate-500 uppercase">Converted From Lead</span>
                            <p className="text-sm text-white mt-1">
                                {customer.converted_from_lead_id
                                    ? <span className="text-indigo-400">Lead #{customer.converted_from_lead_id}</span>
                                    : 'Direct customer'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactions tab */}
            {activeTab === 'interactions' && (
                <div className="glass-card p-6 animate-slide-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-white">Interaction Timeline</h2>
                        <span className="text-xs text-slate-400">{interactionsPagination.total} total</span>
                    </div>

                    {loadingInteractions ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : interactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <div className="text-4xl mb-3">💬</div>
                            <p className="font-medium">No interactions yet</p>
                            <p className="text-sm mt-1">Log a call, email, or meeting</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {interactions.map((interaction: any, idx: number) => (
                                <div key={interaction.id || idx}
                                    className="flex items-start space-x-4 p-4 rounded-xl transition-all hover:bg-white/[0.02]"
                                    style={{ background: typeColors[interaction.type]?.bg, border: `1px solid ${typeColors[interaction.type]?.border}20` }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                        style={{ background: `${typeColors[interaction.type]?.border}20` }}>
                                        {typeIcons[interaction.type] || '📝'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-semibold text-white capitalize">{interaction.type}</span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(interaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-300">{interaction.notes}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Interactions pagination */}
                    {interactionsPagination.last_page > 1 && (
                        <div className="flex justify-center mt-6 space-x-1">
                            {Array.from({ length: interactionsPagination.last_page }, (_, i) => i + 1).map(page => (
                                <button key={page} onClick={() => loadInteractions(page)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${page === interactionsPagination.current_page
                                        ? 'text-white font-semibold'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    style={page === interactionsPagination.current_page ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Interaction Form Modal */}
            {showInteractionForm && (
                <InteractionForm customerId={customer.id} onClose={handleInteractionAdded} />
            )}
        </div>
    );
};

export default CustomerDetail;
