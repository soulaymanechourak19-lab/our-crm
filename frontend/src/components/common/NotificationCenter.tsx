import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const initialNotifications = [
    { id: 1, type: 'info', title: 'New lead assigned', message: 'Sarah Smith has been assigned to you.', time: '5m ago', read: false },
    { id: 2, type: 'success', title: 'System Updated', message: 'CRM version 2.4 has been deployed successfully.', time: '2h ago', read: false },
    { id: 3, type: 'warning', title: 'Meeting Reminder', message: 'Call with Acme Corp in 15 minutes.', time: '1d ago', read: true },
];

const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(prev => !prev)}
                style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative', color: 'var(--text-secondary)',
                    transition: 'all 0.2s',
                    outline: 'none'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.95)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        style={{
                            position: 'absolute', top: '6px', right: '6px',
                            width: '7px', height: '7px', borderRadius: '50%', background: '#e84393',
                        }}
                    />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-xl z-[100] overflow-hidden bg-white dark:bg-dark-800 border-slate-100 dark:border-dark-700 border"
                    >
                        <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-dark-700 bg-white/80 dark:bg-dark-800/80 backdrop-blur-md">
                            <h3 className="m-0 text-slate-800 dark:text-white text-sm font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 dark:text-dark-400">
                                    <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-dark-700">
                                    {notifications.map((notification, idx) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => markAsRead(notification.id)}
                                            className={`p-4 cursor-pointer transition-colors relative ${!notification.read ? 'bg-slate-50 dark:bg-dark-700/50' : 'hover:bg-slate-50 dark:hover:bg-dark-700/30'}`}
                                        >
                                            {!notification.read && (
                                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#e84393', borderTopRightRadius: '4px', borderBottomRightRadius: '4px' }} />
                                            )}
                                            <div className="flex gap-3">
                                                <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                                    ${notification.type === 'primary' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                                                      notification.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
                                                      notification.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 
                                                      'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}
                                                >
                                                    {notification.type === 'success' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                    {notification.type === 'warning' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                    {(!notification.type || notification.type === 'info') && <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                </div>
                                                <div>
                                                    <h4 className={`m-0 text-sm font-semibold ${!notification.read ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-dark-300'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="mt-1 mb-0 text-xs text-slate-500 dark:text-dark-400">{notification.message}</p>
                                                    <p className="mt-1 mb-0 text-[11px] font-medium text-slate-400 dark:text-dark-500">{notification.time}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-center">
                                <button className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-dark-400 dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
