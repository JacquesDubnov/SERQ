/**
 * TableKeyboardNavigation Extension
 * Adds Option+Arrow keyboard shortcuts for vertical cell navigation in tables
 */

import { Extension } from '@tiptap/core'
import { EditorState, TextSelection } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'
import { TableMap } from '@tiptap/pm/tables'

/**
 * Find the table node and its position from current selection
 */
function findTable(state: EditorState) {
  const { $head } = state.selection
  for (let d = $head.depth; d > 0; d--) {
    const node = $head.node(d)
    if (node.type.name === 'table') {
      return { node, pos: $head.before(d), depth: d }
    }
  }
  return null
}

/**
 * Find the current cell and its position
 */
function findCell(state: EditorState) {
  const { $head } = state.selection
  for (let d = $head.depth; d > 0; d--) {
    const node = $head.node(d)
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      return { node, pos: $head.before(d), depth: d }
    }
  }
  return null
}

/**
 * Navigate to a cell in a specific direction within the table
 */
function navigateCell(
  direction: 'up' | 'down' | 'left' | 'right',
  state: EditorState,
  view: EditorView
): boolean {
  const table = findTable(state)
  const cell = findCell(state)

  if (!table || !cell) return false

  const tableMap = TableMap.get(table.node)
  const tableStart = table.pos + 1

  // Find current cell index in the map
  const cellPos = cell.pos - tableStart
  const cellIndex = tableMap.map.indexOf(cellPos)
  if (cellIndex === -1) return false

  const currentRow = Math.floor(cellIndex / tableMap.width)
  const currentCol = cellIndex % tableMap.width

  let targetRow = currentRow
  let targetCol = currentCol

  switch (direction) {
    case 'up':
      targetRow = currentRow - 1
      break
    case 'down':
      targetRow = currentRow + 1
      break
    case 'left':
      targetCol = currentCol - 1
      break
    case 'right':
      targetCol = currentCol + 1
      break
  }

  // Bounds check
  if (targetRow < 0 || targetRow >= tableMap.height) return false
  if (targetCol < 0 || targetCol >= tableMap.width) return false

  // Get target cell position
  const targetIndex = targetRow * tableMap.width + targetCol
  const targetCellPos = tableMap.map[targetIndex]
  const absolutePos = tableStart + targetCellPos

  // Set selection to the beginning of the target cell
  const $pos = state.doc.resolve(absolutePos + 1)
  const tr = state.tr.setSelection(TextSelection.near($pos))
  view.dispatch(tr)

  return true
}

export const TableKeyboardNavigation = Extension.create({
  name: 'tableKeyboardNavigation',

  addKeyboardShortcuts() {
    return {
      'Alt-ArrowUp': () => navigateCell('up', this.editor.state, this.editor.view),
      'Alt-ArrowDown': () => navigateCell('down', this.editor.state, this.editor.view),
      'Alt-ArrowLeft': () => navigateCell('left', this.editor.state, this.editor.view),
      'Alt-ArrowRight': () => navigateCell('right', this.editor.state, this.editor.view),
    }
  },
})
