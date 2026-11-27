import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Placeholder Pages (will be implemented shortly)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IncomingStock from './pages/IncomingStock';
import Distribution from './pages/Distribution';
import Inventory from './pages/Inventory';
import RepairEntry from './pages/repair/RepairEntry';
import RepairDashboard from './pages/repair/RepairDashboard';
import RepairView from './pages/repair/RepairView';
import RepairPublicSearch from './pages/repair/RepairPublicSearch';
import BorrowReturn from './pages/BorrowReturn';
import ChatRoom from './pages/ChatRoom';
import ComputerEquipment from './pages/ComputerEquipment';
import FloatingChat from './components/FloatingChat';
import InternalRepair from './pages/repair/InternalRepair';
import JobSearch from './pages/repair/JobSearch';
import QrAutoLogin from './pages/QrAutoLogin';

import ErrorBoundary from './components/ErrorBoundary';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { currentUser, isAdmin_2 } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (!isAdmin_2) return <Navigate to="/job-search" replace />;
  return <Layout>{children}</Layout>;
}

function DefaultFallbackRoute() {
  const { currentUser, isAdmin_2 } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin_2 ? '/' : '/job-search'} replace />;
}

import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          {/* Public route - no login required */}
          <Route path="/repair/public" element={<RepairPublicSearch />} />
          <Route path="/repair/public/:id" element={<RepairPublicSearch />} />
          <Route path="/" element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          } />
          <Route path="/incoming" element={
            <AdminRoute>
              <ErrorBoundary>
                <IncomingStock />
              </ErrorBoundary>
            </AdminRoute>
          } />
          <Route path="/distribution" element={
            <AdminRoute>
              <Distribution />
            </AdminRoute>
          } />
          <Route path="/inventory" element={
            <AdminRoute>
              <Inventory />
            </AdminRoute>
          } />
          <Route path="/computer-equipment" element={
            <AdminRoute>
              <ComputerEquipment />
            </AdminRoute>
          } />
          <Route path="/borrow" element={
            <AdminRoute>
              <BorrowReturn />
            </AdminRoute>
          } />
          <Route path="/chat" element={
            <AdminRoute>
              <ChatRoom />
            </AdminRoute>
          } />
          <Route path="/repair" element={
            <AdminRoute>
              <RepairDashboard />
            </AdminRoute>
          } />
          <Route path="/repair/entry" element={
            <AdminRoute>
              <RepairEntry />
            </AdminRoute>
          } />
          <Route path="/repair/view/:id" element={
            <PrivateRoute>
              <RepairView />
            </PrivateRoute>
          } />
          <Route path="/repair/edit/:id" element={
            <AdminRoute>
              <RepairEntry />
            </AdminRoute>
          } />
          <Route path="/repair/dashboard" element={
            <AdminRoute>
              <RepairDashboard />
            </AdminRoute>
          } />
          <Route path="/internal-repair" element={
            <AdminRoute>
              <InternalRepair />
            </AdminRoute>
          } />
          <Route path="/job-search" element={
            <PrivateRoute>
              <JobSearch />
            </PrivateRoute>
          } />
          <Route path="/qr-login" element={
            <AdminRoute>
              <QrAutoLogin />
            </AdminRoute>
          } />
          <Route path="*" element={<DefaultFallbackRoute />} />
        </Routes>
        {/* Floating Chat Bubble - available on all authenticated pages */}
        <FloatingChat />
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
