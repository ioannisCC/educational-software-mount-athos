import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { 
  register as authRegister, 
  login as authLogin, 
  logout as authLogout, 
  getCurrentUser, 
  updateProfile as authUpdateProfile,
  changePassword as authChangePassword,
  initAuth,
} from '../services/auth';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize authentication state on component mount
  useEffect(() => {
    // Check for existing user
    const user = initAuth();
    
    if (user) {
      setCurrentUser(user);
    }
    
    setLoading(false);
  }, []);

  // Register a new user
  const register = async (userData) => {
    try {
      setError(null);
      const user = await authRegister(userData);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  // Login user
  const login = async (email, password, rememberMe = false) => {
    try {
      setError(null);
      const user = await authLogin(email, password, rememberMe);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setError(null);
      await authLogout();
      setCurrentUser(null);
    } catch (err) {
      setError(err.message || 'Logout failed');
      throw err;
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const updatedUser = await authUpdateProfile(profileData);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      await authChangePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message || 'Failed to change password');
      throw err;
    }
  };

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;