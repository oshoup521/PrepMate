import React, { useState, useEffect } from 'react';

const DISMISSED_KEY = 'pwa-install-dismissed';

const InstallPWA = () => {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already installed (standalone mode) — nothing to show
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    // User already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Detect iOS (Safari doesn't fire beforeinstallprompt)
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
    if (ios) {
      setIsIOS(true);
      // Show the iOS manual install instructions after a short delay
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Chrome / Android / Edge — listen for the install prompt
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Hide once installed
    window.addEventListener('appinstalled', () => {
      setVisible(false);
      setIsInstalled(true);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setIsInstalled(true);
    }
    setPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!visible || isInstalled) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-md mx-auto bg-white dark:bg-dark-muted border border-forest/20 dark:border-sage/20 rounded-2xl shadow-xl p-4 flex items-start gap-3">
        {/* App icon */}
        <img
          src="/pwa-192.svg"
          alt="PrepMate icon"
          className="w-12 h-12 rounded-xl flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-light-text dark:text-dark-text">
            Install PrepMate
          </p>
          {isIOS ? (
            <p className="text-xs text-light-text/60 dark:text-dark-text/60 mt-0.5">
              Tap{' '}
              <span className="inline-flex items-center font-medium text-forest dark:text-sage">
                <svg className="w-3.5 h-3.5 mx-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                </svg>
                Share
              </span>{' '}
              then <strong className="text-light-text dark:text-dark-text">"Add to Home Screen"</strong>
            </p>
          ) : (
            <p className="text-xs text-light-text/60 dark:text-dark-text/60 mt-0.5">
              Add to your home screen for quick access
            </p>
          )}

          {!isIOS && (
            <button
              onClick={handleInstall}
              className="mt-2 px-4 py-1.5 bg-forest dark:bg-sage text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Install
            </button>
          )}
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="flex-shrink-0 p-1 rounded-lg text-light-text/40 dark:text-dark-text/40 hover:text-light-text dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
