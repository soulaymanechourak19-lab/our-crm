import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/mlService';
import { useTranslation } from 'react-i18next';
import './Chatbot.css';

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
                    return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
                }
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

/* ── SVG Icons ── */
const BotIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27A7 7 0 0 1 14 22h-4a7 7 0 0 1-6.73-3H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
        <circle cx="9.5" cy="15.5" r="1" fill="currentColor" />
        <circle cx="14.5" cy="15.5" r="1" fill="currentColor" />
    </svg>
);

const SendIcon = () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12L3 21l18-9L3 3l3 9m0 0h12" />
    </svg>
);

const Chatbot: React.FC = () => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            sender: 'bot',
            text: "Hey! I'm your CRM assistant with full database access.\n\nAsk me anything — customer details, lead stats, stock alerts, or just search for any name!",
            time: new Date().toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' }),
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
            time: new Date().toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' }),
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
                time: new Date().toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' }),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'bot',
                text: 'Connection to AI service failed. Please try again.',
                time: new Date().toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' }),
            }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg>, text: 'summary' },
        { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>, text: 'top customers' },
        { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>, text: 'leads by status' },
        { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>, text: 'low stock' }
    ];

    return (
        <div className="p-4 sm:p-6 h-[calc(100vh-100px)] max-w-5xl mx-auto flex flex-col chatbot-container">
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden chatbot-window">

                {/* ── Header ── */}
                <div className="relative px-5 py-4 flex items-center justify-between overflow-hidden chat-header-bg">
                    <div className="relative flex items-center gap-4 z-10 w-full">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center chat-bot-icon">
                            <BotIcon />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-[16px] text-white tracking-tight">{t('sidebar.aiAssistant') || 'OurCRM Intelligence'}</h3>
                            <div className="flex items-center gap-2 text-[12px] text-white/80 font-medium tracking-wide mt-0.5">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 chat-status-indicator" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 chat-status-indicator" />
                                </span>
                                {t('dashboard.systemOnline') || 'Live — Connected'}
                            </div>
                        </div>
                        <div className="relative z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/10 backdrop-blur-md border border-white/20">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            <span className="text-[11px] font-bold text-white uppercase tracking-widest">Full Access</span>
                        </div>
                    </div>
                </div>

                {/* ── Messages ── */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 chat-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={msg.id} className={`flex items-end gap-3 animate-message ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            style={{ animationDelay: `${idx * 0.05}s` }}>

                            {msg.sender === 'bot' && (
                                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center chat-msg-bot-icon">
                                    <BotIcon />
                                </div>
                            )}

                            <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 text-[14.5px] leading-relaxed relative ${msg.sender === 'user'
                                    ? 'chat-msg-user rounded-2xl'
                                    : 'chat-msg-bot rounded-2xl'
                                }`}>
                                <div className="whitespace-pre-wrap">
                                    <FormattedText text={msg.text} />
                                </div>
                                <div className={`flex items-center gap-1.5 mt-2.5 text-[11px] font-medium opacity-80 ${msg.sender === 'user' ? 'justify-end text-white/70' : 'text-gray-500'}`}>
                                    {msg.time}
                                    {msg.sender === 'user' && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-end gap-3 animate-message">
                            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center chat-msg-bot-icon">
                                <BotIcon />
                            </div>
                            <div className="chat-msg-bot px-5 py-4 rounded-2xl flex gap-1.5 items-center">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="w-2 h-2 rounded-full typing-dot"
                                        style={{ animation: `chatTypingWave 1.4s infinite ease-in-out ${i * 0.2}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} className="h-4" />
                </div>

                {/* ── Quick Suggestions ── */}
                <div className="px-4 sm:px-6 py-4 flex gap-2.5 overflow-x-auto chat-scrollbar-h">
                    {suggestions.map(s => (
                        <button key={s.text} onClick={() => sendMessage(s.text)}
                            className="whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium flex items-center gap-2 chat-suggestion-btn transition-all duration-200 cursor-pointer">
                            <span className="opacity-70">{s.icon}</span> 
                            <span className="capitalize">{s.text}</span>
                        </button>
                    ))}
                </div>

                {/* ── Input ── */}
                <div className="px-4 sm:px-6 py-4 flex gap-3 chat-input-area">
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask anything about your CRM data..."
                        className="flex-1 rounded-xl px-5 py-3.5 text-[15px] outline-none transition-all duration-200 chat-input-field"
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 chat-send-btn outline-none"
                    >
                        <SendIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
