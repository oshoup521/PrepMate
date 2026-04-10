// axiosConfig.js
// Re-exports axios for AuthContext; error handling is done per-instance
// (interviewService handles its own errors; AuthContext adds its own interceptors)
import axios from 'axios';

export default axios;
