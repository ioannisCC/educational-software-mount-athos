// frontend/src/components/Navigation.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';

const Navigation = ({ isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Mount Athos Explorer
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                <span className="icon">◊</span>
                Home
              </Link>
            </li>
            
            {isAuthenticated && (
              <li className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle" 
                  href="#" 
                  id="modulesDropdown" 
                  role="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                >
                  <span className="icon">◈</span>
                  Modules
                </a>
                <ul className="dropdown-menu" aria-labelledby="modulesDropdown">
                  <li>
                    <Link className="dropdown-item" to="/module/1">
                      <span className="icon">I</span>
                      History & Faith
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/module/2">
                      <span className="icon">II</span>
                      Architecture
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/module/3">
                      <span className="icon">III</span>
                      Environment
                    </Link>
                  </li>
                </ul>
              </li>
            )}
          </ul>
          
          <ul className="navbar-nav">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">
                    <span className="icon">⚙</span>
                    Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-link nav-link" onClick={handleLogout}>
                    <span className="icon">↗</span>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <span className="icon">→</span>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    <span className="icon">+</span>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;