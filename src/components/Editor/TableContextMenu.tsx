/**
 * TableContextMenu Component
 * Right-click context menu for table cell operations
 */

import { useEffect, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import type { Selection } from '@tiptap/pm/state'

interface SelectionInfo {
  cellCount: number
  rowCount: number
  colCount: number
}

interface TableContextMenuProps {
  editor: Editor
  position: { x: number; y: number }
  selectionInfo: SelectionInfo
  savedSelection: Selection
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

export function TableContextMenu({ editor, position, selectionInfo, savedSelection, onClose }: TableContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Helper to restore selection before executing commands
  const restoreSelection = useCallback(() => {
    // First restore the selection
    const tr = editor.state.tr.setSelection(savedSelection)
    editor.view.dispatch(tr)
    // Then focus the editor to ensure commands work
    editor.view.focus()
  }, [editor, savedSelection])

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
  const canMerge = selectionInfo.cellCount > 1
  const canSplit = editor.can().splitCell()

  // Row operations
  const addRowAbove = useCallback(() => {
    restoreSelection()
    editor.chain().focus().addRowBefore().run()
    onClose()
  }, [editor, onClose, restoreSelection])

  const addRowBelow = useCallback(() => {
    restoreSelection()
    editor.chain().focus().addRowAfter().run()
    onClose()
  }, [editor, onClose, restoreSelection])

  const deleteRow = useCallback(() => {
    restoreSelection()
    editor.chain().focus().deleteRow().run()
    onClose()
  }, [editor, onClose, restoreSelection])

  // Column operations
  const addColumnLeft = useCallback(() => {
    restoreSelection()
    editor.chain().focus().addColumnBefore().run()
    onClose()
  }, [editor, onClose, restoreSelection])

  const addColumnRight = useCallback(() => {
    restoreSelection()
    editor.chain().focus().addColumnAfter().run()
    onClose()
  }, [editor, onClose, restoreSelection])

  const deleteColumn = useCallback(() => {
    restoreSelection()
    editor.chain().focus().deleteColumn().run()
    onClose()
  }, [editor, onClose, restoreSelection])

  // Cell operations
  const mergeCells = useCallback(() => {
    restoreSelection()
    editor.chain().focus().mergeCells().run()
    onClose()
  }, [editor, onClose, restoreSelection])

  const splitCell = useCallback(() => {
    restoreSelection()
    editor.chain().focus().splitCell().run()
    onClose()
  }, [editor, onClose, restoreSelection])

  // Header operations
  const toggleHeaderRow = useCallback(() => {
    restoreSelection()
    editor.chain().focus().toggleHeaderRow().run()
    onClose()
  }, [editor, onClose, restoreSelection])

  // Background color
  const setCellBackground = useCallback((color: string) => {
    restoreSelection()
    if (color === 'transparent') {
      // Remove background by setting to transparent
      editor.chain().focus().setCellAttribute('backgroundColor', null).run()
    } else {
      editor.chain().focus().setCellAttribute('backgroundColor', color).run()
    }
    onClose()
  }, [editor, onClose, restoreSelection])

  // Delete table
  const deleteTable = useCallback(() => {
    restoreSelection()
    editor.chain().focus().deleteTable().run()
    onClose()
  }, [editor, onClose, restoreSelection])

  return (
    <div
      ref={menuRef}
      className="table-context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Header - moved to top */}
      <div className="table-context-menu-section">
        <button className="table-context-menu-item" onClick={toggleHeaderRow} onMouseDown={(e) => e.preventDefault()}>
          <span className="table-context-menu-item-icon">H</span>
          Toggle header row
        </button>
      </div>

      {/* Row Operations */}
      <div className="table-context-menu-section">
        <div className="table-context-menu-label">Row</div>
        <button className="table-context-menu-item" onClick={addRowAbove} onMouseDown={(e) => e.preventDefault()}>
          <span className="table-context-menu-item-icon">+</span>
          Insert row above
        </button>
        <button className="table-context-menu-item" onClick={addRowBelow} onMouseDown={(e) => e.preventDefault()}>
          <span className="table-context-menu-item-icon">+</span>
          Insert row below
        </button>
        <button className="table-context-menu-item" onClick={deleteRow} onMouseDown={(e) => e.preventDefault()}>
          <span className="table-context-menu-item-icon">-</span>
          {selectionInfo.rowCount > 1 ? `Delete ${selectionInfo.rowCount} rows` : 'Delete row'}
        </button>
      </div>

      {/* Column Operations */}
      <div className="table-context-menu-section">
        <div className="table-context-menu-label">Column</div>
        <button className="table-context-menu-item" onClick={addColumnLeft} onMouseDown={(e) => e.preventDefault()}>
          <span className="table-context-menu-item-icon">+</span>
          Insert column left
        </button>
        <button className="table-context-menu-item" onClick={addColumnRight} onMouseDown={(e) => e.preventDefault()}>
          <span className="table-context-menu-item-icon">+</span>
          Insert column right
        </button>
        <button className="table-context-menu-item" onClick={deleteColumn} onMouseDown={(e) => e.preventDefault()}>
          <span className="table-context-menu-item-icon">-</span>
          {selectionInfo.colCount > 1 ? `Delete ${selectionInfo.colCount} columns` : 'Delete column'}
        </button>
      </div>

      {/* Cell Operations */}
      <div className="table-context-menu-section">
        <div className="table-context-menu-label">Cell</div>
        <button
          className="table-context-menu-item"
          onClick={mergeCells}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!canMerge}
        >
          <span className="table-context-menu-item-icon">M</span>
          {selectionInfo.cellCount > 1 ? `Merge ${selectionInfo.cellCount} cells` : 'Merge cells'}
        </button>
        <button
          className="table-context-menu-item"
          onClick={splitCell}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!canSplit}
        >
          <span className="table-context-menu-item-icon">S</span>
          Split cell
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
          onMouseDown={(e) => e.preventDefault()}
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
