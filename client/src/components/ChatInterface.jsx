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
    <div className="bg-white dark:bg-dark-muted border-t border-light-border dark:border-dark-border">
      <form onSubmit={handleSubmit} className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Message Input */}
          <div className="flex-1 relative">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLoading ? "AI is processing..." : "Type your answer here... (Press Enter to send, Shift+Enter for new line)"}
                disabled={isLoading}
                className={`
                  w-full resize-none rounded-xl border transition-all duration-200
                  py-3 px-4 sm:py-4 sm:px-5 pr-12 text-sm sm:text-base
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
              <div className="absolute bottom-2 right-12 text-xs text-light-text/40 dark:text-dark-text/40">
                {message.length}/1000
              </div>
            </div>

            {/* Helper text */}
            <div className="flex items-center justify-between mt-2 text-xs text-light-text/50 dark:text-dark-text/50">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Enter to send
                </span>
                <span className="hidden sm:flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Shift+Enter for new line
                </span>
              </div>
              <span className={message.length > 900 ? 'text-yellow-500' : message.length > 950 ? 'text-red-500' : ''}>
                {message.length > 800 && `${1000 - message.length} chars left`}
              </span>
            </div>
          </div>

          {/* Send Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!message.trim() || isLoading || message.length > 1000}
              className={`
                btn transition-all duration-200 flex-shrink-0
                ${!message.trim() || isLoading || message.length > 1000
                  ? 'btn-ghost opacity-50 cursor-not-allowed' 
                  : 'btn-primary hover:shadow-lg hover:scale-105 active:scale-95'
                }
                w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden sm:inline">Processing...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="hidden sm:inline">Send Answer</span>
                  <span className="sm:hidden">Send</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tips Section */}
        {!isLoading && message.length === 0 && (
          <div className="mt-4 p-4 bg-forest/5 dark:bg-sage/5 rounded-lg border border-forest/10 dark:border-sage/10">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-forest/10 dark:bg-sage/10 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-forest dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-forest dark:text-sage mb-2">
                  💡 Tips for Great Answers
                </h4>
                <ul className="text-xs text-light-text/70 dark:text-dark-text/70 space-y-1">
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-forest/40 dark:bg-sage/40 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <span>Be specific and provide concrete examples</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-forest/40 dark:bg-sage/40 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <span>Structure your response clearly (situation, action, result)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-forest/40 dark:bg-sage/40 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <span>Take your time to think before answering</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Voice Input Placeholder (Future Feature) */}
        {false && ( // Hidden for now, can be enabled when voice feature is implemented
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              className="btn btn-ghost btn-sm text-xs"
              disabled
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice Input (Coming Soon)
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInterface;
