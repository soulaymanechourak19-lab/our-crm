import React, { useState } from 'react';
import { motion } from 'framer-motion';

import { useNotification, Notification } from '../context/NotificationContext';

const typeConfig: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    info: {
        bg: 'rgba(99, 102, 241, 0.1)',
        color: '#6366f1',
        icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    success: {
        bg: 'rgba(34, 197, 94, 0.1)',
        color: '#22c55e',
        icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    },
    warning: {
        bg: 'rgba(245, 158, 11, 0.1)',
        color: '#f59e0b',
        icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    error: {
        bg: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>,
    },
};

const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today at ${time}`;
    if (isYesterday) return `Yesterday at ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${time}`;
};

type FilterType = 'all' | 'unread' | 'info' | 'success' | 'warning' | 'error';

const Notifications: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();
    const [filter, setFilter] = useState<FilterType>('all');



    const filtered = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'all') return true;
        return n.type === filter;
    });

    // Group by date
    const grouped = filtered.reduce<Record<string, Notification[]>>((acc, n) => {
        const d = new Date(n.timestamp);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        let label: string;
        if (d.toDateString() === now.toDateString()) label = 'Today';
        else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
        else label = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

        if (!acc[label]) acc[label] = [];
        acc[label].push(n);
        return acc;
    }, {});

    const filterButtons: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'unread', label: `Unread (${unreadCount})` },
        { key: 'info', label: 'Info' },
        { key: 'success', label: 'Success' },
        { key: 'warning', label: 'Warnings' },
        { key: 'error', label: 'Errors' },
    ];

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            All Notifications
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        style={{
                            padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem',
                            fontWeight: 600, border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)', color: 'var(--indigo-500, #6366f1)',
                            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
                    >
                        ✓ Mark all as read
                    </button>
                )}
            </div>

            {/* Filter pills */}
            <div style={{
                display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap',
            }}>
                {filterButtons.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem',
                            fontWeight: 600, border: '1px solid',
                            borderColor: filter === f.key ? 'var(--indigo-500, #6366f1)' : 'var(--border-subtle)',
                            background: filter === f.key ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                            color: filter === f.key ? 'var(--indigo-500, #6366f1)' : 'var(--text-secondary)',
                            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Notification list */}
            {Object.keys(grouped).length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'var(--bg-card)', borderRadius: '16px',
                    border: '1px solid var(--border-subtle)',
                }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: '12px' }}>
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        No notifications match this filter
                    </p>
                </div>
            ) : (
                Object.entries(grouped).map(([dateLabel, items]) => (
                    <div key={dateLabel} style={{ marginBottom: '28px' }}>
                        <h4 style={{
                            fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)',
                            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px',
                            paddingLeft: '4px',
                        }}>
                            {dateLabel}
                        </h4>
                        <div style={{
                            background: 'var(--bg-card)', borderRadius: '16px',
                            border: '1px solid var(--border-subtle)', overflow: 'hidden',
                        }}>
                            {items.map((n, idx) => {
                                const cfg = typeConfig[n.type] || typeConfig.info;
                                return (
                                    <motion.div
                                        key={n.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => markAsRead(n.id)}
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '14px',
                                            padding: '16px 20px', cursor: 'pointer',
                                            borderBottom: idx < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                            background: !n.read ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                                            transition: 'background 0.2s',
                                            position: 'relative',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = !n.read ? 'rgba(99,102,241,0.04)' : 'transparent'; }}
                                    >
                                        {/* Unread indicator */}
                                        {!n.read && (
                                            <div style={{
                                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                                width: '3px', background: '#6366f1',
                                                borderTopRightRadius: '4px', borderBottomRightRadius: '4px',
                                            }} />
                                        )}

                                        {/* Icon */}
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '12px',
                                            background: cfg.bg, color: cfg.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, marginTop: '2px',
                                        }}>
                                            {cfg.icon}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                <h4 style={{
                                                    margin: 0, fontSize: '0.88rem',
                                                    fontWeight: !n.read ? 700 : 600,
                                                    color: !n.read ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                }}>
                                                    {n.title}
                                                </h4>
                                                <span style={{
                                                    fontSize: '0.72rem', fontWeight: 500,
                                                    color: 'var(--text-secondary)', whiteSpace: 'nowrap', opacity: 0.7,
                                                }}>
                                                    {n.time}
                                                </span>
                                            </div>
                                            <p style={{
                                                margin: '4px 0 0', fontSize: '0.82rem',
                                                color: 'var(--text-secondary)', lineHeight: 1.4,
                                            }}>
                                                {n.message}
                                            </p>
                                            <p style={{
                                                margin: '6px 0 0', fontSize: '0.72rem',
                                                color: 'var(--text-secondary)', opacity: 0.6,
                                            }}>
                                                {formatTimestamp(n.timestamp)}
                                            </p>
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--text-secondary)', opacity: 0.4, padding: '4px',
                                                borderRadius: '6px', transition: 'all 0.2s', flexShrink: 0,
                                                marginTop: '2px',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                            onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                            title="Dismiss"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default Notifications;
