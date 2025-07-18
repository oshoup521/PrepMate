import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      setIsExpanded(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // 5 lines approximately
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
      setIsExpanded(scrollHeight > 56); // Expand if more than 2 lines
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isLoading ? "AI is processing..." : "Type your answer here... (Press Enter to send, Shift+Enter for new line)"}
            disabled={isLoading}
            className={`
              w-full resize-none rounded-xl border transition-all duration-200
              py-3 px-4 pr-12 text-sm
              placeholder-light-text/40 dark:placeholder-dark-text/40
              bg-light-bg dark:bg-dark-bg
              border-light-border dark:border-dark-border
              text-light-text dark:text-dark-text
              focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-sage/20
              focus:border-forest dark:focus:border-sage
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isExpanded ? 'min-h-[80px]' : 'min-h-[56px]'}
            `}
            rows={1}
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          
          {/* Character count */}
          <div className="absolute bottom-2 right-3 text-xs text-light-text/40 dark:text-dark-text/40">
            {message.length}/1000
          </div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || isLoading || message.length > 1000}
          className={`
            transition-all duration-200 flex-shrink-0 rounded-xl font-medium
            ${!message.trim() || isLoading || message.length > 1000
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-forest to-forest/90 hover:from-forest/90 hover:to-forest text-white hover:shadow-lg hover:scale-105 active:scale-95'
            }
            px-6 py-3 sm:px-8 sm:py-4
            ${isExpanded ? 'h-[80px]' : 'h-[56px]'}
            flex items-center justify-center
            min-w-[120px]
          `}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="hidden sm:inline">Processing...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="hidden sm:inline">Send Answer</span>
              <span className="sm:hidden">Send</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatInterface;
