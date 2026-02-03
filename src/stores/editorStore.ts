/**
 * Editor Store - Document metadata state
 *
 * IMPORTANT: Document CONTENT lives in TipTap, not here.
 * This store only tracks metadata: file path, name, dirty state, etc.
 */

import { create } from 'zustand';

export type CanvasWidth = 'narrow' | 'normal' | 'wide' | 'full';
export type PageSize = 'a4' | 'letter' | 'legal';

// Page dimensions in pixels at 96 DPI
export const PAGE_DIMENSIONS: Record<PageSize, { width: number; height: number; label: string }> = {
  a4: { width: 794, height: 1123, label: 'A4' },           // 210mm × 297mm
  letter: { width: 816, height: 1056, label: 'Letter' },   // 8.5" × 11"
  legal: { width: 816, height: 1344, label: 'Legal' },     // 8.5" × 14"
};

interface PaginationState {
  enabled: boolean;
  pageSize: PageSize;
}

interface DocumentMeta {
  path: string | null;      // File path (null = unsaved)
  name: string;             // Display name (file name or 'Untitled')
  isDirty: boolean;         // Has unsaved changes
  lastSaved: Date | null;   // Timestamp of last save
}

interface EditorState {
  // Document metadata
  document: DocumentMeta;

  // UI state
  canvasWidth: CanvasWidth;
  isDark: boolean;
  zoom: number; // 20-300 percent
  pagination: PaginationState;

  // Actions
  setDocument: (path: string | null, name: string) => void;
  markDirty: () => void;
  markSaved: () => void;
  clearDocument: () => void;
  setCanvasWidth: (width: CanvasWidth) => void;
  setIsDark: (isDark: boolean) => void;
  toggleTheme: () => void;
  setZoom: (zoom: number) => void;
  setPaginationEnabled: (enabled: boolean) => void;
  setPageSize: (size: PageSize) => void;
  togglePagination: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  // Initial state - new untitled document
  document: {
    path: null,
    name: 'Untitled',
    isDirty: false,
    lastSaved: null,
  },

  canvasWidth: 'normal',
  isDark: typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false,
  zoom: 100, // Default 100%
  pagination: {
    enabled: false,
    pageSize: 'a4',
  },

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

  // Canvas width
  setCanvasWidth: (width) => set({ canvasWidth: width }),

  // Theme
  setIsDark: (isDark) => set({ isDark }),
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),

  // Zoom (20-300%)
  setZoom: (zoom) => set({ zoom: Math.min(300, Math.max(20, zoom)) }),

  // Pagination
  setPaginationEnabled: (enabled) => set((state) => ({
    pagination: { ...state.pagination, enabled }
  })),
  setPageSize: (pageSize) => set((state) => ({
    pagination: { ...state.pagination, pageSize }
  })),
  togglePagination: () => set((state) => ({
    pagination: { ...state.pagination, enabled: !state.pagination.enabled }
  })),
}));
