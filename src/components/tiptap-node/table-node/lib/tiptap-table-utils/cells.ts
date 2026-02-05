import type { Editor } from "@tiptap/react"
import type { Node } from "@tiptap/pm/model"
import { CellSelection } from "@tiptap/pm/tables"

import type { Orientation, CellInfo } from "./types.js"
import {
  getTable,
  resolveOrientationIndex,
  createCellInfo,
  getTableSelectionType,
} from "./core.js"

const EMPTY_CELLS_RESULT = { cells: [] as CellInfo[], mergedCells: [] as CellInfo[] }

/**
 * Checks if a cell is merged (has colspan or rowspan > 1)
 */
export function isCellMerged(node: Node | null): boolean {
  if (!node) return false
  const colspan = node.attrs.colspan ?? 1
  const rowspan = node.attrs.rowspan ?? 1
  return colspan > 1 || rowspan > 1
}

/**
 * Determines whether a table cell is effectively empty.
 *
 * A cell is considered empty when:
 *  - it has no children, or
 *  - it contains only whitespace text, or
 *  - it contains no text and no non-text leaf nodes (images, embeds, etc.)
 *
 * Early-outs as soon as any meaningful content is found.
 *
 * @param cellNode - The table cell node to check
 * @returns true if the cell is empty; false otherwise
 */
export function isCellEmpty(cellNode: Node): boolean {
  if (cellNode.childCount === 0) return true

  let isEmpty = true
  cellNode.descendants((n) => {
    if (n.isText && n.text?.trim()) {
      isEmpty = false
      return false
    }
    if (n.isLeaf && !n.isText) {
      isEmpty = false
      return false
    }
    return true
  })

  return isEmpty
}

/**
 * Generic function to collect cells along a row or column
 */
export function collectCells(
  editor: Editor | null,
  orientation: Orientation,
  index?: number,
  tablePos?: number
): { cells: CellInfo[]; mergedCells: CellInfo[] } {
  if (!editor) return EMPTY_CELLS_RESULT

  const { state } = editor
  const table = getTable(editor, tablePos)
  if (!table) return EMPTY_CELLS_RESULT

  const tableStart = table.start
  const tableNode = table.node
  const map = table.map

  const resolvedIndex = resolveOrientationIndex(
    state,
    table,
    orientation,
    index
  )
  if (resolvedIndex === null) return EMPTY_CELLS_RESULT

  // Bounds check
  const maxIndex = orientation === "row" ? map.height : map.width
  if (resolvedIndex < 0 || resolvedIndex >= maxIndex) {
    return EMPTY_CELLS_RESULT
  }

  const cells: CellInfo[] = []
  const mergedCells: CellInfo[] = []
  const seenMerged = new Set<number>()

  const iterationCount = orientation === "row" ? map.width : map.height

  for (let i = 0; i < iterationCount; i++) {
    const row = orientation === "row" ? resolvedIndex : i
    const col = orientation === "row" ? i : resolvedIndex
    const cellIndex = row * map.width + col
    const mapCell = map.map[cellIndex]

    if (mapCell === undefined) continue

    const cellPos = tableStart + mapCell
    const cellNode = tableNode.nodeAt(mapCell)
    if (!cellNode) continue

    const cell = createCellInfo(row, col, cellPos, cellNode)

    if (isCellMerged(cellNode)) {
      if (!seenMerged.has(cellPos)) {
        mergedCells.push(cell)
        seenMerged.add(cellPos)
      }
    }

    cells.push(cell)
  }

  return { cells, mergedCells }
}

/**
 * Generic function to count empty cells from the end of a row or column
 */
function countEmptyCellsFromEnd(
  editor: Editor,
  tablePos: number,
  orientation: Orientation
): number {
  const table = getTable(editor, tablePos)
  if (!table) return 0

  const { doc } = editor.state
  const maxIndex = orientation === "row" ? table.map.height : table.map.width

  let emptyCount = 0
  for (let idx = maxIndex - 1; idx >= 0; idx--) {
    const seen = new Set<number>()
    let isLineEmpty = true

    const iterationCount =
      orientation === "row" ? table.map.width : table.map.height

    for (let i = 0; i < iterationCount; i++) {
      const row = orientation === "row" ? idx : i
      const col = orientation === "row" ? i : idx
      const rel = table.map.positionAt(row, col, table.node)

      if (seen.has(rel)) continue
      seen.add(rel)

      const abs = tablePos + 1 + rel
      const cell = doc.nodeAt(abs)
      if (!cell) continue

      if (!isCellEmpty(cell)) {
        isLineEmpty = false
        break
      }
    }

    if (isLineEmpty) emptyCount++
    else break
  }

  return emptyCount
}

/**
 * Get all cells (and unique merged cells) in the selected row or column.
 *
 * - If `index` is provided, uses that row/column index.
 * - If omitted, uses the first selected row/column based on current selection.
 *
 * Returns an object with:
 * - `cells`: all cells in the row/column
 * - `mergedCells`: only the unique cells that have rowspan/colspan > 1
 *
 * If no valid selection or index is found, returns empty arrays.
 */
export function getRowOrColumnCells(
  editor: Editor | null,
  index?: number,
  orientation?: Orientation,
  tablePos?: number
): {
  cells: CellInfo[]
  mergedCells: CellInfo[]
  index?: number
  orientation?: Orientation
  tablePos?: number
} {
  const emptyResult = {
    cells: [] as CellInfo[],
    mergedCells: [] as CellInfo[],
    index: undefined,
    orientation: undefined,
    tablePos: undefined,
  }

  if (!editor) {
    return emptyResult
  }

  if (
    typeof index !== "number" &&
    !(editor.state.selection instanceof CellSelection)
  ) {
    return emptyResult
  }

  let finalIndex = index
  let finalOrientation = orientation

  if (
    typeof finalIndex !== "number" ||
    !finalOrientation ||
    !["row", "column"].includes(finalOrientation)
  ) {
    const selectionType = getTableSelectionType(editor)
    if (!selectionType) return emptyResult

    finalIndex = selectionType.index
    finalOrientation = selectionType.orientation
  }

  const result = collectCells(editor, finalOrientation, finalIndex, tablePos)
  return { ...result, index: finalIndex, orientation: finalOrientation }
}

/**
 * Collect cells (and unique merged cells) from a specific row.
 * - If `rowIndex` is provided, scans that row.
 * - If omitted, uses the first (topmost) selected row based on the current selection.
 */
export function getRowCells(
  editor: Editor | null,
  rowIndex?: number,
  tablePos?: number
): { cells: CellInfo[]; mergedCells: CellInfo[] } {
  return collectCells(editor, "row", rowIndex, tablePos)
}

/**
 * Collect cells (and unique merged cells) from the current table.
 * - If `columnIndex` is provided, scans that column.
 * - If omitted, uses the first (leftmost) selected column based on the current selection.
 */
export function getColumnCells(
  editor: Editor | null,
  columnIndex?: number,
  tablePos?: number
): { cells: CellInfo[]; mergedCells: CellInfo[] } {
  return collectCells(editor, "column", columnIndex, tablePos)
}

/**
 * Counts how many consecutive empty rows exist at the bottom of a given table.
 *
 * This function:
 *  - Locates the exact table in the document via reference matching
 *  - Iterates from the last visual row upward
 *  - Deduplicates cells per row using `TableMap` (merged cells can repeat positions)
 *  - Treats a row as empty only if all its unique cells are empty by `isCellEmpty`
 *
 * @param editor - The editor whose document contains the table
 * @param target - The table node instance to analyze (must be the same reference as in the doc)
 * @returns The number of trailing empty rows (0 if table not found)
 */
export function countEmptyRowsFromEnd(
  editor: Editor,
  tablePos: number
): number {
  return countEmptyCellsFromEnd(editor, tablePos, "row")
}

/**
 * Counts how many consecutive empty columns exist at the right edge of a given table.
 *
 * Similar to `countEmptyRowsFromEnd`, but scans by columns:
 *  - Iterates from the last visual column leftward
 *  - Deduplicates per-column cells using `TableMap`
 *  - A column is empty only if all unique cells in that column are empty
 *
 * @param editor - The editor whose document contains the table
 * @param target - The table node instance to analyze (must be the same reference as in the doc)
 * @returns The number of trailing empty columns (0 if table not found)
 */
export function countEmptyColumnsFromEnd(
  editor: Editor,
  tablePos: number
): number {
  return countEmptyCellsFromEnd(editor, tablePos, "column")
}
