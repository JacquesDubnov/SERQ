/**
 * ColumnControls - Floating bar above column block on hover
 *
 * Shows add/remove column buttons and preset options.
 * Rendered inside ColumnBlockView, positioned absolutely above the grid.
 */

import { useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import './column-controls.css'

interface ColumnControlsProps {
  editor: Editor
  columnCount: number
}

export function ColumnControls({ editor, columnCount }: ColumnControlsProps) {
  const handleSetColumns = useCallback(
    (count: 2 | 3 | 4) => {
      // If we're changing column count, we need to add/remove columns
      if (count > columnCount) {
        // Add columns
        for (let i = columnCount; i < count; i++) {
          editor.commands.addColumn()
        }
      } else if (count < columnCount) {
        // Remove from the end
        for (let i = columnCount; i > count; i--) {
          editor.commands.removeColumn(i - 1)
        }
      }
    },
    [editor, columnCount],
  )

  const handleAddColumn = useCallback(() => {
    editor.commands.addColumn()
  }, [editor])

  const handleEqualWidths = useCallback(() => {
    const base = Math.floor((1 / columnCount) * 10000) / 10000
    const widths = Array(columnCount).fill(base)
    widths[columnCount - 1] = +(1 - base * (columnCount - 1)).toFixed(4)
    editor.commands.setColumnWidths(widths)
  }, [editor, columnCount])

  const handleRemoveColumns = useCallback(() => {
    editor.commands.unsetColumns()
  }, [editor])

  return (
    <div className="column-controls" contentEditable={false}>
      {columnCount < 4 && (
        <button
          className="column-controls-btn"
          onClick={handleAddColumn}
          title="Add column"
        >
          +
        </button>
      )}
      <span className="column-controls-sep" />
      {([2, 3, 4] as const).map((n) => (
        <button
          key={n}
          className="column-controls-btn"
          data-active={columnCount === n ? 'true' : 'false'}
          onClick={() => handleSetColumns(n)}
          title={`${n} columns`}
        >
          {n}
        </button>
      ))}
      <span className="column-controls-sep" />
      <button
        className="column-controls-btn"
        onClick={handleEqualWidths}
        title="Equal widths"
      >
        =
      </button>
      <span className="column-controls-sep" />
      <button
        className="column-controls-btn column-controls-btn-danger"
        onClick={handleRemoveColumns}
        title="Remove columns"
      >
        x
      </button>
    </div>
  )
}
