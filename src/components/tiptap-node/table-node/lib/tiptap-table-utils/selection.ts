import type { Editor } from "@tiptap/react"
import type { Node } from "@tiptap/pm/model"
import type { EditorState, Transaction } from "@tiptap/pm/state"
import {
  TableMap,
  CellSelection,
  cellAround,
} from "@tiptap/pm/tables"

import type {
  Orientation,
  CellCoordinates,
  SelectionReturnMode,
  BaseSelectionOptions,
  DispatchSelectionOptions,
  TransactionSelectionOptions,
  StateSelectionOptions,
} from "./types.js"
import { getTable, isWithinBounds, isTableNode } from "./core.js"
import { clamp } from "./operations.js"

/**
 * Applies the transaction based on the specified mode
 */
function applySelectionWithMode(
  state: EditorState,
  transaction: Transaction,
  options: BaseSelectionOptions | DispatchSelectionOptions
): EditorState | Transaction | void {
  const mode: SelectionReturnMode = options.mode ?? "state"

  switch (mode) {
    case "dispatch": {
      const dispatchOptions = options as DispatchSelectionOptions
      if (typeof dispatchOptions.dispatch === "function") {
        dispatchOptions.dispatch(transaction)
      }
      return
    }

    case "transaction":
      return transaction

    default: // "state"
      return state.apply(transaction)
  }
}

/**
 * Create or apply a `CellSelection` inside a table.
 *
 * Depending on the `mode` option, this helper behaves differently:
 *
 * - `"state"` (default) → Returns a new `EditorState` with the selection applied.
 * - `"transaction"` → Returns a `Transaction` with the selection set, without applying it.
 * - `"dispatch"` → Immediately calls `dispatch(tr)` with the new selection.
 *
 * This allows you to reuse the same helper in commands, tests, or utilities
 * without duplicating logic.
 *
 * Example:
 * ```ts
 * // Get new state
 * const nextState = createTableCellSelection(state, tablePosition, { row: 1, col: 1 }, { row: 2, col: 3 })
 *
 * // Get transaction only
 * const tr = createTableCellSelection(state, tablePosition, { row: 0, col: 0 }, { row: 0, col: 2 }, { mode: "transaction" })
 *
 * // Dispatch directly
 * createTableCellSelection(state, tablePosition, { row: 1, col: 1 }, { row: 3, col: 2 }, { mode: "dispatch", dispatch })
 * ```
 */
export function createTableCellSelection(
  state: EditorState,
  tablePosition: number,
  startCell: CellCoordinates,
  endCell?: CellCoordinates,
  options?: StateSelectionOptions
): EditorState
export function createTableCellSelection(
  state: EditorState,
  tablePosition: number,
  startCell: CellCoordinates,
  endCell: CellCoordinates | undefined,
  options: TransactionSelectionOptions
): Transaction
export function createTableCellSelection(
  state: EditorState,
  tablePosition: number,
  startCell: CellCoordinates,
  endCell: CellCoordinates | undefined,
  options: DispatchSelectionOptions
): void

export function createTableCellSelection(
  state: EditorState,
  tablePosition: number,
  startCell: CellCoordinates,
  endCell: CellCoordinates = startCell,
  options: BaseSelectionOptions | DispatchSelectionOptions = { mode: "state" }
): EditorState | Transaction | void {
  const startCellPosition = getCellPosition(state, tablePosition, startCell)
  const endCellPosition = getCellPosition(state, tablePosition, endCell)

  if (!startCellPosition || !endCellPosition) {
    return
  }

  const transaction = state.tr.setSelection(
    new CellSelection(startCellPosition, endCellPosition)
  )

  return applySelectionWithMode(state, transaction, options)
}

/**
 * Get the position of a cell inside a table by relative row/col indices.
 * Returns the position *before* the cell, which is what `CellSelection` expects.
 */
export function getCellPosition(
  state: EditorState,
  tablePosition: number,
  cellCoordinates: CellCoordinates
) {
  const resolvedTablePosition = state.doc.resolve(tablePosition)
  const resolvedRowPosition = state.doc.resolve(
    resolvedTablePosition.posAtIndex(cellCoordinates.row) + 1
  )
  const resolvedColPosition = state.doc.resolve(
    resolvedRowPosition.posAtIndex(cellCoordinates.col)
  )

  const $cell = cellAround(resolvedColPosition)
  if (!$cell) return null

  return resolvedColPosition
}

/**
 * Selects table cells by their (row, col) coordinates.
 *
 * This function can be used in three modes:
 * - `"state"` (default) → Returns a new `EditorState` with the selection applied, or null if failed.
 * - `"transaction"` → Returns a `Transaction` with the selection set, or null if failed.
 * - `"dispatch"` → Immediately dispatches the selection and returns boolean success status.
 *
 * @param editor - The editor instance
 * @param tablePos - Position of the table in the document
 * @param coords - Array of {row, col} coordinates to select
 * @param options - Mode and dispatch options
 */
export function selectCellsByCoords(
  editor: Editor | null,
  tablePos: number,
  coords: { row: number; col: number }[],
  options?: StateSelectionOptions
): EditorState
export function selectCellsByCoords(
  editor: Editor | null,
  tablePos: number,
  coords: { row: number; col: number }[],
  options: TransactionSelectionOptions
): Transaction
export function selectCellsByCoords(
  editor: Editor | null,
  tablePos: number,
  coords: { row: number; col: number }[],
  options: DispatchSelectionOptions
): void
export function selectCellsByCoords(
  editor: Editor | null,
  tablePos: number,
  coords: { row: number; col: number }[],
  options: BaseSelectionOptions | DispatchSelectionOptions = { mode: "state" }
): EditorState | Transaction | void {
  if (!editor) return

  const table = getTable(editor, tablePos)
  if (!table) return

  const { state } = editor
  const tableMap = table.map

  const cleanedCoords = coords
    .map((coord) => ({
      row: clamp(coord.row, 0, tableMap.height - 1),
      col: clamp(coord.col, 0, tableMap.width - 1),
    }))
    .filter((coord) => isWithinBounds(coord.row, coord.col, tableMap))

  if (cleanedCoords.length === 0) {
    return
  }

  // --- Find the smallest rectangle that contains all our coordinates ---
  const allRows = cleanedCoords.map((coord) => coord.row)
  const topRow = Math.min(...allRows)
  const bottomRow = Math.max(...allRows)

  const allCols = cleanedCoords.map((coord) => coord.col)
  const leftCol = Math.min(...allCols)
  const rightCol = Math.max(...allCols)

  // --- Convert visual coordinates to document positions ---
  // Use TableMap.map array directly to handle merged cells correctly
  const getCellPositionFromMap = (row: number, col: number): number | null => {
    // TableMap.map is a flat array where each entry represents a cell
    // For merged cells, the same offset appears multiple times
    const cellOffset = tableMap.map[row * tableMap.width + col]
    if (cellOffset === undefined) return null

    // Convert the relative offset to an absolute position in the document
    // tablePos + 1 skips the table opening tag
    return tablePos + 1 + cellOffset
  }

  // Anchor = where the selection starts (top-left of bounding box)
  const anchorPosition = getCellPositionFromMap(topRow, leftCol)
  if (anchorPosition === null) return

  // Head = where the selection ends (usually bottom-right of bounding box)
  let headPosition = getCellPositionFromMap(bottomRow, rightCol)
  if (headPosition === null) return

  // --- Handle edge case with merged cells ---
  // If anchor and head point to the same cell, we need to find a different head
  // This happens when selecting a single merged cell or when all coords point to one cell
  if (headPosition === anchorPosition) {
    let foundDifferentCell = false

    // Search backwards from bottom-right to find a cell with a different position
    for (let row = bottomRow; row >= topRow && !foundDifferentCell; row--) {
      for (let col = rightCol; col >= leftCol && !foundDifferentCell; col--) {
        const candidatePosition = getCellPositionFromMap(row, col)

        if (
          candidatePosition !== null &&
          candidatePosition !== anchorPosition
        ) {
          headPosition = candidatePosition
          foundDifferentCell = true
        }
      }
    }
  }

  try {
    const anchorRef = state.doc.resolve(anchorPosition)
    const headRef = state.doc.resolve(headPosition)

    const cellSelection = new CellSelection(anchorRef, headRef)
    const transaction = state.tr.setSelection(cellSelection)

    return applySelectionWithMode(state, transaction, options)
  } catch (error) {
    console.error("Failed to create cell selection:", error)
    return
  }
}

/**
 * Select the cell at (row, col) using `cellAround` to respect merged cells.
 *
 * @param editor    Tiptap editor
 * @param row       Row index (0-based)
 * @param col       Column index (0-based)
 * @param tablePos  Optional absolute position of the table node
 * @param dispatch  Optional dispatch; defaults to editor.view.dispatch
 */
export function selectCellAt({
  editor,
  row,
  col,
  tablePos,
  dispatch,
}: {
  editor: Editor | null
  row: number
  col: number
  tablePos?: number
  dispatch?: (tr: Transaction) => void
}): boolean {
  if (!editor) return false

  const { state, view } = editor
  const found = getTable(editor, tablePos)
  if (!found) return false

  // Bounds check
  if (!isWithinBounds(row, col, found.map)) {
    return false
  }

  const relCellPos = found.map.positionAt(row, col, found.node)
  const absCellPos = found.start + relCellPos

  const $abs = state.doc.resolve(absCellPos)
  const $cell = cellAround($abs)
  const cellPos = $cell ? $cell.pos : absCellPos

  const sel = CellSelection.create(state.doc, cellPos)

  const doDispatch = dispatch ?? view?.dispatch
  if (!doDispatch) return false

  doDispatch(state.tr.setSelection(sel))
  return true
}

/**
 * Selects a boundary cell of the table based on orientation.
 *
 * For row orientation, selects the bottom-left cell of the table.
 * For column orientation, selects the top-right cell of the table.
 *
 * This function accounts for merged cells to ensure the correct cell is selected.
 *
 * @param editor      The Tiptap editor instance
 * @param tableNode   The table node
 * @param tablePos    The position of the table node in the document
 * @param orientation "row" to select bottom-left, "column" to select top-right
 * @returns true if the selection was successful; false otherwise
 */
export function selectLastCell(
  editor: Editor,
  tableNode: Node,
  tablePos: number,
  orientation: Orientation
) {
  const map = TableMap.get(tableNode)
  const isRow = orientation === "row"

  // For rows, select bottom-left cell; for columns, select top-right cell
  const row = isRow ? map.height - 1 : 0
  const col = isRow ? 0 : map.width - 1

  // Calculate the index in the table map
  const index = row * map.width + col

  // Get the actual cell position from the map (handles merged cells)
  const cellPos = map.map[index]
  if (!cellPos && cellPos !== 0) {
    console.warn("selectLastCell: cell position not found in map", {
      index,
      row,
      col,
      map,
    })
    return false
  }

  // Find the row and column of the actual cell
  const cellIndex = map.map.indexOf(cellPos)
  const actualRow = cellIndex >= 0 ? Math.floor(cellIndex / map.width) : 0
  const actualCol = cellIndex >= 0 ? cellIndex % map.width : 0

  return selectCellAt({
    editor,
    row: actualRow,
    col: actualCol,
    tablePos,
    dispatch: editor.view.dispatch.bind(editor.view),
  })
}

/**
 * Get all (row, col) coordinates for a given row or column index.
 *
 * - If `orientation` is "row", returns all columns in that row.
 * - If `orientation` is "column", returns all rows in that column.
 *
 * Returns null if:
 * - the editor or table is not found
 * - the index is out of bounds
 *
 * @param editor      The Tiptap editor instance
 * @param index       The row or column index (0-based)
 * @param orientation "row" to get row coordinates, "column" for column coordinates
 * @param tablePos    Optional position of the table node in the document
 * @returns Array of {row, col} objects or null if invalid
 */
export function getIndexCoordinates({
  editor,
  index,
  orientation,
  tablePos,
}: {
  editor: Editor | null
  index: number
  orientation?: Orientation
  tablePos?: number
}): { row: number; col: number }[] | null {
  if (!editor) return null

  const table = getTable(editor, tablePos)
  if (!table) return null

  const { map } = table
  const { width, height } = map

  if (index < 0) return null
  if (orientation === "row" && index >= height) return null
  if (orientation === "column" && index >= width) return null

  return orientation === "row"
    ? Array.from({ length: map.width }, (_, col) => ({ row: index, col }))
    : Array.from({ length: map.height }, (_, row) => ({ row, col: index }))
}

/**
 * Given a DOM cell element, find its (row, col) indices within the table.
 *
 * This function:
 * - Locates the nearest ancestor table element
 * - Uses the editor's document model to resolve the cell's position
 * - Traverses up the node hierarchy to find the corresponding table cell node
 * - Uses `TableMap` to translate the cell's position into (row, col) indices
 *
 * Returns null if:
 * - the table or cell cannot be found in the editor's document
 * - any error occurs during position resolution
 *
 * @param cell      The HTMLTableCellElement (td or th)
 * @param tableNode The table node in the ProseMirror document
 * @param editor    The Tiptap editor instance
 * @returns An object with { rowIndex, colIndex } or null if not found
 */
export function getCellIndicesFromDOM(
  cell: HTMLTableCellElement,
  tableNode: Node | null,
  editor: Editor
): { rowIndex: number; colIndex: number } | null {
  if (!tableNode) return null

  try {
    const cellPos = editor.view.posAtDOM(cell, 0)
    const $cellPos = editor.view.state.doc.resolve(cellPos)

    for (let d = $cellPos.depth; d > 0; d--) {
      const node = $cellPos.node(d)
      if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
        const tableMap = TableMap.get(tableNode)
        const cellNodePos = $cellPos.before(d)
        const tableStart = $cellPos.start(d - 2)
        const cellOffset = cellNodePos - tableStart
        const cellIndex = tableMap.map.indexOf(cellOffset)

        return {
          rowIndex: Math.floor(cellIndex / tableMap.width),
          colIndex: cellIndex % tableMap.width,
        }
      }
    }
  } catch (error) {
    console.warn("Could not get cell position:", error)
  }
  return null
}

/**
 * Given a DOM element inside a table, find the corresponding table node and its position.
 *
 * This function:
 * - Locates the nearest ancestor table element
 * - Uses the editor's document model to resolve the table's position
 * - Traverses up the node hierarchy to find the corresponding table node
 *
 * Returns null if:
 * - the table cannot be found in the editor's document
 * - any error occurs during position resolution
 *
 * @param tableElement The HTMLTableElement or an element inside it
 * @param editor       The Tiptap editor instance
 * @returns An object with { node: tableNode, pos: tablePos } or null if not found
 */
export function getTableFromDOM(
  tableElement: HTMLElement,
  editor: Editor
): { node: Node; pos: number } | null {
  try {
    const pos = editor.view.posAtDOM(tableElement, 0)
    const $pos = editor.view.state.doc.resolve(pos)

    for (let d = $pos.depth; d >= 0; d--) {
      const node = $pos.node(d)
      if (isTableNode(node)) {
        return { node, pos: d === 0 ? 0 : $pos.before(d) }
      }
    }
  } catch (error) {
    console.warn("Could not get table from DOM:", error)
  }
  return null
}
