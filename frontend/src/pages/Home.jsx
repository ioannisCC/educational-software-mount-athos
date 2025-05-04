// frontend/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Progress from '../components/Progress';

const Home = ({ isAuthenticated }) => {
  return (
    <div className="home-container">
      <div className="jumbotron bg-light p-5 rounded mb-4">
        <h1 className="display-4">Welcome to Mount Athos Explorer</h1>
        <p className="lead">
          Discover the rich history, architecture, and natural environment of the Holy Mountain.
        </p>
        
        {isAuthenticated ? (
          <>
            <hr className="my-4" />
            <p>Continue your journey through our educational modules.</p>
            <div className="d-flex gap-2">
              <Link to="/module/1" className="btn btn-primary">Module 1: History</Link>
              <Link to="/module/2" className="btn btn-primary">Module 2: Monasteries</Link>
              <Link to="/module/3" className="btn btn-primary">Module 3: Environment</Link>
            </div>
            
            <div className="mt-4">
              <Progress />
            </div>
          </>
        ) : (
          <>
            <hr className="my-4" />
            <p>Sign in to start your learning journey.</p>
            <Link to="/login" className="btn btn-primary me-2">Login</Link>
            <Link to="/register" className="btn btn-secondary">Register</Link>
          </>
        )}
      </div>
      
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">History & Religious Significance</h5>
              <p className="card-text">Learn about the rich history and deep spiritual traditions of Mount Athos.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Monasteries & Architecture</h5>
              <p className="card-text">Explore the 20 monasteries and their unique architectural styles.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Natural Environment</h5>
              <p className="card-text">Discover the diverse flora and fauna of the Holy Mountain peninsula.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;