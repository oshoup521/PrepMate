import React, { useEffect, useRef, useState } from 'react';

const DURATION_MS = 5000;

const StartInterviewConfirmModal = ({ open, credits = 0, onConfirm, onCancel }) => {
  const [progress, setProgress] = useState(100);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    if (!open) return;
    setProgress(100);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
      setProgress(remaining);
      if (elapsed >= DURATION_MS) {
        clearInterval(interval);
        onConfirmRef.current?.();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const secondsLeft = Math.max(1, Math.ceil(progress / 20));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div className="bg-white dark:bg-dark-muted rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-forest/10 to-sage/10 dark:from-forest/20 dark:to-sage/20 px-6 py-6 text-center border-b border-forest/10 dark:border-forest/20">
          <div className="w-12 h-12 rounded-full bg-forest/10 dark:bg-forest/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-forest dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-light-text dark:text-dark-text">
            Ready to start your interview?
          </h2>
          <p className="text-sm text-light-text/60 dark:text-dark-text/60 mt-1">
            This will use 1 of your {credits} remaining session{credits === 1 ? '' : 's'}.
          </p>
        </div>

        <div className="px-6 pt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-light-text/60 dark:text-dark-text/60">
              Auto-starting in {secondsLeft}s
            </span>
          </div>
          <div className="bg-light-border dark:bg-dark-border rounded-full h-2 overflow-hidden">
            <div
              className="bg-forest dark:bg-sage h-full rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="px-6 py-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-forest to-forest/90 hover:from-forest/90 hover:to-forest rounded-lg shadow-sm transition-all"
          >
            Start Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartInterviewConfirmModal;
