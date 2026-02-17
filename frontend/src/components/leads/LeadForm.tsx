import React, { useState } from 'react';
import { useCRM, Lead } from '../../context/CRMContext';

interface LeadFormProps {
    lead?: Lead | null;
    onClose: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, onClose }) => {
    const { addLead, updateLead } = useCRM();
    const isEdit = !!lead;
    const [formData, setFormData] = useState({
        company_name: lead?.company_name || '',
        contact_name: lead?.contact_name || '',
        email: lead?.email || '',
        phone: lead?.phone || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);
        try {
            if (isEdit && lead) {
                await updateLead(lead.id, formData);
            } else {
                await addLead(formData);
            }
            onClose();
        } catch (err: any) {
            try {
                const parsed = JSON.parse(err.message);
                setErrors(parsed);
            } catch {
                setErrors({ general: err.message });
            }
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="glass-card p-6 w-full max-w-md mx-4 animate-slide-in">
                <h2 className="text-xl font-bold text-white mb-5">
                    {isEdit ? 'Edit Lead' : 'Add New Lead'}
                </h2>

                {errors.general && (
                    <div className="mb-4 px-4 py-2 rounded-xl text-sm text-red-300" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Company Name *</label>
                        <input
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            style={{ background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${errors.company_name ? 'rgba(239, 68, 68, 0.5)' : 'rgba(148, 163, 184, 0.15)'}` }}
                            placeholder="e.g. Acme Corp"
                            required
                            value={formData.company_name}
                            onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                        />
                        {errors.company_name && <p className="text-xs text-red-400 mt-1">{errors.company_name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Contact Name *</label>
                        <input
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            style={{ background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${errors.contact_name ? 'rgba(239, 68, 68, 0.5)' : 'rgba(148, 163, 184, 0.15)'}` }}
                            placeholder="e.g. John Doe"
                            required
                            value={formData.contact_name}
                            onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                        />
                        {errors.contact_name && <p className="text-xs text-red-400 mt-1">{errors.contact_name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Email *</label>
                        <input
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            style={{ background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${errors.email ? 'rgba(239, 68, 68, 0.5)' : 'rgba(148, 163, 184, 0.15)'}` }}
                            placeholder="john@acme.com"
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                        {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone</label>
                        <input
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)' }}
                            placeholder="+1 555 123 4567"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-400 rounded-xl hover:text-white hover:bg-white/5 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/25"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {submitting ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeadForm;
