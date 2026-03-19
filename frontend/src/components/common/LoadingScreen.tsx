import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm animate-fade-in-up">
      <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl w-64">
        {/* Animated Icon */}
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
        
        {/* Animated Text */}
        <h3 className="text-xl font-semibold text-white mb-2 tracking-wide animate-pulse">Loading</h3>
        <p className="text-sm text-gray-400 text-center animate-fade-in-up stagger-1">
          Preparing your workspace...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
