import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/mlService';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    time: string;
}

/** Simple markdown-like renderer for **bold** and \n */
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
                }
                // Split by newline for line breaks
                const lines = part.split('\n');
                return lines.map((line, j) => (
                    <React.Fragment key={`${i}-${j}`}>
                        {j > 0 && <br />}
                        {line}
                    </React.Fragment>
                ));
            })}
        </>
    );
};

const Chatbot: React.FC = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            sender: 'bot',
            text: "Hey! 👋 I'm your CRM assistant with full database access.\n\nAsk me anything — customer details, lead stats, stock alerts, or just search for any name!",
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
    ]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const msgText = text || input.trim();
        if (!msgText || loading) return;

        const userMsg: Message = {
            id: Date.now(),
            sender: 'user',
            text: msgText,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        inputRef.current?.focus();

        try {
            const data = await sendChatMessage(userMsg.text);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'bot',
                text: data.response || "I couldn't process that request.",
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'bot',
                text: '❌ Connection to AI service failed.',
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        { icon: '📊', text: 'summary' },
        { icon: '👥', text: 'top customers' },
        { icon: '🎯', text: 'leads by status' },
        { icon: '⚠️', text: 'low stock' },
        { icon: '📈', text: 'conversion rate' },
        { icon: '💰', text: 'pricing' },
    ];

    return (
        <div className="p-4 sm:p-6 h-[calc(100vh-100px)] max-w-5xl mx-auto flex flex-col">
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl" style={{ background: 'linear-gradient(180deg, #0c1222 0%, #0a0f1c 100%)' }}>

                {/* ── Header ── */}
                <div className="relative px-5 py-4 flex items-center justify-between overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-violet-600/90 to-purple-600/90" />
                    <div className="absolute inset-0 backdrop-blur-sm" />
                    <div className="relative flex items-center gap-3 z-10">
                        <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl border border-white/10 shadow-lg">
                            🤖
                        </div>
                        <div>
                            <h3 className="font-bold text-[15px] text-white tracking-tight">OurCRM Intelligence</h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-white/70 font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                                </span>
                                Live — Connected to database
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Full Access</span>
                    </div>
                </div>

                {/* ── Messages ── */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 chat-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            style={{ animation: `fadeSlideIn 0.3s ease ${idx * 0.05}s both` }}>

                            {msg.sender === 'bot' && (
                                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex-shrink-0 flex items-center justify-center text-xs border border-indigo-500/20">
                                    🤖
                                </div>
                            )}

                            <div className={`max-w-[82%] sm:max-w-[72%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-md shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-800/60 backdrop-blur-sm border border-slate-700/40 text-slate-300 rounded-bl-md'
                                }`}>
                                <div className="whitespace-pre-wrap">
                                    <FormattedText text={msg.text} />
                                </div>
                                <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-medium ${msg.sender === 'user' ? 'text-white/50' : 'text-slate-600'
                                    }`}>
                                    {msg.time}
                                    {msg.sender === 'user' && <span className="text-white/40">✓✓</span>}
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-end gap-2" style={{ animation: 'fadeSlideIn 0.3s ease both' }}>
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex-shrink-0 flex items-center justify-center text-xs border border-indigo-500/20">
                                🤖
                            </div>
                            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/40 rounded-2xl rounded-bl-md px-5 py-4 flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                                        style={{ animation: `typingDot 1.4s infinite ${i * 0.2}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* ── Quick Suggestions ── */}
                <div className="px-4 sm:px-5 py-3 border-t border-slate-800/80 flex gap-2 overflow-x-auto chat-scrollbar-h">
                    {suggestions.map(s => (
                        <button key={s.text} onClick={() => sendMessage(s.text)}
                            className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-semibold
                         bg-slate-800/50 text-slate-400 border border-slate-700/50
                         hover:bg-indigo-500/15 hover:text-indigo-300 hover:border-indigo-500/30
                         active:scale-95 transition-all duration-200 cursor-pointer">
                            {s.icon} {s.text}
                        </button>
                    ))}
                </div>

                {/* ── Input ── */}
                <div className="px-4 sm:px-5 py-3.5 border-t border-slate-800/80 flex gap-3" style={{ background: 'rgba(10,15,28,0.8)' }}>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask anything about your CRM data..."
                        className="flex-1 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl px-4 py-3 text-[14px]
                       outline-none focus:border-indigo-500/40 focus:bg-slate-800/80 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]
                       transition-all duration-200 placeholder:text-slate-600"
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105
                       active:scale-95 transition-all duration-200 outline-none"
                    >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12L3 21l18-9L3 3l3 9m0 0h12" />
                        </svg>
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        .chat-scrollbar::-webkit-scrollbar { width: 5px; }
        .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .chat-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.15); border-radius: 10px; }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.3); }
        .chat-scrollbar-h::-webkit-scrollbar { height: 3px; }
        .chat-scrollbar-h::-webkit-scrollbar-track { background: transparent; }
        .chat-scrollbar-h::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.15); border-radius: 10px; }
      `}</style>
        </div>
    );
};

export default Chatbot;
