/**
 * Block Indicator Extension
 *
 * Tracks which block is hovered and exposes its rect for the React component.
 * Handles block drag-and-drop with long-press activation and multi-block selection.
 */

import { Extension } from "@tiptap/core"
import { createBlockIndicatorPlugin } from './plugin'

// Re-export types
export type { BlockIndicatorState } from './types'
export { blockIndicatorKey } from './types'

// Re-export public API
export {
  setBlockIndicatorEnabled,
  isBlockIndicatorEnabled,
  getSelectedBlockPositions,
  hasSelectedBlocks,
  getSelectedBlockCount,
  subscribeToBlockSelection,
  subscribeToBlockIndicatorEnabled,
  subscribeToBlockIndicator,
  getPreDropPositions,
  getDropInfo,
  clearDropInfo,
  clearSelections,
  finishAnimation,
} from './state'

// Extension
export const BlockIndicator = Extension.create({
  name: "blockIndicator",

  addProseMirrorPlugins() {
    return [createBlockIndicatorPlugin()]
  },
})
