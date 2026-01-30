/**
 * Format Painter Toolbar Button Component
 * Allows copying formatting from one selection and applying to another
 */

import { useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useFormatPainter } from '../../hooks/useFormatPainter'

interface FormatPainterProps {
  editor: Editor
}

export function FormatPainter({ editor }: FormatPainterProps) {
  const {
    isActive,
    hasStoredFormat,
    toggle,
    deactivate,
    startHold,
    endHold,
  } = useFormatPainter(editor)

  // Keyboard shortcut: Cmd+Shift+C to toggle format painter
  useHotkeys(
    'meta+shift+c, ctrl+shift+c',
    (e) => {
      e.preventDefault()
      toggle()
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
    }
  )

  // Handle hold mode with modifier keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift held while format painter not already active
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && !isActive) {
        // Start hold mode on next action
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // If format painter is in hold mode and modifiers released, deactivate
      if (isActive && (!e.metaKey && !e.ctrlKey)) {
        endHold()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isActive, startHold, endHold])

  // Escape to deactivate
  useHotkeys(
    'escape',
    () => {
      if (isActive) {
        deactivate()
      }
    },
    {
      enableOnContentEditable: true,
    },
    [isActive, deactivate]
  )

  return (
    <button
      onClick={toggle}
      title={`Format Painter (Cmd+Shift+C)${isActive ? ' - Click text to apply' : ''}`}
      className={`
        px-2 py-1.5 rounded text-sm font-medium transition-colors relative
        ${
          isActive
            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400'
            : 'text-gray-600 hover:bg-gray-100'
        }
      `}
    >
      {/* Paintbrush icon */}
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>

      {/* Active indicator dot */}
      {isActive && hasStoredFormat && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
    </button>
  )
}

export default FormatPainter
