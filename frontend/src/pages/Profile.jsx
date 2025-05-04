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
      const updatedUser = await updatePreferences({ learningStyle });
      setProfile({...profile, preferences: updatedUser.preferences});
      setError('');
      alert('Preferences updated successfully!');
    } catch (err) {
      setError('Failed to update preferences');
    }
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== profile.username) {
      alert('Please enter your username correctly to confirm deletion');
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
  
  if (loading) return <div className="text-center my-4">Loading profile data...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!profile) return <div className="alert alert-warning">Profile not found</div>;
  
  return (
    <div className="profile-container">
      <div className="row">
        <div className="col-md-6 offset-md-3">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Your Profile</h4>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h5>Account Information</h5>
                <p><strong>Username:</strong> {profile.username}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Member Since:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="mb-4">
                <h5>Learning Preferences</h5>
                <div className="mb-3">
                  <label htmlFor="learningStyle" className="form-label">Preferred Learning Style</label>
                  <select
                    className="form-select"
                    id="learningStyle"
                    value={learningStyle}
                    onChange={(e) => setLearningStyle(e.target.value)}
                  >
                    <option value="visual">Visual</option>
                    <option value="textual">Textual</option>
                  </select>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handlePreferenceUpdate}
                >
                  Update Preferences
                </button>
              </div>
              
              <div className="mb-4 border-top pt-3">
                <h5 className="text-danger">Danger Zone</h5>
                <p>Deleting your account will permanently remove all your data, including progress and quiz results.</p>
                
                {!showDeleteConfirm ? (
                  <button 
                    className="btn btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="delete-confirm mt-3 p-3 border border-danger rounded">
                    <p className="text-danger">This action cannot be undone. To confirm, please type your username:</p>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Enter your username"
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-danger"
                        onClick={handleDeleteAccount}
                      >
                        Permanently Delete Account
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                      >
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
    </div>
  );
};

export default Profile;