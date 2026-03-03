import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabelMap: Record<string, string> = {
    admin: 'Administrator',
    agent_commercial: 'Commercial Agent',
    agent_sav: 'Support Agent',
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    const roleLabel = roleLabelMap[user.role] ?? user.role;

    const cards: { title: string; description: string; icon: string; link?: string; color: string }[] = [];

    if (user.role === 'admin') {
        cards.push(
            { title: 'User Management', description: 'Create, edit & remove users', icon: '👥', link: '/admin/users', color: 'indigo' },
            { title: 'System Settings', description: 'Configure global CRM settings', icon: '⚙️', color: 'slate' },
            { title: 'System Logs', description: 'View activity & audit logs', icon: '📋', color: 'slate' },
            { title: 'All Modules', description: 'Full access to every module', icon: '🔓', color: 'slate' },
        );
    } else if (user.role === 'agent_commercial') {
        cards.push(
            { title: 'My Leads', description: 'View & manage your assigned leads', icon: '🎯', link: '/leads', color: 'indigo' },
            { title: 'Customers', description: 'Convert qualified leads to customers', icon: '🤝', link: '/customers', color: 'emerald' },
            { title: 'Products Catalog', description: 'Browse the product catalog', icon: '📦', color: 'slate' },
            { title: 'Performance', description: 'Your sales performance metrics', icon: '📊', color: 'slate' },
        );
    } else {
        cards.push(
            { title: 'Support Tickets', description: 'Create & manage support tickets', icon: '🎫', color: 'amber' },
            { title: 'Customers', description: 'View customer information', icon: '👤', link: '/customers', color: 'indigo' },
            { title: 'Knowledge Base', description: 'Access support resources', icon: '📚', color: 'slate' },
            { title: 'Issue Resolution', description: 'Track & resolve customer issues', icon: '✅', color: 'emerald' },
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Overview</h1>
                    <p className="text-slate-400 mt-1 font-medium italic opacity-80">Welcome back, {user.name.split(' ')[0]}</p>
                </div>
                <div className="hidden sm:flex gap-2">
                    <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center">
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div className="group relative" key={card.title}>
                        <div className={`p-6 rounded-3xl bg-white/[0.03] border border-white/[0.05] transition-all duration-300 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10`}>
                            {card.link && <Link to={card.link} className="absolute inset-0 z-10" />}
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                {card.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">{card.description}</p>
                            {!card.link && (
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Coming Soon</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
