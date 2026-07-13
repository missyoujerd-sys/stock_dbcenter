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
import History from './pages/History';
import Users from './pages/Users';
import ItDashboard from './pages/it-equipment/ItDashboard';
import ItReceive from './pages/it-equipment/ItReceive';
import ItIssue from './pages/it-equipment/ItIssue';
import ItReports from './pages/it-equipment/ItReports';
import ItEmployees from './pages/it-equipment/ItEmployees';
import RepairEntry from './pages/repair/RepairEntry';
import RepairDashboard from './pages/repair/RepairDashboard';
import RepairView from './pages/repair/RepairView';
import RepairPublicSearch from './pages/repair/RepairPublicSearch';
import BorrowReturn from './pages/BorrowReturn';
import ChatRoom from './pages/ChatRoom';
import FloatingChat from './components/FloatingChat';

import ErrorBoundary from './components/ErrorBoundary';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          {/* Public route - no login required */}
          <Route path="/repair/public" element={<RepairPublicSearch />} />
          <Route path="/repair/public/:id" element={<RepairPublicSearch />} />
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/incoming" element={
            <PrivateRoute>
              <ErrorBoundary>
                <IncomingStock />
              </ErrorBoundary>
            </PrivateRoute>
          } />
          <Route path="/distribution" element={
            <PrivateRoute>
              <Distribution />
            </PrivateRoute>
          } />
          <Route path="/inventory" element={
            <PrivateRoute>
              <Inventory />
            </PrivateRoute>
          } />
          <Route path="/history" element={
            <PrivateRoute>
              <History />
            </PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          } />
          <Route path="/it-equipment" element={
            <PrivateRoute>
              <ItDashboard />
            </PrivateRoute>
          } />
          <Route path="/it-equipment/receive" element={
            <PrivateRoute>
              <ItReceive />
            </PrivateRoute>
          } />
          <Route path="/it-equipment/issue" element={
            <PrivateRoute>
              <ItIssue />
            </PrivateRoute>
          } />
          <Route path="/it-equipment/reports" element={
            <PrivateRoute>
              <ItReports />
            </PrivateRoute>
          } />
          <Route path="/it-equipment/employees" element={
            <PrivateRoute>
              <ItEmployees />
            </PrivateRoute>
          } />
          <Route path="/borrow" element={
            <PrivateRoute>
              <BorrowReturn />
            </PrivateRoute>
          } />
          <Route path="/chat" element={
            <PrivateRoute>
              <ChatRoom />
            </PrivateRoute>
          } />
          <Route path="/repair" element={
            <PrivateRoute>
              <RepairDashboard />
            </PrivateRoute>
          } />
          <Route path="/repair/entry" element={
            <PrivateRoute>
              <RepairEntry />
            </PrivateRoute>
          } />
          <Route path="/repair/view/:id" element={
            <PrivateRoute>
              <RepairView />
            </PrivateRoute>
          } />
          <Route path="/repair/edit/:id" element={
            <PrivateRoute>
              <RepairEntry />
            </PrivateRoute>
          } />
          <Route path="/repair/dashboard" element={
            <PrivateRoute>
              <RepairDashboard />
            </PrivateRoute>
          } />
        </Routes>
        {/* Floating Chat Bubble - available on all authenticated pages */}
        <FloatingChat />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
