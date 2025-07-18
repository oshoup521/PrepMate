import React, { useState, useEffect } from 'react';
import { Button } from './LoadingSpinner';
import toast from 'react-hot-toast';

const EmailTestInfo = () => {
  const [emailInfo, setEmailInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchEmailTestInfo();
  }, []);

  const fetchEmailTestInfo = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/email-test-info`);
      const data = await response.json();
      setEmailInfo(data);
      
      // Only show if it's test mode
      if (data.isTestMode) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Failed to fetch email test info:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  if (loading) {
    return null;
  }

  if (!isVisible || !emailInfo?.isTestMode) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              📧 Email Testing
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            View test emails at Ethereal Email:
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-600">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Email:</span>
                <button
                  onClick={() => copyToClipboard(emailInfo.etherealEmail.email)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                >
                  {emailInfo.etherealEmail.email}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Password:</span>
                <button
                  onClick={() => copyToClipboard(emailInfo.etherealEmail.password)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                >
                  {emailInfo.etherealEmail.password}
                </button>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(emailInfo.etherealEmail.loginUrl, '_blank')}
              className="flex-1 text-xs"
            >
              Open Ethereal Email
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="text-xs"
            >
              Hide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTestInfo; 