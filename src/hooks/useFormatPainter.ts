/**
 * Format Painter Hook
 * Manages format painter logic - capture formatting from one selection, apply to another
 */

import { useCallback, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { useStyleStore } from '../stores/styleStore'

export interface UseFormatPainterReturn {
  isActive: boolean
  mode: 'toggle' | 'hold'
  hasStoredFormat: boolean

  // Actions
  captureAndActivate: () => void
  applyToSelection: () => void
  toggle: () => void
  deactivate: () => void

  // For keyboard hold mode
  startHold: () => void
  endHold: () => void
}

export function useFormatPainter(
  editor: Editor | null
): UseFormatPainterReturn {
  const {
    formatPainter,
    captureFormat,
    applyFormat,
    deactivateFormatPainter,
  } = useStyleStore()

  const { active, mode, storedFormat } = formatPainter

  // Capture current selection's format and activate painter
  const captureAndActivate = useCallback(() => {
    if (!editor) return
    captureFormat(editor)
  }, [editor, captureFormat])

  // Apply stored format to current selection
  const applyToSelection = useCallback(() => {
    if (!editor || !storedFormat) return
    applyFormat(editor)
  }, [editor, applyFormat, storedFormat])

  // Toggle active state
  const toggle = useCallback(() => {
    if (!editor) return

    if (!active) {
      // If not active, capture and activate
      captureFormat(editor)
    } else {
      // If active, deactivate
      deactivateFormatPainter()
    }
  }, [editor, active, captureFormat, deactivateFormatPainter])

  // Deactivate painter
  const deactivate = useCallback(() => {
    deactivateFormatPainter()
  }, [deactivateFormatPainter])

  // Start hold mode (for Cmd+Shift held)
  const startHold = useCallback(() => {
    if (!editor) return
    captureFormat(editor)
    useStyleStore.setState({
      formatPainter: {
        ...useStyleStore.getState().formatPainter,
        mode: 'hold',
      },
    })
  }, [editor, captureFormat])

  // End hold mode
  const endHold = useCallback(() => {
    useStyleStore.setState({
      formatPainter: {
        ...useStyleStore.getState().formatPainter,
        active: false,
        mode: 'toggle',
      },
    })
  }, [])

  // Apply format painter cursor when active
  useEffect(() => {
    if (active) {
      document.body.classList.add('format-painter-active')
    } else {
      document.body.classList.remove('format-painter-active')
    }

    return () => {
      document.body.classList.remove('format-painter-active')
    }
  }, [active])

  // Listen for clicks when format painter is active (toggle mode applies on click)
  useEffect(() => {
    if (!active || !editor || mode !== 'toggle') return

    const handleClick = () => {
      // Small delay to let selection update
      setTimeout(() => {
        const { from, to } = editor.state.selection
        // Only apply if there's an actual selection
        if (from !== to) {
          applyFormat(editor)
        }
      }, 10)
    }

    // Listen on the editor's DOM element
    const editorElement = editor.view.dom
    editorElement.addEventListener('mouseup', handleClick)

    return () => {
      editorElement.removeEventListener('mouseup', handleClick)
    }
  }, [active, editor, mode, applyFormat])

  return {
    isActive: active,
    mode,
    hasStoredFormat: storedFormat !== null,
    captureAndActivate,
    applyToSelection,
    toggle,
    deactivate,
    startHold,
    endHold,
  }
}

export default useFormatPainter
