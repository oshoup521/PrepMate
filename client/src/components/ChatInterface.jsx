import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ messages, onSendMessage, isLoading }) => {
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userInput.trim() && !isLoading) {
      setIsSending(true);
      onSendMessage(userInput);
      setUserInput('');
      // Reset animation after small delay
      setTimeout(() => setIsSending(false), 500);
    }
  };

  // Auto-focus input when chat loads
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  return (
    <div className="flex flex-col h-[70vh] border border-gray-300 dark:border-gray-700 rounded-lg bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-blue-950 shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-t-lg flex items-center">
        <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
        <div className="font-medium text-gray-700 dark:text-gray-300">Interview Session</div>
      </div>
    
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`max-w-[80%] p-4 rounded-lg shadow-md transition-all duration-300 animate-fadeIn
            ${msg.sender === 'ai' 
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 text-gray-800 dark:text-gray-200 mr-auto border-l-4 border-blue-400 dark:border-blue-600' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white ml-auto border-r-4 border-blue-700 dark:border-blue-800'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {msg.sender === 'ai' && (
              <div className="font-semibold mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Interview Coach
              </div>
            )}
            
            <div className="leading-relaxed">{msg.text}</div>
            
            {/* Display feedback if available */}
            {msg.feedback && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 p-3 rounded-md">
                <div className="font-medium text-blue-700 dark:text-blue-400 flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Feedback:
                </div>
                <div className="text-gray-700 dark:text-gray-300">{msg.feedback}</div>
                {msg.score && (
                  <div className="mt-2 flex items-center">
                    <span className="font-medium mr-2 dark:text-gray-300">Score: </span>
                    <span className={`font-bold px-3 py-1 rounded-full text-white ${
                      parseInt(msg.score) >= 8 ? 'bg-green-500 dark:bg-green-600' : 
                      parseInt(msg.score) >= 6 ? 'bg-blue-500 dark:bg-blue-600' : 
                      parseInt(msg.score) >= 4 ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-red-500 dark:bg-red-600'
                    }`}>
                      {msg.score}/10
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-3 max-w-[80%] p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 border-l-4 border-blue-400 dark:border-blue-600 shadow-md">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div className="font-semibold text-gray-800 dark:text-gray-200">Interview Coach is thinking</div>
            </div>
            <div className="ml-2">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input field */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
        <div className="flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your answer here..."
            disabled={isLoading}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-300 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className={`px-5 py-3 rounded-md font-medium transition-all duration-300 flex items-center ${
              isLoading || !userInput.trim() 
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
            } ${isSending ? 'scale-95' : ''}`}
          >
            {isLoading ? (
              'Wait...'
            ) : (
              <>
                Send
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </>
            )}
          </button>        </div>
      </form>
      
      {/* Tips */}
      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
        <span className="font-medium">Pro tip:</span> Press Enter to send. Be concise and specific in your answers.
      </div>
    </div>
  );
};

export default ChatInterface;
