import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Tracks elapsed time for the current interview question.
 *
 * start() — resets + begins counting (call when a new question appears)
 * stop()  — halts counting and returns elapsed seconds (call when user submits)
 * elapsed — live seconds for display
 * isRunning — true while a question is being answered
 */
export function useQuestionTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    clearInterval(intervalRef.current);
    startTimeRef.current = Date.now();
    setElapsed(0);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  // Returns elapsed seconds at the moment of stopping (avoids stale state reads)
  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    if (!startTimeRef.current) return 0;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    startTimeRef.current = null;
    return duration;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { elapsed, isRunning, start, stop };
}
