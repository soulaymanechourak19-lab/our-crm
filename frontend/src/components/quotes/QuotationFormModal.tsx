import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { quotationService, Quotation, QuotationItem } from '../../services/quotationService';
import { Product, getProducts } from '../../services/products';
import { useCurrency } from '../../context/CurrencyContext';

interface QuotationFormProps {
    quotation?: Quotation | null;
    onClose: () => void;
}

const QuotationForm: React.FC<QuotationFormProps> = ({ quotation, onClose }) => {
    const { leads, customers, showToast, fetchQuotations } = useCRM();
    const { formatCurrency } = useCurrency();

    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title) return showToast('Title is required', 'error');
        if (!clientId) return showToast('Client is required', 'error');
        if (items.length === 0 || items.some(i => !i.description)) return showToast('Please add valid line items', 'error');

        setLoading(true);
        try {
            const data = {
                title,
                description,
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
            fetchQuotations();
            onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to send quotation', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const handleUpdateStatus = async (status: 'accepted' | 'rejected') => {
        if (!quotation) return;
        try {
            await quotationService.updateStatus(quotation.id, status);
            showToast(`Quotation marked as ${status}`, 'success');
            fetchQuotations();
            onClose();
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
            fetchQuotations();
            onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to convert quotation', 'error');
        } finally {
            setIsConverting(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!quotation) return;
        setIsDownloading(true);
        try {
            await quotationService.downloadPdf(quotation.id);
            showToast('PDF generated', 'success');
        } catch (err: any) {
            showToast('Failed to download PDF', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-in overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-secondary)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                            {quotation ? `Quotation ${quotation.number}` : 'New Quotation'}
                        </h2>
                        {quotation && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/20 text-indigo-400 border border-indigo-500/20">
                                {quotation.status}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="quotation-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Info Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[var(--border-subtle)]">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Quotation Title *</label>
                                    <input required value={title} onChange={e => setTitle(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                        placeholder="e.g. Website Redesign" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description (Optional)</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                        placeholder="Additional notes..." />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Client Type</label>
                                        <select value={clientType} onChange={e => { setClientType(e.target.value as any); setClientId(''); }}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all">
                                            <option value="lead">Lead</option>
                                            <option value="customer">Customer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Select Client *</label>
                                        <select required value={clientId} onChange={e => setClientId(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all">
                                            <option value="">Select...</option>
                                            {clientType === 'lead' 
                                                ? leads.map(l => <option key={l.id} value={l.id}>{l.company_name} ({l.contact_name})</option>)
                                                : customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                            }
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Valid Until</label>
                                        <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tax Rate (%)</label>
                                        <input type="number" step="0.1" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">Line Items</h3>
                                <button type="button" onClick={addItem}
                                    className="px-3 py-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors">
                                    + Add Item
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl items-start sm:items-center bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                                        <div className="flex-1 w-full">
                                            <input required placeholder="Item description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-transparent border-0 border-b border-[var(--border-subtle)] focus:border-indigo-500 outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors" />
                                        </div>
                                        <div className="w-full sm:w-24">
                                            <label className="block sm:hidden text-xs text-[var(--text-secondary)] mb-1">Qty</label>
                                            <input required type="number" min="1" step="any" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                                className="w-full px-3 py-2 text-sm rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none" />
                                        </div>
                                        <div className="w-full sm:w-32">
                                            <label className="block sm:hidden text-xs text-[var(--text-secondary)] mb-1">Price</label>
                                            <input required type="number" min="0" step="any" placeholder="Price" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                                                className="w-full px-3 py-2 text-sm rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none" />
                                        </div>
                                        <div className="w-full sm:w-24 text-right pt-2 sm:pt-0 font-medium text-[var(--text-primary)]">
                                            {formatCurrency(item.quantity * item.unit_price)}
                                        </div>
                                        <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1}
                                            className="mt-2 sm:mt-0 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Totals */}
                            <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border-subtle)]">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                        <span>Tax ({taxRate}%)</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border-subtle)]">
                                        <span>Total</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                    <div className="flex gap-2">
                        {quotation && (
                            <button type="button" onClick={handleDownloadPdf} disabled={isDownloading}
                                className="px-4 py-2 text-sm font-medium text-white bg-dark-600 hover:bg-dark-500 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                                {isDownloading ? 'Downloading...' : 'Download PDF'}
                            </button>
                        )}
                        {quotation?.status === 'draft' && (
                            <button type="button" onClick={handleSend} disabled={isSending}
                                className="px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                                {isSending ? 'Sending...' : '📨 Mark as Sent'}
                            </button>
                        )}
                        {quotation?.status === 'sent' && (
                            <>
                                <button type="button" onClick={() => handleUpdateStatus('accepted')}
                                    className="px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all flex items-center gap-2">
                                    Accept
                                </button>
                                <button type="button" onClick={() => handleUpdateStatus('rejected')}
                                    className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all flex items-center gap-2">
                                    Reject
                                </button>
                            </>
                        )}
                        {quotation?.status === 'accepted' && (
                            <button type="button" onClick={handleConvert} disabled={isConverting}
                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all flex items-center gap-2">
                                {isConverting ? 'Converting...' : 'Convert to Sale'}
                            </button>
                        )}
                    </div>
                    
                    <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <button type="button" onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--bg-card)] transition-all">
                            Cancel
                        </button>
                        {(quotation?.status === 'draft' || !quotation) && (
                            <button type="submit" form="quotation-form" disabled={loading}
                                className="flex-1 sm:flex-none px-6 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                {loading ? 'Saving...' : 'Save Quotation'}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default QuotationForm;
