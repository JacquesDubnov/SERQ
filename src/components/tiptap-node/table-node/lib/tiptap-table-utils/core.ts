import type { Editor } from "@tiptap/react"
import type { Node } from "@tiptap/pm/model"
import type { EditorState } from "@tiptap/pm/state"
import type { Rect } from "@tiptap/pm/tables"
import {
  TableMap,
  CellSelection,
  findTable,
  selectedRect,
  cellAround,
  selectionCell,
} from "@tiptap/pm/tables"

import type { Orientation, CellInfo, TableInfo } from "./types.js"

/**
 * Validates if row/col indices are within table bounds
 */
export function isWithinBounds(
  row: number,
  col: number,
  map: TableMap
): boolean {
  return row >= 0 && row < map.height && col >= 0 && col < map.width
}

/**
 * Resolves the index for a row or column based on current selection or provided value
 */
export function resolveOrientationIndex(
  state: EditorState,
  table: TableInfo,
  orientation: Orientation,
  providedIndex?: number
): number | null {
  if (typeof providedIndex === "number") {
    return providedIndex
  }

  if (state.selection instanceof CellSelection) {
    const rect = selectedRect(state)
    return orientation === "row" ? rect.top : rect.left
  }

  const $cell = cellAround(state.selection.$anchor) ?? selectionCell(state)
  if (!$cell) return null

  const rel = $cell.pos - table.start
  const rect = table.map.findCell(rel)
  return orientation === "row" ? rect.top : rect.left
}

/**
 * Creates a CellInfo object from position data
 */
export function createCellInfo(
  row: number,
  column: number,
  cellPos: number,
  cellNode: Node
): CellInfo {
  return {
    row,
    column,
    pos: cellPos,
    node: cellNode,
    start: cellPos + 1,
    depth: cellNode ? cellNode.content.size : 0,
  }
}

/**
 * Get information about the table at the current selection or a specific position.
 *
 * If `tablePos` is provided, it looks for a table at that exact position.
 * Otherwise, it finds the nearest table containing the current selection.
 *
 * Returns an object with:
 * - `node`: the table node
 * - `pos`: the position of the table in the document
 * - `start`: the position just after the table node (where its content starts)
 * - `map`: the `TableMap` for layout info (rows, columns, spans)
 *
 * If no table is found, returns null.
 */
export function getTable(editor: Editor | null, tablePos?: number) {
  if (!editor) return null

  let table = null

  if (typeof tablePos === "number") {
    const tableNode = editor.state.doc.nodeAt(tablePos)
    if (tableNode?.type.name === "table") {
      table = {
        node: tableNode,
        pos: tablePos,
        start: tablePos + 1,
        depth: editor.state.doc.resolve(tablePos).depth,
      }
    }
  }

  if (!table) {
    const { state } = editor
    const $from = state.doc.resolve(state.selection.from)
    table = findTable($from)
  }

  if (!table) return null

  const tableMap = TableMap.get(table.node)
  if (!tableMap) return null

  return { ...table, map: tableMap }
}

/**
 * Checks if the current text selection is inside a table cell.
 * @param state - The editor state to check
 * @returns true if the selection is inside a table cell; false otherwise
 */
export function isSelectionInCell(state: EditorState): boolean {
  const { selection } = state
  const $from = selection.$from

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth)
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      return true
    }
  }

  return false
}

/**
 * Cells overlap a rectangle if any of the cells in the rectangle are merged
 * with cells outside the rectangle.
 */
export function cellsOverlapRectangle(
  { width, height, map }: TableMap,
  rect: Rect
) {
  let indexTop = rect.top * width + rect.left,
    indexLeft = indexTop
  let indexBottom = (rect.bottom - 1) * width + rect.left,
    indexRight = indexTop + (rect.right - rect.left - 1)
  for (let i = rect.top; i < rect.bottom; i++) {
    if (
      (rect.left > 0 && map[indexLeft] == map[indexLeft - 1]) ||
      (rect.right < width && map[indexRight] == map[indexRight + 1])
    )
      return true
    indexLeft += width
    indexRight += width
  }
  for (let i = rect.left; i < rect.right; i++) {
    if (
      (rect.top > 0 && map[indexTop] == map[indexTop - width]) ||
      (rect.bottom < height && map[indexBottom] == map[indexBottom + width])
    )
      return true
    indexTop++
    indexBottom++
  }
  return false
}

/**
 * Determine if the current selection is a full row or column selection.
 *
 * If the selection is a `CellSelection` that spans an entire row or column,
 * returns an object indicating the type and index:
 * - `{ type: "row", index: number }` for full row selections
 * - `{ type: "column", index: number }` for full column selections
 *
 * If the selection is not a full row/column, or if no table is found, returns null.
 */
export function getTableSelectionType(
  editor: Editor | null,
  index?: number,
  orientation?: Orientation,
  tablePos?: number
): { orientation: Orientation; index: number } | null {
  if (typeof index === "number" && orientation) {
    return { orientation, index }
  }

  if (!editor) return null

  const { state } = editor

  const table = getTable(editor, tablePos)
  if (!table) return null

  if (state.selection instanceof CellSelection) {
    const rect = selectedRect(state)
    const width = rect.right - rect.left
    const height = rect.bottom - rect.top

    if (height === 1 && width >= 1) {
      return { orientation: "row", index: rect.top }
    }

    if (width === 1 && height >= 1) {
      return { orientation: "column", index: rect.left }
    }

    return null
  }

  return null
}

/**
 * Checks if a node is a table node
 */
export function isTableNode(node: Node | null | undefined): node is Node {
  return (
    !!node &&
    (node.type.name === "table" || node.type.spec.tableRole === "table")
  )
}
