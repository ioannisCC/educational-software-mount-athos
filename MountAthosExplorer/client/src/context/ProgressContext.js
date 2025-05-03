import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

// Create context
const ProgressContext = createContext();

// Custom hook to use the progress context
export const useProgress = () => {
  return useContext(ProgressContext);
};

// Provider component
export const ProgressProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user progress on mount or when user changes
  useEffect(() => {
    if (currentUser) {
      fetchProgress();
    } else {
      setProgress(null);
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch user progress from API
  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get('/user/progress');
      
      if (response.success && response.data) {
        setProgress(response.data);
      } else {
        // Initialize empty progress if none exists
        setProgress({
          modules: [
            { id: 'module1', completion: 0, sections: [] },
            { id: 'module2', completion: 0, sections: [] },
            { id: 'module3', completion: 0, sections: [] },
          ],
          contentProgress: [],
          quizProgress: [],
          achievements: [],
          overallCompletion: 0,
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Failed to load progress data');
      setLoading(false);
    }
  };

  // Update user progress
  const updateProgress = async (moduleId, sectionId, activityType, progressValue, additionalData = {}) => {
    try {
      if (!currentUser) return;
      
      setError(null);
      
      const updateData = {
        moduleId,
        sectionId,
        activityType,
        progress: progressValue,
        ...additionalData,
      };
      
      const response = await apiService.post('/user/progress', updateData);
      
      if (response.success && response.data) {
        setProgress(response.data);
      }
      
      return response.data;
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress');
      throw err;
    }
  };

  // Set achievement for user
  const setAchievement = async (achievement) => {
    try {
      if (!currentUser) return;
      
      setError(null);
      
      const response = await apiService.post('/user/achievements', achievement);
      
      if (response.success && response.data) {
        // Update local progress with new achievement
        setProgress(prev => {
          if (!prev) return prev;
          
          // Check if achievement already exists
          const achievementExists = prev.achievements.some(a => a.id === achievement.id);
          
          if (!achievementExists && response.data.newAchievement) {
            return {
              ...prev,
              achievements: [...prev.achievements, response.data.achievement],
            };
          }
          
          return prev;
        });
      }
      
      return response.data;
    } catch (err) {
      console.error('Error setting achievement:', err);
      setError('Failed to set achievement');
      throw err;
    }
  };

  // Reset user progress
  const resetProgress = async () => {
    try {
      if (!currentUser) return;
      
      setError(null);
      
      const response = await apiService.post('/user/reset-progress');
      
      if (response.success) {
        await fetchProgress();
      }
      
      return response;
    } catch (err) {
      console.error('Error resetting progress:', err);
      setError('Failed to reset progress');
      throw err;
    }
  };

  // Context value
  const value = {
    progress,
    loading,
    error,
    fetchProgress,
    updateProgress,
    setAchievement,
    resetProgress,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export default ProgressContext;