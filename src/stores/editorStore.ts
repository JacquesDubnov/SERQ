import { create } from 'zustand'

/**
 * Page size options for pagination mode
 */
export type PageSize = 'a4' | 'letter' | 'legal'

/**
 * Pagination settings for print-ready documents
 */
export interface PaginationSettings {
  enabled: boolean
  pageSize: PageSize
}

interface DocumentMeta {
  path: string | null       // File path (null = unsaved)
  name: string              // Display name (file name or 'Untitled')
  isDirty: boolean          // Has unsaved changes
  lastSaved: Date | null    // Timestamp of last save
}

/**
 * Outline anchor item from TableOfContents extension
 */
export interface OutlineAnchor {
  id: string
  level: number
  textContent: string
  isActive: boolean
  pos: number
}

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * View mode for editor display
 * - 'rendered': WYSIWYG TipTap editor (default)
 * - 'source': Raw Markdown with syntax highlighting
 */
export type ViewMode = 'rendered' | 'source'

/**
 * Line number display settings
 */
export interface LineNumberSettings {
  enabled: boolean
  style: 'regular' | 'legal'  // regular = per paragraph, legal = every visual line
}

/**
 * Stored selection for commands that need the selection after focus is lost
 * (e.g., Add Comment command - selection is lost when command palette opens)
 */
export interface StoredSelection {
  from: number
  to: number
}

interface EditorState {
  document: DocumentMeta
  canvasWidth: 'narrow' | 'normal' | 'wide' | 'full'
  autoSaveStatus: AutoSaveStatus
  outlineAnchors: OutlineAnchor[]
  storedSelection: StoredSelection | null
  showSaveGlow: boolean
  lineNumbers: LineNumberSettings
  pagination: PaginationSettings
  viewMode: ViewMode
  markdownSource: string

  setDocument: (path: string | null, name: string) => void
  markDirty: () => void
  markSaved: () => void
  clearDocument: () => void
  setCanvasWidth: (width: 'narrow' | 'normal' | 'wide' | 'full') => void
  setAutoSaveStatus: (status: AutoSaveStatus) => void
  setOutlineAnchors: (anchors: OutlineAnchor[]) => void
  setStoredSelection: (selection: StoredSelection | null) => void
  triggerSaveGlow: () => void
  setLineNumbers: (settings: Partial<LineNumberSettings>) => void
  toggleLineNumbers: () => void
  setLineNumberStyle: (style: 'regular' | 'legal') => void
  setPaginationEnabled: (enabled: boolean) => void
  setPageSize: (size: PageSize) => void
  togglePagination: () => void
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
  setMarkdownSource: (source: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  document: {
    path: null,
    name: 'Untitled',
    isDirty: false,
    lastSaved: null,
  },
  canvasWidth: 'normal',
  autoSaveStatus: 'idle',
  outlineAnchors: [],
  storedSelection: null,
  showSaveGlow: false,
  lineNumbers: {
    enabled: false,
    style: 'regular',
  },
  pagination: {
    enabled: false,
    pageSize: 'a4',
  },
  viewMode: 'rendered',
  markdownSource: '',

  setDocument: (path, name) => set({
    document: { path, name, isDirty: false, lastSaved: null }
  }),

  markDirty: () => set((state) => ({
    document: { ...state.document, isDirty: true }
  })),

  markSaved: () => set((state) => ({
    document: {
      ...state.document,
      isDirty: false,
      lastSaved: new Date(),
    }
  })),

  clearDocument: () => set({
    document: { path: null, name: 'Untitled', isDirty: false, lastSaved: null }
  }),

  setCanvasWidth: (width) => set({ canvasWidth: width }),

  setAutoSaveStatus: (status) => set({ autoSaveStatus: status }),

  setOutlineAnchors: (anchors) => set({ outlineAnchors: anchors }),

  setStoredSelection: (selection) => set({ storedSelection: selection }),

  triggerSaveGlow: () => {
    set({ showSaveGlow: true });
    setTimeout(() => set({ showSaveGlow: false }), 600);
  },

  setLineNumbers: (settings) => set((state) => ({
    lineNumbers: { ...state.lineNumbers, ...settings }
  })),

  toggleLineNumbers: () => set((state) => ({
    lineNumbers: { ...state.lineNumbers, enabled: !state.lineNumbers.enabled }
  })),

  setLineNumberStyle: (style) => set((state) => ({
    lineNumbers: { ...state.lineNumbers, style, enabled: true }
  })),

  setPaginationEnabled: (enabled) => set((state) => ({
    pagination: { ...state.pagination, enabled }
  })),

  setPageSize: (size) => set((state) => ({
    pagination: { ...state.pagination, pageSize: size, enabled: true }
  })),

  togglePagination: () => set((state) => ({
    pagination: { ...state.pagination, enabled: !state.pagination.enabled }
  })),

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleViewMode: () => set((state) => ({
    viewMode: state.viewMode === 'rendered' ? 'source' : 'rendered'
  })),

  setMarkdownSource: (source) => set({ markdownSource: source }),
}))

// Export types for external use
export type { DocumentMeta, EditorState, AutoSaveStatus }
export type CanvasWidth = EditorState['canvasWidth']
