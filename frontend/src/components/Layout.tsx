import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: ReactNode;
    title?: string;
}

const roleLabelMap: Record<string, string> = {
    admin: 'Administrator',
    agent_commercial: 'Commercial Agent',
    agent_sav: 'Support Agent',
};

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const roleLabel = roleLabelMap[user.role] ?? user.role;

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="dashboard-layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="10" fill="url(#sidebarGrad)" />
                        <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="18" fontWeight="700">C</text>
                        <defs>
                            <linearGradient id="sidebarGrad" x1="0" y1="0" x2="40" y2="40">
                                <stop stopColor="#6366f1" />
                                <stop offset="1" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span>CRM</span>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                        <span className="nav-icon">🏠</span> Dashboard
                    </Link>

                    {(user.role === 'admin' || user.role === 'agent_commercial') && (
                        <Link to="/leads" className={`nav-item ${isActive('/leads') ? 'active' : ''}`}>
                            <span className="nav-icon">🎯</span> Leads
                        </Link>
                    )}

                    {(user.role === 'admin' || user.role === 'agent_commercial' || user.role === 'agent_sav') && (
                        <Link to="/customers" className={`nav-item ${isActive('/customers') || location.pathname.startsWith('/customers/') ? 'active' : ''}`}>
                            <span className="nav-icon">🤝</span> Customers
                        </Link>
                    )}

                    {(user.role === 'admin' || user.role === 'agent_commercial') && (
                        <Link to="/dashboard" className="nav-item">
                            <span className="nav-icon">📦</span> Products
                        </Link>
                    )}

                    {(user.role === 'admin' || user.role === 'agent_sav') && (
                        <Link to="/dashboard" className="nav-item">
                            <span className="nav-icon">🎫</span> Tickets
                        </Link>
                    )}

                    {user.role === 'admin' && (
                        <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
                            <span className="nav-icon">👥</span> Users
                        </Link>
                    )}

                    <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
                        <span className="nav-icon">⚙️</span> Profile
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <button className="btn btn-ghost btn-block" onClick={logout}>
                        🚪 Sign out
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="main-content">
                <header className="top-bar">
                    <h2>{title}</h2>
                    <div className="user-badge">
                        <span className={`role-pill role-${user.role}`}>{roleLabel}</span>
                        <span className="user-name">{user.name}</span>
                    </div>
                </header>
                <div className="layout-children">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
