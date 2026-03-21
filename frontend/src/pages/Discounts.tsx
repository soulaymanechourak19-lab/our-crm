import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCRM } from '../context/CRMContext';
import { useCurrency } from '../context/CurrencyContext';
import { discountService, Discount } from '../services/discountService';
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

    const loadDiscounts = useCallback(() => {
        const active = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;
        fetchDiscounts(1, { active, search });
    }, [fetchDiscounts, activeFilter, search]);

    useEffect(() => {
        loadDiscounts();
    }, [loadDiscounts]);

    const handleSearch = (val: string) => setSearch(val);
    const handleActiveFilter = (val: string) => setActiveFilter(val);

    const handlePageChange = (page: number) => {
        const active = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;
        fetchDiscounts(page, { active, search });
    };

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
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const data = {
                code, type, value, description,
                starts_at: startsAt || undefined,
                expires_at: expiresAt || undefined,
                max_uses: maxUses ? Number(maxUses) : undefined,
                is_active: isActive
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

    return (
        <div className="animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Discounts & Promotions</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Manage discount codes and track their usage.</p>
                </div>
                <button onClick={handleCreate}
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    + New Discount
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
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
                    <option value="">All Status</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discountsLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="glass-card p-6 h-48 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ))
                ) : discounts.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-[var(--text-muted)] glass-card">
                        <div className="mb-3 flex justify-center"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg></div>
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
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Active
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

            {/* Pagination handles */}
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

            {/* Create/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card w-full max-w-md mx-auto p-6 animate-slide-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                {editingDiscount ? 'Edit Discount' : 'New Discount'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)] hover:text-white transition-colors">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
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

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                                <input value={description} onChange={e => setDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-emerald-500 outline-none transition-all" placeholder="E.g. Summer super sale 2026" />
                            </div>

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
                            
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Max Uses</label>
                                    <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Unlimited"
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-emerald-500 outline-none transition-all" />
                                </div>
                                <div className="mt-6 flex items-center justify-center">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isActive ? 'bg-emerald-500' : 'bg-dark-600'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </div>
                                        <span className="text-sm font-medium text-[var(--text-primary)]">{isActive ? 'Active' : 'Inactive'}</span>
                                        <input type="checkbox" className="hidden" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    {isSaving ? 'Saving...' : 'Save Discount'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Discounts;
