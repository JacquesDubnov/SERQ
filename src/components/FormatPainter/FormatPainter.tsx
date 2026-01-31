/**
 * Format Painter Toolbar Button Component
 * Click to capture formatting from selection, click text to apply
 * Uses useFormatPainter hook which handles click-to-apply logic
 */

import { Editor } from '@tiptap/react'
import { useFormatPainter } from '../../hooks/useFormatPainter'

interface InterfaceColors {
  bg: string
  bgSurface: string
  border: string
  textPrimary: string
  textSecondary: string
}

interface FormatPainterProps {
  editor: Editor
  colors: InterfaceColors
}

export function FormatPainter({ editor, colors }: FormatPainterProps) {
  // Use the hook - this attaches click listeners when active
  const { isActive, hasStoredFormat, toggle } = useFormatPainter(editor)

  const handleClick = () => {
    console.debug('[FormatPainter] Button clicked, toggling')
    toggle()
  }

  return (
    <button
      onMouseDown={(e) => e.preventDefault()} // Prevent focus steal
      onClick={handleClick}
      title={`Format Painter${isActive ? ' - Click text to apply' : ''}`}
      className="px-2 py-1.5 rounded text-sm font-medium transition-colors relative"
      style={{
        backgroundColor: isActive ? colors.bgSurface : 'transparent',
        color: isActive ? colors.textPrimary : colors.textSecondary,
        boxShadow: isActive ? '0 0 0 2px #3b82f6' : 'none',
      }}
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
