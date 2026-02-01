import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ColumnView from './ColumnView'

/**
 * Column node - individual column within a ColumnSection
 * Content: block+ (allows any block type inside)
 *
 * Uses ReactNodeViewRenderer so each column is a proper editable container.
 * This is CRITICAL - without it, TipTap can't handle click/focus in nested columns.
 */
export const Column = Node.create({
  name: 'column',
  content: 'block+',
  isolating: true,

  // Priority > 100 to avoid TipTap extension conflicts
  priority: 110,

  parseHTML() {
    return [{ tag: 'div[data-column]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-column': '' }, HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnView)
  },
})
