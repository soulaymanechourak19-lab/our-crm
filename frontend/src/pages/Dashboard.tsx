import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getProducts } from '../services/products';

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
    { id: 5, action: 'Deal closed', detail: 'Enterprise Package', time: '3 hours ago', icon: '🎉' },
];

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats>({ totalProducts: 0, lowStockCount: 0, totalLeads: 0, totalCustomers: 0 });
    const [productsByCategory, setProductsByCategory] = useState<{ category: string; count: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const productsRes = await getProducts({ page: 1 });
                const products = productsRes.data;
                const lowStock = products.filter((p) => p.stock < 5).length;

                // Count by category
                const catMap: Record<string, number> = {};
                products.forEach((p) => {
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const statCards = [
        { label: 'Total Leads', value: stats.totalLeads, icon: '👥', color: 'from-primary-600 to-primary-800', change: '+12%' },
        { label: 'Total Products', value: stats.totalProducts, icon: '🛒', color: 'from-emerald-600 to-emerald-800', change: '+5%' },
        { label: 'Total Customers', value: stats.totalCustomers, icon: '👤', color: 'from-amber-600 to-amber-800', change: '+8%' },
        { label: 'Low Stock', value: stats.lowStockCount, icon: '⚠️', color: 'from-red-600 to-red-800', change: '-3%' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="relative overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-dark-400 text-sm">{stat.label}</p>
                                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                                <span className={`text-xs mt-2 inline-block ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
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
                <Card>
                    <h3 className="text-white font-semibold mb-4">Leads Over Time</h3>
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
                <Card>
                    <h3 className="text-white font-semibold mb-4">Products by Category</h3>
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
                <Card>
                    <h3 className="text-white font-semibold mb-4">Lead Status Distribution</h3>
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
                                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-700/30 transition-colors">
                                <span className="text-lg">{activity.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{activity.action}</p>
                                    <p className="text-xs text-dark-400 truncate">{activity.detail}</p>
                                </div>
                                <span className="text-xs text-dark-500 whitespace-nowrap">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'Add Product', icon: '🛒', path: '/products' },
                        { label: 'New Lead', icon: '👥', path: '/leads' },
                        { label: 'View Customers', icon: '👤', path: '/customers' },
                    ].map((action) => (
                        <Link
                            key={action.label}
                            to={action.path}
                            className="flex items-center gap-2 px-4 py-2.5 bg-dark-700/50 hover:bg-dark-700 text-dark-300 hover:text-white rounded-xl border border-dark-600/50 transition-all text-sm"
                        >
                            <span>{action.icon}</span>
                            <span>{action.label}</span>
                        </Link>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
