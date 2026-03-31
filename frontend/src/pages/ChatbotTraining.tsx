import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { Icons } from '../components/common/Icons';

interface Intent {
    id: number;
    name: string;
    description: string | null;
    response: string | null;
    example_count: number;
}

interface Example {
    id: number;
    intent_id: number;
    text: string;
}

interface ModelInfo {
    status: string;
    trained_at?: string;
    num_intents?: number;
    num_examples?: number;
    intents?: string[];
}

interface LogEntry {
    id: number;
    message: string;
    predicted_intent: string | null;
    confidence: number | null;
    used_fallback: boolean;
    created_at: string;
}

const ChatbotTraining: React.FC = () => {
    const [intents, setIntents] = useState<Intent[]>([]);
    const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
    const [examples, setExamples] = useState<Example[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

    const [newIntentName, setNewIntentName] = useState('');
    const [newIntentDesc, setNewIntentDesc] = useState('');
    const [newIntentResponse, setNewIntentResponse] = useState('');
    const [newExampleText, setNewExampleText] = useState('');
    const [bulkExamples, setBulkExamples] = useState('');

    const [training, setTraining] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [trainResult, setTrainResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'intents' | 'logs'>('intents');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Data Loading ────────────────────────────────────────────────

    const loadIntents = useCallback(async () => {
        try {
            const { data } = await api.get('/chatbot-training/intents');
            setIntents(data);
        } catch { /* ignore */ }
    }, []);

    const loadExamples = useCallback(async (intentId: number) => {
        try {
            const { data } = await api.get(`/chatbot-training/intents/${intentId}/examples`);
            setExamples(data);
        } catch { /* ignore */ }
    }, []);

    const loadModelInfo = useCallback(async () => {
        try {
            const { data } = await api.get('/chatbot-training/model-info');
            setModelInfo(data);
        } catch { setModelInfo({ status: 'unavailable' }); }
    }, []);

    const loadLogs = useCallback(async () => {
        try {
            const { data } = await api.get('/chatbot-training/logs?per_page=100');
            setLogs(data.data || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { loadIntents(); loadModelInfo(); }, [loadIntents, loadModelInfo]);
    useEffect(() => { if (activeTab === 'logs') loadLogs(); }, [activeTab, loadLogs]);

    // ── Actions ─────────────────────────────────────────────────────

    const createIntent = async () => {
        if (!newIntentName.trim()) return;
        try {
            await api.post('/chatbot-training/intents', {
                name: newIntentName.trim(),
                description: newIntentDesc.trim() || null,
                response: newIntentResponse.trim() || null
            });
            setNewIntentName(''); setNewIntentDesc(''); setNewIntentResponse('');
            showToast('Intent created!', 'success');
            loadIntents();
        } catch (e: any) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    };

    const deleteIntent = async (id: number) => {
        if (!window.confirm('Delete this intent and all its examples?')) return;
        try {
            await api.delete(`/chatbot-training/intents/${id}`);
            if (selectedIntent?.id === id) { setSelectedIntent(null); setExamples([]); }
            showToast('Intent deleted', 'success');
            loadIntents();
        } catch { showToast('Failed to delete', 'error'); }
    };

    const addExample = async () => {
        if (!selectedIntent || !newExampleText.trim()) return;
        try {
            await api.post(`/chatbot-training/intents/${selectedIntent.id}/examples`, { examples: [newExampleText.trim()] });
            setNewExampleText('');
            showToast('Example added!', 'success');
            loadExamples(selectedIntent.id);
            loadIntents();
        } catch { showToast('Failed', 'error'); }
    };

    const addBulkExamples = async () => {
        if (!selectedIntent || !bulkExamples.trim()) return;
        const exs = bulkExamples.split('\n').map(e => e.trim()).filter(e => e.length > 0);
        if (exs.length === 0) return;
        try {
            await api.post(`/chatbot-training/intents/${selectedIntent.id}/examples`, { examples: exs });
            setBulkExamples('');
            showToast(`${exs.length} examples added!`, 'success');
            loadExamples(selectedIntent.id);
            loadIntents();
        } catch { showToast('Failed', 'error'); }
    };

    const deleteExample = async (id: number) => {
        try {
            await api.delete(`/chatbot-training/examples/${id}`);
            setExamples(prev => prev.filter(e => e.id !== id));
            loadIntents();
        } catch { showToast('Failed', 'error'); }
    };

    const seedData = async () => {
        setSeeding(true);
        try {
            const { data } = await api.post('/chatbot-training/seed');
            showToast(data.message, 'success');
            loadIntents();
        } catch { showToast('Seeding failed', 'error'); }
        setSeeding(false);
    };

    const trainModel = async () => {
        setTraining(true); setTrainResult(null);
        try {
            const { data } = await api.post('/chatbot-training/train');
            setTrainResult(data.result);
            showToast('Model trained successfully!', 'success');
            loadModelInfo();
        } catch (e: any) {
            showToast(e.response?.data?.error || 'Training failed', 'error');
        }
        setTraining(false);
    };

    const selectIntent = (intent: Intent) => {
        setSelectedIntent(intent);
        loadExamples(intent.id);
    };

    // ── Render ──────────────────────────────────────────────────────

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-4 sm:p-6 space-y-6"
        >
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg border animate-pulse ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}>
                    {toast.msg}
                </div>
            )}

            {/* Header + Model Status */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.14.35 2.2.94 3.08A5.5 5.5 0 0 0 7 18.5V22h4v-3.5" /><path d="M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.14-.35 2.2-.94 3.08A5.5 5.5 0 0 1 17 18.5V22h-4v-3.5" /><path d="M8 10h8" /><path d="M9 14h6" /></svg> Chatbot Training</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Manage intents, add training examples, and train the ML model</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={seedData} disabled={seeding}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--border-subtle)] transition disabled:opacity-50 flex items-center gap-1">
                        {seeding ? 'Seeding...' : <><Icons.Leaf size={14} /> Seed Data</>}
                    </button>
                    <button onClick={trainModel} disabled={training}
                        className="px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 transition disabled:opacity-50 flex items-center gap-2">
                        {training ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Training...</>
                        ) : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle'}}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg> Train Model</>}
                    </button>
                </div>
            </div>

            {/* Model Info Card */}
            <div className="glass-card p-4 flex flex-wrap gap-6 text-sm">
                <div>
                    <span className="text-[var(--text-secondary)]">Status:</span>{' '}
                    <span className={modelInfo?.status === 'trained' ? 'text-emerald-400 font-bold inline-flex items-center gap-1.5' : 'text-amber-400 inline-flex items-center gap-1.5'}>
                        {modelInfo?.status === 'trained' ? <><Icons.Circle size={10} fill="currentColor" strokeWidth={0} /> Trained</> : <><Icons.Circle size={10} fill="currentColor" strokeWidth={0} /> Not trained</>}
                    </span>
                </div>
                {modelInfo?.num_intents && <div><span className="text-[var(--text-secondary)]">Intents:</span> <span className="text-[var(--text-primary)] font-bold">{modelInfo.num_intents}</span></div>}
                {modelInfo?.num_examples && <div><span className="text-[var(--text-secondary)]">Examples:</span> <span className="text-[var(--text-primary)] font-bold">{modelInfo.num_examples}</span></div>}
                {modelInfo?.trained_at && <div><span className="text-[var(--text-secondary)]">Last trained:</span> <span className="text-[var(--text-secondary)]">{new Date(modelInfo.trained_at).toLocaleString()}</span></div>}
                {trainResult?.cv_accuracy && <div><span className="text-[var(--text-secondary)]">Accuracy:</span> <span className="text-emerald-400 font-bold">{(trainResult.cv_accuracy * 100).toFixed(1)}%</span></div>}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[var(--border-subtle)] w-full mb-6 relative">
                {(['intents', 'logs'] as const).map(tab => {
                    const isActive = activeTab === tab;
                    return (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`relative px-4 py-3 text-sm font-semibold transition-colors duration-200 outline-none ${
                                isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {tab === 'intents' ? 'Intents & Examples' : 'Prediction Logs'}
                            {isActive && (
                                <motion.div
                                    layoutId="chatbotTabInd"
                                    className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-indigo-500 rounded-t-md"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'intents' ? (
                    <motion.div 
                        key="intents-view"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        {/* Left: Intents */}
                    <div className="glass-card p-5 space-y-4">
                        <h2 className="text-base font-bold text-[var(--text-primary)]">Intents ({intents.length})</h2>

                        {/* Add Intent */}
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <input value={newIntentName} onChange={e => setNewIntentName(e.target.value)}
                                    placeholder="intent_name" onKeyDown={e => e.key === 'Enter' && createIntent()}
                                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500/50" />
                                <input value={newIntentDesc} onChange={e => setNewIntentDesc(e.target.value)}
                                    placeholder="Description (e.g. Greeting)"
                                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500/50" />
                            </div>
                            <div className="flex gap-2">
                                <input value={newIntentResponse} onChange={e => setNewIntentResponse(e.target.value)}
                                    placeholder="Bot Response (e.g. Hello! How can I help you?)" onKeyDown={e => e.key === 'Enter' && createIntent()}
                                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500/50" />
                                <button onClick={createIntent}
                                    className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm font-bold hover:bg-indigo-500/30 transition">Add Intent</button>
                            </div>
                        </div>

                        {/* Intent List */}
                        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                            <AnimatePresence>
                                {intents.map((intent, idx) => (
                                    <motion.div 
                                        key={intent.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                                        onClick={() => selectIntent(intent)}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 outline-none ${selectedIntent?.id === intent.id ? 'bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-[var(--bg-secondary)] border border-transparent hover:bg-slate-100 hover:dark:bg-dark-700/50 hover:shadow-sm'
                                            }`}>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-sm font-semibold text-[var(--text-primary)]">{intent.name}</span>
                                                {intent.description && <span className="text-xs text-[var(--text-secondary)]">{intent.description}</span>}
                                            </div>
                                            {intent.response && (
                                                <div className="text-xs text-indigo-300/80 mt-1 italic truncate max-w-[200px] sm:max-w-xs block">
                                                    ↳ "{intent.response}"
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">{intent.example_count}</span>
                                            <button onClick={(e) => { e.stopPropagation(); deleteIntent(intent.id); }}
                                                className="text-red-400/50 hover:text-red-400 text-xs transition">✕</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {intents.length === 0 && <p className="text-sm text-[var(--text-muted)] text-center py-8">No intents yet. Click "<Icons.Leaf size={14} className="inline -mt-1" /> Seed Data" to get started!</p>}
                        </div>
                    </div>

                    {/* Right: Examples */}
                    <div className="glass-card p-5 space-y-4">
                        {selectedIntent ? (
                            <>
                                <h2 className="text-base font-bold text-[var(--text-primary)]">
                                    Examples for <span className="text-indigo-400">{selectedIntent.name}</span>
                                    <span className="text-[var(--text-secondary)] font-normal text-sm ml-2">({examples.length})</span>
                                </h2>

                                {/* Add single example */}
                                <div className="flex gap-2">
                                    <input value={newExampleText} onChange={e => setNewExampleText(e.target.value)}
                                        placeholder="Type an example phrase..."
                                        onKeyDown={e => e.key === 'Enter' && addExample()}
                                        className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500/50" />
                                    <button onClick={addExample}
                                        className="px-3 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm font-bold hover:bg-indigo-500/30 transition">Add</button>
                                </div>

                                {/* Bulk add */}
                                <details className="group">
                                    <summary className="text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]">Bulk add (one per line)</summary>
                                    <div className="mt-2 space-y-2">
                                        <textarea value={bulkExamples} onChange={e => setBulkExamples(e.target.value)}
                                            placeholder="how many customers&#10;total customers&#10;customer count"
                                            rows={4} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500/50 resize-none" />
                                        <button onClick={addBulkExamples}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-bold hover:bg-emerald-500/30 transition">
                                            Add All
                                        </button>
                                    </div>
                                </details>

                                {/* Examples List */}
                                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                    <AnimatePresence>
                                        {examples.map((ex, idx) => (
                                            <motion.div 
                                                key={ex.id} 
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                                                className="flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-3 py-2.5 rounded-xl group hover:shadow-sm transition-all"
                                            >
                                                <span className="text-sm text-slate-700 dark:text-dark-200 font-medium">"{ex.text}"</span>
                                                <button onClick={() => deleteExample(ex.id)}
                                                    className="text-red-400/0 group-hover:text-red-400/70 hover:!text-red-500 text-xs transition-colors p-1 rounded hover:bg-red-500/10">✕</button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] text-sm py-20 gap-3"
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-dark-700/50 flex items-center justify-center shadow-inner"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg></div>
                                <p>Select an intent to manage its examples</p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            ) : (
                /* Logs Tab */
                <motion.div 
                    key="logs-view"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-[var(--text-primary)]">Prediction Logs ({logs.length})</h2>
                        <button onClick={loadLogs} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"><Icons.RefreshCw size={14} /> Refresh</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-[var(--text-secondary)] uppercase border-b border-[var(--border-subtle)]">
                                    <th className="text-left py-2 px-2">Message</th>
                                    <th className="text-left py-2 px-2">Intent</th>
                                    <th className="text-left py-2 px-2">Confidence</th>
                                    <th className="text-left py-2 px-2">Fallback</th>
                                    <th className="text-left py-2 px-2">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {logs.map((log, idx) => (
                                        <motion.tr 
                                            key={log.id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                                            className="border-b border-[var(--border-subtle)] hover:bg-slate-50 hover:dark:bg-dark-700/30 transition-colors"
                                        >
                                            <td className="py-3 px-3 text-[var(--text-primary)] max-w-xs truncate font-medium">{log.message}</td>
                                            <td className="py-3 px-3">
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                                                    {log.predicted_intent || '—'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {log.confidence != null ? (
                                                    <span className={`font-mono text-xs font-bold ${log.confidence >= 0.7 ? 'text-emerald-500 dark:text-emerald-400' : log.confidence >= 0.4 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                                                        {(log.confidence * 100).toFixed(0)}%
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="py-3 px-3">
                                                {log.used_fallback ? <span className="text-amber-500 dark:text-amber-400 text-xs font-medium flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> Yes</span> : <span className="text-emerald-500 dark:text-emerald-400 text-xs font-medium flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> ML</span>}
                                            </td>
                                            <td className="py-3 px-3 text-xs text-[var(--text-secondary)] font-medium">{new Date(log.created_at).toLocaleString()}</td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {logs.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-8 text-[var(--text-muted)]">No predictions logged yet. Use the chatbot first!</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ChatbotTraining;
