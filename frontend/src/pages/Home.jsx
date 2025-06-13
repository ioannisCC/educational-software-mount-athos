// frontend/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Progress from '../components/Progress';

const Home = ({ isAuthenticated }) => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="jumbotron bg-gradient-primary text-white p-5 rounded mb-4" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundImage: 'url("/images/common/mount-athos-hero.jpg")',
        backgroundSize: 'cover',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="container">
          <h1 className="display-4 fw-bold">🏛️ Mount Athos Explorer</h1>
          <p className="lead fs-5">
            Discover the rich history, sacred monasteries, and pristine natural environment of the Holy Mountain
          </p>
          <p className="fs-6">
            🇬🇷 Άγιον Όρος - An immer  sive educational journey through 1000+ years of Orthodox Christian heritage
          </p>
          
          {isAuthenticated ? (
            <>
              <hr className="my-4 border-light" />
              <p className="mb-4">Continue your personalized learning journey through the modules below</p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/module/1" className="btn btn-light btn-lg shadow">
                  📜 Module 1: History & Religious Significance
                </Link>
                <Link to="/module/2" className="btn btn-light btn-lg shadow">
                  🏛️ Module 2: Monasteries & Architecture
                </Link>
                <Link to="/module/3" className="btn btn-light btn-lg shadow">
                  🌿 Module 3: Natural Environment & Geography
                </Link>
              </div>
            </>
          ) : (
            <>
              <hr className="my-4 border-light" />
              <p className="mb-4">Sign in to begin your adaptive learning adventure</p>
              <div className="d-flex gap-3">
                <Link to="/login" className="btn btn-light btn-lg me-3 shadow">
                  🔑 Login
                </Link>
                <Link to="/register" className="btn btn-outline-light btn-lg shadow">
                  📝 Register
                </Link>
              </div>
            </>
          )}
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
          <div className="card h-100 border-primary shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                📜 Module 1: History & Religious Significance
              </h5>
            </div>
            <div className="card-body">
              <p className="card-text">
                Journey through over 1000 years of monastic tradition, from the founding by St. Athanasius the Athonite in 963 AD to the present day.
              </p>
              <ul className="small text-muted">
                <li>🏛️ Ancient origins and Byzantine heritage</li>
                <li>⛪ Religious importance in Orthodox Christianity</li>
                <li>🚫 The Avaton tradition and its significance</li>
                <li>🌍 UNESCO World Heritage recognition</li>
              </ul>
              {isAuthenticated ? (
                <Link to="/module/1" className="btn btn-primary">
                  Start Learning →
                </Link>
              ) : (
                <button className="btn btn-outline-primary" disabled>
                  Login Required
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100 border-success shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                🏛️ Module 2: Monasteries & Architecture
              </h5>
            </div>
            <div className="card-body">
              <p className="card-text">
                Explore the 20 ruling monasteries, their unique histories, architectural marvels, and the international Orthodox character of the Holy Mountain.
              </p>
              <ul className="small text-muted">
                <li>🏰 The twenty ruling monasteries hierarchy</li>
                <li>🌍 International Orthodox communities</li>
                <li>🏗️ Byzantine fortress-monastery architecture</li>
                <li>🗺️ Interactive monastery location map</li>
              </ul>
              {isAuthenticated ? (
                <Link to="/module/2" className="btn btn-success">
                  Explore Monasteries →
                </Link>
              ) : (
                <button className="btn btn-outline-success" disabled>
                  Login Required
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100 border-info shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                🌿 Module 3: Natural Environment & Geography
              </h5>
            </div>
            <div className="card-body">
              <p className="card-text">
                Discover the pristine biodiversity, unique geography, and conservation success of this natural sanctuary in the Aegean Sea.
              </p>
              <ul className="small text-muted">
                <li>🗺️ Chalkidiki Peninsula geography</li>
                <li>🦭 Endemic species and monk seals</li>
                <li>🌳 Forest zones and biodiversity</li>
                <li>♻️ Faith-based conservation model</li>
              </ul>
              {isAuthenticated ? (
                <Link to="/module/3" className="btn btn-info">
                  Discover Nature →
                </Link>
              ) : (
                <button className="btn btn-outline-info" disabled>
                  Login Required
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Adaptive Learning Features */}
      <div className="row mb-5">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">🎯 Adaptive Learning Features</h5>
            </div>
            <div className="card-body">
              <p>Experience personalized education that adapts to your learning style and progress:</p>
              <div className="row">
                <div className="col-md-6">
                  <h6>🧠 Smart Content Delivery</h6>
                  <ul className="small">
                    <li>Performance-based content recommendations</li>
                    <li>Visual vs textual learning preferences</li>
                    <li>Difficulty adjustment based on quiz scores</li>
                    <li>Personalized learning paths</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>📊 Progress Tracking</h6>
                  <ul className="small">
                    <li>Real-time behavior and engagement tracking</li>
                    <li>Detailed progress analytics</li>
                    <li>Struggle detection and help suggestions</li>
                    <li>Achievement badges and milestones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white">
              <h6 className="mb-0">🏆 Learning Goals</h6>
            </div>
            <div className="card-body">
              <ul className="small mb-0">
                <li>✓ Understand 1000+ years of monastic history</li>
                <li>✓ Identify all 20 ruling monasteries</li>
                <li>✓ Recognize Byzantine architectural features</li>
                <li>✓ Appreciate biodiversity conservation</li>
                <li>✓ Comprehend UNESCO heritage significance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Features Showcase */}
      <div className="row mb-5">
        <div className="col-md-6">
          <div className="card border-secondary">
            <div className="card-header">
              <h6>🗺️ Interactive Maps</h6>
            </div>
            <div className="card-body">
              <p className="small">
                Explore monastery locations and environmental zones with clickable interactive maps that bring Mount Athos geography to life.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-secondary">
            <div className="card-header">
              <h6>📱 Comprehensive Quizzes</h6>
            </div>
            <div className="card-body">
              <p className="small">
                Test your knowledge with adaptive quizzes that adjust difficulty based on your performance and provide detailed feedback.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Features */}
      <div className="card mb-4 bg-light">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h6 className="mb-2">🔧 Built with Modern Educational Technology</h6>
              <p className="small text-muted mb-0">
                This application uses cutting-edge adaptive learning algorithms, real-time progress tracking, 
                and personalized content delivery to create an optimal learning experience for each student.
              </p>
            </div>
            <div className="col-md-4 text-end">
              <div className="d-flex justify-content-end gap-2">
                <span className="badge bg-primary">React</span>
                <span className="badge bg-success">MongoDB</span>
                <span className="badge bg-warning text-dark">Adaptive AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cultural Note */}
      <div className="alert alert-info">
        <h6 className="alert-heading">🕊️ Cultural & Educational Note</h6>
        <p className="mb-0">
          This educational application is designed to promote understanding and appreciation of Mount Athos's 
          cultural, religious, and natural heritage. All content is presented with respect for the sacred 
          nature of the Holy Mountain and its continuing role in Orthodox Christian monasticism.
        </p>
      </div>

      {/* Call to Action */}
      {!isAuthenticated && (
        <div className="text-center mt-5 p-4 bg-gradient-primary text-white rounded">
          <h5>Ready to Begin Your Journey?</h5>
          <p>Join thousands of students exploring the heritage of Mount Athos</p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/register" className="btn btn-light btn-lg">
              🚀 Get Started
            </Link>
            <Link to="/login" className="btn btn-outline-light btn-lg">
              👤 Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;