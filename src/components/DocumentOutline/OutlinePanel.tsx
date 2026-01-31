/**
 * Document Outline Panel
 * Displays heading hierarchy from document with click-to-navigate
 * Mirrors StylePanel slide-in pattern from left side
 */

import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore, type OutlineAnchor } from '../../stores/editorStore'
import type { Editor } from '@tiptap/core'

interface InterfaceColors {
  bg: string
  bgSurface: string
  border: string
  textPrimary: string
  textSecondary: string
  textMuted: string
}

interface OutlinePanelProps {
  isOpen: boolean
  onClose: () => void
  editor: Editor | null
  interfaceColors: InterfaceColors
}

/**
 * Get indentation based on heading level
 * H1 = 0, H2 = 16px, H3 = 32px, H4 = 48px, H5 = 64px, H6 = 80px
 */
function getLevelIndent(level: number): number {
  return (level - 1) * 16
}

export function OutlinePanel({ isOpen, onClose, editor, interfaceColors }: OutlinePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const outlineAnchors = useEditorStore((state) => state.outlineAnchors)

  // Navigate to heading position
  const handleNavigate = useCallback(
    (anchor: OutlineAnchor) => {
      if (!editor) return

      // Focus editor and scroll to position
      editor.chain().focus().setTextSelection(anchor.pos).run()

      // Scroll the heading into view
      const headingNode = editor.view.nodeDOM(anchor.pos)
      if (headingNode instanceof HTMLElement) {
        headingNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    [editor]
  )

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="fixed left-0 top-0 bottom-0 flex flex-col z-40"
      style={{
        width: '280px',
        backgroundColor: interfaceColors.bg,
        borderRight: `1px solid ${interfaceColors.border}`,
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          padding: '15px',
          backgroundColor: interfaceColors.bgSurface,
          borderBottom: `1px solid ${interfaceColors.border}`,
        }}
      >
        <h2 className="font-semibold text-sm" style={{ color: interfaceColors.textPrimary }}>
          Document Outline
        </h2>
        <span className="text-xs" style={{ color: interfaceColors.textMuted }}>
          Esc to close
        </span>
      </div>

      {/* Scrollable outline list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '15px' }}>
        {outlineAnchors.length === 0 ? (
          <p className="text-xs" style={{ color: interfaceColors.textMuted }}>
            No headings in document. Add headings (H1, H2, H3...) to see outline.
          </p>
        ) : (
          outlineAnchors.map((anchor) => (
            <button
              key={anchor.id}
              onClick={() => handleNavigate(anchor)}
              className="w-full text-left rounded truncate transition-colors mb-1"
              style={{
                padding: '8px 12px',
                paddingLeft: `${12 + getLevelIndent(anchor.level)}px`,
                backgroundColor: anchor.isActive ? interfaceColors.bgSurface : 'transparent',
                color: anchor.isActive ? interfaceColors.textPrimary : interfaceColors.textSecondary,
                border: anchor.isActive
                  ? `1px solid ${interfaceColors.border}`
                  : '1px solid transparent',
                fontSize: anchor.level <= 2 ? '13px' : '12px',
                fontWeight: anchor.level === 1 ? 600 : 400,
              }}
              title={anchor.textContent}
            >
              <span
                className="inline-block mr-2 opacity-50"
                style={{ fontSize: '10px', minWidth: '20px' }}
              >
                H{anchor.level}
              </span>
              {anchor.textContent || 'Untitled'}
            </button>
          ))
        )}
      </div>

      {/* Footer with count */}
      <div
        className="shrink-0 text-center"
        style={{
          padding: '12px 15px',
          backgroundColor: interfaceColors.bgSurface,
          borderTop: `1px solid ${interfaceColors.border}`,
        }}
      >
        <span className="text-xs" style={{ color: interfaceColors.textMuted }}>
          {outlineAnchors.length} heading{outlineAnchors.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

export default OutlinePanel
