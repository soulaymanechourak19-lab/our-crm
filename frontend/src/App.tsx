import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { CRMProvider } from './context/CRMContext';
import { ToastProvider } from './components/common/Toast';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import LoadingScreen from './components/common/LoadingScreen';
import PageTransition from './components/common/PageTransition';
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
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Settings = lazy(() => import('./pages/Settings'));
const Logs = lazy(() => import('./pages/Logs'));
const TicketsList = lazy(() => import('./pages/TicketsList'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const SAVDashboard = lazy(() => import('./pages/SAVDashboard'));
const SupportChat = lazy(() => import('./pages/SupportChat'));

// ── Lazy-loaded routes (code splitting — smaller initial bundle) ──

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/support" element={<SupportChat />} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.dashboard.title" subtitleKey="pages.dashboard.subtitle">
                  <Dashboard />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.settings.title" subtitleKey="pages.settings.subtitle">
                  <Settings />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <PrivateRoute adminOnly>
              <PageTransition>
                <Layout titleKey="pages.logs.title" subtitleKey="pages.logs.subtitle">
                  <Logs />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.profile.title" subtitleKey="pages.profile.subtitle">
                  <Profile />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />

        {/* CRM routes */}
        <Route
          path="/leads"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.leads.title" subtitleKey="pages.leads.subtitle">
                  <Leads />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.customers.title" subtitleKey="pages.customers.subtitle">
                  <Customers />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.customerDetail.title" subtitleKey="pages.customerDetail.subtitle">
                  <CustomerDetail />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />

        {/* Sales routes */}
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.products.title" subtitleKey="pages.products.subtitle">
                  <Products />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />

        {/* Ticketing routes */}
        <Route
          path="/tickets"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.tickets.title" subtitleKey="pages.tickets.subtitle">
                  <TicketsList />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.ticketDetail.title" subtitleKey="pages.ticketDetail.subtitle">
                  <TicketDetail />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/sav-dashboard"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.savDashboard.title" subtitleKey="pages.savDashboard.subtitle">
                  <SAVDashboard />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/chatbot"
          element={
            <PrivateRoute>
              <PageTransition>
                <Layout titleKey="pages.aiAssistant.title" subtitleKey="pages.aiAssistant.subtitle">
                  <Chatbot />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/chatbot-training"
          element={
            <PrivateRoute adminOnly>
              <PageTransition>
                <Layout titleKey="pages.aiTraining.title" subtitleKey="pages.aiTraining.subtitle">
                  <ChatbotTraining />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute adminOnly>
              <PageTransition>
                <Layout titleKey="pages.users.title" subtitleKey="pages.users.subtitle">
                  <Users />
                </Layout>
              </PageTransition>
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <CRMProvider>
          <ThemeProvider>
            <ToastProvider>
              <Suspense fallback={<LoadingScreen />}>
                <AnimatedRoutes />
              </Suspense>
            </ToastProvider>
          </ThemeProvider>
        </CRMProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
