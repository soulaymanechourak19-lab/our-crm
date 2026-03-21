import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

interface InteractionFormProps {
    customerId: number;
    onClose: () => void;
}

const typeOptions: { value: string; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'call', label: 'Call', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>, color: '#3b82f6' },
    { value: 'email', label: 'Email', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>, color: '#8b5cf6' },
    { value: 'meeting', label: 'Meeting', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, color: '#10b981' },
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
        const success = await addInteraction(customerId, {
            type: type as 'call' | 'email' | 'meeting',
            notes,
            date: new Date(date).toISOString(),
        });
        if (success) {
            onClose();
        }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="glass-card p-6 w-full max-w-md mx-4 animate-slide-in">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">Log Interaction</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type radio buttons */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-3">Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {typeOptions.map(opt => (
                                <button key={opt.value} type="button"
                                    onClick={() => setType(opt.value)}
                                    className="flex flex-col items-center py-3 rounded-xl text-sm font-medium transition-all"
                                    style={{
                                        background: type === opt.value ? `${opt.color}20` : 'var(--bg-secondary)',
                                        border: `1px solid ${type === opt.value ? `${opt.color}50` : 'var(--border-subtle)'}`,
                                        color: type === opt.value ? opt.color : 'var(--text-secondary)',
                                    }}>
                                    <span className="mb-1">{opt.icon}</span>
                                    <span className="text-xs">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Date</label>
                        <input type="date" required
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-indigo-500/50"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Notes *</label>
                        <textarea required rows={4}
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                            placeholder="Describe the interaction..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] rounded-xl hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all">
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
