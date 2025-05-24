import React, { useEffect, useState } from 'react';

const KeyboardShortcuts = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Show shortcuts when user presses '?' with Shift key
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
      
      // Close shortcuts dialog with Escape key
      if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts]);
  
  if (!showShortcuts) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 relative">
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" 
          onClick={() => setShowShortcuts(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Keyboard Shortcuts</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
            <span className="text-gray-700 dark:text-gray-300">Show this dialog</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">Shift + ?</span>
          </div>
          
          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
            <span className="text-gray-700 dark:text-gray-300">Send message</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">Enter</span>
          </div>
          
          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
            <span className="text-gray-700 dark:text-gray-300">Start new line in message</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">Shift + Enter</span>
          </div>
          
          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
            <span className="text-gray-700 dark:text-gray-300">Toggle dark mode</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">Ctrl + D</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-300">Close this dialog</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">Esc</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
