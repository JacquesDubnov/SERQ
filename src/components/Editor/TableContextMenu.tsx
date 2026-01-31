/**
 * TableContextMenu Component
 * Right-click context menu for table cell operations
 */

import { useEffect, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/core'

interface TableContextMenuProps {
  editor: Editor
  position: { x: number; y: number }
  onClose: () => void
}

// Color presets for cell background (8 colors per CONTEXT spec)
const CELL_COLORS = [
  { id: 'none', color: 'transparent', label: 'None' },
  { id: 'gray', color: '#f3f4f6', label: 'Gray' },
  { id: 'red', color: '#fecaca', label: 'Red' },
  { id: 'orange', color: '#fed7aa', label: 'Orange' },
  { id: 'yellow', color: '#fef08a', label: 'Yellow' },
  { id: 'green', color: '#bbf7d0', label: 'Green' },
  { id: 'blue', color: '#bfdbfe', label: 'Blue' },
  { id: 'purple', color: '#e9d5ff', label: 'Purple' },
]

export function TableContextMenu({ editor, position, onClose }: TableContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Delay to prevent immediate close from the right-click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    document.addEventListener('keydown', handleEscape)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = position.x
      let adjustedY = position.y

      if (position.x + rect.width > viewportWidth - 20) {
        adjustedX = viewportWidth - rect.width - 20
      }
      if (position.y + rect.height > viewportHeight - 20) {
        adjustedY = viewportHeight - rect.height - 20
      }

      menuRef.current.style.left = `${adjustedX}px`
      menuRef.current.style.top = `${adjustedY}px`
    }
  }, [position])

  // Check if multiple cells are selected (for merge option)
  const canMerge = editor.can().mergeCells()
  const canSplit = editor.can().splitCell()

  // Row operations
  const addRowAbove = useCallback(() => {
    editor.chain().focus().addRowBefore().run()
    onClose()
  }, [editor, onClose])

  const addRowBelow = useCallback(() => {
    editor.chain().focus().addRowAfter().run()
    onClose()
  }, [editor, onClose])

  const deleteRow = useCallback(() => {
    editor.chain().focus().deleteRow().run()
    onClose()
  }, [editor, onClose])

  // Column operations
  const addColumnLeft = useCallback(() => {
    editor.chain().focus().addColumnBefore().run()
    onClose()
  }, [editor, onClose])

  const addColumnRight = useCallback(() => {
    editor.chain().focus().addColumnAfter().run()
    onClose()
  }, [editor, onClose])

  const deleteColumn = useCallback(() => {
    editor.chain().focus().deleteColumn().run()
    onClose()
  }, [editor, onClose])

  // Cell operations
  const mergeCells = useCallback(() => {
    editor.chain().focus().mergeCells().run()
    onClose()
  }, [editor, onClose])

  const splitCell = useCallback(() => {
    editor.chain().focus().splitCell().run()
    onClose()
  }, [editor, onClose])

  // Header operations
  const toggleHeaderRow = useCallback(() => {
    editor.chain().focus().toggleHeaderRow().run()
    onClose()
  }, [editor, onClose])

  // Background color
  const setCellBackground = useCallback((color: string) => {
    if (color === 'transparent') {
      // Remove background by setting to transparent
      editor.chain().focus().setCellAttribute('backgroundColor', null).run()
    } else {
      editor.chain().focus().setCellAttribute('backgroundColor', color).run()
    }
    onClose()
  }, [editor, onClose])

  // Delete table
  const deleteTable = useCallback(() => {
    editor.chain().focus().deleteTable().run()
    onClose()
  }, [editor, onClose])

  return (
    <div
      ref={menuRef}
      className="table-context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Row Operations */}
      <div className="table-context-menu-section">
        <div className="table-context-menu-label">Row</div>
        <button className="table-context-menu-item" onClick={addRowAbove}>
          <span className="table-context-menu-item-icon">+</span>
          Insert row above
        </button>
        <button className="table-context-menu-item" onClick={addRowBelow}>
          <span className="table-context-menu-item-icon">+</span>
          Insert row below
        </button>
        <button className="table-context-menu-item" onClick={deleteRow}>
          <span className="table-context-menu-item-icon">-</span>
          Delete row
        </button>
      </div>

      {/* Column Operations */}
      <div className="table-context-menu-section">
        <div className="table-context-menu-label">Column</div>
        <button className="table-context-menu-item" onClick={addColumnLeft}>
          <span className="table-context-menu-item-icon">+</span>
          Insert column left
        </button>
        <button className="table-context-menu-item" onClick={addColumnRight}>
          <span className="table-context-menu-item-icon">+</span>
          Insert column right
        </button>
        <button className="table-context-menu-item" onClick={deleteColumn}>
          <span className="table-context-menu-item-icon">-</span>
          Delete column
        </button>
      </div>

      {/* Cell Operations */}
      <div className="table-context-menu-section">
        <div className="table-context-menu-label">Cell</div>
        <button
          className="table-context-menu-item"
          onClick={mergeCells}
          disabled={!canMerge}
        >
          <span className="table-context-menu-item-icon">M</span>
          Merge cells
        </button>
        <button
          className="table-context-menu-item"
          onClick={splitCell}
          disabled={!canSplit}
        >
          <span className="table-context-menu-item-icon">S</span>
          Split cell
        </button>
      </div>

      {/* Header */}
      <div className="table-context-menu-section">
        <button className="table-context-menu-item" onClick={toggleHeaderRow}>
          <span className="table-context-menu-item-icon">H</span>
          Toggle header row
        </button>
      </div>

      {/* Background Color */}
      <div className="table-context-menu-section">
        <div className="table-context-menu-label">Background</div>
        <div className="table-context-menu-colors">
          {CELL_COLORS.map((c) => (
            <button
              key={c.id}
              className="table-context-menu-color-btn"
              title={c.label}
              onClick={() => setCellBackground(c.color)}
              style={{
                backgroundColor: c.color === 'transparent' ? '#ffffff' : c.color,
                backgroundImage: c.color === 'transparent'
                  ? 'linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%)'
                  : 'none',
                backgroundSize: c.color === 'transparent' ? '8px 8px' : 'auto',
                backgroundPosition: c.color === 'transparent' ? '0 0, 4px 4px' : 'initial',
              }}
            />
          ))}
        </div>
      </div>

      {/* Delete Table */}
      <div className="table-context-menu-section">
        <button
          className="table-context-menu-item"
          onClick={deleteTable}
          style={{ color: '#dc2626' }}
        >
          <span className="table-context-menu-item-icon">X</span>
          Delete table
        </button>
      </div>
    </div>
  )
}

export default TableContextMenu
