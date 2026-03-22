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

    const navItems = [
        { path: '/dashboard', label: t('sidebar.dashboard'), icon: '📊' },
        { path: '/leads', label: t('sidebar.leads'), icon: '👥' },
        { path: '/products', label: t('sidebar.products'), icon: '🛒' },
        { path: '/customers', label: t('sidebar.customers'), icon: '👤' },
        { path: '/tickets', label: t('sidebar.tickets', 'Tickets'), icon: '🎫' },
        { path: '/sav-dashboard', label: t('sidebar.savDashboard', 'SAV Dashboard'), icon: '📊' },
        { path: '/settings', label: t('sidebar.settings'), icon: '⚙️' },
        { path: '/logs', label: t('sidebar.logs'), icon: '📋' },
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
