/**
 * Editor Store - Document metadata state
 *
 * IMPORTANT: Document CONTENT lives in TipTap, not here.
 * This store only tracks metadata: file path, name, dirty state, theme.
 *
 * Presentation concerns (zoom, pagination, canvas width) live in
 * presentationStore.ts -- NOT here.
 */

import { create } from 'zustand';

interface DocumentMeta {
  path: string | null;      // File path (null = unsaved)
  name: string;             // Display name (file name or 'Untitled')
  isDirty: boolean;         // Has unsaved changes
  lastSaved: Date | null;   // Timestamp of last save
}

interface EditorState {
  // Document metadata
  document: DocumentMeta;

  // Theme
  isDark: boolean;

  // Actions
  setDocument: (path: string | null, name: string) => void;
  markDirty: () => void;
  markSaved: () => void;
  clearDocument: () => void;
  setIsDark: (isDark: boolean) => void;
  toggleTheme: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  // Initial state - new untitled document
  document: {
    path: null,
    name: 'Untitled',
    isDirty: false,
    lastSaved: null,
  },

  isDark: typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false,

  // Set document from file open
  setDocument: (path, name) => set({
    document: {
      path,
      name,
      isDirty: false,
      lastSaved: null,
    }
  }),

  // Mark document as having unsaved changes
  markDirty: () => set((state) => ({
    document: { ...state.document, isDirty: true }
  })),

  // Mark document as saved
  markSaved: () => set((state) => ({
    document: {
      ...state.document,
      isDirty: false,
      lastSaved: new Date(),
    }
  })),

  // Reset to new untitled document
  clearDocument: () => set({
    document: {
      path: null,
      name: 'Untitled',
      isDirty: false,
      lastSaved: null,
    }
  }),

  // Theme
  setIsDark: (isDark) => set({ isDark }),
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
}));
