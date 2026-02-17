import React, { useState, useEffect } from 'react';
import './App.css';
import { CRMProvider, useCRM } from './context/CRMContext';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';

const Navigation: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/leads');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, toast } = useCRM();

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isActive = (path: string) => route.startsWith(path);

  let Component = Leads;
  if (route.startsWith('#/customers/')) {
    Component = CustomerDetail;
  } else if (route.startsWith('#/customers')) {
    Component = Customers;
  }

  const navItems = [
    { path: '#/leads', label: 'Leads', icon: '🎯' },
    { path: '#/customers', label: 'Customers', icon: '👥' },
  ];


  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col`}
        style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', borderRight: '1px solid rgba(148, 163, 184, 0.1)' }}>

        {/* Logo */}
        <div className="px-6 py-6 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                C
              </div>
              <span className="font-bold text-lg text-white tracking-tight">OurCRM</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors p-1">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <a key={item.path} href={item.path}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(item.path)
                ? 'text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              style={isActive(item.path) ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}>
              <span className="text-xl mr-3">{item.icon}</span>
              {sidebarOpen && item.label}
            </a>
          ))}
        </nav>

        {/* User info */}
        {currentUser && sidebarOpen && (
          <div className="px-4 py-4 mx-3 mb-4 rounded-xl" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-400 capitalize">{currentUser.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-primary)' }}>
        <Component />
      </main>

      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-toast">
          <div className={`px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center space-x-2 ${toast.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <CRMProvider>
      <Navigation />
    </CRMProvider>
  );
}

export default App;
