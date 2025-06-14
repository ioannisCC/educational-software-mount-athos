// frontend/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Progress from '../components/Progress';

const Home = ({ isAuthenticated }) => {
  return (
    <div className="home-container fade-in">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3">
                Mount Athos Explorer
              </h1>
              <p className="lead mb-3">
                Journey through the Sacred Heritage of the Holy Mountain
              </p>
              <p className="lead mb-3">
                Άγιον Όρος • An immersive educational experience through 
                1000+ years of Orthodox Christian monasticism
              </p>
              
              {isAuthenticated ? (
                <>
                  <div className="divider"></div>
                  <p className="lead mb-3">
                    Continue your personalized learning journey through the sacred modules
                  </p>
                  <div className="d-flex flex-wrap gap-3">
                    <Link to="/module/1" className="btn btn-light btn-lg">
                      <span className="icon">I</span>
                      History & Faith
                    </Link>
                    <Link to="/module/2" className="btn btn-light btn-lg">
                      <span className="icon">II</span>
                      Sacred Architecture
                    </Link>
                    <Link to="/module/3" className="btn btn-light btn-lg">
                      <span className="icon">III</span>
                      Natural Sanctuary
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="divider"></div>
                  <p className="mb-4">
                    Begin your spiritual and educational journey
                  </p>
                  <div className="d-flex gap-3">
                    <Link to="/login" className="btn btn-light btn-lg">
                      <span className="icon">→</span>
                      Begin Journey
                    </Link>
                    <Link to="/register" className="btn btn-outline-light btn-lg">
                      <span className="icon">+</span>
                      Join Community
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className="col-lg-4 text-center">
              <div className="row text-center">
                <div className="col-6 mb-3">
                  <div className="stat-card">
                    <span className="stat-number">20</span>
                    <span className="stat-label">Monasteries</span>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="stat-card">
                    <span className="stat-number">1000+</span>
                    <span className="stat-label">Years History</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-card">
                    <span className="stat-number">963</span>
                    <span className="stat-label">Founded AD</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-card">
                    <span className="stat-number">Unesco</span>
                    <span className="stat-label">Heritage Site</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section for Authenticated Users */}
      {isAuthenticated && (
        <div className="mb-5">
          <Progress />
        </div>
      )}
      
      {/* Module Overview Cards */}
      <div className="row mb-5">
        <div className="col-md-4 mb-4">
          <div className="card module-card h-100">
            <div className="card-header">
              <div className="d-flex align-items-center">
                <span className="icon icon-xl me-3">I</span>
                <div>
                  <h5 className="card-title mb-1">History & Religious Significance</h5>
                  <small className="opacity-75">The Sacred Foundation</small>
                </div>
              </div>
            </div>
            <div className="card-body">
              <p className="card-text">
                Journey through the sacred history of Mount Athos, from the 
                blessed founding by St. Athanasius the Athonite in 963 AD to its enduring spiritual legacy.
              </p>
              
              <div className="mb-3">
                <h6 className="mb-2">Sacred Learning Path:</h6>
                <ul className="list-unstyled small">
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    Byzantine origins and imperial blessings
                  </li>
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    Orthodox spiritual significance
                  </li>
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    The sacred Avaton tradition
                  </li>
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    UNESCO World Heritage recognition
                  </li>
                </ul>
              </div>
              
              {isAuthenticated ? (
                <Link to="/module/1" className="btn btn-primary w-100">
                  <span className="icon">→</span>
                  Begin Spiritual Journey
                </Link>
              ) : (
                <button className="btn btn-outline-primary w-100" disabled>
                  <span className="icon">○</span>
                  Authentication Required
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card module-card h-100 fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="card-header">
              <div className="d-flex align-items-center">
                <span className="icon icon-xl me-3">II</span>
                <div>
                  <h5 className="card-title mb-1">Monasteries & Architecture</h5>
                  <small className="opacity-75">Sacred Fortresses</small>
                </div>
              </div>
            </div>
            <div className="card-body">
              <p className="card-text">
                Explore the 20 ruling monasteries and their 
                magnificent Byzantine architecture, each telling unique stories of faith and craftsmanship.
              </p>
              
              <div className="mb-3">
                <h6 className="mb-2">Architectural Wonders:</h6>
                <ul className="list-unstyled small">
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    Fortress-monastery designs
                  </li>
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    International Orthodox communities
                  </li>
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    Sacred art and iconography
                  </li>
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    Katholikon churches and courtyards
                  </li>
                </ul>
              </div>
              
              {isAuthenticated ? (
                <Link to="/module/2" className="btn btn-primary w-100">
                  <span className="icon">→</span>
                  Explore Sacred Architecture
                </Link>
              ) : (
                <button className="btn btn-outline-primary w-100" disabled>
                  <span className="icon">○</span>
                  Authentication Required
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card module-card h-100 fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="card-header">
              <div className="d-flex align-items-center">
                <span className="icon icon-xl me-3">III</span>
                <div>
                  <h5 className="card-title mb-1">Natural Environment & Geography</h5>
                  <small className="opacity-75">God's Garden</small>
                </div>
              </div>
            </div>
            <div className="card-body">
              <p className="card-text">
                Discover the pristine natural sanctuary of the 
                Holy Mountain, where faith-based conservation has preserved God's creation for centuries.
              </p>
              
              <div className="mb-3">
                <h6 className="mb-2">Natural Treasures:</h6>
                <ul className="list-unstyled small">
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    Chalkidiki Peninsula geography
                  </li>
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    Endemic species and monk seals
                  </li>
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    Ancient forests and biodiversity
                  </li>
                  <li className="mb-1">
                    <span className="icon">•</span> 
                    Sacred stewardship model
                  </li>
                </ul>
              </div>
              
              {isAuthenticated ? (
                <Link to="/module/3" className="btn btn-primary w-100">
                  <span className="icon">→</span>
                  Discover Natural Sanctuary
                </Link>
              ) : (
                <button className="btn btn-outline-primary w-100" disabled>
                  <span className="icon">○</span>
                  Authentication Required
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action for Non-Authenticated Users */}
      {!isAuthenticated && (
        <div className="card fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="card-body text-center py-5">
            <h3 className="mb-3">Ready to Begin Your Sacred Journey?</h3>
            <p className="lead mb-4">
              Join thousands of learners exploring the spiritual and cultural heritage of Mount Athos
            </p>
            <div className="divider"></div>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Link to="/register" className="btn btn-primary btn-lg">
                <span className="icon">→</span>
                Start Your Pilgrimage
              </Link>
              <Link to="/login" className="btn btn-outline-primary btn-lg">
                <span className="icon">↵</span>
                Continue Your Journey
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;