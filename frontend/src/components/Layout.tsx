import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

const roleLabelMap: Record<string, string> = {
    admin: 'Administrator',
    agent_commercial: 'Commercial Agent',
    agent_sav: 'Support Agent',
};

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
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
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center mr-2 shadow-lg shadow-indigo-500/20">
                        <span className="text-white font-bold text-lg">C</span>
                    </div>
                    <span className="text-xl font-extrabold tracking-tight text-white">OurCRM</span>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                        <span className="nav-icon text-lg">🏠</span>
                        <span>Dashboard</span>
                    </Link>

                    {(user.role === 'admin' || user.role === 'agent_commercial') && (
                        <Link to="/leads" className={`nav-item ${isActive('/leads') ? 'active' : ''}`}>
                            <span className="nav-icon text-lg">🎯</span>
                            <span>Leads</span>
                        </Link>
                    )}

                    {(user.role === 'admin' || user.role === 'agent_commercial' || user.role === 'agent_sav') && (
                        <Link to="/customers" className={`nav-item ${isActive('/customers') || location.pathname.startsWith('/customers/') ? 'active' : ''}`}>
                            <span className="nav-icon text-lg">🤝</span>
                            <span>Customers</span>
                        </Link>
                    )}

                    {(user.role === 'admin' || user.role === 'agent_commercial') && (
                        <Link to="/products" className={`nav-item ${isActive('/products') ? 'active' : ''}`}>
                            <span className="nav-icon text-lg">📦</span>
                            <span>Products</span>
                        </Link>
                    )}

                    {(user.role === 'admin' || user.role === 'agent_sav') && (
                        <div className="nav-item opacity-40 cursor-not-allowed group">
                            <span className="nav-icon text-lg">🎫</span>
                            <span>Tickets</span>
                            <small className="ml-auto text-[9px] uppercase font-bold tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Soon</small>
                        </div>
                    )}

                    <div className="mt-8 mb-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Settings</div>

                    {user.role === 'admin' && (
                        <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
                            <span className="nav-icon text-lg">👥</span>
                            <span>Users</span>
                        </Link>
                    )}

                    <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
                        <span className="nav-icon text-lg">👤</span>
                        <span>Profile</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] mb-4 mx-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{roleLabel}</p>
                            </div>
                        </div>
                    </div>
                    <button className="nav-item w-full text-left font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 mb-2" onClick={logout}>
                        <span className="nav-icon text-lg">🚪</span> Sign out
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="main-content">
                <header className="top-bar">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-extrabold text-white tracking-tight">{title}</h2>
                        {subtitle && <p className="text-sm text-slate-400 font-medium mt-1">{subtitle}</p>}
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                            <span className="text-xl">🔔</span>
                        </button>
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
