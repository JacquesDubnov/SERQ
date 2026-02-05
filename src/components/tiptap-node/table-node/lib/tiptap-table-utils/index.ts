// Types and constants
export {
  RESIZE_MIN_WIDTH,
  EMPTY_CELL_WIDTH,
  EMPTY_CELL_HEIGHT,
} from "./types.js"
export type {
  Orientation,
  CellInfo,
  CellCoordinates,
  SelectionReturnMode,
  BaseSelectionOptions,
  DispatchSelectionOptions,
  TransactionSelectionOptions,
  StateSelectionOptions,
  TableInfo,
} from "./types.js"

// DOM utilities
export {
  isHTMLElement,
  safeClosest,
  domCellAround,
} from "./dom.js"
export type { DomCellAroundResult } from "./dom.js"

// Core table querying & inspection
export {
  getTable,
  isSelectionInCell,
  cellsOverlapRectangle,
  getTableSelectionType,
  isTableNode,
} from "./core.js"

// Cell collection & analysis
export {
  isCellMerged,
  isCellEmpty,
  getRowOrColumnCells,
  getRowCells,
  getColumnCells,
  countEmptyRowsFromEnd,
  countEmptyColumnsFromEnd,
} from "./cells.js"

// Cell selection & positioning
export {
  createTableCellSelection,
  getCellPosition,
  selectCellsByCoords,
  selectCellAt,
  selectLastCell,
  getIndexCoordinates,
  getCellIndicesFromDOM,
  getTableFromDOM,
} from "./selection.js"

// Cell attributes, state preservation, math utils
export {
  clamp,
  setCellAttr,
  runPreservingCursor,
  updateSelectionAfterAction,
  marginRound,
  rectEq,
} from "./operations.js"
