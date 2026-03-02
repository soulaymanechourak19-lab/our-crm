import React from 'react';

interface NavbarProps {
    title: string;
    onMenuToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title, onMenuToggle }) => {

    return (
        <header className="sticky top-0 z-30 h-16 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50">
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

                    <h1 className="text-lg font-semibold text-white">{title}</h1>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="hidden md:flex items-center bg-dark-800/50 border border-dark-700/50 rounded-xl px-3 py-2">
                        <svg className="w-4 h-4 text-dark-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent text-sm text-white placeholder-dark-500 focus:outline-none w-48"
                        />
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;

