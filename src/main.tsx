import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getPreferencesStore } from './lib/preferencesStore';

// Initialize preferences store on app start
// This ensures the store is loaded and file is created before any file operations
async function initializeApp() {
  try {
    const store = await getPreferencesStore();
    // Ensure preferences file exists by saving defaults
    await store.save();
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
