import React from 'react';
import NotificationCenter from './common/NotificationCenter';

interface NavbarProps {
    title: string;
    onMenuToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title, onMenuToggle }) => {

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-dark-700/50 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left Side */}
                <div className="flex items-center gap-4">
                    {/* Mobile menu button */}
                    <button
                        onClick={onMenuToggle}
                        className="lg:hidden p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <h1 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h1>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="hidden md:flex items-center bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-2
                                    dark:bg-dark-800/50 dark:border-dark-700/50 dark:shadow-none">
                        <svg className="w-5 h-5 text-slate-400 dark:text-dark-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent text-sm text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-dark-500 focus:outline-none w-48"
                        />
                    </div>

                    {/* Notifications */}
                    <NotificationCenter />
                </div>
            </div>
        </header>
    );
};

export default Navbar;

