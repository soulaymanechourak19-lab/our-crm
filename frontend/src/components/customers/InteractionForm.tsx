import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

interface InteractionFormProps {
    customerId: number;
    onClose: () => void;
}

const typeOptions = [
    { value: 'call', label: 'Call', icon: '📞', color: '#3b82f6' },
    { value: 'email', label: 'Email', icon: '📧', color: '#8b5cf6' },
    { value: 'meeting', label: 'Meeting', icon: '👥', color: '#10b981' },
];

const InteractionForm: React.FC<InteractionFormProps> = ({ customerId, onClose }) => {
    const { addInteraction } = useCRM();
    const [type, setType] = useState('call');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addInteraction(customerId, {
                type: type as 'call' | 'email' | 'meeting',
                notes,
                date: new Date(date).toISOString(),
            });
            onClose();
        } catch { }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="glass-card p-6 w-full max-w-md mx-4 animate-slide-in">
                <h2 className="text-xl font-bold text-white mb-5">Log Interaction</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type radio buttons */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-3">Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {typeOptions.map(opt => (
                                <button key={opt.value} type="button"
                                    onClick={() => setType(opt.value)}
                                    className="flex flex-col items-center py-3 rounded-xl text-sm font-medium transition-all"
                                    style={{
                                        background: type === opt.value ? `${opt.color}20` : 'rgba(15, 23, 42, 0.6)',
                                        border: `1px solid ${type === opt.value ? `${opt.color}50` : 'rgba(148, 163, 184, 0.15)'}`,
                                        color: type === opt.value ? opt.color : '#94a3b8',
                                    }}>
                                    <span className="text-xl mb-1">{opt.icon}</span>
                                    <span className="text-xs">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
                        <input type="date" required
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                            style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)', colorScheme: 'dark' }}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes *</label>
                        <textarea required rows={4}
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                            style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)' }}
                            placeholder="Describe the interaction..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
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
                            {submitting ? 'Saving...' : 'Log Interaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InteractionForm;
