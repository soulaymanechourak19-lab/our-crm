import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CRMProvider } from './context/CRMContext';
import { ToastProvider } from './components/common/Toast';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import './App.css';

// ── Lazy-loaded routes (code splitting — smaller initial bundle) ──
const Login = lazy(() => import('./components/auth/Login'));
const Register = lazy(() => import('./components/auth/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Users = lazy(() => import('./pages/admin/Users'));
const Leads = lazy(() => import('./pages/Leads'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Products = lazy(() => import('./pages/Products'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const ChatbotTraining = lazy(() => import('./pages/ChatbotTraining'));

// Simple full-page loading fallback
const PageLoader: React.FC = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#0a0e1a', color: '#a0aec0', fontFamily: 'Inter, sans-serif'
  }}>
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium tracking-widest uppercase opacity-50">Loading OurCRM</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <CRMProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Layout title="Dashboard" subtitle="Overview of your business performance">
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Layout title="User Profile" subtitle="Manage your account settings">
                        <Profile />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* CRM routes */}
                <Route
                  path="/leads"
                  element={
                    <PrivateRoute>
                      <Layout title="Leads" subtitle="Manage and track your sales pipeline">
                        <Leads />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <PrivateRoute>
                      <Layout title="Customers" subtitle="Keep track of your client relationships">
                        <Customers />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/customers/:id"
                  element={
                    <PrivateRoute>
                      <Layout title="Customer Details" subtitle="Detailed view of client information">
                        <CustomerDetail />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Sales routes */}
                <Route
                  path="/products"
                  element={
                    <PrivateRoute>
                      <Layout title="Products" subtitle="Manage your inventory and product catalog">
                        <Products />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Admin-only routes */}
                <Route
                  path="/chatbot"
                  element={
                    <PrivateRoute>
                      <Layout title="AI Assistant" subtitle="Your intelligent operations companion">
                        <Chatbot />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/chatbot-training"
                  element={
                    <PrivateRoute adminOnly>
                      <Layout title="AI Training" subtitle="Train your chatbot's machine learning model">
                        <ChatbotTraining />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <PrivateRoute adminOnly>
                      <Layout title="User Management" subtitle="Manage system users and permissions">
                        <Users />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </CRMProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
