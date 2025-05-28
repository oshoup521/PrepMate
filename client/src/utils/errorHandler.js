import toast from 'react-hot-toast';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const handleApiError = (error) => {
  console.error('API Error:', error);

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const message = data?.message || `Request failed with status ${status}`;
    
    switch (status) {
      case 400:
        if (data?.errors) {
          // Validation errors
          const validationErrors = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          toast.error(`Validation Error:\n${validationErrors}`);
        } else {
          toast.error(message);
        }
        break;
      case 401:
        toast.error('Authentication failed. Please login again.');
        // Redirect to login or clear auth
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
      case 403:
        toast.error('Access denied. You don\'t have permission for this action.');
        break;
      case 404:
        toast.error('Resource not found.');
        break;
      case 409:
        toast.error(message || 'Conflict - Resource already exists.');
        break;
      case 429:
        toast.error('Too many requests. Please slow down.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(message || 'An unexpected error occurred.');
    }
    
    return new ApiError(message, status, data);
  } else if (error.request) {
    // Request was made but no response received
    toast.error('Network error. Please check your connection.');
    return new ApiError('Network error', 0, null);
  } else {
    // Something else happened
    toast.error('An unexpected error occurred.');
    return new ApiError(error.message, 0, null);
  }
};

export const showSuccessToast = (message) => {
  toast.success(message);
};

export const showErrorToast = (message) => {
  toast.error(message);
};

export const showLoadingToast = (message) => {
  return toast.loading(message);
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};
