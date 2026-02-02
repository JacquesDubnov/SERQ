import type { RefObject } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useFileOperations } from './useFileOperations'
import { useEditorStore } from '../stores/editorStore'
import type { EditorCoreRef } from '../components/Editor/EditorCore'

/**
 * Common options for all keyboard shortcuts
 * - enableOnContentEditable: Allow shortcuts when cursor is in TipTap editor
 * - enableOnFormTags: Allow shortcuts in any input context
 */
const HOTKEY_OPTIONS = {
  enableOnContentEditable: true,
  enableOnFormTags: true,
} as const

/**
 * Hook that registers global keyboard shortcuts for file operations
 *
 * Shortcuts:
 * - Cmd+S / Ctrl+S: Save document
 * - Cmd+Shift+S / Ctrl+Shift+S: Save As
 * - Cmd+O / Ctrl+O: Open file
 * - Cmd+N / Ctrl+N: New document
 * - Cmd+/ / Ctrl+/: Toggle Markdown source view
 *
 * All shortcuts work even when cursor is focused in the TipTap editor.
 */
export function useKeyboardShortcuts(editorRef: RefObject<EditorCoreRef | null>) {
  const { openFile, saveFile, saveFileAs, newFile } = useFileOperations(editorRef)
  const toggleViewMode = useEditorStore((s) => s.toggleViewMode)

  // Save: Cmd+S (macOS) / Ctrl+S (Windows/Linux)
  useHotkeys(
    'meta+s, ctrl+s',
    (e) => {
      e.preventDefault()
      saveFile()
    },
    HOTKEY_OPTIONS
  )

  // Save As: Cmd+Shift+S (macOS) / Ctrl+Shift+S (Windows/Linux)
  useHotkeys(
    'meta+shift+s, ctrl+shift+s',
    (e) => {
      e.preventDefault()
      saveFileAs()
    },
    HOTKEY_OPTIONS
  )

  // Open: Cmd+O (macOS) / Ctrl+O (Windows/Linux)
  useHotkeys(
    'meta+o, ctrl+o',
    (e) => {
      e.preventDefault()
      openFile()
    },
    HOTKEY_OPTIONS
  )

  // New: Cmd+N (macOS) / Ctrl+N (Windows/Linux)
  useHotkeys(
    'meta+n, ctrl+n',
    (e) => {
      e.preventDefault()
      newFile()
    },
    HOTKEY_OPTIONS
  )

  // Toggle Markdown source view: Cmd+/ (macOS) / Ctrl+/ (Windows/Linux)
  useHotkeys(
    'meta+/, ctrl+/',
    (e) => {
      e.preventDefault()
      toggleViewMode()
    },
    HOTKEY_OPTIONS
  )
}
