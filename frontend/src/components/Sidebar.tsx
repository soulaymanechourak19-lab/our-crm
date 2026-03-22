import React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

const navContainerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.2
        }
    }
};

const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } }
};

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) => {
    const { t } = useTranslation();

    const navItems: { path: string; label: string; icon: React.ReactNode }[] = [
        { path: '/dashboard', label: t('sidebar.dashboard'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
        { path: '/leads', label: t('sidebar.leads'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
        { path: '/quotations', label: 'Quotations', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
        { path: '/customers', label: t('sidebar.customers'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
        { path: '/discounts', label: 'Discounts', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg> },
        { path: '/products', label: t('sidebar.products'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg> },
        { path: '/tickets', label: t('sidebar.tickets', 'Tickets'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/><path d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/><line x1="15" y1="12" x2="9" y2="12"/><line x1="15" y1="8" x2="9" y2="8"/><line x1="15" y1="16" x2="9" y2="16"/></svg> },
        { path: '/sav-dashboard', label: t('sidebar.savDashboard', 'SAV Dashboard'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg> },
        { path: '/settings', label: t('sidebar.settings'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
        { path: '/logs', label: t('sidebar.logs'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> },
    ];

    // Create a motion component wrapper for NavLink correctly handling the active class via children
    const MotionNavLink = motion.create(React.forwardRef<HTMLAnchorElement, NavLinkProps>((props, ref) => (
        <NavLink ref={ref} {...props} />
    )));

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" 
                        onClick={onMobileClose} 
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 z-50 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
                    } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo */}
                <div className="flex items-center h-16 px-4 border-b border-dark-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
                            <span className="text-white font-bold text-lg">C</span>
                        </div>
                        {!isCollapsed && <span className="text-white font-bold text-lg">Our CRM</span>}
                    </div>
                </div>

                {/* Navigation */}
                <motion.nav 
                    variants={navContainerVariants}
                    initial="hidden"
                    animate="show"
                    className="flex-1 px-3 py-4 space-y-2 overflow-y-auto"
                >
                    {navItems.map((item) => (
                        <MotionNavLink
                            key={item.path}
                            to={item.path}
                            onClick={onMobileClose}
                            variants={navItemVariants}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className={({ isActive }: { isActive: boolean }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${isActive
                                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                                    : 'text-dark-400 hover:text-white hover:bg-dark-800 hover:shadow-lg'
                                } ${isCollapsed ? 'justify-center' : ''}`
                            }
                        >
                            <span className="text-lg flex-shrink-0">{item.icon}</span>
                            {!isCollapsed && <span>{item.label}</span>}
                        </MotionNavLink>
                    ))}
                </motion.nav>

                {/* Collapse Toggle (desktop) */}
                <div className="hidden lg:block px-3 py-2 border-t border-dark-700/50">
                    <button
                        onClick={onToggle}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-all text-sm font-medium"
                    >
                        {isCollapsed ? '→' : '← Collapse'}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
