// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updatePreferences, deleteAccount } from '../services/auth';

const Profile = ({ setIsAuthenticated, setUser }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = await getCurrentUser();
        setProfile(userData);
        setLearningStyle(userData.preferences?.learningStyle || 'visual');
        setLoading(false);
      } catch (err) {
        setError('Failed to load profile data');
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  const handlePreferenceUpdate = async () => {
    try {
      setUpdateLoading(true);
      const updatedUser = await updatePreferences({ learningStyle });
      setProfile({...profile, preferences: updatedUser.preferences});
      setError('');
      
      // Show success message
      const successAlert = document.createElement('div');
      successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed';
      successAlert.style.top = '20px';
      successAlert.style.right = '20px';
      successAlert.style.zIndex = '1060';
      successAlert.innerHTML = `
        <span class="icon me-2">✓</span>
        <strong>Success!</strong> Your preferences have been updated.
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
      `;
      document.body.appendChild(successAlert);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        if (successAlert.parentElement) {
          successAlert.parentElement.removeChild(successAlert);
        }
      }, 3000);
    } catch (err) {
      setError('Failed to update preferences');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== profile.username) {
      setError('Please enter your username correctly to confirm deletion');
      return;
    }
    
    try {
      await deleteAccount();
      setIsAuthenticated(false);
      setUser(null);
      navigate('/');
    } catch (err) {
      setError('Failed to delete account');
    }
  };
  
  if (loading) {
    return (
      <div className="profile-container fade-in">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading profile...</span>
                </div>
                <p className="mt-3 mb-0 text-muted">Loading your profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && !profile) {
    return (
      <div className="profile-container fade-in">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="alert alert-danger">
              <span className="icon me-2">!</span>
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="profile-container fade-in">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="alert alert-warning">
              <span className="icon me-2">?</span>
              Profile not found
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="profile-container fade-in">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {/* Profile Header */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="mb-0">
                <span className="icon me-2">◊</span>
                Your Profile
              </h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <span className="icon me-2">!</span>
                  {error}
                </div>
              )}
              
              {/* Account Information */}
              <div className="mb-4">
                <h5 className="border-start-primary ps-3 mb-3">Account Information</h5>
                <div className="row">
                  <div className="col-sm-4">
                    <strong>Username:</strong>
                  </div>
                  <div className="col-sm-8">
                    <span className="icon me-2">◊</span>
                    {profile.username}
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-sm-4">
                    <strong>Email:</strong>
                  </div>
                  <div className="col-sm-8">
                    <span className="icon me-2">@</span>
                    {profile.email}
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-sm-4">
                    <strong>Member Since:</strong>
                  </div>
                  <div className="col-sm-8">
                    <span className="icon me-2">◆</span>
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              {/* Learning Preferences */}
              <div className="mb-4">
                <h5 className="border-start-primary ps-3 mb-3">Learning Preferences</h5>
                <div className="mb-3">
                  <label htmlFor="learningStyle" className="form-label">
                    <span className="icon me-1">⚡</span>
                    Preferred Learning Style
                  </label>
                  <select
                    className="form-select"
                    id="learningStyle"
                    value={learningStyle}
                    onChange={(e) => setLearningStyle(e.target.value)}
                  >
                    <option value="visual">Visual Learner (images, videos, diagrams)</option>
                    <option value="textual">Text Learner (reading, written content)</option>
                  </select>
                  <small className="text-muted">
                    <span className="icon me-1">i</span>
                    This determines how content is prioritized in your learning modules
                  </small>
                </div>
                
                {/* Current Learning Style Description */}
                <div className="alert alert-info">
                  <div className="d-flex align-items-start">
                    <span className="icon me-2 mt-1">
                      {learningStyle === 'visual' ? '👁' : '📖'}
                    </span>
                    <div>
                      <strong>
                        {learningStyle === 'visual' ? 'Visual Learning' : 'Text Learning'}
                      </strong>
                      <p className="mb-0 mt-1">
                        {learningStyle === 'visual' 
                          ? 'You learn best with images, videos, and visual content. Visual materials will appear first in your modules.'
                          : 'You learn best with text-based content and detailed reading materials. Written content will be prioritized in your modules.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <button 
                  className="btn btn-primary"
                  onClick={handlePreferenceUpdate}
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <span className="icon me-2">✓</span>
                      Update Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-danger">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">
                <span className="icon me-2">!</span>
                Account Management
              </h5>
            </div>
            <div className="card-body">
              <h6 className="text-danger">Delete Account</h6>
              <p className="mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
                Your progress, quiz results, and learning preferences will be lost forever.
              </p>
              
              {!showDeleteConfirm ? (
                <button 
                  className="btn btn-outline-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <span className="icon me-2">×</span>
                  Delete Account
                </button>
              ) : (
                <div className="border border-danger rounded p-3">
                  <div className="alert alert-warning">
                    <span className="icon me-2">⚠</span>
                    <strong>This action cannot be undone.</strong> 
                    To confirm, please type your username: <strong>{profile.username}</strong>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="deleteConfirm" className="form-label">
                      Type your username to confirm:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="deleteConfirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={`Type "${profile.username}" to confirm`}
                    />
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== profile.username}
                    >
                      <span className="icon me-2">×</span>
                      Permanently Delete Account
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                        setError('');
                      }}
                    >
                      <span className="icon me-2">←</span>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;