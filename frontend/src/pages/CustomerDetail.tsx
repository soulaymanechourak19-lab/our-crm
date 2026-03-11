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
    const [activeTab, setActiveTab] = useState<'info' | 'interactions' | 'ml'>('info');
    const [interactions, setInteractions] = useState<any[]>([]);
    const [interactionsPagination, setInteractionsPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
    const [loadingInteractions, setLoadingInteractions] = useState(false);

    // ML Data State
    const [mlInsights, setMlInsights] = useState<any>(null);
    const [loadingML, setLoadingML] = useState(false);

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

    const loadMLInsights = async (customerId: number) => {
        setLoadingML(true);
        try {
            // Fetch churn and segmentation from Laravel which proxies to ml-service
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fire three requests in parallel using native fetch since apiCall isn't in scope
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
            const [churnRes, segRes, recRes] = await Promise.all([
                fetch(`${baseUrl}/ml/churn/${customerId}`, { method: 'POST', headers }),
                fetch(`${baseUrl}/ml/segment/${customerId}`, { method: 'POST', headers }),
                fetch(`${baseUrl}/ml/recommend/${customerId}`, { method: 'POST', headers })
            ]);
            
            const churnData = await churnRes.json();
            const segData = await segRes.json();
            const recData = await recRes.json();
            
            setMlInsights({ 
                churn: churnData, 
                segment: segData,
                recommendations: recData.recommendations || []
            });
        } catch (err) {
            console.error("Failed to load ML insights:", err);
            setMlInsights(null); // Clear insights on error
        } finally {
            setLoadingML(false);
        }
    };

    useEffect(() => {
        if (id && activeTab === 'ml') {
            loadMLInsights(id);
        }
    }, [id, activeTab]);

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
                <button onClick={() => setActiveTab('ml')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'ml' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    style={activeTab === 'ml' ? { background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.2))' } : {}}>
                    🧠 ML Insights
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

            {/* ML Insights tab */}
            {activeTab === 'ml' && (
                <div className="glass-card p-6 animate-slide-in" style={{ border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-purple-500/20 text-purple-400">
                            🧠
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">AI Assistant Insights</h2>
                            <p className="text-xs text-slate-400">Powered by Machine Learning</p>
                        </div>
                    </div>

                    {loadingML ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : mlInsights ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Churn Risk Card */}
                            <div className="p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🏃</div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Churn Probability</h3>
                                    
                                    <div className="flex items-end gap-3 mb-2">
                                        <span className="text-4xl font-bold text-white">
                                            {mlInsights.churn?.probability !== undefined 
                                                ? Math.round(mlInsights.churn.probability * 100) 
                                                : mlInsights.churn?.churn_risk_score !== undefined 
                                                    ? Math.round(mlInsights.churn.churn_risk_score) 
                                                    : 0}%
                                        </span>
                                        <span className={`text-sm font-medium px-2.5 py-1 rounded-lg mb-1 ${
                                            (mlInsights.churn?.risk_level === 'high' || mlInsights.churn?.churn_risk_label === 'High') ? 'bg-red-500/20 text-red-400' :
                                            (mlInsights.churn?.risk_level === 'medium' || mlInsights.churn?.churn_risk_label === 'Medium') ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                            {mlInsights.churn?.risk_level || mlInsights.churn?.churn_risk_label || 'Low'} Risk
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-4">
                                    <div className="h-full rounded-full transition-all duration-1000" 
                                         style={{ 
                                             width: `${mlInsights.churn?.probability ? mlInsights.churn.probability * 100 : mlInsights.churn?.churn_risk_score || 0}%`,
                                             background: (mlInsights.churn?.risk_level === 'high' || mlInsights.churn?.churn_risk_label === 'High') ? '#ef4444' :
                                                         (mlInsights.churn?.risk_level === 'medium' || mlInsights.churn?.churn_risk_label === 'Medium') ? '#f97316' : '#10b981'
                                         }}>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Segmentation Card */}
                            <div className="p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🎯</div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">AI Customer Segment</h3>
                                    
                                    <div className="mt-2 text-center py-4">
                                        <h4 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                                            {mlInsights.segment?.segment || mlInsights.segment?.ml_segment || 'Unknown Segment'}
                                        </h4>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-4 text-center">
                                    Based on K-Means clustering of RFM behavior and engagement metrics.
                                </p>
                            </div>
                            
                            {/* Product Recommendations Card (Full Width) */}
                            <div className="md:col-span-2 p-5 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                                    ✨ Suggested Products
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    Predicted using Neural Collaborative Filtering based on purchase history.
                                </p>
                                
                                {mlInsights.recommendations && mlInsights.recommendations.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {mlInsights.recommendations.map((rec: any, idx: number) => (
                                            <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-colors flex flex-col items-center text-center">
                                                <div className="text-2xl mb-2">📦</div>
                                                <p className="text-sm font-semibold text-white truncate w-full">Product {rec.product_id}</p>
                                                <p className="text-xs text-purple-400 mt-1">Match: {Math.min(99, Math.round(rec.score * 100))}%</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-500 text-sm">
                                        Not enough data for recommendations.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-slate-400">No AI insights available for this customer.</p>
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
