import { create } from 'zustand'

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
 * Line number display settings
 */
export interface LineNumberSettings {
  enabled: boolean
  position: 'gutter' | 'margin'
  style: 'code' | 'legal'
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
    position: 'gutter',
    style: 'code',
  },

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
}))

// Export types for external use
export type { DocumentMeta, EditorState, AutoSaveStatus }
export type CanvasWidth = EditorState['canvasWidth']
