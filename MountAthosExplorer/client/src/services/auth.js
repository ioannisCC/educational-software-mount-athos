/**
 * Authentication Service
 * 
 * Handles user authentication, registration, and session management
 * for the Mount Athos Explorer educational software.
 */

import apiService from './api';
import analyticsService from './analytics';

// Local storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// Token refresh settings
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
let refreshInterval = null;

/**
 * Parse JWT token to get payload
 * @param {string} token - JWT token
 * @returns {object} - Decoded token payload
 */
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is expired
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  
  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
};

/**
 * Get user from local storage
 * @returns {object|null} - User data or null if not logged in
 */
export const getCurrentUser = () => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Get auth token from local storage
 * @returns {string|null} - JWT token or null if not logged in
 */
export const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (!token || isTokenExpired(token)) {
    // Token is missing or expired, try refresh token
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken && !isTokenExpired(refreshToken)) {
      // Attempt to refresh token asynchronously
      refreshTokenAsync();
    }
    return null;
  }
  
  return token;
};

/**
 * Refresh token asynchronously
 */
const refreshTokenAsync = async () => {
  try {
    const newToken = await refreshToken();
    if (newToken) {
      // Token refreshed successfully
      console.log('Token refreshed successfully');
    }
  } catch (error) {
    console.error('Async token refresh failed:', error);
    // Clear auth if refresh fails
    logout();
  }
};

/**
 * Refresh the auth token
 * @returns {Promise<string|null>} - New JWT token or null if refresh failed
 */
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;
    
    const response = await apiService.post('/auth/refresh', { refreshToken });
    
    if (response.token) {
      // Store new token
      localStorage.setItem(TOKEN_KEY, response.token);
      
      // Update refresh token if provided
      if (response.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      }
      
      // Update API service token
      apiService.setAuthToken(response.token);
      
      return response.token;
    }
    
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // If refresh fails, logout
    logout();
    return null;
  }
};

/**
 * Set up automatic token refresh
 */
const setupTokenRefresh = () => {
  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  // Set up new interval
  refreshInterval = setInterval(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.exp) {
        // Refresh token 5 minutes before expiration
        const expirationTime = payload.exp * 1000;
        const timeUntilExpiration = expirationTime - Date.now();
        
        if (timeUntilExpiration < 5 * 60 * 1000) {
          await refreshToken();
        }
      }
    }
  }, TOKEN_REFRESH_INTERVAL);
};

/**
 * Clear the token refresh interval
 */
const clearTokenRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

/**
 * Initialize auth service
 * @returns {object|null} - Current user or null if not logged in
 */
export const initAuth = () => {
  const token = getToken();
  const user = getCurrentUser();
  
  if (token && user) {
    apiService.setAuthToken(token);
    setupTokenRefresh();
    return user;
  }
  
  return null;
};

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @returns {Promise<object>} - Registered user data
 */
export const register = async (userData) => {
  try {
    const response = await apiService.post('/auth/register', userData);
    
    if (response.token) {
      // Store tokens
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      
      // Store user data
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      
      // Set token in API service
      apiService.setAuthToken(response.token);
      
      // Initialize analytics with user ID
      analyticsService.init(response.user._id);
      
      // Set up token refresh
      setupTokenRefresh();
      
      return response.user;
    }
    
    throw new Error('Registration failed: No token received');
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} - Logged in user data
 */
export const login = async (email, password) => {
  try {
    const response = await apiService.post('/auth/login', { email, password });
    
    if (response.token) {
      // Store tokens
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      
      // Store user data
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      
      // Set token in API service
      apiService.setAuthToken(response.token);
      
      // Initialize analytics with user ID
      analyticsService.init(response.user._id);
      
      // Set up token refresh
      setupTokenRefresh();
      
      return response.user;
    }
    
    throw new Error('Login failed: No token received');
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

/**
 * Login with Google
 * @param {string} googleToken - Google OAuth token
 * @returns {Promise<object>} - Logged in user data
 */
export const loginWithGoogle = async (googleToken) => {
  try {
    const response = await apiService.post('/auth/google', { token: googleToken });
    
    if (response.token) {
      // Store tokens
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      
      // Store user data
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      
      // Set token in API service
      apiService.setAuthToken(response.token);
      
      // Initialize analytics with user ID
      analyticsService.init(response.user._id);
      
      // Set up token refresh
      setupTokenRefresh();
      
      return response.user;
    }
    
    throw new Error('Google login failed: No token received');
  } catch (error) {
    console.error('Google login failed:', error);
    throw error;
  }
};

/**
 * Logout the current user
 */
export const logout = () => {
  // Clear tokens from local storage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  
  // Clear token in API service
  apiService.clearAuthToken();
  
  // Stop token refresh
  clearTokenRefresh();
  
  // Clean up analytics
  analyticsService.cleanup();
  
  // Optional: Call logout endpoint if you need to invalidate token on server
  apiService.post('/auth/logout').catch(error => {
    console.error('Error logging out:', error);
  });
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<object>} - Response data
 */
export const requestPasswordReset = async (email) => {
  return apiService.post('/auth/reset-password', { email });
};

/**
 * Reset password with token
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password
 * @returns {Promise<object>} - Response data
 */
export const resetPassword = async (token, newPassword) => {
  return apiService.post('/auth/reset-password/confirm', { token, newPassword });
};

/**
 * Change password (for logged in users)
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} - Response data
 */
export const changePassword = async (currentPassword, newPassword) => {
  return apiService.post('/auth/change-password', { currentPassword, newPassword });
};

/**
 * Update user profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} - Updated user data
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await apiService.put('/user/profile', profileData);
    
    if (response.user) {
      // Update user in local storage
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      return response.user;
    }
    
    throw new Error('Profile update failed');
  } catch (error) {
    console.error('Profile update failed:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token && !isTokenExpired(token);
};

// Initialize auth on module load
initAuth();