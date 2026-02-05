import type { Editor } from "@tiptap/react"
import type { Command } from "@tiptap/pm/state"
import { Selection } from "@tiptap/pm/state"
import {
  CellSelection,
  isInTable,
  selectionCell,
} from "@tiptap/pm/tables"
import { Mapping } from "@tiptap/pm/transform"

import type { Orientation } from "./types.js"
import { getTable } from "./core.js"

/**
 * Clamps a value between min and max bounds
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

/**
 * Returns a command that sets the given attributes to the given values,
 * and is only available when the currently selected cell doesn't
 * already have those attributes set to those values.
 *
 * @public
 */
export function setCellAttr(attrs: Record<string, unknown>): Command
export function setCellAttr(name: string, value: unknown): Command
export function setCellAttr(
  nameOrAttrs: string | Record<string, unknown>,
  value?: unknown
): Command {
  return function (state, dispatch) {
    if (!isInTable(state)) return false
    const $cell = selectionCell(state)

    const attrs =
      typeof nameOrAttrs === "string" ? { [nameOrAttrs]: value } : nameOrAttrs

    if (dispatch) {
      const tr = state.tr
      if (state.selection instanceof CellSelection) {
        state.selection.forEachCell((node, pos) => {
          const needsUpdate = Object.entries(attrs).some(
            ([name, val]) => node.attrs[name] !== val
          )

          if (needsUpdate) {
            tr.setNodeMarkup(pos, null, {
              ...node.attrs,
              ...attrs,
            })
          }
        })
      } else {
        const needsUpdate = Object.entries(attrs).some(
          ([name, val]) => $cell.nodeAfter!.attrs[name] !== val
        )

        if (needsUpdate) {
          tr.setNodeMarkup($cell.pos, null, {
            ...$cell.nodeAfter!.attrs,
            ...attrs,
          })
        }
      }
      dispatch(tr)
    }
    return true
  }
}

/**
 * Runs a function while preserving the editor's selection.
 * @param editor The Tiptap editor instance
 * @param fn The function to run
 * @returns True if the selection was successfully restored, false otherwise
 */
export function runPreservingCursor(editor: Editor, fn: () => void): boolean {
  const view = editor.view
  const startSel = view.state.selection
  const bookmark = startSel.getBookmark()

  const mapping = new Mapping()
  const originalDispatch = view.dispatch

  view.dispatch = (tr) => {
    mapping.appendMapping(tr.mapping)
    originalDispatch(tr)
  }

  try {
    fn()
  } finally {
    view.dispatch = originalDispatch
  }

  try {
    const sel = bookmark.map(mapping).resolve(view.state.doc)
    view.dispatch(view.state.tr.setSelection(sel))
    return true
  } catch {
    // Fallback: if the exact spot vanished (e.g., cell deleted),
    // go to the nearest valid position.
    const mappedPos = mapping.map(startSel.from, -1)
    const clamped = clamp(mappedPos, 0, view.state.doc.content.size)
    const near = Selection.near(view.state.doc.resolve(clamped), -1)
    view.dispatch(view.state.tr.setSelection(near))
    return false
  }
}

/**
 * After moving a row or column, update the selection to the moved item.
 *
 * This ensures that after a move operation, the selection remains on the
 * moved row or column, providing better user feedback.
 *
 * @param editor - The editor instance
 * @param orientation - "row" or "column" indicating what was moved
 * @param newIndex - The new index of the moved row/column
 * @param tablePos - Optional position of the table in the document
 */
export function updateSelectionAfterAction(
  editor: Editor,
  orientation: Orientation,
  newIndex: number,
  tablePos?: number
): void {
  try {
    const table = getTable(editor, tablePos)
    if (!table) return

    const { state } = editor
    const { map } = table

    if (orientation === "row") {
      if (newIndex >= 0 && newIndex < map.height) {
        const startCol = 0
        const endCol = map.width - 1

        const startCellPos =
          table.start + map.positionAt(newIndex, startCol, table.node)
        const endCellPos =
          table.start + map.positionAt(newIndex, endCol, table.node)

        const $start = state.doc.resolve(startCellPos)
        const $end = state.doc.resolve(endCellPos)

        const newSelection = CellSelection.create(
          state.doc,
          $start.pos,
          $end.pos
        )
        const tr = state.tr.setSelection(newSelection)
        editor.view.dispatch(tr)
      }
    } else if (orientation === "column") {
      if (newIndex >= 0 && newIndex < map.width) {
        const startRow = 0
        const endRow = map.height - 1

        const startCellPos =
          table.start + map.positionAt(startRow, newIndex, table.node)
        const endCellPos =
          table.start + map.positionAt(endRow, newIndex, table.node)

        const $start = state.doc.resolve(startCellPos)
        const $end = state.doc.resolve(endCellPos)

        const newSelection = CellSelection.create(
          state.doc,
          $start.pos,
          $end.pos
        )
        const tr = state.tr.setSelection(newSelection)
        editor.view.dispatch(tr)
      }
    }
  } catch (error) {
    console.warn("Failed to update selection after move:", error)
  }
}

/**
 * Rounds a number with a symmetric "dead-zone" around integer boundaries,
 * which makes drag/resize UX feel less jittery near thresholds.
 *
 * For example, with `margin = 0.3`:
 *  - values < n + 0.3 snap down to `n`
 *  - values > n + 0.7 snap up to `n + 1`
 *  - values in [n + 0.3, n + 0.7] fall back to `Math.round`
 *
 * @param num - The floating value to round
 * @param margin - Half-width of the dead-zone around integer boundaries (default 0.3)
 * @returns The rounded value using the dead-zone heuristic
 */
export function marginRound(num: number, margin = 0.3): number {
  const floor = Math.floor(num)
  const ceil = Math.ceil(num)
  const lowerBound = floor + margin
  const upperBound = ceil - margin

  if (num < lowerBound) return floor
  if (num > upperBound) return ceil
  return Math.round(num)
}

/**
 * Compares two DOMRect objects for equality.
 *
 * Treats `undefined` as a valid state, where two `undefined` rects are equal,
 * and `undefined` is not equal to any defined rect.
 *
 * @param a - The first DOMRect or undefined
 * @param b - The second DOMRect or undefined
 * @returns true if both rects are equal or both are undefined; false otherwise
 */
export function rectEq(a?: DOMRect | null, b?: DOMRect | null): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height
  )
}
