/**
 * ColumnContextMenu - Context menu for column section management
 * Provides column count, borders toggle, and delete options
 */
import { useEffect, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/core'

interface ColumnContextMenuProps {
  position: { x: number; y: number }
  editor: Editor
  nodePos: number
  currentColumnCount: number
  showBorders: boolean
  onClose: () => void
}

const COLUMN_OPTIONS = [2, 3, 4, 5, 6]

export function ColumnContextMenu({
  position,
  editor,
  nodePos,
  currentColumnCount,
  showBorders,
  onClose,
}: ColumnContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Delay to prevent immediate close from the triggering click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Adjust position to stay within viewport
  const adjustedPosition = useCallback(() => {
    const menuWidth = 200
    const menuHeight = 320
    const padding = 8

    let x = position.x
    let y = position.y

    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding
    }
    if (x < padding) {
      x = padding
    }

    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding
    }
    if (y < padding) {
      y = padding
    }

    return { x, y }
  }, [position])

  const { x, y } = adjustedPosition()

  const handleColumnCountChange = (count: number) => {
    if (count === currentColumnCount) {
      onClose()
      return
    }

    // Get the current column section node
    const { tr } = editor.state
    const node = tr.doc.nodeAt(nodePos)
    if (!node || node.type.name !== 'columnSection') {
      onClose()
      return
    }

    // Extract content from existing columns
    const existingContent: any[][] = []
    node.forEach((column) => {
      const content: any[] = []
      column.forEach((child) => {
        content.push(child.toJSON())
      })
      existingContent.push(content)
    })

    // Create new columns with redistributed content
    const newColumns = []
    for (let i = 0; i < count; i++) {
      const columnContent = existingContent[i] || [{ type: 'paragraph' }]
      newColumns.push({
        type: 'column',
        content: columnContent.length > 0 ? columnContent : [{ type: 'paragraph' }],
      })
    }

    // If reducing columns, merge extra content into the last column
    if (count < currentColumnCount) {
      const lastColumnContent = [...newColumns[count - 1].content]
      for (let i = count; i < existingContent.length; i++) {
        lastColumnContent.push(...existingContent[i])
      }
      newColumns[count - 1].content = lastColumnContent
    }

    // Calculate new widths (equal distribution)
    const newWidths = Array(count).fill(1)

    // Replace the node
    const newNode = {
      type: 'columnSection',
      attrs: {
        ...node.attrs,
        columnCount: count,
        columnWidths: newWidths,
      },
      content: newColumns,
    }

    editor.commands.command(({ tr, dispatch }) => {
      if (dispatch) {
        tr.replaceWith(nodePos, nodePos + node.nodeSize, editor.schema.nodeFromJSON(newNode))
        dispatch(tr)
      }
      return true
    })

    onClose()
  }

  const handleToggleBorders = () => {
    const { tr } = editor.state
    const node = tr.doc.nodeAt(nodePos)
    if (!node || node.type.name !== 'columnSection') {
      onClose()
      return
    }

    editor.commands.command(({ tr, dispatch }) => {
      if (dispatch) {
        tr.setNodeMarkup(nodePos, undefined, {
          ...node.attrs,
          showBorders: !showBorders,
        })
        dispatch(tr)
      }
      return true
    })

    onClose()
  }

  const handleDelete = () => {
    const { tr } = editor.state
    const node = tr.doc.nodeAt(nodePos)
    if (!node || node.type.name !== 'columnSection') {
      onClose()
      return
    }

    editor.commands.command(({ tr, dispatch }) => {
      if (dispatch) {
        // Replace with a single paragraph to avoid empty gap
        const paragraph = editor.schema.nodes.paragraph.create()
        tr.replaceWith(nodePos, nodePos + node.nodeSize, paragraph)
        dispatch(tr)
      }
      return true
    })

    onClose()
  }

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.5rem',
    fontSize: '0.875rem',
    textAlign: 'left' as const,
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'var(--text-primary, #1f2937)',
  }

  const activeButtonStyle = {
    ...buttonStyle,
    background: 'var(--bg-hover, #f3f4f6)',
  }

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary, #6b7280)',
    padding: '0.25rem 0.5rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }

  const dividerStyle = {
    height: '1px',
    backgroundColor: 'var(--border-color, #e5e7eb)',
    margin: '0.5rem 0',
  }

  return (
    <div
      ref={menuRef}
      className="column-context-menu"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 1000,
        backgroundColor: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-color, #e5e7eb)',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        padding: '0.5rem',
        minWidth: '180px',
      }}
    >
      {/* Section: Column Count */}
      <div className="column-context-menu-section">
        <div style={labelStyle}>Columns</div>
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem 0.5rem' }}>
          {COLUMN_OPTIONS.map((count) => (
            <button
              key={count}
              onClick={() => handleColumnCountChange(count)}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: currentColumnCount === count ? 600 : 400,
                background: currentColumnCount === count ? 'var(--color-primary, #3b82f6)' : 'var(--bg-hover, #f3f4f6)',
                color: currentColumnCount === count ? '#ffffff' : 'var(--text-primary, #1f2937)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (currentColumnCount !== count) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-active, #e5e7eb)'
                }
              }}
              onMouseLeave={(e) => {
                if (currentColumnCount !== count) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f3f4f6)'
                }
              }}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div style={dividerStyle} />

      {/* Section: Options */}
      <div className="column-context-menu-section">
        <div style={labelStyle}>Options</div>
        <button
          onClick={handleToggleBorders}
          style={showBorders ? activeButtonStyle : buttonStyle}
          onMouseEnter={(e) => {
            if (!showBorders) {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f3f4f6)'
            }
          }}
          onMouseLeave={(e) => {
            if (!showBorders) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray={showBorders ? '0' : '4 2'} />
          </svg>
          <span>Show Borders</span>
          {showBorders && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ marginLeft: 'auto' }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      </div>

      <div style={dividerStyle} />

      {/* Section: Delete */}
      <div className="column-context-menu-section">
        <button
          onClick={handleDelete}
          style={{
            ...buttonStyle,
            color: 'var(--color-danger, #ef4444)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          <span>Delete Columns</span>
        </button>
      </div>
    </div>
  )
}

export default ColumnContextMenu
