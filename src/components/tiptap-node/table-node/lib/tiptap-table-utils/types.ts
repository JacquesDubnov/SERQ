import type { FindNodeResult, Rect } from "@tiptap/pm/tables"
import type { Transaction } from "@tiptap/pm/state"
import { TableMap } from "@tiptap/pm/tables"

export { Rect, TableMap }

export const RESIZE_MIN_WIDTH = 35
export const EMPTY_CELL_WIDTH = 120
export const EMPTY_CELL_HEIGHT = 40

export type Orientation = "row" | "column"
export interface CellInfo extends FindNodeResult {
  row: number
  column: number
}

export type CellCoordinates = {
  row: number
  col: number
}

export type SelectionReturnMode = "state" | "transaction" | "dispatch"

export type BaseSelectionOptions = { mode?: SelectionReturnMode }
export type DispatchSelectionOptions = {
  mode: "dispatch"
  dispatch: (tr: Transaction) => void
}
export type TransactionSelectionOptions = { mode: "transaction" }
export type StateSelectionOptions = { mode?: "state" }

export type TableInfo = {
  map: TableMap
} & FindNodeResult
