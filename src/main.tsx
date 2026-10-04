import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from './components/AppErrorBoundary.tsx';
import './index.css';

const root = document.getElementById('root');

if (!root) throw new Error('Wearza root element is missing');

// Drop saved seller data that is corrupted so it can never crash startup.
try { const s = localStorage.getItem('wearza_seller'); if (s) { const p = JSON.parse(s); if (!p || typeof p !== 'object' || !p.id) localStorage.removeItem('wearza_seller'); } }
catch { try { localStorage.removeItem('wearza_seller'); } catch { /* storage blocked */ } }

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);

(window as unknown as { __wearzaBooted?: () => void }).__wearzaBooted?.();
