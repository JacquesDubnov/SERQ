import { create } from 'zustand'

interface DocumentMeta {
  path: string | null       // File path (null = unsaved)
  name: string              // Display name (file name or 'Untitled')
  isDirty: boolean          // Has unsaved changes
  lastSaved: Date | null    // Timestamp of last save
}

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface EditorState {
  document: DocumentMeta
  canvasWidth: 'narrow' | 'normal' | 'wide' | 'full'
  autoSaveStatus: AutoSaveStatus

  setDocument: (path: string | null, name: string) => void
  markDirty: () => void
  markSaved: () => void
  clearDocument: () => void
  setCanvasWidth: (width: 'narrow' | 'normal' | 'wide' | 'full') => void
  setAutoSaveStatus: (status: AutoSaveStatus) => void
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
}))

// Export types for external use
export type { DocumentMeta, EditorState, AutoSaveStatus }
export type CanvasWidth = EditorState['canvasWidth']
