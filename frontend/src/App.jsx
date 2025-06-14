// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAuth, getCurrentUser } from './services/auth';

import './styles/orthodox-theme.css';

// Components
import Navigation from './components/Navigation';

// Pages
import Home from './pages/Home';
import Module1 from './pages/Module1';
import Module2 from './pages/Module2';
import Module3 from './pages/Module3';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const hasToken = initializeAuth();
      
      if (hasToken) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Authentication error:', error);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border orthodox-text-gold mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="orthodox-text-blue">Preparing your sacred journey...</p>
          </div>
        </div>
      );
    }
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="mb-4">
            <span className="orthodox-icon fs-1">⛪</span>
          </div>
          <div className="spinner-border orthodox-text-gold mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="orthodox-text-blue">Mount Athos Explorer</h5>
          <p className="orthodox-text-accent">Loading the sacred application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Navigation 
          isAuthenticated={isAuthenticated} 
          setIsAuthenticated={setIsAuthenticated} 
        />
        
        <main className="container mt-4 mb-5">
          <Routes>
            <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} />
            <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
              </ProtectedRoute>
            } />
            
            <Route path="/module/1" element={
              <ProtectedRoute>
                <Module1 user={user} />
              </ProtectedRoute>
            } />
            
            <Route path="/module/2" element={
              <ProtectedRoute>
                <Module2 user={user} />
              </ProtectedRoute>
            } />
            
            <Route path="/module/3" element={
              <ProtectedRoute>
                <Module3 user={user} />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        {/* Orthodox Footer */}
        <footer className="mt-auto py-4" style={{ 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 249, 247, 0.98) 100%)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <span className="orthodox-icon me-2">⛪</span>
                  <small className="orthodox-text-blue">
                    Mount Athos Explorer • Sacred Educational Journey
                  </small>
                </div>
              </div>
              <div className="col-md-6 text-md-end">
                <small className="orthodox-text-accent">
                  Preserving Orthodox Heritage Through Education
                </small>
              </div>
            </div>
            <div className="orthodox-divider my-2"></div>
            <div className="text-center">
              <small className="text-muted">
                Built with reverence for the Holy Mountain and its sacred traditions
              </small>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;