import React, { useEffect, useState, useContext } from 'react'
import './App.css'
import InterviewSession from './components/InterviewSession'
import ThemeToggle from './components/ThemeToggle'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import { ThemeContext } from './contexts/ThemeContext'

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useContext(ThemeContext);
  
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-3 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400 animate-spin mx-auto mb-3"></div>
          <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200">PrepMate</h2>
          <p className="text-sm text-blue-600 dark:text-blue-400">Loading your interview coach...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 pt-6 pb-10 px-4 transition-colors duration-300">
      <KeyboardShortcuts />
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-xl font-bold text-blue-900 dark:text-blue-200">PrepMate</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <nav className="hidden md:flex space-x-4 text-sm">
              <a href="#" className="text-blue-600 dark:text-blue-400 font-medium px-3 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30">Features</a>
              <a href="#" className="text-gray-600 dark:text-gray-300 px-3 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300">About</a>
              <a href="#" className="text-gray-600 dark:text-gray-300 px-3 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300">Contact</a>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto">
        <InterviewSession />
      </main>
      
      <footer className="max-w-6xl mx-auto mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© 2025 PrepMate. All rights reserved.</p>
        <p className="mt-1">Your AI-powered interview preparation assistant</p>
        <p className="mt-2 flex items-center justify-center">
          <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-xs">
            <kbd className="px-1 mr-1">Shift</kbd>+<kbd className="px-1 ml-1">?</kbd>
          </span>
          <span className="ml-1">for keyboard shortcuts</span>
        </p>
      </footer>
    </div>
  )
}

export default App
