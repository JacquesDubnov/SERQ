import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/focus-mode.css';
import './styles/version-history.css';
import './styles/comments.css';
import './styles/pagination.css';
import { getPreferencesStore } from './lib/preferencesStore';

// Initialize preferences store on app start
// This ensures the store is loaded and file is created before any file operations
async function initializeApp() {
  console.log('[SERQ] Initializing app...');
  try {
    console.log('[SERQ] Loading preferences store...');
    const store = await getPreferencesStore();
    console.log('[SERQ] Store loaded, saving to create file...');
    await store.save();
    console.log('[SERQ] Preferences store initialized successfully');
  } catch (error) {
    console.error('[SERQ] Failed to initialize preferences store:', error);
    // Continue anyway - app can work without preferences
  }
}

// Initialize then render
initializeApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
