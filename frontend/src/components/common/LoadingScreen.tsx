import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in-up" 
      style={{ backgroundColor: 'rgba(var(--bg-primary-rgb, 0, 0, 0), 0.8)', backdropFilter: 'blur(4px)' }}
    >
      <div 
        className="flex flex-col items-center justify-center p-8 rounded-2xl shadow-xl w-64"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Animated Icon */}
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
        
        {/* Animated Text */}
        <h3 className="text-xl font-semibold mb-2 tracking-wide animate-pulse" style={{ color: 'var(--text-primary)' }}>Loading</h3>
        <p className="text-sm text-center animate-fade-in-up stagger-1" style={{ color: 'var(--text-secondary)' }}>
          Preparing your workspace...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
