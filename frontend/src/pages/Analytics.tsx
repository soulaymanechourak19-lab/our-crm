import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import api from '../services/api';

/* ─── Palette ──────────────────────────────────────────────────── */
const C = ['#6c5ce7','#a29bfe','#00cec9','#fdcb6e','#e84393','#00b894','#ff7675','#74b9ff','#fab1a0','#55efc4'];
// const formatK = (v: number) => v >= 1000000 ? `$${(v/1e6).toFixed(1)}M` : v >= 1000 ? `$${(v/1e3).toFixed(1)}k` : `$${v}`;

/* ─── Inline SVG icons (matching sidebar Lucide/Feather style) ─ */
const svgIcons = {
    overview: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21H3" /><path d="M18 17V9" /><path d="M14 17V5" /><path d="M10 17v-4" /><path d="M6 17v-2" /></svg>,
    funnel: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>,
    revenue: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    team: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    reports: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
    target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    trendUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    profile: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    product: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
    trophy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
    settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
    exportCsv: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
};

/* ─── Tab type ────────────────────────────────────────────────── */
type Tab = 'overview' | 'funnel' | 'revenue' | 'team' | 'reports';
const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: svgIcons.overview },
    { key: 'funnel', label: 'Sales Funnel', icon: svgIcons.funnel },
    { key: 'revenue', label: 'Revenue', icon: svgIcons.revenue },
    { key: 'team', label: 'Team', icon: svgIcons.team },
    { key: 'reports', label: 'Reports', icon: svgIcons.reports },
];

/* ─── Custom tooltip ──────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
    const { formatCurrency } = useCurrency();
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>{label}</div>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ fontSize: '0.8rem', fontWeight: 700, color: p.color || '#f1f5f9' }}>
                    {p.name}: {typeof p.value === 'number' && p.value > 100 ? formatCurrency(p.value) : p.value}
                </div>
            ))}
        </div>
    );
};

/* ─── Sparkline ───────────────────────────────────────────────── */
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    const max = Math.max(...data, 1);
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * 80},${40 - (v / max) * 36}`).join(' ');
    return (
        <svg width="80" height="40" style={{ display: 'block' }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

/* ═══════════════════════════════════════════════════════════════ */

const Analytics: React.FC = () => {
    const { formatCurrency } = useCurrency();
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>('overview');
    const [overview, setOverview] = useState<any>(null);
    const [funnel, setFunnel] = useState<any>(null);
    const [revByProduct, setRevByProduct] = useState<any>(null);
    const [revByRep, setRevByRep] = useState<any[]>([]);
    const [revTrend, setRevTrend] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [sourcePerf, setSourcePerf] = useState<any[]>([]);
    const [performers, setPerformers] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [custGrowth, setCustGrowth] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Report builder state
    const [savedReports, setSavedReports] = useState<any[]>([]);
    const [reportConfig, setReportConfig] = useState({ source: 'leads', chartType: 'bar', groupBy: 'status', metric: 'count', dateFrom: '', dateTo: '' });
    const [reportResult, setReportResult] = useState<any>(null);
    const [reportName, setReportName] = useState('');
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [ov, fn, rbp, rbr, rt, tp, sp, perf, act, cg, sr] = await Promise.allSettled([
                    api.get('/analytics/overview'),
                    api.get('/analytics/funnel'),
                    api.get('/analytics/revenue-by-product'),
                    api.get('/analytics/revenue-by-rep'),
                    api.get('/analytics/revenue-trend'),
                    api.get('/analytics/top-products'),
                    api.get('/analytics/source-performance'),
                    api.get('/analytics/top-performers'),
                    api.get('/analytics/activity-summary'),
                    api.get('/analytics/customer-growth'),
                    api.get('/reports'),
                ]);
                if (ov.status === 'fulfilled') setOverview(ov.value.data);
                if (fn.status === 'fulfilled') setFunnel(fn.value.data);
                if (rbp.status === 'fulfilled') setRevByProduct(rbp.value.data);
                if (rbr.status === 'fulfilled') setRevByRep(rbr.value.data);
                if (rt.status === 'fulfilled') setRevTrend(rt.value.data);
                if (tp.status === 'fulfilled') setTopProducts(tp.value.data);
                if (sp.status === 'fulfilled') setSourcePerf(sp.value.data);
                if (perf.status === 'fulfilled') setPerformers(perf.value.data);
                if (act.status === 'fulfilled') setActivity(act.value.data);
                if (cg.status === 'fulfilled') setCustGrowth(cg.value.data);
                if (sr.status === 'fulfilled') setSavedReports(sr.value.data);
            } catch (_e) { /* ignore */ }
            setLoading(false);
        };
        fetchAll();
    }, []);

    const generateReport = async () => {
        setGeneratingReport(true);
        try {
            const { data } = await api.post('/reports/generate', reportConfig);
            setReportResult(data);
        } catch (_e) { /* ignore */ }
        setGeneratingReport(false);
    };

    const saveReport = async () => {
        if (!reportName.trim()) return;
        try {
            await api.post('/reports', { name: reportName, config: reportConfig });
            setReportName('');
            const { data } = await api.get('/reports');
            setSavedReports(data);
        } catch (_e) { /* ignore */ }
    };

    const deleteReport = async (id: number) => {
        try {
            await api.delete(`/reports/${id}`);
            setSavedReports(s => s.filter(r => r.id !== id));
        } catch (_e) { /* ignore */ }
    };

    const exportReport = async () => {
        try {
            const params = new URLSearchParams({
                source: reportConfig.source,
                ...(reportConfig.dateFrom && { dateFrom: reportConfig.dateFrom }),
                ...(reportConfig.dateTo && { dateTo: reportConfig.dateTo }),
            });
            const { data } = await api.get(`/reports/export?${params.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `report_${reportConfig.source}_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch {
            alert('Export failed');
        }
    };

    /* ━━━ Styles ━━━ */
    const card: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)' };
    const inputS: React.CSSProperties = { padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'inherit' };

    if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>Loading BI Dashboard...</div>;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Business Intelligence</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>Real-time pipeline analytics & custom reporting</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-primary)', borderRadius: '14px', padding: '4px', border: '1px solid var(--border-subtle)' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        flex: 1, padding: '10px 6px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: tab === t.key ? 'linear-gradient(135deg, #6c5ce7, #a29bfe)' : 'transparent',
                        color: tab === t.key ? '#fff' : 'var(--text-secondary)',
                        fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.25s', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}>{t.icon} {t.label}</button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ═══ OVERVIEW TAB ═══ */}
                {tab === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                        {/* KPI Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
                            {overview && [
                                { label: 'Total Revenue', value: formatCurrency(overview.total_revenue), change: overview.revenue_growth, color: '#00b894', spark: overview.sparkline },
                                { label: 'Conversion Rate', value: `${overview.conversion_rate}%`, change: null, color: '#6c5ce7', spark: null },
                                { label: 'Pipeline Value', value: formatCurrency(overview.pipeline_value), change: null, color: '#fdcb6e', spark: null },
                                { label: 'Active Leads', value: overview.active_leads, change: overview.lead_growth, color: '#e84393', spark: overview.sparkline },
                            ].map((kpi, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                    style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{kpi.label}</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                                        {kpi.change !== null && (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: kpi.change >= 0 ? '#00b894' : '#ff7675' }}>
                                                {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change)}% vs last month
                                            </span>
                                        )}
                                    </div>
                                    {kpi.spark && <Sparkline data={kpi.spark} color={kpi.color} />}
                                </motion.div>
                            ))}
                        </div>

                        {/* 2-col: Revenue Trend + Source Performance */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div style={card}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.revenue} Revenue Trend (12 months)</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={revTrend}>
                                        <defs>
                                            <linearGradient id="biGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#00b894" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#00b894" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="month_short" stroke="#64748b" fontSize={11} />
                                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v: number) => formatCurrency(v)} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="revenue" stroke="#00b894" strokeWidth={2.5} fill="url(#biGrad)" name="Revenue" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={card}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.target} Lead Sources</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={sourcePerf} dataKey="total" nameKey="source" cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={3}>
                                            {sourcePerf.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend formatter={(v: any) => <span style={{ color: '#94a3b8', fontSize: '10px' }}>{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Customer Growth */}
                        <div style={card}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.trendUp} Customer Growth</h3>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={custGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                                    <YAxis stroke="#64748b" fontSize={11} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="new" fill="#6c5ce7" radius={[4,4,0,0]} name="New Customers" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}

                {/* ═══ FUNNEL TAB ═══ */}
                {tab === 'funnel' && funnel && (
                    <motion.div key="funnel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                        <div style={card}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.funnel} Sales Funnel — {funnel.total_leads} total leads</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                                {funnel.funnel.map((stage: any, i: number) => {
                                    const width = funnel.funnel[0]?.count > 0 ? Math.max(20, (stage.count / funnel.funnel[0].count) * 100) : 20;
                                    return (
                                        <motion.div key={stage.stage}
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: `${width}%`, opacity: 1 }}
                                            transition={{ duration: 0.7, delay: i * 0.12 }}
                                            style={{
                                                background: `linear-gradient(135deg, ${C[i]}, ${C[i]}99)`,
                                                borderRadius: '12px', padding: '14px 20px',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '220px',
                                            }}>
                                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{stage.stage}</span>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600 }}>{stage.count} leads</span>
                                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>~{stage.avg_days}d avg</span>
                                                <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>{stage.percentage}%</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Conversion Cards */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {funnel.conversions.map((conv: any, i: number) => (
                                <div key={i} style={{
                                    ...card, textAlign: 'center', minWidth: '140px', flex: '1 1 140px',
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                                        {conv.from} → {conv.to}
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: conv.rate > 50 ? '#00b894' : conv.rate > 25 ? '#fdcb6e' : '#ff7675' }}>
                                        {conv.rate}%
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: '#ff7675', fontWeight: 600, marginTop: '4px' }}>↓ {conv.drop_off}% drop-off</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ═══ REVENUE TAB ═══ */}
                {tab === 'revenue' && (
                    <motion.div key="revenue" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                        {/* Revenue by Rep */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div style={card}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.profile} Revenue by Sales Rep</h3>
                                {revByRep.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={revByRep} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v: number) => formatCurrency(v)} />
                                            <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={90} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="revenue" radius={[0,6,6,0]} name="Revenue">
                                                {revByRep.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No rep data</div>}
                            </div>

                            <div style={card}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.product} Revenue by Product</h3>
                                {revByProduct?.by_quotation?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={revByProduct.by_quotation.slice(0, 8)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={50} />
                                            <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v: number) => formatCurrency(v)} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="revenue" radius={[4,4,0,0]} name="Revenue">
                                                {(revByProduct.by_quotation || []).slice(0, 8).map((_: any, i: number) => <Cell key={i} fill={C[i % C.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No product revenue data yet</div>}
                            </div>
                        </div>

                        {/* Revenue Trend + Top Products Table */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                            <div style={card}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.trendUp} Monthly Revenue + Deals</h3>
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={revTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="month_short" stroke="#64748b" fontSize={11} />
                                        <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickFormatter={(v: number) => formatCurrency(v)} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#00b894" strokeWidth={2.5} dot={false} name="Revenue" />
                                        <Line yAxisId="right" type="monotone" dataKey="deals" stroke="#6c5ce7" strokeWidth={2} dot={false} name="Deals" />
                                        <Line yAxisId="right" type="monotone" dataKey="new_leads" stroke="#fdcb6e" strokeWidth={1.5} dot={false} strokeDasharray="5 5" name="New Leads" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div style={card}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.trophy} Top Products</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {topProducts.slice(0, 7).map((p: any, i: number) => (
                                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: i === 0 ? 'rgba(253,203,110,0.06)' : 'transparent' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: C[i % C.length], minWidth: '18px' }}>#{i+1}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{p.category} · {p.total_sold} sold</div>
                                            </div>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#00b894' }}>{formatCurrency(p.total_revenue)}</span>
                                        </div>
                                    ))}
                                    {topProducts.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No product data</div>}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══ TEAM TAB ═══ */}
                {tab === 'team' && (
                    <motion.div key="team" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            {/* Leaderboard */}
                            <div style={card}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.trophy} Sales Leaderboard</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {performers.map((p: any, i: number) => (
                                        <div key={p.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                                            borderRadius: '12px', background: i === 0 ? 'rgba(253,203,110,0.08)' : 'transparent',
                                            border: i === 0 ? '1px solid rgba(253,203,110,0.2)' : '1px solid transparent',
                                        }}>
                                            <span style={{
                                                width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: i < 3 ? '1rem' : '0.75rem', fontWeight: 800,
                                                background: i === 0 ? '#fdcb6e' : i === 1 ? '#b2bec3' : i === 2 ? '#e17055' : 'var(--bg-secondary, rgba(255,255,255,0.05))',
                                                color: i < 3 ? '#1a1f35' : 'var(--text-secondary)',
                                            }}>{i+1}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{p.conversions} conversions · {p.deals} deals</div>
                                            </div>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00b894' }}>{p.revenue > 0 ? formatCurrency(p.revenue) : '—'}</span>
                                        </div>
                                    ))}
                                    {performers.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No agents yet</div>}
                                </div>
                            </div>

                            {/* Win Rate */}
                            <div style={card}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.target} Win Rate by Rep</h3>
                                {revByRep.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={revByRep.filter((r: any) => r.total_leads > 0)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                                            <YAxis stroke="#64748b" fontSize={11} unit="%" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="win_rate" radius={[4,4,0,0]} name="Win Rate (%)">
                                                {revByRep.map((_: any, i: number) => <Cell key={i} fill={C[i % C.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No data yet</div>}
                            </div>
                        </div>

                        {/* Activity Summary */}
                        <div style={card}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.overview} Activity Summary</h3>
                            {activity.length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                {['Name', 'Role', 'Tasks Done', 'Leads Created', 'Quotes Sent'].map(h => (
                                                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activity.map((a: any) => (
                                                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                    <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{a.name}</td>
                                                    <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{a.role}</td>
                                                    <td style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#00b894' }}>{a.tasks_completed}</td>
                                                    <td style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#6c5ce7' }}>{a.leads_created}</td>
                                                    <td style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#fdcb6e' }}>{a.quotes_sent}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No activity data</div>}
                        </div>
                    </motion.div>
                )}

                {/* ═══ REPORTS TAB ═══ */}
                {tab === 'reports' && (
                    <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                            {/* Report Builder */}
                            <div style={card}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.settings} Report Builder</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Data Source</label>
                                        <select value={reportConfig.source} onChange={e => setReportConfig(c => ({ ...c, source: e.target.value }))} style={{ ...inputS, width: '100%' }}>
                                            <option value="leads">Leads</option>
                                            <option value="customers">Customers</option>
                                            <option value="products">Products</option>
                                            <option value="transactions">Transactions</option>
                                            <option value="quotations">Quotations</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Group By</label>
                                        <select value={reportConfig.groupBy} onChange={e => setReportConfig(c => ({ ...c, groupBy: e.target.value }))} style={{ ...inputS, width: '100%' }}>
                                            <option value="month">Month</option>
                                            <option value="status">Status</option>
                                            <option value="source">Source</option>
                                            <option value="category">Category</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Metric</label>
                                        <select value={reportConfig.metric} onChange={e => setReportConfig(c => ({ ...c, metric: e.target.value }))} style={{ ...inputS, width: '100%' }}>
                                            <option value="count">Count</option>
                                            <option value="sum">Sum (Revenue)</option>
                                            <option value="avg">Average</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Chart Type</label>
                                        <select value={reportConfig.chartType} onChange={e => setReportConfig(c => ({ ...c, chartType: e.target.value }))} style={{ ...inputS, width: '100%' }}>
                                            <option value="bar">Bar Chart</option>
                                            <option value="line">Line Chart</option>
                                            <option value="pie">Pie Chart</option>
                                            <option value="area">Area Chart</option>
                                            <option value="table">Data Table</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>FROM</label>
                                            <input type="date" value={reportConfig.dateFrom} onChange={e => setReportConfig(c => ({ ...c, dateFrom: e.target.value }))} style={{ ...inputS, width: '100%' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>TO</label>
                                            <input type="date" value={reportConfig.dateTo} onChange={e => setReportConfig(c => ({ ...c, dateTo: e.target.value }))} style={{ ...inputS, width: '100%' }} />
                                        </div>
                                    </div>
                                    <button onClick={generateReport} disabled={generatingReport}
                                        style={{
                                            padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: '#fff',
                                            fontWeight: 700, fontSize: '0.82rem', opacity: generatingReport ? 0.6 : 1,
                                        }}>{generatingReport ? 'Generating...' : '▶ Generate Report'}</button>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={exportReport}
                                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent', color: '#00b894', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>{svgIcons.exportCsv} Export CSV</button>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Save Report</label>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="Report name..." style={{ ...inputS, flex: 1 }} />
                                            <button onClick={saveReport} disabled={!reportName.trim()}
                                                style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#00b894', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', opacity: reportName.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center' }}>{svgIcons.save}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Report Output */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ ...card, minHeight: '360px' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.overview} Report Output</h3>
                                    {reportResult ? (
                                        <>
                                            {/* Chart rendering */}
                                            {(reportConfig.chartType === 'bar') && (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <BarChart data={reportResult.data}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                        <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                                                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v: number) => formatCurrency(v)} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Bar dataKey="value" radius={[4,4,0,0]} name="Value">
                                                            {reportResult.data.map((_: any, i: number) => <Cell key={i} fill={C[i % C.length]} />)}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                            {(reportConfig.chartType === 'line') && (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <LineChart data={reportResult.data}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                        <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                                                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v: number) => formatCurrency(v)} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Line type="monotone" dataKey="value" stroke="#6c5ce7" strokeWidth={2.5} dot={{ r: 3, fill: '#6c5ce7' }} name="Value" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}
                                            {(reportConfig.chartType === 'pie') && (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <PieChart>
                                                        <Pie data={reportResult.data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={3}>
                                                            {reportResult.data.map((_: any, i: number) => <Cell key={i} fill={C[i % C.length]} />)}
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Legend formatter={(v: any) => <span style={{ color: '#94a3b8', fontSize: '10px' }}>{v}</span>} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                            {(reportConfig.chartType === 'area') && (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <AreaChart data={reportResult.data}>
                                                        <defs>
                                                            <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.3} />
                                                                <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                        <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                                                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v: number) => formatCurrency(v)} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Area type="monotone" dataKey="value" stroke="#6c5ce7" strokeWidth={2.5} fill="url(#rptGrad)" name="Value" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            )}
                                            {(reportConfig.chartType === 'table') && (
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Label</th>
                                                                <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Value</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {reportResult.data.map((row: any, i: number) => (
                                                                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                                    <td style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.label || '—'}</td>
                                                                    <td style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#6c5ce7', textAlign: 'right' }}>{row.value}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
                                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21H3" /><path d="M18 17V9" /><path d="M14 17V5" /><path d="M10 17v-4" /><path d="M6 17v-2" /></svg></div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatCurrency(56750)}</div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t('configure_generate_report')}</div>
                                            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Select a data source, grouping, and chart type</div>
                                        </div>
                                    )}
                                </div>

                                {/* Saved Reports */}
                                {savedReports.length > 0 && (
                                    <div style={card}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>{svgIcons.save} Saved Reports</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {savedReports.map(r => (
                                                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{r.name}</span>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{r.config?.source}</span>
                                                    <button onClick={() => { setReportConfig(r.config); generateReport(); }}
                                                        style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'rgba(108,92,231,0.12)', color: '#6c5ce7', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>▶ Run</button>
                                                    <button onClick={() => deleteReport(r.id)}
                                                        style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(255,107,107,0.1)', color: '#ff7675', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Analytics;
