/**
 * Column Block Extensions - Barrel Export
 *
 * Provides ColumnBlock (container) and Column (individual) nodes,
 * plus commands for managing column layouts and a normalization plugin.
 */

import { ColumnBlock as ColumnBlockBase } from './column-block'
import { Column as ColumnBase } from './column'
import { addColumnCommands } from './commands'
import { createNormalizePlugin } from './normalize-plugin'

// Extend ColumnBlock with commands and normalization
export const ColumnBlock = ColumnBlockBase.extend({
  addCommands() {
    return addColumnCommands()
  },

  addProseMirrorPlugins() {
    return [createNormalizePlugin()]
  },
})

export const Column = ColumnBase

// Re-export types
export type { ColumnBlockAttributes } from './column-block'
