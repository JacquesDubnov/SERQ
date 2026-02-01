import { Node, mergeAttributes } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ColumnsView from './ColumnsView'

// Extend TipTap's Commands interface
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columnSection: {
      /**
       * Insert a column layout with specified column count
       */
      insertColumns: (options: { count: number }) => ReturnType
      /**
       * Set the column widths (as fr values)
       */
      setColumnWidths: (widths: number[]) => ReturnType
      /**
       * Toggle column borders visibility
       */
      toggleColumnBorders: () => ReturnType
      /**
       * Remove columns and extract content as paragraphs
       */
      removeColumns: () => ReturnType
    }
  }
}

/**
 * ColumnSection node - parent container for column layout
 * Content: column+ (must contain at least one column)
 */
export const ColumnSection = Node.create({
  name: 'columnSection',
  group: 'block',
  content: 'column+',
  draggable: true,
  isolating: true,

  // Priority > 100 to avoid TipTap extension conflicts
  priority: 110,

  addAttributes() {
    return {
      columnCount: {
        default: 2,
        parseHTML: (element) => parseInt(element.getAttribute('data-column-count') || '2', 10),
        renderHTML: (attributes) => ({
          'data-column-count': attributes.columnCount,
        }),
      },
      columnWidths: {
        default: null, // null = equal widths, array = fr values
        parseHTML: (element) => {
          const widths = element.getAttribute('data-column-widths')
          return widths ? JSON.parse(widths) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.columnWidths) return {}
          return {
            'data-column-widths': JSON.stringify(attributes.columnWidths),
          }
        },
      },
      showBorders: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-show-borders') === 'true',
        renderHTML: (attributes) => ({
          'data-show-borders': attributes.showBorders ? 'true' : 'false',
        }),
      },
      gap: {
        default: '24px',
        parseHTML: (element) => element.getAttribute('data-gap') || '24px',
        renderHTML: (attributes) => ({
          'data-gap': attributes.gap,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-column-section]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-column-section': '' }, HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnsView)
  },

  addCommands() {
    return {
      insertColumns:
        ({ count }) =>
        ({ chain }) => {
          // Create column content with empty paragraphs
          const columns = Array(count)
            .fill(null)
            .map(() => ({
              type: 'column',
              content: [{ type: 'paragraph' }],
            }))

          return chain()
            .insertContent({
              type: 'columnSection',
              attrs: { columnCount: count },
              content: columns,
            })
            // Move cursor into the first column's paragraph
            .command(({ tr }) => {
              const { doc } = tr
              let columnSectionContentPos: number | null = null

              // Find the last columnSection in the document (the one we just inserted)
              doc.descendants((node, pos) => {
                if (node.type.name === 'columnSection') {
                  // Position inside the first column's first paragraph
                  // +1 for columnSection, +1 for column, +1 for paragraph start
                  columnSectionContentPos = pos + 3
                }
              })

              if (columnSectionContentPos !== null) {
                try {
                  const $pos = tr.doc.resolve(columnSectionContentPos)
                  tr.setSelection(TextSelection.near($pos))
                } catch {
                  // Fallback: keep current selection
                }
              }
              return true
            })
            .run()
        },

      setColumnWidths:
        (widths) =>
        ({ commands }) => {
          return commands.updateAttributes('columnSection', { columnWidths: widths })
        },

      toggleColumnBorders:
        () =>
        ({ tr, state }) => {
          // Find the columnSection at cursor position
          const { selection } = state
          const { $from } = selection

          // Walk up the tree to find columnSection
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth)
            if (node.type.name === 'columnSection') {
              const pos = $from.before(depth)
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                showBorders: !node.attrs.showBorders,
              })
              return true
            }
          }
          return false
        },

      removeColumns:
        () =>
        ({ chain }) => {
          return chain().deleteNode('columnSection').run()
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // Backspace at start of empty first column paragraph removes the column section
      Backspace: () => {
        const { state, view } = this.editor
        const { selection } = state
        const { $from } = selection

        // Check if we're at the start of a paragraph inside a column
        if ($from.parent.type.name === 'paragraph' && $from.parent.textContent === '') {
          const column = $from.node(-1)
          if (column?.type.name === 'column' && column.childCount === 1) {
            const columnSection = $from.node(-2)
            if (columnSection?.type.name === 'columnSection') {
              // Check if this is the first column and all columns are empty
              const columnSectionPos = $from.before(-2)
              let allEmpty = true
              columnSection.forEach((col) => {
                if (col.textContent.trim() !== '') {
                  allEmpty = false
                }
              })

              if (allEmpty) {
                // Delete the column section and insert a paragraph
                const tr = state.tr.replaceWith(
                  columnSectionPos,
                  columnSectionPos + columnSection.nodeSize,
                  state.schema.nodes.paragraph.create()
                )
                view.dispatch(tr)
                return true
              }
            }
          }
        }
        return false
      },
    }
  },
})
