import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Column node - individual column within a ColumnSection
 * Content: block+ (allows any block type inside)
 *
 * Note: This node does NOT use ReactNodeViewRenderer because nested
 * NodeViews with the parent ColumnsView cause React crashes.
 * Click handling is done via CSS and the parent ColumnsView.
 */
export const Column = Node.create({
  name: 'column',
  content: 'block+',
  isolating: true,
  // Defining as true ensures TipTap treats this as an editable content container
  defining: true,

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
          class: 'column',
          // Ensure the column is focusable and editable
          style: 'min-height: 2rem; padding: 0.5rem;',
        },
        HTMLAttributes
      ),
      0,
    ]
  },
})
