import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';

const VOICE_ENABLED = import.meta.env.VITE_ENABLE_VOICE_INPUT === 'true';

const ChatInterface = ({ onSendMessage, isLoading, disabled, placeholder }) => {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef(null);
  // Snapshot of message at the moment the mic was tapped, so interim text
  // is layered on top rather than replacing existing typed content.
  const voiceBaseRef = useRef('');

  const { isListening, isSupported, error: voiceError, startListening, stopListening } =
    useVoiceInput();

  const showVoiceBtn = VOICE_ENABLED && isSupported;
  const isDisabled = isLoading || disabled;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
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

  // Called by the speech engine with each interim/final result.
  // We display interim text live in the textarea; on final we commit it
  // as the new base so a subsequent tap picks up from there.
  const handleVoiceResult = useCallback((text, isFinal) => {
    const base = voiceBaseRef.current;
    const sep = base.trimEnd() ? ' ' : '';
    const next = base.trimEnd() + sep + text;
    setMessage(next);
    if (isFinal) voiceBaseRef.current = next;
  }, []);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      voiceBaseRef.current = message;
      startListening(handleVoiceResult);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
      setIsExpanded(scrollHeight > 48);
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3 items-end">
        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              placeholder ||
              (isDisabled
                ? 'Please wait...'
                : 'Type your answer here... (Press Enter to send, Shift+Enter for new line)')
            }
            disabled={isDisabled}
            className={`
              w-full resize-none rounded-xl border transition-all duration-200
              py-3 text-sm
              ${showVoiceBtn ? 'pl-10 pr-16' : 'px-4 pr-12'}
              placeholder-light-text/40 dark:placeholder-dark-text/40
              bg-light-bg dark:bg-dark-bg
              border-light-border dark:border-dark-border
              text-light-text dark:text-dark-text
              focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-sage/20
              focus:border-forest dark:focus:border-sage
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isExpanded ? 'min-h-[80px]' : 'min-h-[48px]'}
            `}
            rows={1}
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />

          {/* Mic button — vertically centered, left inside the textarea */}
          {showVoiceBtn && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isDisabled}
              title={isListening ? 'Stop dictation' : 'Dictate answer'}
              className={`
                absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                ${isListening
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
                  : 'text-light-text/50 dark:text-dark-text/50 hover:text-forest dark:hover:text-sage hover:bg-forest/10 dark:hover:bg-sage/10'
                }
              `}
            >
              {isListening ? (
                /* Solid mic while recording */
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                </svg>
              ) : (
                /* Outline mic at rest */
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          )}

          {/* Character count — vertically centered, right */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-light-text/40 dark:text-dark-text/40">
            {message.length}/1000
          </div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || isDisabled || message.length > 1000}
          className={`
            transition-all duration-200 flex-shrink-0 rounded-xl font-medium
            ${!message.trim() || isDisabled || message.length > 1000
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-forest to-forest/90 hover:from-forest/90 hover:to-forest text-white hover:shadow-lg hover:scale-105 active:scale-95'
            }
            px-6
            flex items-center justify-center
            min-w-[120px]
            ${isExpanded ? 'h-[80px]' : 'h-[48px]'}
          `}
        >
          {isDisabled ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="hidden sm:inline">Processing...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="hidden sm:inline">Send Answer</span>
              <span className="sm:hidden">Send</span>
            </>
          )}
        </button>
      </div>

      {/* Voice status / error — shown below the input row */}
      {showVoiceBtn && isListening && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Listening… speak now
        </p>
      )}
      {showVoiceBtn && voiceError && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {voiceError === 'not-allowed'
            ? 'Microphone access denied — check browser permissions.'
            : `Voice error: ${voiceError}`}
        </p>
      )}
    </form>
  );
};

export default ChatInterface;
