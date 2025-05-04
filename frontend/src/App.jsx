// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAuth, getCurrentUser } from './services/auth';

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
    if (loading) return <div className="text-center mt-5">Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  if (loading) {
    return <div className="text-center mt-5">Loading application...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        <Navigation 
          isAuthenticated={isAuthenticated} 
          setIsAuthenticated={setIsAuthenticated} 
        />
        
        <div className="container mt-4">
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
        </div>
      </div>
    </Router>
  );
};

export default App;