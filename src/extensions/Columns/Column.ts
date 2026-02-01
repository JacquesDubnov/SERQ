import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Column node - individual column within a ColumnSection
 * Content: block+ (allows any block type inside)
 *
 * Uses native ProseMirror rendering (like TipTap's TableCell)
 * for proper click/focus handling. No ReactNodeViewRenderer.
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
    return [
      'div',
      mergeAttributes(
        {
          'data-column': '',
          // CSS handles all styling via [data-column] selector
        },
        HTMLAttributes
      ),
      0,
    ]
  },
})
