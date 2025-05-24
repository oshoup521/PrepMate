import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const interviewService = {
  generateQuestion: async (role, difficulty = 'intermediate') => {
    try {
      const response = await axios.post(`${API_URL}/interview/generate-question`, {
        role,
        difficulty,
      });
      return response.data;
    } catch (error) {
      console.error('Error generating question:', error);
      throw error;
    }
  },

  evaluateAnswer: async (question, answer, role, difficulty = 'intermediate') => {
    try {
      const response = await axios.post(`${API_URL}/interview/evaluate-answer`, {
        question,
        answer,
        role,
        difficulty,
      });
      return response.data;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      throw error;
    }
  },
};

export default interviewService;
