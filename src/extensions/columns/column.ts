/**
 * Column Node Extension
 *
 * Individual column within a ColumnBlock. NOT in the 'block' group --
 * uses its own 'column' group so it's only valid inside columnBlock.
 *
 * Content allows all standard block types except columnBlock (no nesting).
 * Uses ReactNodeViewRenderer for proper cursor/click handling.
 */

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ColumnView } from './ColumnView'

export const Column = Node.create({
  name: 'column',

  // Own group -- only valid as child of columnBlock's content expression
  group: 'column',

  // All block content types registered in the schema, excluding columnBlock to prevent nesting.
  // Uses 'block+' for maximum compatibility -- any block node added later works automatically.
  // Nesting prevention is enforced by normalize-plugin.ts (unwraps nested columnBlocks).
  content: 'block+',

  isolating: true,
  selectable: false,
  defining: false,

  parseHTML() {
    return [{ tag: 'div[data-column]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-column': '' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnView)
  },
})
