/**
 * useBlockSelection - Hook for toolbar components to work with selected blocks
 *
 * Provides:
 * - Whether blocks are currently selected
 * - Count of selected blocks
 * - Function to apply attributes to all selected blocks
 */

import { useState, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import {
  subscribeToBlockSelection,
  hasSelectedBlocks,
  getSelectedBlockCount,
  getSelectedBlockPositions,
} from '@/extensions/block-indicator'

export interface UseBlockSelectionResult {
  /** Whether any blocks are currently selected */
  hasSelection: boolean
  /** Number of selected blocks */
  selectionCount: number
  /** Apply node attributes to all selected blocks */
  applyToSelectedBlocks: (
    editor: Editor,
    attrs: Record<string, unknown>
  ) => boolean
  /** Apply a command to all selected blocks (for marks, alignment, etc.) */
  applyCommandToSelectedBlocks: (
    editor: Editor,
    command: (editor: Editor, pos: number) => void
  ) => boolean
}

/**
 * Hook for components to react to block selection state
 */
export function useBlockSelection(): UseBlockSelectionResult {
  const [hasSelection, setHasSelection] = useState(() => hasSelectedBlocks())
  const [selectionCount, setSelectionCount] = useState(() => getSelectedBlockCount())

  useEffect(() => {
    const unsubscribe = subscribeToBlockSelection((positions) => {
      setHasSelection(positions.size > 0)
      setSelectionCount(positions.size)
    })
    return unsubscribe
  }, [])

  /**
   * Apply node attributes to all selected blocks
   * Returns true if any blocks were modified
   */
  const applyToSelectedBlocks = useCallback(
    (editor: Editor, attrs: Record<string, unknown>): boolean => {
      const positions = getSelectedBlockPositions()
      if (positions.size === 0) return false

      const { tr } = editor.state
      let modified = false

      positions.forEach((pos) => {
        try {
          const node = editor.state.doc.nodeAt(pos)
          if (node && (node.type.name === 'paragraph' || node.type.name === 'heading')) {
            // Merge new attrs with existing
            const newAttrs = { ...node.attrs, ...attrs }
            tr.setNodeMarkup(pos, undefined, newAttrs)
            modified = true
          }
        } catch {
          // Position invalid, skip
        }
      })

      if (modified) {
        editor.view.dispatch(tr)
      }

      return modified
    },
    []
  )

  /**
   * Apply a command to each selected block
   * The command receives the editor and block position
   */
  const applyCommandToSelectedBlocks = useCallback(
    (editor: Editor, command: (editor: Editor, pos: number) => void): boolean => {
      const positions = getSelectedBlockPositions()
      if (positions.size === 0) return false

      // Sort positions in reverse order so we don't invalidate later positions
      const sortedPositions = Array.from(positions).sort((a, b) => b - a)

      sortedPositions.forEach((pos) => {
        try {
          command(editor, pos)
        } catch {
          // Position invalid, skip
        }
      })

      return true
    },
    []
  )

  return {
    hasSelection,
    selectionCount,
    applyToSelectedBlocks,
    applyCommandToSelectedBlocks,
  }
}

/**
 * Apply text alignment to selected blocks
 */
export function applyTextAlignToSelectedBlocks(
  editor: Editor,
  align: 'left' | 'center' | 'right' | 'justify'
): boolean {
  const positions = getSelectedBlockPositions()
  if (positions.size === 0) return false

  const { tr } = editor.state
  let modified = false

  positions.forEach((pos) => {
    try {
      const node = editor.state.doc.nodeAt(pos)
      if (node && (node.type.name === 'paragraph' || node.type.name === 'heading')) {
        const newAttrs = { ...node.attrs, textAlign: align }
        tr.setNodeMarkup(pos, undefined, newAttrs)
        modified = true
      }
    } catch {
      // Position invalid
    }
  })

  if (modified) {
    editor.view.dispatch(tr)
  }

  return modified
}

/**
 * Apply line height to selected blocks
 */
export function applyLineHeightToSelectedBlocks(
  editor: Editor,
  lineHeight: string | null
): boolean {
  const positions = getSelectedBlockPositions()
  if (positions.size === 0) return false

  const { tr } = editor.state
  let modified = false

  positions.forEach((pos) => {
    try {
      const node = editor.state.doc.nodeAt(pos)
      if (node && (node.type.name === 'paragraph' || node.type.name === 'heading')) {
        const newAttrs = { ...node.attrs, lineHeight }
        tr.setNodeMarkup(pos, undefined, newAttrs)
        modified = true
      }
    } catch {
      // Position invalid
    }
  })

  if (modified) {
    editor.view.dispatch(tr)
  }

  return modified
}

/**
 * Apply letter spacing to selected blocks (block-level, not marks)
 */
export function applyLetterSpacingToSelectedBlocks(
  editor: Editor,
  letterSpacing: string | null
): boolean {
  const positions = getSelectedBlockPositions()
  if (positions.size === 0) return false

  const { tr } = editor.state
  let modified = false

  positions.forEach((pos) => {
    try {
      const node = editor.state.doc.nodeAt(pos)
      if (node && (node.type.name === 'paragraph' || node.type.name === 'heading')) {
        const newAttrs = { ...node.attrs, letterSpacing }
        tr.setNodeMarkup(pos, undefined, newAttrs)
        modified = true
      }
    } catch {
      // Position invalid
    }
  })

  if (modified) {
    editor.view.dispatch(tr)
  }

  return modified
}
