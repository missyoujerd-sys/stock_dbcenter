import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Placeholder Pages (will be implemented shortly)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IncomingStock from './pages/IncomingStock';
import Distribution from './pages/Distribution';

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
              <IncomingStock />
            </PrivateRoute>
          } />
          <Route path="/distribution" element={
            <PrivateRoute>
              <Distribution />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
