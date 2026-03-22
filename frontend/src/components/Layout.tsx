import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import NotificationCenter from './common/NotificationCenter';

interface LayoutProps {
    children: ReactNode;
    titleKey?: string;
    subtitleKey?: string;
    title?: string;
    subtitle?: string;
}

const roleLabelMap: Record<string, string> = {
    admin: 'Administrator',
    agent_commercial: 'Commercial Agent',
    agent_sav: 'Support Agent',
};

/* ── Inline SVG icons (Lucide / Feather style) ── */
const icons = {
    dashboard: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
    ),
    leads: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    ),
    customers: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    products: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    ),
    ai: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27A7 7 0 0 1 14 22h-4a7 7 0 0 1-6.73-3H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
            <circle cx="9.5" cy="15.5" r="1" fill="currentColor" />
            <circle cx="14.5" cy="15.5" r="1" fill="currentColor" />
        </svg>
    ),
    brain: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.14.35 2.2.94 3.08A5.5 5.5 0 0 0 7 18.5V22h4v-3.5" />
            <path d="M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.14-.35 2.2-.94 3.08A5.5 5.5 0 0 1 17 18.5V22h-4v-3.5" />
            <path d="M8 10h8" />
            <path d="M9 14h6" />
        </svg>
    ),
    users: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    profile: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    logout: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    bell: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    search: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    settings: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    logs: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    performance: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    ticket: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5v2" /><path d="M15 11v2" /><path d="M15 17v2" />
            <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" />
        </svg>
    ),
    knowledge: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    ),
    check: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    quotations: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    discounts: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
    ),
    tasks: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
    ),
    analytics: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 21H3" />
            <path d="M18 17V9" />
            <path d="M14 17V5" />
            <path d="M10 17v-4" />
            <path d="M6 17v-2" />
        </svg>
    ),
    email: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    ),
};

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, titleKey, subtitleKey }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    if (!user) return null;

    const roleLabel = t(`roles.${user.role}`, roleLabelMap[user.role] ?? user.role);
    const isActive = (path: string) => location.pathname === path;
    const isActiveSub = (path: string) => location.pathname.startsWith(path);

    // Build nav items based on role
    type NavEntry = { to: string; active: boolean; icon: React.ReactNode; label: string; accentColor: string; badge?: string };
    const navItems: NavEntry[] = [];

    navItems.push({ to: '/dashboard', active: isActive('/dashboard'), icon: icons.dashboard, label: t('sidebar.dashboard'), accentColor: '#6c5ce7' });

    if (user.role === 'admin' || user.role === 'agent_commercial') {
        navItems.push({ to: '/leads', active: isActive('/leads'), icon: icons.leads, label: t('sidebar.leads', 'Leads'), accentColor: '#e84393' });
        navItems.push({ to: '/quotations', active: isActive('/quotations'), icon: icons.quotations, label: t('sidebar.quotations', 'Quotations'), accentColor: '#0984e3' });
    }
    if (user.role === 'admin' || user.role === 'agent_commercial' || user.role === 'agent_sav') {
        navItems.push({ to: '/customers', active: isActive('/customers') || isActiveSub('/customers/'), icon: icons.customers, label: t('sidebar.customers'), accentColor: '#00cec9' });
    }
    if (user.role === 'admin' || user.role === 'agent_commercial') {
        navItems.push({ to: '/products', active: isActive('/products'), icon: icons.products, label: t('sidebar.products', 'Products'), accentColor: '#fdcb6e' });
        navItems.push({ to: '/discounts', active: isActive('/discounts'), icon: icons.discounts, label: t('sidebar.discounts', 'Discounts'), accentColor: '#ff7675' });
    }
    if (user.role === 'admin' || user.role === 'agent_sav' || user.role === 'agent_commercial') {
        navItems.push({ to: '/tickets', active: isActive('/tickets') || isActiveSub('/tickets/'), icon: icons.ticket, label: t('sidebar.tickets', 'Tickets'), accentColor: '#fd79a8' });
    }
    if (user.role === 'admin' || user.role === 'agent_sav') {
        navItems.push({ to: '/sav-dashboard', active: isActive('/sav-dashboard'), icon: icons.performance, label: t('sidebar.savDashboard', 'SAV Dashboard'), accentColor: '#00b894' });
    }
    if (user.role === 'admin' || user.role === 'agent_sav') {
        navItems.push({ to: '/chatbot', active: isActive('/chatbot'), icon: icons.ai, label: t('sidebar.aiAssistant'), accentColor: '#a29bfe', badge: t('sidebar.new') });
    }
    navItems.push({ to: '/tasks', active: isActive('/tasks'), icon: icons.tasks, label: t('sidebar.tasks', 'Tasks'), accentColor: '#e17055' });
    if (user.role === 'admin' || user.role === 'agent_commercial') {
        navItems.push({ to: '/analytics', active: isActive('/analytics'), icon: icons.analytics, label: t('sidebar.analytics', 'Analytics'), accentColor: '#0984e3' });
    }

    const settingsItems: NavEntry[] = [];
    if (user.role === 'admin') {
        settingsItems.push({ to: '/admin/users', active: isActive('/admin/users'), icon: icons.users, label: t('sidebar.users'), accentColor: '#74b9ff' });
    }
    settingsItems.push({ to: '/profile', active: isActive('/profile'), icon: icons.profile, label: t('sidebar.profile'), accentColor: '#e17055' });
    if (user.role === 'admin') {
        settingsItems.push({ to: '/email-templates', active: isActive('/email-templates'), icon: icons.email, label: t('sidebar.emailTemplates', 'Email Templates'), accentColor: '#e84393' });
    }

    return (
        <div className="dashboard-layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                {/* Brand */}
                <div className="sidebar-brand">
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6c5ce7, #e84393)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(108, 92, 231, 0.35)',
                    }}>
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>C</span>
                    </div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>OurCRM</span>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav" style={{ gap: '3px' }}>
                    {navItems.map(item => (
                        <SidebarLink key={item.to} {...item} />
                    ))}

                    <div style={{
                        marginTop: '24px', marginBottom: '8px', padding: '0 14px',
                        fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)',
                        textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.6
                    }}>{t('sidebar.settingsSection')}</div>

                    {settingsItems.map(item => (
                        <SidebarLink key={item.to} {...item} />
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div style={{
                        padding: '14px', borderRadius: '14px',
                        background: 'rgba(108, 92, 231, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '12px', marginLeft: '4px', marginRight: '4px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #6c5ce7, #e84393)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: '1.05rem',
                                boxShadow: '0 2px 10px rgba(108, 92, 231, 0.3)',
                            }}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                                <p style={{ margin: 0, fontSize: '0.62rem', color: '#a29bfe', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{roleLabel}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            width: 'calc(100% - 8px)', margin: '0 4px', padding: '10px 14px',
                            borderRadius: '12px', textAlign: 'left', fontWeight: 600, fontSize: '0.88rem',
                            color: '#ff7675', border: 'none', background: 'transparent',
                            cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 118, 117, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <span style={{ opacity: 0.9 }}>{icons.logout}</span> {t('sidebar.logout')}
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="main-content">
                <header className="top-bar">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>{titleKey ? t(titleKey) : title}</h2>
                        {(subtitleKey || subtitle) && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>{subtitleKey ? t(subtitleKey) : subtitle}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 14px', borderRadius: '10px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                        }}>
                            {icons.search}
                            <input type="text" placeholder="Search..." style={{
                                background: 'transparent', border: 'none', outline: 'none',
                                color: 'var(--text-primary)', fontSize: '0.82rem', width: '140px', fontFamily: 'inherit',
                            }} />
                        </div>
                        <NotificationCenter />
                    </div>
                </header>
                <div className="layout-children">
                    {children}
                </div>
            </main>
        </div>
    );
};

/* ── Sidebar Link sub-component ── */
const SidebarLink: React.FC<{
    to: string;
    active: boolean;
    icon: React.ReactNode;
    label: string;
    accentColor: string;
    badge?: string;
}> = ({ to, active, icon, label, accentColor, badge }) => (
    <Link to={to} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '12px',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: '0.88rem', fontWeight: active ? 600 : 500,
        textDecoration: 'none', position: 'relative',
        background: active ? 'rgba(108, 92, 231, 0.1)' : 'transparent',
        borderLeft: active ? `3px solid ${accentColor}` : '3px solid transparent',
        transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
        if (!active) {
            e.currentTarget.style.background = 'rgba(108, 92, 231, 0.06)';
            e.currentTarget.style.color = 'var(--text-primary)';
        }
    }}
    onMouseLeave={(e) => {
        if (!active) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
        }
    }}
    >
        <span style={{ display: 'flex', alignItems: 'center', width: '22px', justifyContent: 'center' }}>{icon}</span>
        <span>{label}</span>
        {badge && (
            <span style={{
                marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                color: '#e84393', background: 'rgba(232, 67, 147, 0.1)',
                padding: '2px 8px', borderRadius: '10px',
            }}>{badge}</span>
        )}
    </Link>
);

export default Layout;
