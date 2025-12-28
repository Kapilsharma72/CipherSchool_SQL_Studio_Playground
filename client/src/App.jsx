import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import './App.css';

import AssignmentList from './components/AssignmentList/AssignmentList';
import AssignmentAttempt from './pages/AssignmentAttempt/AssignmentAttempt';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Navbar from './components/Layout/Navbar';
import LoadingSpinner from './components/Common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAppContext();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppContent = () => {
  const { loading } = useAppContext();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app">
      {!['/login', '/register'].includes(location.pathname) && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AssignmentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignment/:id"
            element={
              <ProtectedRoute>
                <AssignmentAttempt />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;