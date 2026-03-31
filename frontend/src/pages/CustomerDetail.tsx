import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { useCurrency } from '../context/CurrencyContext';
import { discountService, CustomerDiscount } from '../services/discountService';
import LoyaltyBadge from '../components/customers/LoyaltyBadge';
import InteractionForm from '../components/customers/InteractionForm';
import { ticketService, Ticket } from '../services/ticketService';

/* ── Inline SVG icons (matching sidebar Lucide/Feather style) ── */
const svgIcon = {
    phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
    email: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
    meeting: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
    chat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    brain: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.14.35 2.2.94 3.08A5.5 5.5 0 0 0 7 18.5V22h4v-3.5" /><path d="M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.14-.35 2.2-.94 3.08A5.5 5.5 0 0 1 17 18.5V22h-4v-3.5" /><path d="M8 10h8" /><path d="M9 14h6" /></svg>,
    tag: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
    note: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    trendUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    sparkle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" /></svg>,
    product: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
    ticket: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2" /><path d="M15 11v2" /><path d="M15 17v2" /><path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" /></svg>,
};

const typeIcons: Record<string, React.ReactNode> = {
    call: svgIcon.phone,
    email: svgIcon.email,
    meeting: svgIcon.meeting,
};

const typeColors: Record<string, { bg: string; border: string }> = {
    call: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' },
    email: { bg: 'rgba(139, 92, 246, 0.1)', border: '#8b5cf6' },
    meeting: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
};

const CustomerDetail: React.FC = () => {
    const { selectedCustomer, fetchCustomerDetail, fetchInteractions, currentUser } = useCRM();
    const { formatCurrency } = useCurrency();
    const [showInteractionForm, setShowInteractionForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'interactions' | 'ml' | 'discounts' | 'tickets'>('info');
    const [interactions, setInteractions] = useState<any[]>([]);
    const [interactionsPagination, setInteractionsPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
    const [loadingInteractions, setLoadingInteractions] = useState(false);

    // ML Data State
    const [mlInsights, setMlInsights] = useState<any>(null);
    const [loadingML, setLoadingML] = useState(false);

    // Discounts State
    const [customerDiscounts, setCustomerDiscounts] = useState<CustomerDiscount[]>([]);
    const [loadingDiscounts, setLoadingDiscounts] = useState(false);

    // Tickets State
    const [customerTickets, setCustomerTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, activeTab]);

    // Load tickets when tab is active
    useEffect(() => {
        if (id && activeTab === 'tickets') {
            setLoadingTickets(true);
            ticketService.getCustomerTickets(id)
                .then(setCustomerTickets)
                .catch(() => setCustomerTickets([]))
                .finally(() => setLoadingTickets(false));
        }
    }, [id, activeTab]);

    useEffect(() => {
        if (id && activeTab === 'discounts') {
            loadCustomerDiscounts(id);
        }
    }, [id, activeTab]);

    const loadCustomerDiscounts = async (customerId: number) => {
        setLoadingDiscounts(true);
        try {
            const data = await discountService.getCustomerDiscounts(customerId);
            setCustomerDiscounts(data);
        } catch (err) {
            console.error("Failed to load customer discounts", err);
        } finally {
            setLoadingDiscounts(false);
        }
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
            <a href="#/customers" className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-indigo-400 transition-colors mb-6">
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
                                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{customer.name}</h1>
                                <p className="text-[var(--text-secondary)]">{customer.email}</p>
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
                    <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-[var(--text-secondary)]">Loyalty Progress</span>
                            <span className="text-xs font-semibold" style={{ color: customer.tier === 'Gold' ? '#eab308' : customer.tier === 'Silver' ? '#94a3b8' : '#ca8a04' }}>
                                {customer.loyalty_score} / 100
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${loyaltyPercent}%`, background: tierGradient }}></div>
                        </div>
                        <div className="flex justify-between mt-1.5">
                            <span className="text-[10px] text-[var(--text-muted)]">Bronze (0-30)</span>
                            <span className="text-[10px] text-[var(--text-muted)]">Silver (31-70)</span>
                            <span className="text-[10px] text-[var(--text-muted)]">Gold (71-100)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <button onClick={() => setActiveTab('info')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'info' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    style={activeTab === 'info' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}>
                    <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: '4px' }}>{svgIcon.info}</span> Info
                </button>
                <button onClick={() => setActiveTab('interactions')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'interactions' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    style={activeTab === 'interactions' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}>
                    <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: '4px' }}>{svgIcon.chat}</span> Interactions
                </button>
                <button onClick={() => setActiveTab('ml')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'ml' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    style={activeTab === 'ml' ? { background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.2))' } : {}}>
                    <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: '4px' }}>{svgIcon.brain}</span> ML Insights
                </button>
                <button onClick={() => setActiveTab('discounts')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'discounts' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    style={activeTab === 'discounts' ? { background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.2))' } : {}}>
                    <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: '4px' }}>{svgIcon.tag}</span> Discounts
                </button>
                <button onClick={() => setActiveTab('tickets')}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'tickets' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    style={activeTab === 'tickets' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}>
                    <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: '4px' }}>{svgIcon.ticket}</span> Tickets
                </button>
            </div>

            {/* Info tab */}
            {activeTab === 'info' && (
                <div className="glass-card p-6 animate-slide-in">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Customer Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase">Phone</span>
                            <p className="text-sm text-[var(--text-primary)] mt-1">{customer.phone || 'Not provided'}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase">Address</span>
                            <p className="text-sm text-[var(--text-primary)] mt-1">{customer.address || 'Not provided'}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase">Loyalty Tier</span>
                            <p className="text-sm text-[var(--text-primary)] mt-1">{customer.tier || 'Bronze'}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase">Converted From Lead</span>
                            <p className="text-sm text-[var(--text-primary)] mt-1">
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
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Interaction Timeline</h2>
                        <span className="text-xs text-[var(--text-secondary)]">{interactionsPagination.total} total</span>
                    </div>

                    {loadingInteractions ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : interactions.length === 0 ? (
                        <div className="text-center py-12 text-[var(--text-muted)]">
                            <div className="mb-3 flex justify-center"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div>
                            <p className="font-medium">No interactions yet</p>
                            <p className="text-sm mt-1">Log a call, email, or meeting</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {interactions.map((interaction: any, idx: number) => (
                                <div key={interaction.id || idx}
                                    className="flex items-start space-x-4 p-4 rounded-xl transition-all hover:bg-[var(--bg-secondary)]"
                                    style={{ background: typeColors[interaction.type]?.bg, border: `1px solid ${typeColors[interaction.type]?.border}20` }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                        style={{ background: `${typeColors[interaction.type]?.border}20` }}>
                                        {typeIcons[interaction.type] || svgIcon.note}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">{interaction.type}</span>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {new Date(interaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)]">{interaction.notes}</p>
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
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
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
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/20 text-purple-400">
                            {svgIcon.brain}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">AI Assistant Insights</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Powered by Machine Learning</p>
                        </div>
                    </div>

                    {loadingML ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : mlInsights ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Churn Risk Card */}
                            <div className="p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                <div className="absolute top-0 right-0 p-4 opacity-10"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">Churn Probability</h3>
                                    
                                    <div className="flex items-end gap-3 mb-2">
                                        <span className="text-4xl font-bold text-[var(--text-primary)]">
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
                                <div className="w-full h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden mt-4">
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
                            <div className="p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                <div className="absolute top-0 right-0 p-4 opacity-10"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">AI Customer Segment</h3>
                                    
                                    <div className="mt-2 text-center py-4">
                                        <h4 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                                            {mlInsights.segment?.segment || mlInsights.segment?.ml_segment || 'Unknown Segment'}
                                        </h4>
                                    </div>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
                                    Based on K-Means clustering of RFM behavior and engagement metrics.
                                </p>
                            </div>
                            
                            {/* Product Recommendations Card (Full Width) */}
                            <div className="md:col-span-2 p-5 rounded-2xl relative overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider flex items-center gap-2">
                                    {svgIcon.sparkle} Suggested Products
                                </h3>
                                <p className="text-xs text-[var(--text-muted)] mb-4">
                                    Predicted using Neural Collaborative Filtering based on purchase history.
                                </p>
                                
                                {mlInsights.recommendations && mlInsights.recommendations.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {mlInsights.recommendations.map((rec: any, idx: number) => (
                                            <div key={idx} className="p-3 rounded-xl border hover:border-purple-500/50 transition-colors flex flex-col items-center text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                                                <div className="mb-2 flex justify-center">{svgIcon.product}</div>
                                                <p className="text-sm font-semibold text-[var(--text-primary)] truncate w-full">Product {rec.product_id}</p>
                                                <p className="text-xs text-purple-400 mt-1">Match: {Math.min(99, Math.round(rec.score * 100))}%</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-[var(--text-muted)] text-sm">
                                        Not enough data for recommendations.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-[var(--text-secondary)]">No AI insights available for this customer.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Discounts tab */}
            {activeTab === 'discounts' && (
                <div className="glass-card p-6 animate-slide-in">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Customer Discounts</h2>
                    
                    {loadingDiscounts ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : customerDiscounts.length === 0 ? (
                        <div className="text-center py-12 text-[var(--text-muted)]">
                            <div className="mb-3 flex justify-center"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg></div>
                            <p className="font-medium">No discounts available</p>
                            <p className="text-sm mt-1">This customer doesn't have any assigned discounts.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {customerDiscounts.map((cd, idx) => (
                                <div key={idx} className="p-4 rounded-xl relative overflow-hidden flex flex-col justify-between" 
                                     style={{ 
                                         background: 'var(--bg-secondary)', 
                                         border: `1px solid ${cd.applied_at ? 'var(--border-subtle)' : 'rgba(16, 185, 129, 0.3)'}`,
                                         opacity: cd.applied_at ? 0.7 : 1
                                     }}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-lg font-bold text-[var(--text-primary)] tracking-widest bg-[var(--bg-card)] px-2 py-1 rounded inline-block border-[var(--border-subtle)] border print:border-none">
                                                {cd.discount?.code}
                                            </span>
                                            <p className="text-xs text-[var(--text-secondary)] mt-2">
                                                {cd.discount?.description || `${cd.discount?.type === 'percentage' ? cd.discount?.value + '%' : '$' + cd.discount?.value} off`}
                                            </p>
                                        </div>
                                        {cd.applied_at ? (
                                            <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full">
                                                Used
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                                Available
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3 mt-2 flex justify-between">
                                        <span>Added: {new Date(cd.created_at).toLocaleDateString()}</span>
                                        {cd.applied_at && <span>Used: {new Date(cd.applied_at).toLocaleDateString()}</span>}
                                        {cd.discount?.expires_at && !cd.applied_at && (
                                            <span className={new Date(cd.discount.expires_at) < new Date() ? 'text-red-400' : ''}>
                                                Expires: {new Date(cd.discount.expires_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Interaction Form Modal */}
            {showInteractionForm && (
                <InteractionForm customerId={customer.id} onClose={handleInteractionAdded} />
            )}

            {/* Tickets tab */}
            {activeTab === 'tickets' && (
                <div className="glass-card p-6 animate-slide-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-[var(--text-primary)]"><span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: '6px' }}>{svgIcon.ticket}</span>Support Tickets</h2>
                        <a href="#/tickets" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Voir tous →</a>
                    </div>
                    {loadingTickets ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : customerTickets.length === 0 ? (
                        <div className="text-center py-12 text-[var(--text-muted)]">
                            <div className="text-4xl mb-3 flex justify-center"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2" /><path d="M15 11v2" /><path d="M15 17v2" /><path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" /></svg></div>
                            <p className="font-medium">Aucun ticket pour ce client</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {customerTickets.map((ticket) => {
                                const statusColors: Record<string, string> = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280' };
                                const statusLabels: Record<string, string> = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé' };
                                const prioColors: Record<string, string> = { low: '#6b7280', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };
                                return (
                                    <a key={ticket.id} href={`#/tickets/${ticket.id}`}
                                        className="block p-4 rounded-xl transition-all hover:bg-[var(--bg-secondary)] cursor-pointer"
                                        style={{ border: `1px solid ${statusColors[ticket.status]}20` }}>
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-[var(--text-muted)]">{ticket.ticket_number}</span>
                                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                                    style={{ color: statusColors[ticket.status], background: `${statusColors[ticket.status]}15` }}>
                                                    {statusLabels[ticket.status]}
                                                </span>
                                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                                    style={{ color: prioColors[ticket.priority], background: `${prioColors[ticket.priority]}15` }}>
                                                    {ticket.priority}
                                                </span>
                                            </div>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{ticket.title}</p>
                                        <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{ticket.description}</p>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomerDetail;
