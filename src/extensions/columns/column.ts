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

  // All block and container content types. Nesting prevention (no columnBlock
  // inside columns) is enforced by normalize-plugin.ts.
  content: '(block | container)+',

  isolating: true,
  selectable: false,
  defining: false,

  addAttributes() {
    return {
      width: {
        default: 0.5,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-col-width')
          return v ? parseFloat(v) : 0.5
        },
        renderHTML: (attrs) => ({
          'data-col-width': String(attrs.width),
          style: `flex: 0 0 ${(attrs.width as number) * 100}%`,
        }),
      },
    }
  },

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
