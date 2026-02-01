import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Column node - individual column within a ColumnSection
 * Content: block+ (allows any block type inside)
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
})
