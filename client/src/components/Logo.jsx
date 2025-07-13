import React from 'react';

const Logo = ({ size = 'md', hideText = false }) => {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-12'
  };

  return (
    <div className="flex items-center">
      <div className="mr-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`${sizes[size]} text-forest dark:text-sage`}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M8 10h8" />
          <path d="M12 7v6" />
        </svg>
      </div>      {!hideText && (
        <div>
          <h1 className={`font-bold ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'} text-forest dark:text-sage`}>
            PrepMate
          </h1>
          <p className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-olive dark:text-sage/80`}>
            AI Interview Coach
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo; 