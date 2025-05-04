// frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Content endpoints
export const getModules = async () => {
  try {
    const response = await axios.get(`${API_URL}/content/modules`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getContentByModule = async (moduleId) => {
  try {
    const response = await axios.get(`${API_URL}/content/module/${moduleId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getContentById = async (contentId) => {
  try {
    const response = await axios.get(`${API_URL}/content/${contentId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Quiz endpoints
export const getQuizzesByModule = async (moduleId) => {
  try {
    const response = await axios.get(`${API_URL}/quiz/module/${moduleId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getQuizById = async (quizId) => {
  try {
    const response = await axios.get(`${API_URL}/quiz/${quizId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const submitQuiz = async (quizId, answers) => {
  try {
    const response = await axios.post(`${API_URL}/quiz/${quizId}/submit`, { answers });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Progress endpoints
export const getProgressOverview = async () => {
  try {
    const response = await axios.get(`${API_URL}/progress`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateContentProgress = async (contentId, completed) => {
  try {
    const response = await axios.post(`${API_URL}/progress/content`, { 
      contentId, 
      completed 
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getModuleProgress = async (moduleId) => {
  try {
    const response = await axios.get(`${API_URL}/progress/module/${moduleId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};