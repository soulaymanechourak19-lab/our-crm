import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getDashboardStats } from '../services/api';
import { getProducts } from '../services/products';
import MLDashboard from '../components/ml/MLDashboard';
import './Dashboard.css';

interface Stats {
    totalProducts: number;
    lowStockCount: number;
    totalLeads: number;
    totalCustomers: number;
}

/* ── Framer Motion Variants ───────────────────────────── */
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
        opacity: 1, 
        y: 0, 
        transition: { type: 'spring' as const, stiffness: 350, damping: 25 } 
    }
};

const hoverCardStyle = {
    scale: 1.02,
    y: -4,
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    transition: { type: "spring" as const, stiffness: 400, damping: 25 }
};

/* ── SVG Radial Gauge ─────────────────────────────────── */
const RadialGauge: React.FC<{ value: number; color: string; size?: number }> = React.memo(({
    value, color, size = 90
}) => {
    const r = 36;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (value / 100) * circumference;
    return (
        <svg className="db-gauge-svg" viewBox="0 0 90 90" width={size} height={size}>
            <circle className="db-gauge-track" cx="45" cy="45" r={r} />
            <motion.circle
                className="db-gauge-fill"
                cx="45" cy="45" r={r}
                stroke={color}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            />
            <text className="db-gauge-text" x="45" y="45">{value}%</text>
        </svg>
    );
});

/* ── Progress Bar ─────────────────────────────────────── */
const ProgressBar: React.FC<{ label: string; value: number; max: number; color: string }> = React.memo(({
    label, value, max, color
}) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="db-progress-item">
            <div className="db-progress-header">
                <span className="db-progress-name">{label}</span>
                <span className="db-progress-pct">{pct}%</span>
            </div>
            <div className="db-progress-track">
                <motion.div 
                    className="db-progress-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    style={{ background: color }} 
                />
            </div>
        </div>
    );
});

/* ── SVG Icons (Lucide/Feather) ───────────────────────── */
const svgs = {
    users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    logs: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    ai: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27A7 7 0 0 1 14 22h-4a7 7 0 0 1-6.73-3H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><circle cx="9.5" cy="15.5" r="1" fill="currentColor"/><circle cx="14.5" cy="15.5" r="1" fill="currentColor"/></svg>,
    brain: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.14.35 2.2.94 3.08A5.5 5.5 0 0 0 7 18.5V22h4v-3.5"/><path d="M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.14-.35 2.2-.94 3.08A5.5 5.5 0 0 1 17 18.5V22h-4v-3.5"/><path d="M8 10h8"/><path d="M9 14h6"/></svg>,
    target: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    handshake: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    box: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    ticket: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2"/><path d="M15 11v2"/><path d="M15 17v2"/><path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/></svg>,
    user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    book: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    alert: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    activity: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
};


const Dashboard: React.FC = React.memo(() => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [stats, setStats] = useState<Stats>({ totalProducts: 0, lowStockCount: 0, totalLeads: 0, totalCustomers: 0 });
    const [productsByCategory, setProductsByCategory] = useState<{ category: string; count: number }[]>([]);
    const [chartData, setChartData] = useState({
        leadsOverTime: [] as any[],
        leadStatusData: [] as any[],
        recentActivity: [] as any[]
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const productsRes = await getProducts({ page: 1 });
                const products = productsRes.data;
                const catMap: Record<string, number> = {};
                products.forEach((p: any) => {
                    catMap[p.category] = (catMap[p.category] || 0) + 1;
                });
                setProductsByCategory(Object.entries(catMap).map(([category, count]) => ({ category, count })));

                const dbStats = await getDashboardStats();
                setStats(dbStats.stats);
                setChartData({
                    leadsOverTime: dbStats.leadsOverTime,
                    leadStatusData: dbStats.leadStatusData,
                    recentActivity: dbStats.recentActivity
                });
            } catch (err) {
                console.error("Dashboard stats error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Memoize the chart colors and metric computations
    const { conversionRate, healthyStock, totalStatusValues, wonLeads } = useMemo(() => {
        const total = chartData.leadStatusData.reduce((sum: number, s: any) => sum + (s.value || 0), 0);
        const won = chartData.leadStatusData.find((s: any) => s.name === 'Won')?.value || 0;
        const conv = total > 0 ? Math.round((won / total) * 100) : 0;
        const health = stats.totalProducts > 0 ? Math.round(((stats.totalProducts - stats.lowStockCount) / stats.totalProducts) * 100) : 0;
        return { conversionRate: conv, healthyStock: health, totalStatusValues: total, wonLeads: won };
    }, [chartData.leadStatusData, stats.totalProducts, stats.lowStockCount]);

    const leadStatusColors = useMemo<Record<string, string>>(() => ({
        New: '#74b9ff', Contacted: '#a29bfe', Qualified: '#00cec9', Won: '#00b894', Lost: '#ff7675'
    }), []);
    
    const barColors = useMemo(() => ['#e84393', '#00cec9', '#fdcb6e', '#6c5ce7', '#74b9ff', '#00b894', '#e17055', '#a29bfe'], []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Quick access cards based on role
    const cards: { title: string; icon: React.ReactNode; link?: string; color: string }[] = [];
    if (user?.role === 'admin') {
        cards.push(
            { title: t('sidebar.users') || 'Users', icon: svgs.users, link: '/admin/users', color: '#6c5ce7' },
            { title: t('sidebar.settings'), icon: svgs.settings, link: '/settings', color: '#e17055' },
            { title: t('sidebar.logs'), icon: svgs.logs, link: '/logs', color: '#00cec9' },
            { title: t('sidebar.aiAssistant') || 'AI Assistant', icon: svgs.ai, link: '/chatbot', color: '#e84393' },
            { title: t('sidebar.aiTraining') || 'AI Training', icon: svgs.brain, link: '/chatbot-training', color: '#fdcb6e' },
        );
    } else if (user?.role === 'agent_commercial') {
        cards.push(
            { title: t('sidebar.myLeads') || 'My Leads', icon: svgs.target, link: '/leads', color: '#e84393' },
            { title: t('sidebar.customers'), icon: svgs.handshake, link: '/customers', color: '#00cec9' },
            { title: 'Products', icon: svgs.box, link: '/products', color: '#6c5ce7' },
            { title: 'Performance', icon: svgs.chart, color: '#fdcb6e' },
        );
    } else {
        cards.push(
            { title: 'Tickets', icon: svgs.ticket, color: '#fdcb6e' },
            { title: 'Customers', icon: svgs.user, link: '/customers', color: '#6c5ce7' },
            { title: 'Knowledge', icon: svgs.book, color: '#00cec9' },
            { title: 'Issues', icon: svgs.check, color: '#00b894' },
        );
    }

    const statItems = [
        { label: t('dashboard.totalLeads') || 'Total Leads', value: stats.totalLeads, icon: svgs.target, iconClass: 'magenta', trend: '+12%', trendDir: 'up' },
        { label: t('dashboard.products') || 'Products', value: stats.totalProducts, icon: svgs.box, iconClass: 'cyan', trend: '+5%', trendDir: 'up' },
        { label: t('dashboard.customers') || 'Customers', value: stats.totalCustomers, icon: svgs.users, iconClass: 'amber', trend: '+8%', trendDir: 'up' },
        { label: t('dashboard.lowStock') || 'Low Stock', value: stats.lowStockCount, icon: svgs.alert, iconClass: 'red', trend: stats.lowStockCount > 0 ? t('dashboard.attention') || 'Attention' : t('dashboard.ok') || 'OK', trendDir: stats.lowStockCount > 0 ? 'down' : 'up' },
    ];

    return (
        <motion.div 
            className="db-root"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* ── Header ──────────────────────────────────── */}
            <motion.div variants={itemVariants} className="db-header">
                <div>
                    <h1 className="db-header-title">{t('dashboard.overview') || 'Overview'}</h1>
                    <p className="db-header-sub">{t('dashboard.welcomeBack') || 'Welcome back'}, {user?.name?.split(' ')[0]}</p>
                </div>
                <div className="db-date-badge">
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
            </motion.div>

            {/* ── Stat Cards ─────────────────────────────── */}
            <motion.div variants={itemVariants} className="db-stats-grid">
                {statItems.map((s, i) => (
                    <motion.div 
                        key={s.label} 
                        className="db-stat-card"
                        whileHover={hoverCardStyle}
                        whileTap={{ scale: 0.98 }}
                        style={{ '--accent-gradient': `linear-gradient(90deg, ${i === 0 ? '#e84393' : i === 1 ? '#00cec9' : i === 2 ? '#fdcb6e' : '#ff7675'}, transparent)` } as React.CSSProperties}
                    >
                        <div className={`db-stat-icon ${s.iconClass}`}>
                            <span>{s.icon}</span>
                        </div>
                        <div className="db-stat-info">
                            <div className="db-stat-label">{s.label}</div>
                            <div className="db-stat-value">{s.value}</div>
                            <span className={`db-stat-trend ${s.trendDir}`}>
                                {s.trendDir === 'up' ? '↑' : '↓'} {s.trend}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── Main 3-Column Grid ─────────────────────── */}
            <motion.div variants={itemVariants} className="db-main-grid">
                {/* Left — Quick Access */}
                <div className="db-quick-access">
                    <div className="db-quick-title">{t('dashboard.quickAccess')}</div>
                    {cards.map((c) => {
                        const inner = (
                            <>
                                <span className="db-quick-dot" style={{ background: c.color }} />
                                <span>{c.title}</span>
                            </>
                        );
                        return c.link ? (
                            <Link key={c.title} to={c.link} className="db-quick-item">{inner}</Link>
                        ) : (
                            <div key={c.title} className="db-quick-item" style={{ opacity: 0.5, cursor: 'default' }}>{inner}</div>
                        );
                    })}
                </div>

                {/* Center — Gauges, Progress, Charts */}
                <div className="db-center">
                    {/* Gauges */}
                    <div className="db-gauges-row">
                        <motion.div whileHover={hoverCardStyle} className="db-gauge-card">
                            <RadialGauge value={conversionRate} color="#e84393" />
                            <div className="db-gauge-info">
                                <div className="db-gauge-label">{t('dashboard.leadConversion') || 'Lead Conversion'}</div>
                                <div className="db-gauge-detail">
                                    {t('dashboard.wonOutOfTotal', { won: wonLeads, total: totalStatusValues }) || `${wonLeads} won out of ${totalStatusValues} total leads in pipeline`}
                                </div>
                            </div>
                        </motion.div>
                        <motion.div whileHover={hoverCardStyle} className="db-gauge-card">
                            <RadialGauge value={healthyStock} color="#00cec9" />
                            <div className="db-gauge-info">
                                <div className="db-gauge-label">{t('dashboard.stockHealth') || 'Stock Health'}</div>
                                <div className="db-gauge-detail">
                                    {t('dashboard.productsRunningLow', { low: stats.lowStockCount, total: stats.totalProducts }) || `${stats.lowStockCount} products running low out of ${stats.totalProducts}`}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Lead Status Progress Bars */}
                    <motion.div whileHover={hoverCardStyle} className="db-progress-card">
                        <div className="db-progress-title">{t('dashboard.leadStatusDistribution') || 'Lead Status Distribution'}</div>
                        {chartData.leadStatusData.map((status: any) => (
                            <ProgressBar
                                key={status.name}
                                label={status.name}
                                value={status.value}
                                max={totalStatusValues}
                                color={leadStatusColors[status.name] || '#a29bfe'}
                            />
                        ))}
                    </motion.div>

                    {/* Charts */}
                    <div className="db-charts-row">
                        {/* Area Chart - Leads Over Time */}
                        <motion.div whileHover={hoverCardStyle} className="db-chart-card">
                            <div className="db-chart-title">
                                <span className="db-chart-dot" style={{ background: '#e84393' }} />
                                {t('dashboard.leadsOverTime') || 'Leads Over Time'}
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={chartData.leadsOverTime}>
                                    <defs>
                                        <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#e84393" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#e84393" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9', fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="leads" stroke="#e84393" strokeWidth={2.5} fill="url(#leadGrad)" dot={{ fill: '#e84393', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#e84393', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Bar Chart - Products by Category */}
                        <motion.div whileHover={hoverCardStyle} className="db-chart-card">
                            <div className="db-chart-title">
                                <span className="db-chart-dot" style={{ background: '#00cec9' }} />
                                {t('dashboard.productsByCategory') || 'Products by Category'}
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={productsByCategory.length > 0 ? productsByCategory : [{ category: 'No data', count: 0 }]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {(productsByCategory.length > 0 ? productsByCategory : [{ category: 'No data', count: 0 }]).map((_, i) => (
                                            <Cell key={i} fill={barColors[i % barColors.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>
                </div>

                {/* Right Panel — Big Stats + Pie + Activity */}
                <div className="db-right-panel">
                    {/* Big Stat 1 */}
                    <motion.div whileHover={hoverCardStyle} className="db-big-stat-card">
                        <div className="db-big-stat-value" style={{ color: '#a29bfe' }}>{conversionRate}%</div>
                        <div className="db-big-stat-label">{t('dashboard.leadConversionRate') || 'Lead Conversion Rate'}</div>
                        <div className="db-big-stat-bars">
                            <div className="db-big-stat-bar-track">
                                <motion.div 
                                    className="db-big-stat-bar-fill" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${conversionRate}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                    style={{ background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)' }} 
                                />
                            </div>
                            <div className="db-big-stat-bar-track">
                                <motion.div 
                                    className="db-big-stat-bar-fill" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(conversionRate + 15, 100)}%` }}
                                    transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                                    style={{ background: 'linear-gradient(90deg, #00cec9, #74b9ff)' }} 
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Big Stat 2 */}
                    <motion.div whileHover={hoverCardStyle} className="db-big-stat-card">
                        <div className="db-big-stat-value" style={{ color: '#00cec9' }}>{healthyStock}%</div>
                        <div className="db-big-stat-label">{t('dashboard.inventoryHealthScore') || 'Inventory Health Score'}</div>
                        <div className="db-big-stat-bars">
                            <div className="db-big-stat-bar-track">
                                <motion.div 
                                    className="db-big-stat-bar-fill" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${healthyStock}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                    style={{ background: 'linear-gradient(90deg, #00b894, #00cec9)' }} 
                                />
                            </div>
                            <div className="db-big-stat-bar-track">
                                <motion.div 
                                    className="db-big-stat-bar-fill" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(healthyStock - 10, 0)}%` }}
                                    transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                                    style={{ background: 'linear-gradient(90deg, #e84393, #fd79a8)' }} 
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Pie Chart */}
                    <motion.div whileHover={hoverCardStyle} className="db-pie-card">
                        <div className="db-pie-title">{t('dashboard.leadStatus') || 'Lead Status'}</div>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={chartData.leadStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {chartData.leadStatusData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || barColors[index % barColors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9', fontSize: '12px' }}
                                />
                                <Legend
                                    formatter={(value: any) => <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div whileHover={hoverCardStyle} className="db-activity-card">
                        <div className="db-activity-title">{t('dashboard.recentActivity') || 'Recent Activity'}</div>
                        {chartData.recentActivity.slice(0, 5).map((a: any) => {
                            // Map the backend emojis to our frontend SVGs
                            const activityIcon = a.icon === '🎯' ? svgs.target : 
                                                 a.icon === '👤' ? svgs.user : 
                                                 a.icon === '🛒' ? svgs.box : 
                                                 svgs.activity;
                                                 
                            return (
                                <div key={a.id} className="db-activity-item">
                                    <span className="db-activity-icon" style={{ display: 'flex', alignItems: 'center' }}>
                                        {activityIcon}
                                    </span>
                                    <div className="db-activity-text">
                                        <div className="db-activity-action">{a.action}</div>
                                        <div className="db-activity-detail">{a.detail}</div>
                                    </div>
                                    <span className="db-activity-time">{a.time}</span>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </motion.div>

            {/* ── ML Dashboard ────────────────────────────── */}
            <motion.div variants={itemVariants} className="db-ml-section">
                <MLDashboard />
            </motion.div>
        </motion.div>
    );
});

export default Dashboard;
