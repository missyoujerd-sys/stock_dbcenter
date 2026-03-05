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

import ErrorBoundary from './components/ErrorBoundary';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
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
          <Route path="/repair/dashboard" element={
            <PrivateRoute>
              <RepairDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
