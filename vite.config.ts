import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Path alias for TipTap UI components
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Tauri expects a fixed port
  server: {
    port: 5173,
    strictPort: true,
  },
  // Tauri uses a custom protocol
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS/Linux
    target: ['es2021', 'chrome100', 'safari13'],
    // Don't inline assets under this size
    assetsInlineLimit: 0,
  },
  // Clear the screen
  clearScreen: false,
  // Env prefix for Tauri
  envPrefix: ['VITE_', 'TAURI_'],
});
