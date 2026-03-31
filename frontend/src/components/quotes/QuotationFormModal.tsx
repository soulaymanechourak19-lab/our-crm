import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useCRM } from '../../context/CRMContext';
import { quotationService, Quotation, QuotationItem } from '../../services/quotationService';
import { Product, getProducts, getCategories } from '../../services/products';
import { useCurrency } from '../../context/CurrencyContext';
import { Send } from 'lucide-react';

interface QuotationFormProps {
    quotation?: Quotation | null;
    onClose: () => void;
}

/* ─────────────────────────────────────────────────────────────────
   Shared input style — ensures consistent styling in light/dark
   ───────────────────────────────────────────────────────────────── */
const inputClass =
    'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all font-[inherit]';
const inputStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
};

/* ─────────────────────────────────────────────────────────────────
   Searchable Client Autocomplete
   ───────────────────────────────────────────────────────────────── */
const ClientSearchPicker: React.FC<{
    clientType: 'lead' | 'customer';
    onClientTypeChange: (type: 'lead' | 'customer') => void;
    clientId: number | '';
    onSelect: (id: number) => void;
    leads: any[];
    customers: any[];
}> = ({ clientType, onClientTypeChange, clientId, onSelect, leads, customers }) => {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const items = clientType === 'lead'
        ? leads.map(l => ({ id: l.id, label: `${l.company_name} (${l.contact_name})` }))
        : customers.map(c => ({ id: c.id, label: c.name }));

    const filtered = search
        ? items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
        : items;

    const selectedLabel = items.find(i => i.id === clientId)?.label || '';

    return (
        <>
            {/* Client type toggle */}
            <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Client Type</label>
                <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    {(['lead', 'customer'] as const).map(type => (
                        <button key={type} type="button"
                            onClick={() => { onClientTypeChange(type); setSearch(''); }}
                            style={{
                                flex: 1, padding: '9px 0', fontSize: '0.82rem', fontWeight: 600,
                                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                background: clientType === type ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-secondary)',
                                color: clientType === type ? '#fff' : 'var(--text-secondary)',
                            }}>
                            {type === 'lead' ? 'Lead' : 'Customer'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Searchable dropdown */}
            <div ref={ref} style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Select {clientType === 'lead' ? 'Lead' : 'Customer'} *
                </label>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </span>
                    <input
                        value={open ? search : selectedLabel}
                        onChange={e => { setSearch(e.target.value); setOpen(true); }}
                        onFocus={() => { setSearch(''); setOpen(true); }}
                        placeholder="Type a name to search..."
                        className={inputClass}
                        style={{ ...inputStyle, paddingLeft: 36 }}
                    />
                </div>
                {open && (
                    <div style={{
                        position: 'absolute', zIndex: 60, left: 0, right: 0, marginTop: 4,
                        maxHeight: 220, overflowY: 'auto', borderRadius: 14,
                        border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                    }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>No results found</div>
                        ) : filtered.map(item => (
                            <button key={item.id} type="button"
                                onClick={() => { onSelect(item.id); setSearch(''); setOpen(false); }}
                                style={{
                                    width: '100%', textAlign: 'left', padding: '10px 14px',
                                    fontSize: '0.82rem', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: item.id === clientId ? 'rgba(99,102,241,0.1)' : 'transparent',
                                    color: item.id === clientId ? '#818cf8' : 'var(--text-primary)',
                                    fontWeight: item.id === clientId ? 600 : 400,
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { if (item.id !== clientId) e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                                onMouseLeave={e => { if (item.id !== clientId) e.currentTarget.style.background = 'transparent'; }}>
                                <span style={{
                                    width: 28, height: 28, borderRadius: 8, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                }}>
                                    {item.label.charAt(0).toUpperCase()}
                                </span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

/* ─────────────────────────────────────────────────────────────────
   Product Picker — Search by name or filter by category
   ───────────────────────────────────────────────────────────────── */
const ProductPicker: React.FC<{
    products: Product[];
    categories: string[];
    onSelect: (product: Product) => void;
    currentDescription: string;
    onDescriptionChange: (val: string) => void;
}> = ({ products, categories, onSelect, currentDescription, onDescriptionChange }) => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = !category || p.category === category;
        return matchSearch && matchCat;
    });

    return (
        <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                    </span>
                    <input
                        value={open ? search : currentDescription}
                        onChange={e => {
                            setSearch(e.target.value);
                            setOpen(true);
                            // Also update description so user can type custom text
                            onDescriptionChange(e.target.value);
                        }}
                        onFocus={() => { setSearch(''); setOpen(true); }}
                        onBlur={() => {
                            // If the user typed something and didn't pick a product, keep their text
                            if (!open && search && !currentDescription) {
                                onDescriptionChange(search);
                            }
                        }}
                        placeholder="Search product..."
                        style={{
                            width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                            fontSize: '0.82rem', borderRadius: 10,
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                            outline: 'none', transition: 'border-color 0.2s',
                            fontFamily: 'inherit',
                        }}
                    />
                </div>
                <select
                    value={category}
                    onChange={e => { setCategory(e.target.value); setOpen(true); }}
                    style={{
                        padding: '8px 8px', fontSize: '0.72rem', borderRadius: 10,
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                        outline: 'none', cursor: 'pointer', maxWidth: 100,
                        fontFamily: 'inherit',
                    }}>
                    <option value="">All Cat.</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            {open && filtered.length > 0 && (
                <div style={{
                    position: 'absolute', zIndex: 60, left: 0, right: 0, marginTop: 4,
                    maxHeight: 240, overflowY: 'auto', borderRadius: 14,
                    border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                }}>
                    {filtered.map(product => (
                        <button key={product.id} type="button"
                            onClick={() => { onSelect(product); setOpen(false); setSearch(''); setCategory(''); }}
                            style={{
                                width: '100%', textAlign: 'left', padding: '10px 14px',
                                fontSize: '0.82rem', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                                background: 'transparent', transition: 'background 0.15s',
                                color: 'var(--text-primary)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                <span style={{
                                    width: 30, height: 30, borderRadius: 8, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    background: 'rgba(99, 102, 241, 0.1)',
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                </span>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{product.category}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                <span style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.85rem' }}>{product.price.toFixed(2)}</span>
                                <span style={{ fontSize: '0.65rem', color: product.stock > 0 ? '#34d399' : '#f87171' }}>
                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────
   Main Quotation Form Modal
   ───────────────────────────────────────────────────────────────── */
const QuotationForm: React.FC<QuotationFormProps> = ({ quotation, onClose }) => {
    const { leads, customers, showToast, fetchQuotations, fetchLeads, fetchCustomers } = useCRM();
    const { formatCurrency } = useCurrency();

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        if (leads.length === 0) fetchLeads(1, { per_page: 100 });
        if (customers.length === 0) fetchCustomers(1, { per_page: 100 });
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                getProducts({ page: 1 }),
                getCategories()
            ]);
            setProducts(prodRes.data);
            setCategories(catRes);
        } catch { }
    };

    const [title, setTitle] = useState(quotation?.title || '');
    const [description, setDescription] = useState(quotation?.description || '');
    const [clientType, setClientType] = useState<'lead' | 'customer'>(quotation?.customer_id ? 'customer' : 'lead');
    const [clientId, setClientId] = useState<number | ''>(quotation?.customer_id || quotation?.lead_id || '');
    const [validUntil, setValidUntil] = useState(quotation?.valid_until ? quotation.valid_until.split('T')[0] : '');
    const [taxRate, setTaxRate] = useState<number>(quotation?.tax_rate || 20);

    const [items, setItems] = useState<QuotationItem[]>(quotation?.items || [
        { description: '', quantity: 1, unit_price: 0 }
    ]);

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const [isSending, setIsSending] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    useEffect(() => {
        if (!quotation && !validUntil) {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            setValidUntil(date.toISOString().split('T')[0]);
        }
    }, [quotation, validUntil]);

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleProductSelect = (index: number, product: Product) => {
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            product_id: product.id,
            description: product.name,
            unit_price: product.price
        };
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return showToast('Title is required', 'error');
        if (!clientId) return showToast('Client is required', 'error');
        if (items.length === 0 || items.some(i => !i.description)) return showToast('Please add valid line items', 'error');

        setLoading(true);
        try {
            const data = {
                title, description,
                lead_id: clientType === 'lead' ? clientId : null,
                customer_id: clientType === 'customer' ? clientId : null,
                tax_rate: taxRate,
                valid_until: validUntil || undefined,
                items
            };
            if (quotation) {
                await quotationService.updateQuotation(quotation.id, data);
                showToast('Quotation updated successfully', 'success');
            } else {
                await quotationService.createQuotation(data);
                showToast('Quotation created successfully', 'success');
            }
            fetchQuotations();
            onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to save quotation', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!quotation) return;
        setIsSending(true);
        try {
            await quotationService.sendQuotation(quotation.id);
            showToast('Quotation marked as sent', 'success');
            fetchQuotations(); onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to send quotation', 'error');
        } finally { setIsSending(false); }
    };

    const handleUpdateStatus = async (status: 'accepted' | 'rejected') => {
        if (!quotation) return;
        try {
            await quotationService.updateStatus(quotation.id, status);
            showToast(`Quotation marked as ${status}`, 'success');
            fetchQuotations(); onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || `Failed to update status`, 'error');
        }
    };

    const handleConvert = async () => {
        if (!quotation) return;
        setIsConverting(true);
        try {
            await quotationService.convertToTransaction(quotation.id);
            showToast('Quotation converted to transaction successfully!', 'success');
            fetchQuotations(); onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to convert quotation', 'error');
        } finally { setIsConverting(false); }
    };

    const handleDownloadPdf = async () => {
        if (!quotation) return;
        setIsDownloading(true);
        try {
            await quotationService.downloadPdf(quotation.id);
            showToast('PDF generated', 'success');
        } catch { showToast('Failed to download PDF', 'error'); }
        finally { setIsDownloading(false); }
    };

    /* ── small button helper ── */
    const actionBtnStyle = (color: string, bg: string): React.CSSProperties => ({
        padding: '9px 18px', fontSize: '0.82rem', fontWeight: 600,
        borderRadius: 12, border: 'none', cursor: 'pointer',
        color, background: bg, transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', gap: 6,
    });

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '24px',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        }}>
            <div style={{
                width: '100%', maxWidth: 860, maxHeight: 'calc(100vh - 48px)',
                display: 'flex', flexDirection: 'column',
                borderRadius: 20, overflow: 'hidden',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
                flexShrink: 0,
            }}>

                {/* ── Header ── */}
                <div style={{
                    padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)', flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {quotation ? `Quotation ${quotation.number}` : 'New Quotation'}
                        </h2>
                        {quotation && (
                            <span style={{
                                padding: '3px 10px', borderRadius: 20,
                                fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                                color: '#a78bfa', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
                            }}>
                                {quotation.status}
                            </span>
                        )}
                    </div>
                    <button type="button" onClick={onClose} style={{
                        width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* ── Scrollable Body ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    <form id="quotation-form" onSubmit={handleSubmit}>

                        {/* ── Section 1: Basic Info ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Quotation Title *</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)}
                                    className={inputClass} style={inputStyle}
                                    placeholder="e.g. Website Redesign" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Valid Until</label>
                                    <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                                        className={inputClass} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Tax Rate (%)</label>
                                    <input type="number" step="0.1" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                                        className={inputClass} style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Client ── */}
                        <div style={{
                            padding: '12px 14px', borderRadius: 14, marginBottom: 14,
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                        }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Client</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <ClientSearchPicker
                                    clientType={clientType}
                                    onClientTypeChange={(type) => { setClientType(type); setClientId(''); }}
                                    clientId={clientId}
                                    onSelect={(id) => setClientId(id)}
                                    leads={leads}
                                    customers={customers}
                                />
                            </div>
                        </div>

                        {/* ── Section 3: Description ── */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Description (Optional)</label>
                            <input value={description} onChange={e => setDescription(e.target.value)}
                                className={inputClass} style={inputStyle}
                                placeholder="Additional notes..." />
                        </div>

                        {/* ── Section 4: Line Items ── */}
                        <div style={{
                            padding: '12px 14px', borderRadius: 14,
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Line Items</div>
                                <button type="button" onClick={addItem}
                                    style={{
                                        padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700,
                                        borderRadius: 8, border: 'none', cursor: 'pointer',
                                        color: '#818cf8', background: 'rgba(99,102,241,0.1)',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}>
                                    + Add Item
                                </button>
                            </div>

                            {/* Column headers */}
                            <div style={{ display: 'flex', gap: 10, padding: '0 14px', marginBottom: 8 }}>
                                <span style={{ flex: 1, fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Product / Description</span>
                                <span style={{ width: 70, fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' }}>Qty</span>
                                <span style={{ width: 100, fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' }}>Unit Price</span>
                                <span style={{ width: 90, fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'right' }}>Total</span>
                                <span style={{ width: 32 }} />
                            </div>

                            {/* Items */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {items.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', gap: 10, padding: 12, borderRadius: 12, alignItems: 'center',
                                        background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                                    }}>
                                        <ProductPicker
                                            products={products}
                                            categories={categories}
                                            currentDescription={item.description}
                                            onDescriptionChange={val => updateItem(idx, 'description', val)}
                                            onSelect={(product) => handleProductSelect(idx, product)}
                                        />
                                        <input required type="number" min="1" step="any" value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                            style={{
                                                width: 70, padding: '8px 10px', fontSize: '0.82rem', borderRadius: 10,
                                                border: '1px solid var(--border-subtle)',
                                                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                                outline: 'none', textAlign: 'center', fontFamily: 'inherit',
                                            }} />
                                        <input required type="number" min="0" step="any" value={item.unit_price}
                                            onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                                            style={{
                                                width: 100, padding: '8px 10px', fontSize: '0.82rem', borderRadius: 10,
                                                border: '1px solid var(--border-subtle)',
                                                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                                outline: 'none', textAlign: 'right', fontFamily: 'inherit',
                                            }} />
                                        <div style={{ width: 90, textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                            {formatCurrency(item.quantity * item.unit_price)}
                                        </div>
                                        <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1}
                                            style={{
                                                width: 32, height: 32, borderRadius: 8, border: 'none',
                                                cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                                                background: 'transparent', color: '#f87171',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                opacity: items.length === 1 ? 0.25 : 1,
                                                transition: 'all 0.15s', flexShrink: 0,
                                            }}
                                            onMouseEnter={e => { if (items.length > 1) e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ width: 240 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                                        <span>Tax ({taxRate}%)</span><span>{formatCurrency(tax)}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', paddingTop: 10,
                                        borderTop: '2px solid var(--border-subtle)',
                                        fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)',
                                    }}>
                                        <span>Total</span><span>{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* ── Footer Actions ── */}
                <div style={{
                    padding: '10px 20px', borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)', flexShrink: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 8,
                }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {quotation && (
                            <button type="button" onClick={handleDownloadPdf} disabled={isDownloading}
                                style={{ ...actionBtnStyle('var(--text-primary)', 'var(--bg-primary)'), border: '1px solid var(--border-subtle)', opacity: isDownloading ? 0.5 : 1 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                {isDownloading ? 'Downloading...' : 'PDF'}
                            </button>
                        )}
                        {quotation?.status === 'draft' && (
                            <button type="button" onClick={handleSend} disabled={isSending}
                                style={{ ...actionBtnStyle('#60a5fa', 'rgba(59,130,246,0.1)'), opacity: isSending ? 0.5 : 1 }}>
                                {isSending ? 'Sending...' : <><Send size={14} /> Mark as Sent</>}
                            </button>
                        )}
                        {quotation?.status === 'sent' && (
                            <>
                                <button type="button" onClick={() => handleUpdateStatus('accepted')}
                                    style={actionBtnStyle('#34d399', 'rgba(16,185,129,0.1)')}>Accept</button>
                                <button type="button" onClick={() => handleUpdateStatus('rejected')}
                                    style={actionBtnStyle('#f87171', 'rgba(239,68,68,0.1)')}>Reject</button>
                            </>
                        )}
                        {quotation?.status === 'accepted' && (
                            <button type="button" onClick={handleConvert} disabled={isConverting}
                                style={{ ...actionBtnStyle('#fff', 'linear-gradient(135deg, #10b981, #059669)'), opacity: isConverting ? 0.5 : 1 }}>
                                {isConverting ? 'Converting...' : 'Convert to Sale'}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={onClose}
                            style={{
                                padding: '9px 20px', fontSize: '0.82rem', fontWeight: 600,
                                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                                color: 'var(--text-secondary)', background: 'transparent',
                                border: '1px solid var(--border-subtle)',
                            }}>
                            Cancel
                        </button>
                        {(quotation?.status === 'draft' || !quotation) && (
                            <button type="submit" form="quotation-form" disabled={loading}
                                style={{
                                    padding: '9px 24px', fontSize: '0.82rem', fontWeight: 700,
                                    borderRadius: 12, border: 'none', cursor: 'pointer',
                                    color: '#fff', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                                    opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
                                }}>
                                {loading ? 'Saving...' : 'Save Quotation'}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default QuotationForm;
