import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-8 w-14 sm:h-9 sm:w-16 items-center justify-center rounded-full
        transition-all duration-300 ease-in-out
        ${isDark 
          ? 'bg-forest dark:bg-sage text-white' 
          : 'bg-light-border dark:bg-dark-border text-light-text dark:text-dark-text'
        }
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-sage/20 focus:ring-offset-2
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Background track */}
      <div className={`
        absolute inset-0 rounded-full transition-all duration-300
        ${isDark 
          ? 'bg-gradient-to-r from-forest to-olive shadow-inner' 
          : 'bg-gradient-to-r from-sage/20 to-olive/20 shadow-inner'
        }
      `} />
      
      {/* Sliding indicator */}
      <div className={`
        absolute w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all duration-300 ease-in-out
        flex items-center justify-center shadow-lg
        ${isDark 
          ? 'translate-x-3 sm:translate-x-4 bg-white text-forest' 
          : '-translate-x-3 sm:-translate-x-4 bg-white dark:bg-dark-muted text-olive dark:text-sage'
        }
      `}>
        {/* Icon */}
        <div className="w-3 h-3 sm:w-4 sm:h-4">
          {isDark ? (
            // Moon icon
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
            </svg>
          ) : (
            // Sun icon
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM2 13h2a1 1 0 1 0 0-2H2a1 1 0 1 0 0 2zm18 0h2a1 1 0 1 0 0-2h-2a1 1 0 1 0 0 2zM11 2v2a1 1 0 1 0 2 0V2a1 1 0 1 0-2 0zm0 18v2a1 1 0 1 0 2 0v-2a1 1 0 1 0-2 0zM5.99 4.58a1 1 0 0 0-1.41 1.41l1.06 1.06a1 1 0 0 0 1.41-1.41L5.99 4.58zm12.37 12.37a1 1 0 0 0-1.41 1.41l1.06 1.06a1 1 0 0 0 1.41-1.41l-1.06-1.06zm1.06-10.96a1 1 0 0 0-1.41-1.41l-1.06 1.06a1 1 0 0 0 1.41 1.41l1.06-1.06zM7.05 18.36a1 1 0 0 0-1.41-1.41l-1.06 1.06a1 1 0 0 0 1.41 1.41l1.06-1.06z" />
            </svg>
          )}
        </div>
      </div>
      
      {/* Accessibility text */}
      <span className="sr-only">
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
