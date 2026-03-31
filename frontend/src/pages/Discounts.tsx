import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCRM } from '../context/CRMContext';
import { useCurrency } from '../context/CurrencyContext';
import { discountService, Discount, LoyaltySuggestion } from '../services/discountService';
import { getProducts, Product } from '../services/products';
import api from '../services/api';

/* ─── Pagination helper ─────────────────────────────────────────────── */
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

/* ─── Searchable picker component ───────────────────────────────────── */
interface PickerItem { id: number; label: string; sub: string; extra?: string }

const SearchablePicker: React.FC<{
    placeholder: string;
    items: PickerItem[];
    selected: PickerItem | null;
    onSelect: (item: PickerItem | null) => void;
    onSearch: (q: string) => void;
    loading?: boolean;
    icon: React.ReactNode;
}> = ({ placeholder, items, selected, onSelect, onSearch, loading, icon }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [hasLoaded, setHasLoaded] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const onSearchRef = useRef(onSearch);
    onSearchRef.current = onSearch;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced search when user types
    useEffect(() => {
        if (!hasLoaded) return;
        const debounce = setTimeout(() => onSearchRef.current(query), 300);
        return () => clearTimeout(debounce);
    }, [query, hasLoaded]);

    const handleFocus = () => {
        setOpen(true);
        // Always fire a fresh search on focus so all items appear
        onSearchRef.current(query);
        setHasLoaded(true);
    };

    return (
        <div ref={ref} className="relative">
            {selected ? (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-emerald-500/40"
                    style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.08))' }}>
                    <span className="text-emerald-400">{icon}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-primary)] font-semibold truncate">{selected.label}</p>
                        <p className="text-[var(--text-muted)] text-xs truncate">{selected.sub}</p>
                    </div>
                    <button type="button" onClick={() => onSelect(null)}
                        className="ml-2 p-1 text-[var(--text-muted)] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{icon}</span>
                    <input
                        placeholder={placeholder}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-emerald-500 outline-none transition-all"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setOpen(true); }}
                        onFocus={handleFocus}
                    />
                </div>
            )}

            <AnimatePresence>
                {open && !selected && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 mt-2 w-full max-h-52 overflow-y-auto rounded-xl shadow-2xl"
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(16px)' }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="px-4 py-5 text-center text-sm text-[var(--text-muted)]">No results found</div>
                        ) : (
                            items.map(item => (
                                <button key={item.id} type="button"
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-500/10 transition-colors border-b border-[var(--border-subtle)] last:border-b-0"
                                    onClick={() => { onSelect(item); setOpen(false); setQuery(''); }}
                                >
                                    <span className="text-emerald-400/70">{icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.label}</p>
                                        <p className="text-xs text-[var(--text-muted)] truncate">{item.sub}</p>
                                    </div>
                                    {item.extra && (
                                        <span className="text-xs font-bold text-emerald-400 whitespace-nowrap">{item.extra}</span>
                                    )}
                                </button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── Loyalty suggestion banner ─────────────────────────────────────── */
const LoyaltyBanner: React.FC<{
    suggestion: LoyaltySuggestion | null;
    loading: boolean;
    onApply: () => void;
}> = ({ suggestion, loading, onApply }) => {
    if (loading) return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-indigo-300">Calculating loyalty discount…</span>
        </div>
    );
    if (!suggestion) return null;

    const tierColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
        Bronze: { bg: 'rgba(146,64,14,0.1)', border: 'rgba(180,83,9,0.3)', text: '#fbbf24', glow: 'rgba(251,191,36,0.15)' },
        Silver: { bg: 'rgba(100,116,139,0.1)', border: 'rgba(148,163,184,0.3)', text: '#cbd5e1', glow: 'rgba(203,213,225,0.15)' },
        Gold: { bg: 'rgba(180,83,9,0.1)', border: 'rgba(217,119,6,0.3)', text: '#fcd34d', glow: 'rgba(252,211,77,0.2)' },
    };
    const colors = tierColors[suggestion.tier] || tierColors.Bronze;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden"
            style={{ background: colors.bg, border: `1px solid ${colors.border}`, boxShadow: `0 4px 20px ${colors.glow}` }}
        >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: colors.border }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold" style={{ color: colors.text }}>
                            {suggestion.tier} Tier — {suggestion.suggested_percent}% Suggested
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                            Loyalty score: {suggestion.loyalty_score} pts
                        </p>
                    </div>
                </div>
                <button type="button" onClick={onApply}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg transition-all hover:scale-105"
                    style={{ background: colors.border, color: colors.text }}>
                    Apply {suggestion.suggested_percent}%
                </button>
            </div>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
const Discounts: React.FC = () => {
    const { discounts, discountsPagination, discountsLoading, fetchDiscounts, showToast, currentUser } = useCRM();
    const { formatCurrency, currency } = useCurrency();

    const [showForm, setShowForm] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [code, setCode] = useState('');
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
    const [value, setValue] = useState(10);
    const [description, setDescription] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [maxUses, setMaxUses] = useState<number | ''>('');
    const [isActive, setIsActive] = useState(true);

    // Product & customer pickers
    const [selectedProduct, setSelectedProduct] = useState<PickerItem | null>(null);
    const [productResults, setProductResults] = useState<PickerItem[]>([]);
    const [productSearchLoading, setProductSearchLoading] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState<PickerItem | null>(null);
    const [customerResults, setCustomerResults] = useState<PickerItem[]>([]);
    const [customerSearchLoading, setCustomerSearchLoading] = useState(false);

    // Loyalty suggestion
    const [loyaltySuggestion, setLoyaltySuggestion] = useState<LoyaltySuggestion | null>(null);
    const [loyaltyLoading, setLoyaltyLoading] = useState(false);

    /* ─── Search handlers ─────────────────────────────────────────────── */
    const searchProducts = async (q: string) => {
        setProductSearchLoading(true);
        try {
            const data = await getProducts({ search: q || undefined });
            setProductResults((data.data || []).map((p: Product) => ({
                id: p.id,
                label: p.name,
                sub: p.category || 'No category',
                extra: formatCurrency(p.price),
            })));
        } catch { setProductResults([]); }
        setProductSearchLoading(false);
    };

    const searchCustomers = async (q: string) => {
        setCustomerSearchLoading(true);
        try {
            const { data } = await api.get('/discounts/search-customers', { params: { search: q || undefined } });
            setCustomerResults((data || []).map((c: any) => ({
                id: c.id,
                label: c.name,
                sub: c.email,
                extra: `${c.loyalty_score} pts`,
            })));
        } catch { setCustomerResults([]); }
        setCustomerSearchLoading(false);
    };

    /* ─── Loyalty auto-suggestion on customer pick ────────────────────── */
    useEffect(() => {
        if (!selectedCustomer) {
            setLoyaltySuggestion(null);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoyaltyLoading(true);
            try {
                const suggestion = await discountService.getLoyaltySuggestion(selectedCustomer.id);
                if (!cancelled) setLoyaltySuggestion(suggestion);
            } catch { if (!cancelled) setLoyaltySuggestion(null); }
            if (!cancelled) setLoyaltyLoading(false);
        })();
        return () => { cancelled = true; };
    }, [selectedCustomer]);

    const applyLoyaltySuggestion = () => {
        if (!loyaltySuggestion) return;
        setType('percentage');
        setValue(loyaltySuggestion.suggested_percent);
    };

    /* ─── Data lifecycle ──────────────────────────────────────────────── */
    const loadDiscounts = useCallback(() => {
        const active = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;
        fetchDiscounts(1, { active, search });
    }, [fetchDiscounts, activeFilter, search]);

    useEffect(() => { loadDiscounts(); }, [loadDiscounts]);

    const handleSearch = (val: string) => setSearch(val);
    const handleActiveFilter = (val: string) => setActiveFilter(val);

    const handlePageChange = (page: number) => {
        const active = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;
        fetchDiscounts(page, { active, search });
    };

    /* ─── Form handlers ───────────────────────────────────────────────── */
    const handleEdit = (discount: Discount) => {
        setEditingDiscount(discount);
        setCode(discount.code);
        setType(discount.type);
        setValue(discount.value);
        setDescription(discount.description || '');
        setStartsAt(discount.starts_at ? discount.starts_at.split('T')[0] : '');
        setExpiresAt(discount.expires_at ? discount.expires_at.split('T')[0] : '');
        setMaxUses(discount.max_uses || '');
        setIsActive(discount.is_active);
        setSelectedProduct(discount.product ? {
            id: discount.product.id,
            label: discount.product.name,
            sub: discount.product.category || 'No category',
            extra: formatCurrency(discount.product.price),
        } : null);
        setSelectedCustomer(discount.customer ? {
            id: discount.customer.id,
            label: discount.customer.name,
            sub: discount.customer.email,
            extra: `${discount.customer.loyalty_score} pts`,
        } : null);
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingDiscount(null);
        setCode(`PROMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
        setType('percentage');
        setValue(10);
        setDescription('');
        setStartsAt('');
        setExpiresAt('');
        setMaxUses('');
        setIsActive(true);
        setSelectedProduct(null);
        setSelectedCustomer(null);
        setLoyaltySuggestion(null);
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const data: any = {
                code, type, value, description,
                starts_at: startsAt || undefined,
                expires_at: expiresAt || undefined,
                max_uses: maxUses ? Number(maxUses) : undefined,
                is_active: isActive,
                product_id: selectedProduct?.id || null,
                customer_id: selectedCustomer?.id || null,
            };

            if (editingDiscount) {
                await discountService.updateDiscount(editingDiscount.id, data);
                showToast('Discount updated', 'success');
            } else {
                await discountService.createDiscount(data);
                showToast('Discount created', 'success');
            }
            setShowForm(false);
            loadDiscounts();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to save discount', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this discount?')) return;
        try {
            await discountService.deleteDiscount(id);
            showToast('Discount deleted', 'success');
            loadDiscounts();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to delete discount', 'error');
        }
    };

    /* ─── Icons ────────────────────────────────────────────────────────── */
    const productIcon = (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    );
    const customerIcon = (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    );

    /* ═══════════════════════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════════════════════ */
    return (
        <div className="animate-fade-in max-w-7xl mx-auto">
            <div className="flex justify-end mb-6">
                <button onClick={handleCreate}
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    + New Discount
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </span>
                    <input
                        placeholder="Search codes..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border-0 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                    value={activeFilter}
                    onChange={e => handleActiveFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                </select>
            </div>

            {/* ─── Discount Cards Grid ──────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discountsLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="glass-card p-6 h-48 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ))
                ) : discounts.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-[var(--text-muted)] glass-card">
                        <div className="mb-3 flex justify-center">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                        </div>
                        <p className="font-medium text-lg text-[var(--text-primary)]">No discounts found</p>
                        <p className="text-sm mt-1">Create a new discount code to get started</p>
                    </div>
                ) : (
                    discounts.map((discount, idx) => {
                        const isExpired = discount.expires_at && new Date(discount.expires_at) < new Date();
                        const isMaxedOut = discount.max_uses && discount.used_count >= discount.max_uses;
                        const isInvalid = !discount.is_active || isExpired || isMaxedOut;

                        return (
                            <div key={discount.id} className="glass-card p-5 relative overflow-hidden transition-all hover:border-indigo-500/30 group"
                                 style={{ animationDelay: `${idx * 50}ms`, opacity: isInvalid ? 0.7 : 1 }}>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xl font-bold font-mono tracking-widest text-[var(--text-primary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]">
                                            {discount.code}
                                        </span>
                                    </div>
                                    {isInvalid ? (
                                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 rounded-full">
                                            {isExpired ? 'Expired' : !discount.is_active ? 'Inactive' : 'Depleted'}
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 rounded-full flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-[var(--border-subtle)] pb-4">
                                        <div>
                                            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Value</p>
                                            <p className="text-2xl font-bold text-indigo-400">
                                                {discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)}
                                                {discount.type === 'fixed' && <span className="text-sm font-normal text-[var(--text-muted)] ml-1">OFF</span>}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Usage</p>
                                            <p className="text-lg font-semibold text-[var(--text-primary)]">
                                                {discount.used_count} <span className="text-sm font-normal text-[var(--text-muted)]">/ {discount.max_uses || '∞'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Product & Customer tags */}
                                    {(discount.product || discount.customer) && (
                                        <div className="flex flex-wrap gap-2">
                                            {discount.product && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                    {productIcon}
                                                    <span className="truncate max-w-[120px]">{discount.product.name}</span>
                                                </span>
                                            )}
                                            {discount.customer && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                                    {customerIcon}
                                                    <span className="truncate max-w-[120px]">{discount.customer.name}</span>
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="text-xs text-[var(--text-muted)] space-y-1.5">
                                        {discount.description && <p className="truncate text-[var(--text-primary)]">{discount.description}</p>}
                                        <div className="flex justify-between">
                                            <span>Starts: {discount.starts_at ? new Date(discount.starts_at).toLocaleDateString() : 'Active now'}</span>
                                            {discount.expires_at && <span>Expires: {new Date(discount.expires_at).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions overlays on hover */}
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(discount)} className="p-2 bg-indigo-500 text-white rounded-lg shadow-lg hover:bg-indigo-600 transition-colors">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                    <button onClick={() => handleDelete(discount.id)} className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {!discountsLoading && discountsPagination.last_page > 1 && (
                <div className="flex justify-center items-center mt-8">
                    <div className="flex items-center space-x-1 glass-card p-1 rounded-xl">
                        {getPaginationGroup(discountsPagination.current_page, discountsPagination.last_page).map((page, i) => (
                            typeof page === 'number' ? (
                                <button key={i} onClick={() => handlePageChange(page)}
                                    className={`px-4 py-2 text-sm rounded-lg transition-all ${page === discountsPagination.current_page
                                        ? 'text-white font-semibold'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                        }`}
                                    style={page === discountsPagination.current_page ? { background: 'linear-gradient(135deg, #10b981, #059669)' } : {}}>
                                    {page}
                                </button>
                            ) : (
                                <span key={i} className="px-3 py-2 text-[var(--text-secondary)]">...</span>
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               CREATE / EDIT FORM MODAL
               ═══════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.35 }}
                            className="glass-card w-full max-w-lg mx-auto max-h-[80vh] flex flex-col overflow-hidden"
                        >
                            {/* ── Sticky Header ─────────────────────────── */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]"
                                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                            <line x1="7" y1="7" x2="7.01" y2="7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                            {editingDiscount ? 'Edit Discount' : 'New Discount'}
                                        </h2>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {editingDiscount ? 'Update discount details' : 'Create a promotional code'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* ── Scrollable Form Body ──────────────────── */}
                            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Code *</label>
                                    <div className="flex gap-2">
                                        <input required value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm font-mono font-bold uppercase bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-emerald-500 text-[var(--text-primary)] outline-none transition-all" />
                                        <button type="button" onClick={() => setCode(`PROMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)}
                                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white rounded-xl text-xl" title="Generate Random">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="4" /><circle cx="8" cy="8" r="1.5" /><circle cx="16" cy="8" r="1.5" /><circle cx="8" cy="16" r="1.5" /><circle cx="16" cy="16" r="1.5" /><circle cx="12" cy="12" r="1.5" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* ─── Product Picker ────────────────────────────────── */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Product
                                        <span className="ml-1 text-[var(--text-muted)] font-normal">(optional)</span>
                                    </label>
                                    <SearchablePicker
                                        placeholder="Search products by name…"
                                        items={productResults}
                                        selected={selectedProduct}
                                        onSelect={setSelectedProduct}
                                        onSearch={searchProducts}
                                        loading={productSearchLoading}
                                        icon={productIcon}
                                    />
                                </div>

                                {/* ─── Customer Picker ───────────────────────────────── */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Customer
                                        <span className="ml-1 text-[var(--text-muted)] font-normal">(optional)</span>
                                    </label>
                                    <SearchablePicker
                                        placeholder="Search customers by name…"
                                        items={customerResults}
                                        selected={selectedCustomer}
                                        onSelect={setSelectedCustomer}
                                        onSearch={searchCustomers}
                                        loading={customerSearchLoading}
                                        icon={customerIcon}
                                    />
                                </div>

                                {/* ─── Loyalty Suggestion Banner ─────────────────────── */}
                                {selectedCustomer && (
                                    <LoyaltyBanner
                                        suggestion={loyaltySuggestion}
                                        loading={loyaltyLoading}
                                        onApply={applyLoyaltySuggestion}
                                    />
                                )}

                                {/* Type & Value */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Type *</label>
                                        <select value={type} onChange={e => setType(e.target.value as any)}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-emerald-500 outline-none transition-all">
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount ({currency})</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Value *</label>
                                        <input required type="number" step="any" min="0" value={value} onChange={e => setValue(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-emerald-500 outline-none transition-all" />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                                    <input value={description} onChange={e => setDescription(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-emerald-500 outline-none transition-all" placeholder="E.g. Summer super sale 2026" />
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Starts At</label>
                                        <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-emerald-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Expires At</label>
                                        <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-emerald-500 outline-none transition-all" />
                                    </div>
                                </div>

                                {/* Max Uses & Active toggle */}
                                <div className="grid grid-cols-2 gap-4 items-center">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Max Uses</label>
                                        <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Unlimited"
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-emerald-500 outline-none transition-all" />
                                    </div>
                                    <div className="mt-6 flex items-center justify-center">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isActive ? 'bg-emerald-500' : 'bg-dark-600'}`}>
                                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </div>
                                            <span className="text-sm font-medium text-[var(--text-primary)]">{isActive ? 'Active' : 'Inactive'}</span>
                                            <input type="checkbox" className="hidden" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                                        </label>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl hover:text-[var(--text-primary)] transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSaving}
                                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50"
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                        {isSaving ? 'Saving...' : 'Save Discount'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Discounts;
