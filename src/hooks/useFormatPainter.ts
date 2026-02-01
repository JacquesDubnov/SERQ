/**
 * Format Painter Hook
 * Manages format painter logic - capture formatting from one selection, apply to another
 *
 * Hold Option key while clicking to apply format multiple times without deactivating
 */

import { useCallback, useEffect, useRef } from 'react'
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
      console.debug('[FormatPainter] Capturing format from selection')
      captureFormat(editor)
    } else {
      // If active, deactivate
      console.debug('[FormatPainter] Deactivating')
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

  // Track Option key state for repeat brushing
  const optionKeyHeldRef = useRef(false)

  // Listen for Option key to enable repeat brushing mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && active) {
        optionKeyHeldRef.current = true
        // Switch to hold mode while Option is pressed
        useStyleStore.setState({
          formatPainter: {
            ...useStyleStore.getState().formatPainter,
            mode: 'hold',
          },
        })
        console.debug('[FormatPainter] Option key held - repeat brush mode ON')
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || !e.altKey) {
        optionKeyHeldRef.current = false
        // Deactivate format painter when Option is released
        useStyleStore.setState({
          formatPainter: {
            ...useStyleStore.getState().formatPainter,
            active: false,
            mode: 'toggle',
          },
        })
        console.debug('[FormatPainter] Option key released - format painter DEACTIVATED')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [active])

  // Listen for clicks when format painter is active
  useEffect(() => {
    if (!active || !editor) {
      console.debug('[FormatPainter] Effect: not active or no editor', { active, hasEditor: !!editor })
      return
    }

    // Get fresh stored format from store
    const currentFormat = useStyleStore.getState().formatPainter.storedFormat
    console.debug('[FormatPainter] Effect running - Active and listening for clicks. Stored format:', currentFormat)

    const handleClick = (e: MouseEvent) => {
      console.debug('[FormatPainter] Click event fired on editor, optionKey:', e.altKey)

      // If Option key is held during click, temporarily set hold mode
      if (e.altKey) {
        useStyleStore.setState({
          formatPainter: {
            ...useStyleStore.getState().formatPainter,
            mode: 'hold',
          },
        })
      }

      // Get the latest stored format directly from store
      const { formatPainter: fp } = useStyleStore.getState()
      if (!fp.storedFormat) {
        console.debug('[FormatPainter] No stored format available!')
        return
      }

      // Longer delay to ensure selection is finalized after click
      setTimeout(() => {
        const { from, to } = editor.state.selection
        console.debug('[FormatPainter] After delay - Selection:', { from, to })

        if (from !== to) {
          // There's a selection - apply format
          console.debug('[FormatPainter] Applying format to existing selection')
          useStyleStore.getState().applyFormat(editor)
        } else {
          // No selection - select the word at cursor and apply
          console.debug('[FormatPainter] No selection, finding word at cursor')

          const pos = editor.state.selection.from
          const $pos = editor.state.doc.resolve(pos)

          // Find word boundaries in parent text
          if ($pos.parent.isTextblock && $pos.parent.textContent) {
            const text = $pos.parent.textContent
            const offset = $pos.parentOffset
            console.debug('[FormatPainter] Parent text:', text, 'offset:', offset)

            // Find word boundaries
            let wordStart = offset
            while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
              wordStart--
            }

            let wordEnd = offset
            while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
              wordEnd++
            }

            if (wordEnd > wordStart) {
              const nodeStart = $pos.start()
              const word = text.slice(wordStart, wordEnd)
              console.debug('[FormatPainter] Found word:', word, 'selecting range:', nodeStart + wordStart, 'to', nodeStart + wordEnd)

              editor
                .chain()
                .focus()
                .setTextSelection({ from: nodeStart + wordStart, to: nodeStart + wordEnd })
                .run()

              // Apply format after selection is set
              setTimeout(() => {
                console.debug('[FormatPainter] Applying format to word')
                useStyleStore.getState().applyFormat(editor)
              }, 20)
            } else {
              console.debug('[FormatPainter] No word found at cursor position')
            }
          } else {
            console.debug('[FormatPainter] Parent is not textblock or has no content')
          }
        }
      }, 100) // Increased delay for selection to stabilize
    }

    const editorElement = editor.view.dom
    console.debug('[FormatPainter] Attaching click listener to:', editorElement)
    editorElement.addEventListener('click', handleClick)

    return () => {
      console.debug('[FormatPainter] Removing click listener')
      editorElement.removeEventListener('click', handleClick)
    }
  }, [active, editor])

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
