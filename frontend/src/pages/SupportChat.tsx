import React, { useState, useRef, useEffect } from 'react';
import './SupportChat.css';

/* ── Types ──────────────────────────────────────────────────────── */
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    time: string;
    ticketData?: { ticket_number: string; priority: string; agent: string };
}

/* ── SVG Icons ──────────────────────────────────────────────────── */
const BotIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27A7 7 0 0 1 14 22h-4a7 7 0 0 1-6.73-3H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
        <circle cx="9.5" cy="15.5" r="1" fill="currentColor" /><circle cx="14.5" cy="15.5" r="1" fill="currentColor" />
    </svg>
);

const SendIcon = () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12L3 21l18-9L3 3l3 9m0 0h12" />
    </svg>
);

/* ── Formatted text (bold + newlines) ───────────────────────────── */
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return part.split('\n').map((line, j) => (
                    <React.Fragment key={`${i}-${j}`}>
                        {j > 0 && <br />}
                        {line}
                    </React.Fragment>
                ));
            })}
        </>
    );
};

/* ── Ticket Success Card ────────────────────────────────────────── */
const TicketCard: React.FC<{ data: { ticket_number: string; priority: string; agent: string } }> = ({ data }) => (
    <div className="sc-ticket-card">
        <h4>✅ Ticket Created Successfully!</h4>
        <div className="sc-ticket-detail"><span className="sc-ticket-label">Ticket #</span><span className="sc-ticket-value">{data.ticket_number}</span></div>
        <div className="sc-ticket-detail"><span className="sc-ticket-label">Priority</span><span className="sc-ticket-value" style={{ textTransform: 'capitalize' }}>{data.priority}</span></div>
        <div className="sc-ticket-detail"><span className="sc-ticket-label">Assigned to</span><span className="sc-ticket-value">{data.agent}</span></div>
        <div className="sc-ticket-detail"><span className="sc-ticket-label">Status</span><span className="sc-ticket-value" style={{ color: '#22c55e' }}>Open</span></div>
    </div>
);

/* ── Quick suggestion chips ─────────────────────────────────────── */
const defaultChips = [
    { icon: '📦', text: 'Where is my order?' },
    { icon: '🔄', text: 'I want to return an item' },
    { icon: '🔐', text: "I can't access my account" },
    { icon: '🛠️', text: 'My product is broken' },
    { icon: '💬', text: 'Talk to an agent' },
];

/* ═══════════════════════════════════════════════════════════════════
   SMART CLIENT-SIDE FAQ ENGINE
   Instant responses — no backend dependency for FAQ
   ═══════════════════════════════════════════════════════════════════ */

interface FAQEntry {
    keywords: string[];
    answer: string;
    followUpChips?: string[];
}

const faqDatabase: FAQEntry[] = [
    // ── Order & Delivery ─────────────────────────────────────────
    {
        keywords: ['order', 'delivery', 'shipping', 'track', 'where is my', 'commande', 'livraison', 'suivi', 'colis', 'expédition', 'shipped', 'package', 'arrive', 'arriving'],
        answer: "📦 **Order & Delivery Information**\n\nHere's what you need to know:\n\n• **Standard delivery**: 3-5 business days\n• **Express delivery**: 1-2 business days\n• **Track your order**: Check your confirmation email for a tracking link\n• **International**: 7-14 business days depending on destination\n\n💡 If your order is more than **7 days late**, I'd recommend creating a support ticket so our logistics team can investigate right away!\n\nWould you like to **create a ticket**, or do you have another question?",
        followUpChips: ['Create a ticket', 'What about express?', 'International shipping'],
    },

    // ── Returns & Refunds ────────────────────────────────────────
    {
        keywords: ['return', 'refund', 'exchange', 'money back', 'retour', 'remboursement', 'échange', 'rembourser', 'send back', 'give back'],
        answer: "🔄 **Returns & Refund Policy**\n\nWe want you to be completely satisfied!\n\n• **Return window**: 30 days from delivery date\n• **Condition**: Items must be unused, in original packaging\n• **How to return**:\n  1. Keep your order number ready\n  2. Say **\"create a ticket\"** and I'll start the process\n  3. Our team will send you a prepaid return label\n• **Refund timeline**: 5-10 business days after we receive the item\n• **Exchanges**: Free of charge for the same product in a different size/color\n\nWould you like me to **start a return** for you?",
        followUpChips: ['Start a return', 'How long for refund?', 'Can I exchange?'],
    },

    // ── Account Issues ───────────────────────────────────────────
    {
        keywords: ['password', 'login', 'log in', 'sign in', 'account', 'access', 'locked', 'mot de passe', 'connexion', 'compte', 'accès', 'forgot', 'reset', 'cant login', "can't login", "can't access", 'unable to login'],
        answer: "🔐 **Account Access Help**\n\n**Forgot your password?**\n1. Go to the login page\n2. Click **\"Forgot Password\"**\n3. Enter your email address\n4. Check your inbox (and spam folder!) for a reset link\n5. The link expires in 60 minutes\n\n**Account locked?**\nAfter 5 failed attempts, accounts are temporarily locked for **30 minutes** for security.\n\n**Email not recognized?**\nYou may have registered with a different email. Try your work or personal email.\n\n**Still stuck?** I can create a priority support ticket, and our team will help you regain access within **a few hours**! 🔑",
        followUpChips: ['Create a ticket', 'I forgot my email too', 'Account was hacked'],
    },

    // ── Product Issues (immediate escalation) ────────────────────
    {
        keywords: ['broken', 'defective', 'damaged', 'not working', "doesn't work", "doesn't turn on", 'quality', 'issue with product', 'cassé', 'défectueux', 'endommagé', 'ne fonctionne pas', 'panne', 'problème', 'malfunctioning', 'dead', 'faulty'],
        answer: "🛠️ **I'm really sorry to hear about that!**\n\nProduct issues are our **top priority**, and I want to make sure this gets resolved quickly for you.\n\nHere's what I recommend:\n\n1. **If purchased within 30 days** → We'll send you a replacement right away\n2. **If under warranty** → Free repair or replacement\n3. **If you need urgent help** → Our technical team can troubleshoot with you\n\nLet me create a **support ticket** so our team can help you personally. 🎫\n\nPlease click **\"Create a ticket\"** below, or just share your **email** and I'll set everything up!",
        followUpChips: ['Create a ticket', 'Is it under warranty?', 'I want a refund instead'],
    },

    // ── Pricing & Discounts ──────────────────────────────────────
    {
        keywords: ['price', 'pricing', 'cost', 'how much', 'discount', 'promotion', 'coupon', 'prix', 'tarif', 'combien', 'réduction', 'promo', 'sale', 'cheaper', 'deal', 'offer'],
        answer: "💰 **Pricing & Promotions**\n\n• **Product prices** are listed on each product page\n• **Bulk discounts**: Available for orders of **10+ items** (up to 25% off!)\n• **Seasonal promotions**: Announced on our homepage and via email newsletter\n• **Loyalty rewards**: Earn points with every purchase for future discounts\n• **Custom quotes**: Available for enterprise & business needs\n\n💡 **Pro tip**: Subscribe to our newsletter for exclusive deals!\n\nNeed a **personalized quote** for a large order? I can create a ticket for our sales team! 🎫",
        followUpChips: ['Get a custom quote', 'How do loyalty points work?', 'Current promotions'],
    },

    // ── Contact / Hours ──────────────────────────────────────────
    {
        keywords: ['contact', 'phone', 'email address', 'hours', 'open', 'reach', 'support hours', 'horaires', 'téléphone', 'joindre', 'heures', 'call', 'when are you'],
        answer: "📞 **Contact & Support Hours**\n\n• **Live Chat** (this chatbot): **24/7** — I never sleep! 🤖\n• **Support team**: Monday–Friday, **9AM – 6PM** (CET)\n• **Email**: support@ourcrm.com\n• **Response time**: Within **24 hours** for normal requests, **4 hours** for urgent ones\n• **Weekend emergencies**: Create a ticket marked as urgent, and our on-call team will be notified\n\nI'm always here to help! What else can I do for you? 😊",
        followUpChips: ['Create an urgent ticket', 'Email support', 'Where are you located?'],
    },

    // ── Warranty ─────────────────────────────────────────────────
    {
        keywords: ['warranty', 'guarantee', 'garantie', 'couvert', 'covered', 'warranty claim', 'extended warranty'],
        answer: "🛡️ **Warranty Coverage**\n\n• **Standard warranty**: **1 year** from purchase date\n• **Extended warranty**: Available at checkout (+1 or +2 years)\n• **What's covered**:\n  ✅ Manufacturing defects\n  ✅ Hardware failures\n  ✅ Battery issues\n• **What's NOT covered**:\n  ❌ Physical damage (drops, spills)\n  ❌ Unauthorized modifications\n  ❌ Normal wear and tear\n\n**File a warranty claim?** Just say \"create a ticket\" and provide your order number. We'll handle the rest! 🎫",
        followUpChips: ['File a warranty claim', 'Buy extended warranty', 'What counts as a defect?'],
    },

    // ── Payment & Billing ────────────────────────────────────────
    {
        keywords: ['payment', 'pay', 'invoice', 'billing', 'charge', 'credit card', 'paiement', 'facture', 'carte', 'facturation', 'charged twice', 'double charge', 'bank', 'visa', 'mastercard', 'paypal'],
        answer: "💳 **Payment & Billing**\n\n**Accepted methods:**\n• Visa, Mastercard, American Express\n• PayPal, Apple Pay, Google Pay\n• Bank Transfer (for orders over $100)\n\n**Invoices**: Automatically sent to your email after purchase\n\n**Billing issues?**\n• **Double charged?** Usually an authorization hold — it clears within 48h\n• **Wrong amount?** Let's create a ticket and our billing team will investigate\n• **Payment plans**: Available for orders over **$500**\n\nNeed help with a billing issue? I'll create a priority ticket! 🎫",
        followUpChips: ['I was charged twice', 'Need an invoice', 'Set up payment plan'],
    },

    // ── Subscription / Cancel ────────────────────────────────────
    {
        keywords: ['cancel', 'subscription', 'unsubscribe', 'stop', 'end my', 'annuler', 'résiliation', 'désabonner'],
        answer: "🔔 **Subscription & Cancellation**\n\n**Cancel a subscription:**\n1. Log into your account\n2. Go to **Settings → Subscriptions**\n3. Click **\"Cancel\"** on the relevant plan\n4. You'll keep access until the end of your billing period\n\n**Important:**\n• No cancellation fees\n• Data is retained for 30 days after cancellation\n• You can reactivate anytime\n\n**Having trouble?** I can create a ticket and our team will handle the cancellation for you! 🎫",
        followUpChips: ['Cancel for me', 'Pause instead of cancel', 'Will I lose my data?'],
    },

    // ── Technical / App Issues ───────────────────────────────────
    {
        keywords: ['bug', 'error', 'crash', 'slow', 'loading', 'not loading', 'blank', 'freezing', 'glitch', 'technical', 'app not working', 'website down', 'page error'],
        answer: "🔧 **Technical Troubleshooting**\n\nLet's try fixing this!\n\n**Quick fixes to try:**\n1. 🔄 **Refresh** the page (Ctrl+F5 or Cmd+Shift+R)\n2. 🗑️ **Clear your browser cache** and cookies\n3. 🌐 Try a **different browser** (Chrome, Firefox, Edge)\n4. 📱 If on mobile, try **updating the app**\n5. 🔌 Check your **internet connection**\n\n**Still not working?** No worries — let me create a technical support ticket with details about your issue. Our engineers are really fast at resolving these! ⚡",
        followUpChips: ['Create a ticket', 'How to clear cache?', 'Is the site down?'],
    },

    // ── Shipping cost ────────────────────────────────────────────
    {
        keywords: ['shipping cost', 'delivery cost', 'free shipping', 'shipping fee', 'frais de livraison', 'livraison gratuite'],
        answer: "🚚 **Shipping Costs**\n\n• **Free shipping**: On all orders over **$50**! 🎉\n• **Standard** (3-5 days): $4.99\n• **Express** (1-2 days): $12.99\n• **International**: Starting at $14.99\n\n💡 **Pro tip**: Add a small item to reach the $50 threshold for free shipping!\n\nAnything else I can help with?",
        followUpChips: ['Where is my order?', 'International delivery times', 'Create a ticket'],
    },
];

// ── Escalation keywords ─────────────────────────────────────────
const escalationKeywords = [
    'speak to', 'talk to', 'agent', 'human', 'real person', 'supervisor',
    'manager', 'escalate', 'create ticket', 'create a ticket', 'open ticket',
    'file complaint', 'complaint', 'not helpful', 'useless', 'cancel for me',
    'start a return', 'file a warranty', 'get a custom quote', 'urgent ticket',
    'parler à', 'parler a', 'agent humain', 'personne réelle', 'personne reelle',
    'créer un ticket', 'creer un ticket', 'ouvrir un ticket',
    'réclamation', 'reclamation', 'charged twice', 'i was charged',
];

// ── Greeting patterns ────────────────────────────────────────────
const greetingKeywords = ['hello', 'hi', 'hey', 'bonjour', 'salut', 'salam', 'good morning', 'good afternoon', 'bonsoir', 'yo', 'howdy'];
const thanksKeywords = ['thank', 'merci', 'thanks', 'thx', 'appreciate', 'helpful'];
const byeKeywords = ['bye', 'goodbye', 'au revoir', 'ciao', 'see you', 'that\'s all'];

function matchFAQ(msg: string): { answer: string; chips?: string[] } | null {
    const lower = msg.toLowerCase().trim();

    // Check for escalation intent
    for (const phrase of escalationKeywords) {
        if (lower.includes(phrase)) {
            return {
                answer: "I understand you'd like more personalized help! 🎫\n\nI'll create a support ticket for you right away. Our team is really responsive — most tickets are answered within **a few hours**.\n\nPlease provide your **email address** so we can track your request and get back to you.",
                chips: [],
            };
        }
    }

    // Check for greetings
    for (const g of greetingKeywords) {
        if (lower.includes(g) || lower === g) {
            return {
                answer: "Hello! 👋 Welcome to **OurCRM Support**!\n\nI'm your virtual assistant and I'm here to help. I can answer questions about:\n\n• 📦 **Orders & Deliveries** — tracking, shipping times\n• 🔄 **Returns & Refunds** — 30-day returns, exchanges\n• 🔐 **Account Access** — password reset, login issues\n• 🛠️ **Product Issues** — defective, damaged items\n• 💰 **Pricing & Billing** — discounts, payment methods\n• 🛡️ **Warranty** — coverage, claims\n• 🔧 **Technical Issues** — app bugs, errors\n\nJust **describe your issue** or pick one of the quick options below! 👇",
                chips: ['Where is my order?', 'I want to return an item', 'My product is broken', 'Talk to an agent'],
            };
        }
    }

    // Check for thanks
    for (const t of thanksKeywords) {
        if (lower.includes(t)) {
            return {
                answer: "You're very welcome! 😊 I'm glad I could help!\n\nIs there anything else I can assist you with? I'm here anytime you need me! 🌟",
                chips: ['I have another question', 'That\'s all, thanks!'],
            };
        }
    }

    // Check for goodbye
    for (const b of byeKeywords) {
        if (lower.includes(b)) {
            return {
                answer: "Goodbye! 👋 It was great chatting with you!\n\nRemember, I'm available **24/7** right here whenever you need help. Have a wonderful day! 🌟",
                chips: [],
            };
        }
    }

    // Check FAQ database
    for (const faq of faqDatabase) {
        for (const keyword of faq.keywords) {
            if (lower.includes(keyword)) {
                return { answer: faq.answer, chips: faq.followUpChips };
            }
        }
    }

    return null;
}

function getSmartFallback(failedCount: number): { answer: string; chips?: string[] } {
    if (failedCount === 0) {
        return {
            answer: "Hmm, I'm not quite sure I understood that. 🤔\n\nCould you try rephrasing? Here are some things I can help with:\n\n• **\"Where is my order?\"** — delivery tracking & shipping info\n• **\"I want to return an item\"** — returns & refund policy\n• **\"I can't log in\"** — account access help\n• **\"My product is broken\"** — product issues & warranty\n• **\"How much does shipping cost?\"** — pricing info\n• **\"Talk to an agent\"** — get human support\n\nOr just describe your issue in simple words! 😊",
            chips: ['Where is my order?', 'Return an item', 'Account help', 'Talk to an agent'],
        };
    }
    if (failedCount === 1) {
        return {
            answer: "I'm still having trouble understanding. 😅 Let me try to help differently!\n\n**Try using simple keywords** like:\n• \"order\" or \"delivery\"\n• \"return\" or \"refund\"\n• \"password\" or \"login\"\n• \"broken\" or \"defective\"\n\nOr if you'd prefer, say **\"create a ticket\"** and I'll connect you with a real support agent who can help with anything! 🙏",
            chips: ['Create a ticket', 'Order help', 'Account help', 'Product issue'],
        };
    }
    return {
        answer: "I'm sorry I haven't been able to help with your specific question. 😔\n\nLet me connect you with a **real support agent** who can definitely help! I'll create a ticket for you right away.\n\nPlease provide your **email address** and I'll set everything up. Our team typically responds within **a few hours**! 🎫",
        chips: [],
    };
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
const SupportChat: React.FC = () => {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1, sender: 'bot',
            text: "Hello! 👋 Welcome to **OurCRM Support**!\n\nI'm your virtual assistant and I'm here to help. You can ask me about:\n\n• 📦 Orders & Deliveries\n• 🔄 Returns & Refunds\n• 🔐 Account Access\n• 🛠️ Product Issues\n• 💰 Pricing & Billing\n• 🛡️ Warranty & Guarantees\n\nHow can I help you today? 😊",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [failedCount, setFailedCount] = useState(0);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailForm, setEmailForm] = useState({ email: '', name: '', subject: '', description: '' });
    const [submittingTicket, setSubmittingTicket] = useState(false);
    const [conversationLog, setConversationLog] = useState('');
    const [activeChips, setActiveChips] = useState(defaultChips.map(c => c.text));

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    /* ── Send message — client-side first, API fallback ─────────── */
    const sendMessage = async (text?: string) => {
        const msgText = text || input.trim();
        if (!msgText || loading) return;

        const userMsg: Message = { id: Date.now(), sender: 'user', text: msgText, time: now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Update conversation log
        setConversationLog(prev => prev + `\n[Client]: ${msgText}`);

        // Simulate typing delay for natural feel
        const typingDelay = Math.min(800 + msgText.length * 15, 2000);
        await new Promise(resolve => setTimeout(resolve, typingDelay));

        // ── Client-side FAQ matching ────────────────────────────
        const faqResult = matchFAQ(msgText);

        if (faqResult) {
            const botMsg: Message = { id: Date.now() + 1, sender: 'bot', text: faqResult.answer, time: now() };
            setMessages(prev => [...prev, botMsg]);
            setConversationLog(prev => prev + `\n[Bot]: ${faqResult.answer}`);
            setFailedCount(0);

            // Update chips
            if (faqResult.chips && faqResult.chips.length > 0) {
                setActiveChips(faqResult.chips);
            } else if (faqResult.chips && faqResult.chips.length === 0) {
                // Escalation — show email modal
                setEmailForm(prev => ({
                    ...prev,
                    subject: `Support: ${msgText.slice(0, 80)}`,
                    description: msgText,
                }));
                setTimeout(() => setShowEmailModal(true), 600);
                setActiveChips([]);
            }
        } else {
            // No FAQ match — smart fallback
            const newFailed = failedCount + 1;
            const fallback = getSmartFallback(failedCount);
            const botMsg: Message = { id: Date.now() + 1, sender: 'bot', text: fallback.answer, time: now() };
            setMessages(prev => [...prev, botMsg]);
            setConversationLog(prev => prev + `\n[Bot]: ${fallback.answer}`);
            setFailedCount(newFailed);

            if (fallback.chips && fallback.chips.length > 0) {
                setActiveChips(fallback.chips);
            } else {
                // Auto-escalation after 3 failures
                setEmailForm(prev => ({
                    ...prev,
                    subject: `Support request - ${msgText.slice(0, 80)}`,
                    description: msgText,
                }));
                setTimeout(() => setShowEmailModal(true), 600);
                setActiveChips([]);
            }
        }

        setLoading(false);
        inputRef.current?.focus();
    };

    /* ── Create ticket via API ──────────────────────────────────── */
    const submitTicket = async () => {
        if (!emailForm.email || !emailForm.subject) return;
        setSubmittingTicket(true);

        try {
            const res = await fetch(`${API_BASE}/support/ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailForm.email,
                    name: emailForm.name,
                    subject: emailForm.subject,
                    description: emailForm.description,
                    conversation: conversationLog,
                }),
            });
            const data = await res.json();

            setShowEmailModal(false);

            if (data.success) {
                const ticketMsg: Message = {
                    id: Date.now(), sender: 'bot', time: now(),
                    text: `🎫 **Great news!** Your support ticket has been created!\n\nTicket **#${data.ticket_number}** has been assigned to **${data.agent}** with **${data.priority}** priority.\n\nYou'll receive updates at **${emailForm.email}**.\n\nOur team will get back to you as soon as possible! 🙏\n\nIs there anything else I can help you with? 😊`,
                    ticketData: { ticket_number: data.ticket_number, priority: data.priority, agent: data.agent },
                };
                setMessages(prev => [...prev, ticketMsg]);
                setFailedCount(0);
                setActiveChips(['I have another question', "That's all, thanks!"]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now(), sender: 'bot', time: now(),
                    text: "Sorry, I wasn't able to create the ticket right now. 😔\n\nPlease try again, or email us directly at **support@ourcrm.com** — our team will respond within 24 hours! 📧",
                }]);
                setActiveChips(['Try again', 'Email support']);
            }
        } catch {
            setShowEmailModal(false);
            setMessages(prev => [...prev, {
                id: Date.now(), sender: 'bot', time: now(),
                text: "I'm having trouble connecting to our ticket system. 😔\n\nDon't worry! You can reach us directly at **support@ourcrm.com** — just include your issue details and we'll get back to you within 24 hours. 📧\n\nI apologize for the inconvenience! 🙏",
            }]);
            setActiveChips(['Try again', 'Email support']);
        } finally {
            setSubmittingTicket(false);
            setEmailForm({ email: '', name: '', subject: '', description: '' });
        }
    };

    /* ── Render ──────────────────────────────────────────────────── */
    return (
        <div className="support-page">
            {/* Navbar */}
            <nav className="sc-navbar">
                <span className="sc-logo">OurCRM</span>
                <div className="sc-nav-links">
                    <a href="#/" className="sc-nav-link">Home</a>
                    <a href="#/login" className="sc-nav-link primary">Sign In</a>
                </div>
            </nav>

            {/* Chat container */}
            <div className="sc-container">
                <div className="sc-window">
                    {/* Header */}
                    <div className="sc-header">
                        <div className="sc-header-icon"><BotIcon /></div>
                        <div className="sc-header-info">
                            <h2>Support Assistant</h2>
                            <div className="sc-header-status">
                                <span className="sc-status-dot" />
                                Online — Ready to help
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="sc-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`sc-msg ${msg.sender}`}>
                                <div className="sc-msg-avatar">
                                    {msg.sender === 'bot' ? <BotIcon /> : '👤'}
                                </div>
                                <div>
                                    <div className="sc-msg-bubble">
                                        <FormattedText text={msg.text} />
                                        {msg.ticketData && <TicketCard data={msg.ticketData} />}
                                    </div>
                                    <div className="sc-msg-time">{msg.time}</div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="sc-typing">
                                <div className="sc-msg-avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BotIcon />
                                </div>
                                <div className="sc-typing-dots">
                                    <div className="sc-typing-dot" />
                                    <div className="sc-typing-dot" />
                                    <div className="sc-typing-dot" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} style={{ height: 8 }} />
                    </div>

                    {/* Dynamic quick chips */}
                    {activeChips.length > 0 && (
                        <div className="sc-chips">
                            {activeChips.map(c => {
                                const icon = c.includes('order') ? '📦' : c.includes('return') ? '🔄' : c.includes('account') || c.includes('login') ? '🔐' : c.includes('broken') || c.includes('product') || c.includes('Product') ? '🛠️' : c.includes('agent') || c.includes('ticket') || c.includes('Ticket') || c.includes('Create') ? '🎫' : c.includes('warranty') || c.includes('Warranty') ? '🛡️' : c.includes('another') ? '💬' : c.includes('thanks') || c.includes("That's all") ? '👋' : c.includes('Try') ? '🔄' : '💡';
                                return (
                                    <button key={c} className="sc-chip" onClick={() => sendMessage(c)}>
                                        <span>{icon}</span> {c}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Input */}
                    <div className="sc-input-area">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Describe your issue or ask a question..."
                            className="sc-input"
                        />
                        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="sc-send-btn">
                            <SendIcon />
                        </button>
                    </div>
                </div>
            </div>

            {/* Email / Ticket Modal */}
            {showEmailModal && (
                <div className="sc-modal-overlay" onClick={() => setShowEmailModal(false)}>
                    <div className="sc-modal" onClick={e => e.stopPropagation()}>
                        <h3>🎫 Create Support Ticket</h3>
                        <p>Please provide your details so our team can follow up with you. We typically respond within a few hours!</p>

                        <div className="sc-modal-field">
                            <label>Email *</label>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={emailForm.email}
                                onChange={e => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                                autoFocus
                            />
                        </div>
                        <div className="sc-modal-field">
                            <label>Your Name (optional)</label>
                            <input
                                type="text"
                                placeholder="Your name"
                                value={emailForm.name}
                                onChange={e => setEmailForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="sc-modal-field">
                            <label>Subject *</label>
                            <input
                                type="text"
                                placeholder="Brief description of your issue"
                                value={emailForm.subject}
                                onChange={e => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                            />
                        </div>
                        <div className="sc-modal-field">
                            <label>Details</label>
                            <textarea
                                placeholder="Tell us more about your issue so our team can help faster..."
                                value={emailForm.description}
                                onChange={e => setEmailForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="sc-modal-btns">
                            <button className="sc-modal-cancel" onClick={() => setShowEmailModal(false)}>Cancel</button>
                            <button className="sc-modal-submit" onClick={submitTicket} disabled={!emailForm.email || !emailForm.subject || submittingTicket}>
                                {submittingTicket ? 'Creating...' : '🎫 Create Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportChat;
