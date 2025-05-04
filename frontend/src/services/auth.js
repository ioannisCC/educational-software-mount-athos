// frontend/src/services/auth.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/auth';

// Set auth token
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
    localStorage.removeItem('token');
  }
};

// Register user
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    setAuthToken(response.data.token);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Login user
export const login = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/login`, userData);
    setAuthToken(response.data.token);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Logout user
export const logout = () => {
  setAuthToken(null);
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/user`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Update user preferences
export const updatePreferences = async (preferences) => {
  try {
    const response = await axios.put(`${API_URL}/preferences`, preferences);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Initialize - check for token
export const initializeAuth = () => {
  const token = localStorage.getItem('token');
  if (token) {
    setAuthToken(token);
    return true;
  }
  return false;
};