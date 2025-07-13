// axiosConfig.js
import axios from 'axios';
import { handleApiError } from './errorHandler';

// Log the API URL during initialization
console.log('Initializing axios with API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000');

// Set up global error handling for axios
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios error interceptor caught:', error);
    handleApiError(error);
    return Promise.reject(error);
  }
);

export default axios;
