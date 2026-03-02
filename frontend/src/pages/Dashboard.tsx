import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabelMap: Record<string, string> = {
    admin: 'Administrator',
    agent_commercial: 'Commercial Agent',
    agent_sav: 'Support Agent',
};

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    const roleLabel = roleLabelMap[user.role] ?? user.role;

    /* Role-based quick-access cards */
    const cards: { title: string; description: string; icon: string; link?: string }[] = [];

    if (user.role === 'admin') {
        cards.push(
            { title: 'User Management', description: 'Create, edit & remove users', icon: '👥', link: '/admin/users' },
            { title: 'System Settings', description: 'Configure global CRM settings', icon: '⚙️' },
            { title: 'System Logs', description: 'View activity & audit logs', icon: '📋' },
            { title: 'All Modules', description: 'Full access to every module', icon: '🔓' },
        );
    }

    if (user.role === 'agent_commercial') {
        cards.push(
            { title: 'My Leads', description: 'View & manage your assigned leads', icon: '🎯' },
            { title: 'Customers', description: 'Convert qualified leads to customers', icon: '🤝' },
            { title: 'Products Catalog', description: 'Browse the product catalog', icon: '📦' },
            { title: 'Performance', description: 'Your sales performance metrics', icon: '📊' },
        );
    }

    if (user.role === 'agent_sav') {
        cards.push(
            { title: 'Support Tickets', description: 'Create & manage support tickets', icon: '🎫' },
            { title: 'Customers', description: 'View customer information', icon: '👤' },
            { title: 'Knowledge Base', description: 'Access support resources', icon: '📚' },
            { title: 'Issue Resolution', description: 'Track & resolve customer issues', icon: '✅' },
        );
    }

    return (
        <div className="dashboard-layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="10" fill="url(#sideGrad)" />
                        <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="18" fontWeight="700">C</text>
                        <defs><linearGradient id="sideGrad" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
                    </svg>
                    <span>CRM</span>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item active">
                        <span className="nav-icon">🏠</span> Dashboard
                    </Link>

                    {(user.role === 'admin' || user.role === 'agent_commercial') && (
                        <Link to="/dashboard" className="nav-item">
                            <span className="nav-icon">🎯</span> Leads
                        </Link>
                    )}

                    {(user.role === 'admin' || user.role === 'agent_commercial' || user.role === 'agent_sav') && (
                        <Link to="/dashboard" className="nav-item">
                            <span className="nav-icon">👤</span> Customers
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
                        <Link to="/admin/users" className="nav-item">
                            <span className="nav-icon">👥</span> Users
                        </Link>
                    )}

                    <Link to="/profile" className="nav-item">
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
                    <h2>Dashboard</h2>
                    <div className="user-badge">
                        <span className={`role-pill role-${user.role}`}>{roleLabel}</span>
                        <span className="user-name">{user.name}</span>
                    </div>
                </header>

                <section className="welcome-banner">
                    <h1>Welcome back, {user.name} 👋</h1>
                    <p>You are logged in as <strong>{roleLabel}</strong>. Here's what you can do:</p>
                </section>

                <div className="card-grid">
                    {cards.map((card) => (
                        <div className="dash-card" key={card.title}>
                            {card.link ? (
                                <Link to={card.link} className="card-link-overlay" aria-label={card.title} />
                            ) : null}
                            <span className="card-icon">{card.icon}</span>
                            <h3>{card.title}</h3>
                            <p>{card.description}</p>
                            {!card.link && <span className="badge-soon">Coming soon</span>}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
