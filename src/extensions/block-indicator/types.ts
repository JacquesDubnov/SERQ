/**
 * Block Indicator - Type Definitions
 */

import { PluginKey } from "@tiptap/pm/state"

export interface BlockIndicatorState {
  /** Whether indicator should be visible */
  visible: boolean
  /** Position relative to editor container */
  top: number
  height: number
  /** Left edge of the block (for offset calculation) */
  blockLeft: number
  /** Width of the block */
  blockWidth: number
  /** Whether Option is held (shows full frame instead of left line) */
  commandHeld: boolean
  /** Long press state */
  isLongPressing: boolean
  /** Drag state */
  isDragging: boolean
  /** Drop indicator Y position (relative to editor container) */
  dropIndicatorTop: number | null
  /** Source block overlay (for fade out effect) - React renders this */
  sourceOverlay: {
    left: number
    top: number
    width: number
    height: number
  } | null
  /** Animation state after drop */
  isAnimating: boolean
  /** Indicator should animate from source to landing position after drop */
  indicatorTransition: {
    fromTop: number
    fromHeight: number
    toTop: number
    toHeight: number
  } | null
  /** Animation stage after drop: 'none' | 'shrinking' | 'growing' */
  dropAnimation: 'none' | 'shrinking' | 'growing'

  // Multi-block selection
  /** Array of selected blocks with their positions and dimensions */
  selectedBlocks: Array<{
    pos: number        // ProseMirror position
    top: number
    height: number
    blockLeft: number
    blockWidth: number
    pageNumber: number // Page number (1-indexed) for pagination support
  }>
  /** Last selected block position (for range selection) */
  lastSelectedPos: number | null

  /** Whether pagination mode is active */
  paginationEnabled: boolean

  // Horizontal drop (column creation via drag)
  /** Which side of a block the horizontal drop indicator should show on */
  horizontalDropSide: 'left' | 'right' | null
  /** ProseMirror position of the block targeted for horizontal drop */
  horizontalDropBlockPos: number | null
  /** Screen rect of the targeted block (for rendering the vertical indicator) */
  horizontalDropRect: { left: number; top: number; width: number; height: number } | null
  /** When dropping between columns of an existing columnBlock, the column index to insert at */
  horizontalDropColumnIndex: number | null
  /** X position (relative to editor) for the vertical indicator when dropping between columns */
  horizontalDropGapX: number | null

  // Column content drop (dropping a block INTO a column as content)
  /** When dragging a block over a column's content area, drop info for inserting inside the column */
  columnContentDrop: {
    columnBlockPos: number    // pos of the columnBlock
    columnIndex: number       // which column (0-indexed)
    insertPos: number         // ProseMirror position to insert at
    indicatorTop: number      // visual position of horizontal indicator
    indicatorLeft: number     // left edge of column
    indicatorWidth: number    // width of column
  } | null
}

export const blockIndicatorKey = new PluginKey<{ isDragging: boolean }>("blockIndicator")

// HMR state persistence
export interface HMRState {
  currentState: BlockIndicatorState
  listeners: ((state: BlockIndicatorState) => void)[]
  selectedBlockPositions: Set<number>
  lastSelectedPos: number | null
  commandHeld: boolean
  indicatorEnabled: boolean
  enabledListeners: ((enabled: boolean) => void)[]
}
