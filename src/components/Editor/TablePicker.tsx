/**
 * TablePicker Component
 * Grid-based dimension picker for inserting tables (like Word/Notion)
 */

import { useState, useCallback, useRef, useEffect } from 'react'

interface TablePickerProps {
  onSelect: (rows: number, cols: number) => void
  onClose: () => void
}

const MAX_COLS = 8
const MAX_ROWS = 6

export function TablePicker({ onSelect, onClose }: TablePickerProps) {
  const [hoveredCol, setHoveredCol] = useState(3) // Default 3 cols
  const [hoveredRow, setHoveredRow] = useState(4) // Default 4 rows
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Delay to prevent immediate close from the button click
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

  const handleCellHover = useCallback((row: number, col: number) => {
    setHoveredRow(row)
    setHoveredCol(col)
  }, [])

  const handleSelect = useCallback(() => {
    onSelect(hoveredRow, hoveredCol)
    onClose()
  }, [hoveredRow, hoveredCol, onSelect, onClose])

  return (
    <div
      ref={pickerRef}
      className="table-picker"
      style={{
        position: 'absolute',
        top: '100%',
        left: '0',
        marginTop: '4px',
        backgroundColor: 'var(--color-bg, #ffffff)',
        border: '1px solid var(--color-border, #e5e7eb)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        padding: '12px',
        zIndex: 1000,
      }}
    >
      {/* Grid of cells */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${MAX_COLS}, 20px)`,
          gridTemplateRows: `repeat(${MAX_ROWS}, 20px)`,
          gap: '2px',
        }}
      >
        {Array.from({ length: MAX_ROWS * MAX_COLS }).map((_, index) => {
          const row = Math.floor(index / MAX_COLS) + 1
          const col = (index % MAX_COLS) + 1
          const isHighlighted = row <= hoveredRow && col <= hoveredCol

          return (
            <div
              key={index}
              onMouseEnter={() => handleCellHover(row, col)}
              onClick={handleSelect}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '2px',
                border: '1px solid var(--color-border, #e5e7eb)',
                backgroundColor: isHighlighted
                  ? 'var(--color-accent, #2563eb)'
                  : 'transparent',
                opacity: isHighlighted ? 0.3 : 1,
                cursor: 'pointer',
                transition: 'background-color 0.05s ease',
              }}
            />
          )
        })}
      </div>

      {/* Dimension label */}
      <div
        style={{
          marginTop: '8px',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary, #6b7280)',
          fontWeight: 500,
        }}
      >
        {hoveredCol} x {hoveredRow}
      </div>
    </div>
  )
}

export default TablePicker
