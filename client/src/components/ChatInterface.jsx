import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ onSendMessage, isLoading }) => {
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-light-border dark:border-dark-border bg-white dark:bg-dark-muted">
      <div className="flex items-center space-x-3">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your answer here..."
          disabled={isLoading}
          className="flex-1 p-3 rounded-md border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-forest dark:focus:ring-sage transition-all duration-200 bg-white dark:bg-dark-bg text-light-text dark:text-dark-text"
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
        />
        <button
          type="submit"
          disabled={isLoading || !userInput.trim()}
          className={`btn px-5 py-3 rounded-md font-medium transition-all duration-300 flex items-center ${
            isLoading || !userInput.trim() 
              ? 'bg-light-border dark:bg-dark-border text-light-text/50 dark:text-dark-text/50 cursor-not-allowed' 
              : 'btn-primary'
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
        </button>
      </div>
      <div className="mt-2 text-xs text-light-text/60 dark:text-dark-text/60 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-forest dark:text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Press Enter to send. Be concise and specific in your answers.</span>
      </div>
    </form>
  );
};

export default ChatInterface;
