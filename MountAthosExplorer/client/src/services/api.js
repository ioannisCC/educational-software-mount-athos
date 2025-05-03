/**
 * API Service
 * 
 * Centralized service for handling API requests to the backend server
 * for the Mount Athos Explorer educational software.
 */

import { refreshToken } from './auth';

// Default API configuration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000, // 1 second
};

class ApiService {
  constructor(config = API_CONFIG) {
    this.config = config;
    this.authToken = null;
  }

  /**
   * Set the authentication token for API requests
   * @param {string} token - JWT token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Clear the authentication token
   */
  clearAuthToken() {
    this.authToken = null;
  }

  /**
   * Create request headers with optional authentication
   * @param {object} additionalHeaders - Additional headers to include
   * @returns {Headers} - Headers object for fetch
   */
  createHeaders(additionalHeaders = {}) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...additionalHeaders,
    });

    if (this.authToken) {
      headers.append('Authorization', `Bearer ${this.authToken}`);
    }

    return headers;
  }

  /**
   * Build the full URL for an API endpoint
   * @param {string} endpoint - API endpoint path
   * @returns {string} - Full URL
   */
  buildUrl(endpoint) {
    let url = endpoint;
    
    // If endpoint doesn't start with http, prepend the base URL
    if (!endpoint.startsWith('http')) {
      // Remove leading slash if present
      const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      url = `${this.config.BASE_URL}/${path}`;
    }
    
    return url;
  }

  /**
   * Handle API response
   * @param {Response} response - Fetch Response object
   * @returns {Promise<any>} - Parsed response data
   * @throws {Error} - If response is not OK
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    // Check if response is OK (status in the range 200-299)
    if (!response.ok) {
      // Try to parse error response
      let errorData;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { message: await response.text() };
        }
      } catch (e) {
        errorData = { message: response.statusText };
      }
      
      const error = new Error(errorData.message || 'API request failed');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    // Parse response based on content type
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType && contentType.includes('text/')) {
      return await response.text();
    }
    
    return response;
  }

  /**
   * Perform a fetch request with timeout and retry capabilities
   * @param {string} url - Request URL
   * @param {object} options - Fetch options
   * @returns {Promise<any>} - Response data
   */
  async fetchWithTimeout(url, options) {
    let attempts = 0;
    let lastError = null;
    
    while (attempts <= this.config.RETRY_ATTEMPTS) {
      attempts++;
      
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.TIMEOUT);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Special handling for 401 Unauthorized - attempt token refresh
        if (response.status === 401 && attempts === 1 && this.authToken) {
          try {
            // Attempt to refresh token
            const newToken = await refreshToken();
            if (newToken) {
              this.setAuthToken(newToken);
              
              // Update Authorization header with new token
              const headers = this.createHeaders(options.headers);
              
              // Retry the request with new token
              return this.fetchWithTimeout(url, {
                ...options,
                headers,
              });
            }
          } catch (refreshError) {
            // If refresh fails, continue with normal error handling
            console.error('Token refresh failed:', refreshError);
          }
        }
        
        return await this.handleResponse(response);
      } catch (error) {
        lastError = error;
        
        // Don't retry aborted requests (timeouts) or if max attempts reached
        if (error.name === 'AbortError' || attempts > this.config.RETRY_ATTEMPTS) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.RETRY_DELAY));
      }
    }
    
    // If all attempts fail, throw the last error
    throw lastError;
  }

  /**
   * Perform a GET request
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @param {object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  async get(endpoint, params = {}, options = {}) {
    // Build URL with query parameters
    const url = new URL(this.buildUrl(endpoint), window.location.origin);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    // Make request
    return this.fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: this.createHeaders(options.headers),
      ...options,
    });
  }

  /**
   * Perform a POST request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  async post(endpoint, data = {}, options = {}) {
    return this.fetchWithTimeout(this.buildUrl(endpoint), {
      method: 'POST',
      headers: this.createHeaders(options.headers),
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Perform a PUT request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  async put(endpoint, data = {}, options = {}) {
    return this.fetchWithTimeout(this.buildUrl(endpoint), {
      method: 'PUT',
      headers: this.createHeaders(options.headers),
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Perform a PATCH request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  async patch(endpoint, data = {}, options = {}) {
    return this.fetchWithTimeout(this.buildUrl(endpoint), {
      method: 'PATCH',
      headers: this.createHeaders(options.headers),
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Perform a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  async delete(endpoint, options = {}) {
    return this.fetchWithTimeout(this.buildUrl(endpoint), {
      method: 'DELETE',
      headers: this.createHeaders(options.headers),
      ...options,
    });
  }

  /**
   * Upload files with multipart/form-data
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with files
   * @param {object} options - Additional fetch options
   * @param {Function} onProgress - Progress callback (if supported)
   * @returns {Promise<any>} - Response data
   */
  async uploadFiles(endpoint, formData, options = {}, onProgress = null) {
    const headers = new Headers(options.headers);
    // Do not set Content-Type, let browser set it with boundary for form data
    
    if (this.authToken) {
      headers.append('Authorization', `Bearer ${this.authToken}`);
    }
    
    // If XMLHttpRequest is used for progress tracking
    if (onProgress && typeof onProgress === 'function') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', this.buildUrl(endpoint));
        
        // Add headers
        headers.forEach((value, key) => {
          xhr.setRequestHeader(key, value);
        });
        
        // Track progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            let response;
            try {
              response = JSON.parse(xhr.responseText);
            } catch (e) {
              response = xhr.responseText;
            }
            resolve(response);
          } else {
            let errorData;
            try {
              errorData = JSON.parse(xhr.responseText);
            } catch (e) {
              errorData = { message: xhr.statusText };
            }
            
            const error = new Error(errorData.message || 'Upload failed');
            error.status = xhr.status;
            error.data = errorData;
            reject(error);
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });
        
        // Set timeout
        xhr.timeout = this.config.TIMEOUT;
        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timed out'));
        });
        
        // Send the form data
        xhr.send(formData);
      });
    } else {
      // Fall back to regular fetch without progress tracking
      return this.fetchWithTimeout(this.buildUrl(endpoint), {
        method: 'POST',
        headers,
        body: formData,
        ...options,
      });
    }
  }

  /**
   * Get content module data
   * @param {string} moduleId - The module ID
   * @returns {Promise<object>} - Module data
   */
  async getModule(moduleId) {
    return this.get(`/modules/${moduleId}`);
  }

  /**
   * Get section data
   * @param {string} moduleId - The module ID
   * @param {string} sectionId - The section ID
   * @returns {Promise<object>} - Section data
   */
  async getSection(moduleId, sectionId) {
    return this.get(`/modules/${moduleId}/sections/${sectionId}`);
  }

  /**
   * Get quiz data
   * @param {string} quizId - The quiz ID
   * @returns {Promise<object>} - Quiz data
   */
  async getQuiz(quizId) {
    return this.get(`/quizzes/${quizId}`);
  }

  /**
   * Submit quiz answers
   * @param {string} quizId - The quiz ID
   * @param {object} answers - The user's answers
   * @returns {Promise<object>} - Quiz results
   */
  async submitQuiz(quizId, answers) {
    return this.post(`/quizzes/${quizId}/submit`, { answers });
  }

  /**
   * Get user progress
   * @returns {Promise<object>} - User progress data
   */
  async getUserProgress() {
    return this.get('/user/progress');
  }

  /**
   * Update user progress
   * @param {string} moduleId - The module ID
   * @param {string} sectionId - The section ID
   * @param {string} activityType - Type of activity (content, quiz, etc.)
   * @param {number} progress - Progress value (0-100)
   * @returns {Promise<object>} - Updated progress data
   */
  async updateProgress(moduleId, sectionId, activityType, progress) {
    return this.post('/user/progress', {
      moduleId,
      sectionId,
      activityType,
      progress
    });
  }

  /**
   * Get user achievements
   * @returns {Promise<Array>} - User achievements
   */
  async getAchievements() {
    return this.get('/user/achievements');
  }

  /**
   * Award an achievement to the user
   * @param {object} achievement - Achievement data
   * @returns {Promise<object>} - Added achievement
   */
  async awardAchievement(achievement) {
    return this.post('/user/achievements', achievement);
  }

  /**
   * Get monastery data
   * @param {string} monasteryId - Monastery ID
   * @returns {Promise<object>} - Monastery data
   */
  async getMonastery(monasteryId) {
    return this.get(`/monasteries/${monasteryId}`);
  }

  /**
   * Get all monasteries
   * @returns {Promise<Array>} - List of monasteries
   */
  async getMonasteries() {
    return this.get('/monasteries');
  }

  /**
   * Get map points of interest
   * @returns {Promise<Array>} - Map points
   */
  async getMapPoints() {
    return this.get('/map/points');
  }

  /**
   * Update user profile
   * @param {object} profileData - Profile data to update
   * @returns {Promise<object>} - Updated profile
   */
  async updateProfile(profileData) {
    return this.put('/user/profile', profileData);
  }

  /**
   * Get user learning preferences
   * @returns {Promise<object>} - Learning preferences
   */
  async getLearningPreferences() {
    return this.get('/user/preferences');
  }

  /**
   * Update user learning preferences
   * @param {object} preferences - Learning preferences
   * @returns {Promise<object>} - Updated preferences
   */
  async updateLearningPreferences(preferences) {
    return this.put('/user/preferences', preferences);
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;