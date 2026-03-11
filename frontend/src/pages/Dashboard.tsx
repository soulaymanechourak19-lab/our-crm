import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getProducts } from '../services/products';
import MLDashboard from '../components/ml/MLDashboard';

interface Stats {
    totalProducts: number;
    lowStockCount: number;
    totalLeads: number;
    totalCustomers: number;
}

// Mock data for charts (leads over time)
const leadsOverTime = [
    { month: 'Jan', leads: 12 },
    { month: 'Feb', leads: 19 },
    { month: 'Mar', leads: 15 },
    { month: 'Apr', leads: 28 },
    { month: 'May', leads: 24 },
    { month: 'Jun', leads: 32 },
];

// Mock lead status distribution
const leadStatusData = [
    { name: 'New', value: 35, color: '#818cf8' },
    { name: 'Contacted', value: 25, color: '#6366f1' },
    { name: 'Qualified', value: 20, color: '#22c55e' },
    { name: 'Lost', value: 10, color: '#ef4444' },
    { name: 'Won', value: 10, color: '#f59e0b' },
];

// Recent activity mock data
const recentActivity = [
    { id: 1, action: 'New lead created', detail: 'Ahmed Benali', time: '5 min ago', icon: '👥' },
    { id: 2, action: 'Product updated', detail: 'Laptop Pro X1', time: '12 min ago', icon: '🛒' },
    { id: 3, action: 'Customer registered', detail: 'Sara El Fassi', time: '1 hour ago', icon: '👤' },
    { id: 4, action: 'Stock alert', detail: 'Wireless Mouse - Low stock', time: '2 hours ago', icon: '⚠️' },
    { id: 5, action: 'Deal closed', detail: 'Enterprise Package', time: '3 hours ago', icon: '💰' },
];

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats>({ totalProducts: 0, lowStockCount: 0, totalLeads: 0, totalCustomers: 0 });
    const [productsByCategory, setProductsByCategory] = useState<{ category: string; count: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const productsRes = await getProducts({ page: 1 });
                const products = productsRes.data;
                const lowStock = products.filter((p: any) => p.stock < 5).length;

                // Count by category
                const catMap: Record<string, number> = {};
                products.forEach((p: any) => {
                    catMap[p.category] = (catMap[p.category] || 0) + 1;
                });
                const catData = Object.entries(catMap).map(([category, count]) => ({ category, count }));

                setStats({
                    totalProducts: productsRes.total,
                    lowStockCount: lowStock,
                    totalLeads: 130, // Mock
                    totalCustomers: 85, // Mock
                });
                setProductsByCategory(catData);
            } catch {
                // Use mock data on error
                setStats({ totalProducts: 0, lowStockCount: 0, totalLeads: 130, totalCustomers: 85 });
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards: { title: string; description: string; icon: string; link?: string; color: string }[] = [];

    if (user?.role === 'admin') {
        cards.push(
            { title: 'User Management', description: 'Create, edit & remove users', icon: '👥', link: '/admin/users', color: 'indigo' },
            { title: 'System Settings', description: 'Configure global CRM settings', icon: '⚙️', color: 'slate' },
            { title: 'System Logs', description: 'View activity & audit logs', icon: '📋', color: 'slate' },
            { title: 'All Modules', description: 'Full access to every module', icon: '🔓', color: 'slate' },
        );
    } else if (user?.role === 'agent_commercial') {
        cards.push(
            { title: 'My Leads', description: 'View & manage your assigned leads', icon: '🎯', link: '/leads', color: 'indigo' },
            { title: 'Customers', description: 'Convert qualified leads to customers', icon: '🤝', link: '/customers', color: 'emerald' },
            { title: 'Products Catalog', description: 'Browse the product catalog', icon: '📦', link: '/products', color: 'indigo' },
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const statCards = [
        { label: 'Total Leads', value: stats.totalLeads, icon: '👥', color: 'from-indigo-600 to-indigo-800', change: '+12%' },
        { label: 'Total Products', value: stats.totalProducts, icon: '🛒', color: 'from-emerald-600 to-emerald-800', change: '+5%' },
        { label: 'Total Customers', value: stats.totalCustomers, icon: '👤', color: 'from-amber-600 to-amber-800', change: '+8%' },
        { label: 'Low Stock', value: stats.lowStockCount, icon: '⚠️', color: 'from-red-600 to-red-800', change: '-3%' },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Overview</h1>
                    <p className="text-slate-400 mt-1 font-medium italic opacity-80">Welcome back, {user?.name?.split(' ')[0]}</p>
                </div>
                <div className="hidden sm:flex gap-2">
                    <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center">
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Quick Access Modules */}
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="relative overflow-hidden border-none!">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                                <span className={`text-xs mt-2 inline-block font-semibold ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {stat.change} this month
                                </span>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl shadow-lg`}>
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart - Leads over time */}
                <Card className="border-none!">
                    <h3 className="text-white font-semibold mb-4 text-lg">Leads Over Time</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={leadsOverTime}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                {/* Bar Chart - Products by category */}
                <Card className="border-none!">
                    <h3 className="text-white font-semibold mb-4 text-lg">Products by Category</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={productsByCategory.length > 0 ? productsByCategory : [{ category: 'No data', count: 0 }]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                            />
                            <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Pie Chart - Lead Status */}
                <Card className="border-none!">
                    <h3 className="text-white font-semibold mb-4 text-lg">Lead Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={leadStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                                {leadStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                            />
                            <Legend
                                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                {/* Recent Activity */}
                <Card className="border-none!">
                    <h3 className="text-white font-semibold mb-4 text-lg">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 cursor-pointer">
                                <span className="text-xl">{activity.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{activity.action}</p>
                                    <p className="text-xs text-slate-400 truncate">{activity.detail}</p>
                                </div>
                                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </Card>
                
                {/* AI / ML Global Dashboard */}
                <div className="lg:col-span-2 mt-4">
                    <MLDashboard />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
