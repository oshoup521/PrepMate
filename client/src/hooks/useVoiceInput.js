import { useState, useRef, useCallback, useEffect } from 'react';

const VOICE_ENABLED = import.meta.env.VITE_ENABLE_VOICE_INPUT === 'true';

// Resolved once at module load — avoids re-checking on every render
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

/**
 * Thin wrapper around the Web Speech API for answer dictation.
 *
 * Usage:
 *   const { isListening, isSupported, error, startListening, stopListening } = useVoiceInput();
 *
 *   startListening((text, isFinal) => {
 *     // text  — current transcript (interim or final)
 *     // isFinal — true once the engine commits the utterance
 *   });
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  // Store the callback in a ref so startListening stays stable
  const onResultRef = useRef(null);

  const isSupported = VOICE_ENABLED && !!SpeechRecognition;

  const startListening = useCallback(
    (onResult) => {
      if (!isSupported || recognitionRef.current) return;

      onResultRef.current = onResult;
      setError(null);

      const recognition = new SpeechRecognition();
      recognition.continuous = false;   // stops after a natural pause
      recognition.interimResults = true; // stream text as the user speaks
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }
        onResultRef.current?.(final || interim, !!final);
      };

      recognition.onerror = (e) => {
        // 'no-speech' is expected when the user pauses too long — not an error
        if (e.error !== 'no-speech') setError(e.error);
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        setError('start-failed');
        recognitionRef.current = null;
      }
    },
    [isSupported],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // Abort on unmount (e.g. navigating away mid-dictation)
  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  return { isListening, isSupported, error, startListening, stopListening };
}
