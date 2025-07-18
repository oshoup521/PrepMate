import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'current' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    current: 'text-current',
    primary: 'text-forest dark:text-sage',
    white: 'text-white',
    gray: 'text-gray-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
  );
};

const LoadingPage = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg ${className}`}>
      <LoadingSpinner size="xl" color="primary" />
      <p className="mt-6 text-lg text-light-text/70 dark:text-dark-text/70 text-center max-w-md">
        {message}
      </p>
    </div>
  );
};

const LoadingCard = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`card p-8 text-center ${className}`}>
      <LoadingSpinner size="lg" color="primary" />
      <p className="mt-4 text-light-text/70 dark:text-dark-text/70">{message}</p>
    </div>
  );
};

const LoadingButton = ({ 
  loading = false, 
  disabled = false,
  children, 
  className = '', 
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loadingText,
  ...props 
}) => {
  const isDisabled = loading || disabled;
  
  // Base button classes
  let buttonClasses = `btn btn-${variant} btn-${size}`;
  
  // Add custom classes
  if (className) {
    buttonClasses += ` ${className}`;
  }

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      {...props}
    >
      <div className="flex items-center justify-center">
        {loading && (
          <LoadingSpinner size={size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs'} color="current" />
        )}
        
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        
        <span className={loading ? 'ml-2' : ''}>
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </div>
    </button>
  );
};

// Enhanced Button component with better props
const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  leftIcon,
  rightIcon,
  loadingText,
  fullWidth = false,
  children, 
  className = '', 
  ...props 
}) => {
  const isDisabled = loading || disabled;
  
  let buttonClasses = `btn btn-${variant} btn-${size}`;
  
  if (fullWidth) {
    buttonClasses += ' w-full';
  }
  
  if (className) {
    buttonClasses += ` ${className}`;
  }

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      {...props}
    >
      <div className="flex items-center justify-center">
        {loading && (
          <LoadingSpinner size={size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs'} color="current" />
        )}
        
        {!loading && leftIcon && (
          <span className="mr-2 flex items-center">{leftIcon}</span>
        )}
        
        <span className={loading ? 'ml-2' : ''}>
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="ml-2 flex items-center">{rightIcon}</span>
        )}
      </div>
    </button>
  );
};

// Icon Button component
const IconButton = ({ 
  icon, 
  variant = 'ghost', 
  size = 'md', 
  loading = false, 
  disabled = false,
  'aria-label': ariaLabel,
  tooltip,
  className = '', 
  ...props 
}) => {
  const isDisabled = loading || disabled;
  
  let buttonClasses = `btn btn-${variant} btn-${size} !p-2`;
  
  if (className) {
    buttonClasses += ` ${className}`;
  }

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={tooltip || ariaLabel}
      {...props}
    >
      <div className="flex items-center justify-center">
        {loading ? (
          <LoadingSpinner size={size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'xs'} color="current" />
        ) : (
          icon
        )}
      </div>
    </button>
  );
};

// Loading Skeleton component
const LoadingSkeleton = ({ className = '', width = 'w-full', height = 'h-4' }) => {
  return (
    <div className={`loading-skeleton ${width} ${height} ${className}`}></div>
  );
};

// Loading Shimmer component
const LoadingShimmer = ({ className = '', children }) => {
  return (
    <div className={`loading-shimmer ${className}`}>
      {children}
    </div>
  );
};

export default LoadingSpinner;
export { 
  LoadingPage, 
  LoadingCard, 
  LoadingButton, 
  Button, 
  IconButton, 
  LoadingSkeleton, 
  LoadingShimmer 
};
