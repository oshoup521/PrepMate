import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiError(error);
    return Promise.reject(error);
  }
);

export const interviewService = {
  generateQuestion: async (jobRole, difficulty = 'medium', context = null) => {
    try {
      const response = await apiClient.post('/interview/generate-question', {
        jobRole,
        difficulty,
        context,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  evaluateAnswer: async (question, answer, jobRole) => {
    try {
      const response = await apiClient.post('/interview/evaluate-answer', {
        question,
        answer,
        jobRole,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Authentication services
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (name, email, password) => {
    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Session management
  createSession: async (jobRole, difficulty = 'medium', description = null) => {
    try {
      const response = await apiClient.post('/interview/sessions', {
        jobRole,
        difficulty,
        description,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserSessions: async () => {
    try {
      const response = await apiClient.get('/interview/sessions');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSession: async (sessionId) => {
    try {
      const response = await apiClient.get(`/interview/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateSession: async (sessionId, updateData) => {
    try {
      const response = await apiClient.post(`/interview/sessions/${sessionId}/update`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  endSession: async (sessionId) => {
    try {
      const response = await apiClient.post(`/interview/sessions/${sessionId}/end`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addQuestionAnswer: async (sessionId, question, answer, evaluation = null) => {
    try {
      const response = await apiClient.post(`/interview/sessions/${sessionId}/qa`, {
        question,
        answer,
        evaluation,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  generateSummary: async (sessionId) => {
    try {
      const response = await apiClient.post(`/interview/sessions/${sessionId}/summary`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserProgress: async () => {
    try {
      const response = await apiClient.get('/interview/progress');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default interviewService;
