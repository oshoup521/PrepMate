import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'

// iOS PWA: prevent viewport zoom on input focus by enforcing maximum-scale=1.
// The meta tag alone can be reset by iOS after SPA navigation, so we re-apply on every focus.
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const noZoom = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  if (viewportMeta) viewportMeta.setAttribute('content', noZoom);
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea, select') && viewportMeta) {
      viewportMeta.setAttribute('content', noZoom);
    }
  }, true);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
