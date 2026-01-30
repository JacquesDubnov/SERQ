import { create } from 'zustand'
import { Editor } from '@tiptap/react'
import {
  applyTypographyPreset,
  applyColorPreset,
  applyCanvasPreset,
  applyLayoutPreset,
  applyMasterTheme as applyMasterThemePresets,
  getMasterThemeById,
} from '../lib/presets'
import { useEditorStore } from './editorStore'

// ============================================
// Type Definitions
// ============================================

export interface StoredFormat {
  marks: Array<{ type: string; attrs: Record<string, unknown> }>
  textAlign: string
}

export interface CustomStyle {
  id: string
  name: string
  typography: string
  colors: string
  canvas: string
  layout: string
  createdAt: string
}

export interface StyleMetadata {
  typography: string
  colors: string
  canvas: string
  layout: string
  masterTheme: string | null
  themeMode: 'light' | 'dark' | 'system'
}

interface StyleState {
  // Current active presets
  currentTypography: string
  currentColor: string
  currentCanvas: string
  currentLayout: string
  currentMasterTheme: string | null
  themeMode: 'light' | 'dark' | 'system'

  // Recently used (for quick access in UI)
  recentTypography: string[]
  recentColors: string[]
  recentCanvas: string[]
  recentLayout: string[]
  recentMasterThemes: string[]

  // Format painter state
  formatPainter: {
    active: boolean
    mode: 'toggle' | 'hold'
    storedFormat: StoredFormat | null
  }

  // Custom saved styles (user-created combinations)
  customStyles: CustomStyle[]

  // Actions
  setTypography: (presetId: string) => void
  setColor: (presetId: string) => void
  setCanvas: (presetId: string) => void
  setLayout: (presetId: string) => void
  setMasterTheme: (themeId: string) => void
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void

  // Format painter actions
  captureFormat: (editor: Editor) => void
  applyFormat: (editor: Editor) => void
  toggleFormatPainter: () => void
  deactivateFormatPainter: () => void

  // Custom style actions
  saveCustomStyle: (name: string) => void
  deleteCustomStyle: (id: string) => void
  renameCustomStyle: (id: string, newName: string) => void

  // Bulk operations
  applyAllPresets: () => void
  resetToDefaults: () => void
  loadFromDocument: (metadata: StyleMetadata) => void
  getStyleMetadata: () => StyleMetadata

  // Internal: For loading recents/customs from preferences
  _loadPersistedState: (state: Partial<PersistedStyleState>) => void
}

// State that gets persisted to preferences
export interface PersistedStyleState {
  recentTypography: string[]
  recentColors: string[]
  recentCanvas: string[]
  recentLayout: string[]
  recentMasterThemes: string[]
  customStyles: CustomStyle[]
}

// ============================================
// Helper Functions
// ============================================

const MAX_RECENT = 5

function addToRecent(recent: string[], id: string): string[] {
  // Remove if exists, prepend, limit to MAX_RECENT
  const filtered = recent.filter((r) => r !== id)
  return [id, ...filtered].slice(0, MAX_RECENT)
}

function getEffectiveThemeMode(
  mode: 'light' | 'dark' | 'system'
): 'light' | 'dark' {
  if (mode === 'system') {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return 'light'
  }
  return mode
}

// ============================================
// Store Definition
// ============================================

export const useStyleStore = create<StyleState>((set, get) => ({
  // Initial state - defaults
  currentTypography: 'serq-default',
  currentColor: 'default',
  currentCanvas: 'white',
  currentLayout: 'default',
  currentMasterTheme: null,
  themeMode: 'system',

  recentTypography: [],
  recentColors: [],
  recentCanvas: [],
  recentLayout: [],
  recentMasterThemes: [],

  formatPainter: {
    active: false,
    mode: 'toggle',
    storedFormat: null,
  },

  customStyles: [],

  // Actions
  setTypography: (presetId: string) => {
    applyTypographyPreset(presetId)
    set((state) => ({
      currentTypography: presetId,
      currentMasterTheme: null, // No longer using a master theme
      recentTypography: addToRecent(state.recentTypography, presetId),
    }))
    useEditorStore.getState().markDirty()
  },

  setColor: (presetId: string) => {
    const state = get()
    const effectiveMode = getEffectiveThemeMode(state.themeMode)
    applyColorPreset(presetId, effectiveMode)
    set((s) => ({
      currentColor: presetId,
      currentMasterTheme: null,
      recentColors: addToRecent(s.recentColors, presetId),
    }))
    useEditorStore.getState().markDirty()
  },

  setCanvas: (presetId: string) => {
    applyCanvasPreset(presetId)
    set((state) => ({
      currentCanvas: presetId,
      currentMasterTheme: null,
      recentCanvas: addToRecent(state.recentCanvas, presetId),
    }))
    useEditorStore.getState().markDirty()
  },

  setLayout: (presetId: string) => {
    applyLayoutPreset(presetId)
    set((state) => ({
      currentLayout: presetId,
      currentMasterTheme: null,
      recentLayout: addToRecent(state.recentLayout, presetId),
    }))
    useEditorStore.getState().markDirty()
  },

  setMasterTheme: (themeId: string) => {
    const theme = getMasterThemeById(themeId)
    if (!theme) {
      console.warn(`Master theme not found: ${themeId}`)
      return
    }

    const state = get()
    const effectiveMode = getEffectiveThemeMode(state.themeMode)

    // Apply all four presets
    applyMasterThemePresets(themeId, effectiveMode)

    set((s) => ({
      currentTypography: theme.typography,
      currentColor: theme.colors,
      currentCanvas: theme.canvas,
      currentLayout: theme.layout,
      currentMasterTheme: themeId,
      recentMasterThemes: addToRecent(s.recentMasterThemes, themeId),
    }))
    useEditorStore.getState().markDirty()
  },

  setThemeMode: (mode: 'light' | 'dark' | 'system') => {
    const state = get()
    const effectiveMode = getEffectiveThemeMode(mode)

    // Reapply current color preset with new mode
    applyColorPreset(state.currentColor, effectiveMode)

    // Update data-theme attribute on document
    document.documentElement.dataset.theme = effectiveMode

    set({ themeMode: mode })
    useEditorStore.getState().markDirty()
  },

  // Format painter actions
  captureFormat: (editor: Editor) => {
    const { state } = editor
    const { from } = state.selection

    // Get marks at selection
    const marks: StoredFormat['marks'] = []
    const resolvedFrom = state.doc.resolve(from)

    // Get marks from the resolved position
    resolvedFrom.marks().forEach((mark) => {
      marks.push({
        type: mark.type.name,
        attrs: { ...mark.attrs },
      })
    })

    // Get text alignment from parent node
    const parent = resolvedFrom.parent
    const textAlign =
      (parent.attrs.textAlign as string) ||
      (parent.type.name === 'paragraph' ? 'left' : '')

    set({
      formatPainter: {
        active: true,
        mode: get().formatPainter.mode,
        storedFormat: { marks, textAlign },
      },
    })
  },

  applyFormat: (editor: Editor) => {
    const { formatPainter } = get()
    if (!formatPainter.storedFormat) return

    const { marks, textAlign } = formatPainter.storedFormat

    // Apply marks to current selection
    editor.chain().focus().unsetAllMarks().run()

    marks.forEach((mark) => {
      const markType = editor.schema.marks[mark.type]
      if (markType) {
        editor.chain().focus().setMark(mark.type, mark.attrs).run()
      }
    })

    // Apply text alignment if applicable
    if (textAlign && editor.can().setTextAlign(textAlign)) {
      editor.chain().focus().setTextAlign(textAlign).run()
    }

    // In toggle mode, deactivate after one use
    if (formatPainter.mode === 'toggle') {
      set({
        formatPainter: {
          ...formatPainter,
          active: false,
        },
      })
    }
  },

  toggleFormatPainter: () => {
    set((state) => ({
      formatPainter: {
        ...state.formatPainter,
        active: !state.formatPainter.active,
      },
    }))
  },

  deactivateFormatPainter: () => {
    set((state) => ({
      formatPainter: {
        ...state.formatPainter,
        active: false,
        storedFormat: null,
      },
    }))
  },

  // Custom style actions
  saveCustomStyle: (name: string) => {
    const state = get()
    const newStyle: CustomStyle = {
      id: `custom-${Date.now()}`,
      name,
      typography: state.currentTypography,
      colors: state.currentColor,
      canvas: state.currentCanvas,
      layout: state.currentLayout,
      createdAt: new Date().toISOString(),
    }

    set((s) => ({
      customStyles: [...s.customStyles, newStyle],
    }))
  },

  deleteCustomStyle: (id: string) => {
    set((state) => ({
      customStyles: state.customStyles.filter((s) => s.id !== id),
    }))
  },

  renameCustomStyle: (id: string, newName: string) => {
    set((state) => ({
      customStyles: state.customStyles.map((s) =>
        s.id === id ? { ...s, name: newName } : s
      ),
    }))
  },

  // Bulk operations
  applyAllPresets: () => {
    const state = get()
    const effectiveMode = getEffectiveThemeMode(state.themeMode)

    applyTypographyPreset(state.currentTypography)
    applyColorPreset(state.currentColor, effectiveMode)
    applyCanvasPreset(state.currentCanvas)
    applyLayoutPreset(state.currentLayout)

    // Update data-theme attribute
    document.documentElement.dataset.theme = effectiveMode
  },

  resetToDefaults: () => {
    // Apply default presets
    applyTypographyPreset('serq-default')
    applyColorPreset('default', 'light')
    applyCanvasPreset('white')
    applyLayoutPreset('default')

    set({
      currentTypography: 'serq-default',
      currentColor: 'default',
      currentCanvas: 'white',
      currentLayout: 'default',
      currentMasterTheme: null,
      themeMode: 'system',
    })

    document.documentElement.dataset.theme = 'light'
    useEditorStore.getState().markDirty()
  },

  loadFromDocument: (metadata: StyleMetadata) => {
    const effectiveMode = getEffectiveThemeMode(metadata.themeMode)

    // Apply all presets
    applyTypographyPreset(metadata.typography)
    applyColorPreset(metadata.colors, effectiveMode)
    applyCanvasPreset(metadata.canvas)
    applyLayoutPreset(metadata.layout)

    // Update data-theme attribute
    document.documentElement.dataset.theme = effectiveMode

    set({
      currentTypography: metadata.typography,
      currentColor: metadata.colors,
      currentCanvas: metadata.canvas,
      currentLayout: metadata.layout,
      currentMasterTheme: metadata.masterTheme,
      themeMode: metadata.themeMode,
    })
  },

  getStyleMetadata: (): StyleMetadata => {
    const state = get()
    return {
      typography: state.currentTypography,
      colors: state.currentColor,
      canvas: state.currentCanvas,
      layout: state.currentLayout,
      masterTheme: state.currentMasterTheme,
      themeMode: state.themeMode,
    }
  },

  // Internal: Load persisted state from preferences
  _loadPersistedState: (persisted: Partial<PersistedStyleState>) => {
    set({
      recentTypography: persisted.recentTypography ?? [],
      recentColors: persisted.recentColors ?? [],
      recentCanvas: persisted.recentCanvas ?? [],
      recentLayout: persisted.recentLayout ?? [],
      recentMasterThemes: persisted.recentMasterThemes ?? [],
      customStyles: persisted.customStyles ?? [],
    })
  },
}))

// Export types for external use
export type { StyleState }
