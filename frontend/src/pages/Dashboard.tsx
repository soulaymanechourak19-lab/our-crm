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
        <>
            <section className="welcome-banner">
                <h2>Welcome back, {user.name} 👋</h2>
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
        </>
    );
};

export default Dashboard;
