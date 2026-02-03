import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initDebugBridge } from './lib/debug-bridge';
import './index.css';

// Initialize debug bridge BEFORE React mounts
// Captures all console output + errors -> pipes to ~/.serq-debug.log
initDebugBridge();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
