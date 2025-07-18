// axiosConfig.js
import axios from 'axios';
import { handleApiError } from './errorHandler';



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
