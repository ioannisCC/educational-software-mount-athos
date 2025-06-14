// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/auth';

const Register = ({ setIsAuthenticated, setUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    learningStyle: 'visual'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      // Prepare data for API
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        preferences: {
          learningStyle: formData.learningStyle
        }
      };
      
      const response = await register(userData);
      setIsAuthenticated(true);
      setUser(response.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container fade-in">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card">
            <div className="card-header text-center">
              <h4 className="mb-0">Join Our Community</h4>
              <p className="text-muted mb-0">Begin your Mount Athos learning journey</p>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <span className="icon me-2">!</span>
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    <span className="icon me-1">◊</span>
                    Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    <span className="icon me-1">@</span>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    <span className="icon me-1">*</span>
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    <span className="icon me-1">*</span>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="learningStyle" className="form-label">
                    <span className="icon me-1">⚡</span>
                    Preferred Learning Style
                  </label>
                  <select
                    className="form-select"
                    id="learningStyle"
                    name="learningStyle"
                    value={formData.learningStyle}
                    onChange={handleChange}
                  >
                    <option value="visual">Visual Learner (images, videos)</option>
                    <option value="textual">Text Learner (reading, text)</option>
                  </select>
                  <small className="text-muted">
                    This helps us personalize your learning experience
                  </small>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 mb-3" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <span className="icon me-2">+</span>
                      Create Account
                    </>
                  )}
                </button>
              </form>
              
              <div className="text-center">
                <p className="text-muted mb-0">
                  Already have an account? 
                  <a href="/login" className="text-decoration-none ms-1">
                    <span className="icon me-1">→</span>
                    Sign in here
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;