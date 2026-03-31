import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { getProducts } from '../../services/products';

interface SearchResult {
    id: number;
    type: 'lead' | 'customer' | 'product';
    title: string;
    description: string;
    url: string;
}

const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ leads: SearchResult[], customers: SearchResult[], products: SearchResult[] }>({
        leads: [],
        customers: [],
        products: []
    });
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults({ leads: [], customers: [], products: [] });
                setIsOpen(query.trim().length > 0);
                return;
            }

            setLoading(true);
            setIsOpen(true);

            try {
                // Fetch in parallel
                const [leadsRes, customersRes, productsRes] = await Promise.all([
                    api.get(`/leads?search=${encodeURIComponent(query)}&per_page=3`).catch(() => ({ data: { data: [] } })),
                    api.get(`/customers?search=${encodeURIComponent(query)}&per_page=3`).catch(() => ({ data: { data: [] } })),
                    getProducts({ search: query, page: 1 }).catch(() => ({ data: [] }))
                ]);

                setResults({
                    leads: (leadsRes.data.data || []).map((l: any) => ({
                        id: l.id,
                        type: 'lead',
                        title: l.company_name,
                        description: l.email || l.contact_name,
                        url: `/leads` // Optionally add ?search=lead.company_name
                    })),
                    customers: (customersRes.data.data || []).map((c: any) => ({
                        id: c.id,
                        type: 'customer',
                        title: c.name,
                        description: c.email || c.phone,
                        url: `/customers/${c.id}`
                    })),
                    products: (productsRes.data || []).slice(0, 3).map((p: any) => ({
                        id: p.id,
                        type: 'product',
                        title: p.name,
                        description: p.category || `$${p.price}`,
                        url: `/products`
                    }))
                });
            } catch (err) {
                console.error("Global search failed:", err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(() => {
            fetchResults();
        }, 300);

        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelect = (url: string) => {
        setIsOpen(false);
        setQuery('');
        navigate(url);
    };

    const hasResults = results.leads.length > 0 || results.customers.length > 0 || results.products.length > 0;

    return (
        <div className="relative" ref={wrapperRef}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: '10px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input 
                    type="text" 
                    placeholder="Global search..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (query) setIsOpen(true); }}
                    style={{
                        background: 'transparent', border: 'none', outline: 'none',
                        color: 'var(--text-primary)', fontSize: '0.82rem', width: '200px', fontFamily: 'inherit',
                    }} 
                />
                {loading && (
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin ml-2"></div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && query.trim().length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-[400px] rounded-2xl shadow-xl z-[100] overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(16px)' }}
                    >
                        {!loading && !hasResults ? (
                            <div className="p-8 text-center text-[var(--text-secondary)]">
                                <p>No results found for "{query}"</p>
                            </div>
                        ) : (
                            <div className="py-2 max-h-[400px] overflow-y-auto">
                                {/* Leads Section */}
                                {results.leads.length > 0 && (
                                    <div className="px-4 py-2 border-b border-[var(--border-subtle)] pb-3">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Leads</h4>
                                        <div className="space-y-1">
                                            {results.leads.map(r => (
                                                <button key={`l-${r.id}`} onClick={() => handleSelect(r.url)} className="w-full text-left p-2 rounded-xl transition-colors hover:bg-[var(--bg-secondary)] flex flex-col items-start border-none bg-transparent cursor-pointer">
                                                    <span className="text-sm font-semibold text-[var(--text-primary)]">{r.title}</span>
                                                    <span className="text-xs text-[var(--text-muted)] line-clamp-1">{r.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Customers Section */}
                                {results.customers.length > 0 && (
                                    <div className="px-4 py-2 border-b border-[var(--border-subtle)] pb-3">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Customers</h4>
                                        <div className="space-y-1">
                                            {results.customers.map(r => (
                                                <button key={`c-${r.id}`} onClick={() => handleSelect(r.url)} className="w-full text-left p-2 rounded-xl transition-colors hover:bg-[var(--bg-secondary)] flex flex-col items-start border-none bg-transparent cursor-pointer">
                                                    <span className="text-sm font-semibold text-[var(--text-primary)]">{r.title}</span>
                                                    <span className="text-xs text-[var(--text-muted)] line-clamp-1">{r.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Products Section */}
                                {results.products.length > 0 && (
                                    <div className="px-4 py-2 pb-3">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Products</h4>
                                        <div className="space-y-1">
                                            {results.products.map(r => (
                                                <button key={`p-${r.id}`} onClick={() => handleSelect(r.url)} className="w-full text-left p-2 rounded-xl transition-colors hover:bg-[var(--bg-secondary)] flex flex-col items-start border-none bg-transparent cursor-pointer">
                                                    <span className="text-sm font-semibold text-[var(--text-primary)]">{r.title}</span>
                                                    <span className="text-xs text-[var(--text-muted)] line-clamp-1">{r.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GlobalSearch;
// Trigger recompile
