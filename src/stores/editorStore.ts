import { create } from 'zustand'

interface DocumentMeta {
  path: string | null       // File path (null = unsaved)
  name: string              // Display name (file name or 'Untitled')
  isDirty: boolean          // Has unsaved changes
  lastSaved: Date | null    // Timestamp of last save
}

interface EditorState {
  document: DocumentMeta
  canvasWidth: 'narrow' | 'normal' | 'wide' | 'full'

  setDocument: (path: string | null, name: string) => void
  markDirty: () => void
  markSaved: () => void
  clearDocument: () => void
  setCanvasWidth: (width: 'narrow' | 'normal' | 'wide' | 'full') => void
}

export const useEditorStore = create<EditorState>((set) => ({
  document: {
    path: null,
    name: 'Untitled',
    isDirty: false,
    lastSaved: null,
  },
  canvasWidth: 'normal',

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
}))

// Export types for external use
export type { DocumentMeta, EditorState }
export type CanvasWidth = EditorState['canvasWidth']
