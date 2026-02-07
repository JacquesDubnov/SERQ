/**
 * ColumnBlock Node Extension
 *
 * Container node that holds 2-4 Column children in a CSS Grid layout.
 * Rendered via ReactNodeViewRenderer for resize handles and dividers.
 *
 * Column widths are stored on Column children (Column.attrs.width),
 * NOT on this parent node. The `columns` attr is synced by the
 * normalize plugin to match actual child count.
 */

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ColumnBlockView } from './ColumnBlockView'

export interface ColumnBlockAttributes {
  columns: number
  gutter: number
}

export const ColumnBlock = Node.create({
  name: 'columnBlock',

  group: 'block container',

  // Enforces 2-4 column children at schema level
  content: 'column{2,4}',

  isolating: true,
  selectable: true,
  draggable: true,
  defining: false,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (element) => {
          const val = element.getAttribute('data-columns')
          return val ? parseInt(val, 10) : 2
        },
        renderHTML: (attributes) => ({
          'data-columns': attributes.columns,
        }),
      },
      // Gutter stays on ColumnBlock until PresentationConfig (Phase 2)
      gutter: {
        default: 24,
        parseHTML: (element) => {
          const val = element.getAttribute('data-gutter')
          const parsed = val ? parseInt(val, 10) : 24
          return Math.max(10, parsed)
        },
        renderHTML: (attributes) => ({
          'data-gutter': attributes.gutter,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-column-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-column-block': '' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnBlockView)
  },
})
