import { Node, mergeAttributes } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CalloutView from './CalloutView'

// Extend TipTap's Commands interface
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /**
       * Insert a callout block
       */
      insertCallout: (attrs?: {
        color?: string
        icon?: string | null
        collapsed?: boolean
        collapsible?: boolean
        borderStyle?: 'left' | 'right' | 'top' | 'bottom' | 'full' | 'none'
      }) => ReturnType
    }
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+', // Allow any block content inside (paragraphs, lists, headings)
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      color: {
        default: 'blue',
        parseHTML: (element) => element.getAttribute('data-color') || 'blue',
        renderHTML: (attributes) => ({
          'data-color': attributes.color,
        }),
      },
      icon: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-icon'),
        renderHTML: (attributes) => {
          if (!attributes.icon) return {}
          return { 'data-icon': attributes.icon }
        },
      },
      collapsed: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-collapsed') === 'true',
        renderHTML: (attributes) => ({
          'data-collapsed': attributes.collapsed ? 'true' : 'false',
        }),
      },
      collapsible: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-collapsible') === 'true',
        renderHTML: (attributes) => ({
          'data-collapsible': attributes.collapsible ? 'true' : 'false',
        }),
      },
      borderStyle: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-border-style') || 'left',
        renderHTML: (attributes) => ({
          'data-border-style': attributes.borderStyle,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-callout': '' }, HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },

  addCommands() {
    return {
      insertCallout:
        (attrs = {}) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: 'callout',
              attrs: {
                color: attrs.color ?? 'blue',
                icon: attrs.icon ?? null,
                collapsed: attrs.collapsed ?? false,
                collapsible: attrs.collapsible ?? false,
                borderStyle: attrs.borderStyle ?? 'left',
              },
              content: [{ type: 'paragraph' }],
            })
            // Move cursor into the callout's first paragraph
            .command(({ tr }) => {
              // Find the callout we just inserted by looking at the end of the document changes
              const { doc } = tr
              let calloutContentPos: number | null = null

              // Find the last callout in the document (the one we just inserted)
              doc.descendants((node, pos) => {
                if (node.type.name === 'callout') {
                  // Position inside the first child (paragraph) of the callout
                  calloutContentPos = pos + 2 // +1 for callout, +1 for paragraph start
                }
              })

              if (calloutContentPos !== null) {
                try {
                  const $pos = tr.doc.resolve(calloutContentPos)
                  tr.setSelection(TextSelection.near($pos))
                } catch {
                  // Fallback: keep current selection
                }
              }
              return true
            })
            .run()
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // Backspace at start of empty callout removes it
      Backspace: () => {
        const { state, view } = this.editor
        const { selection } = state
        const { $from } = selection

        // Only handle if we're at the start of the callout content
        if ($from.parent.type.name === 'paragraph' && $from.parent.textContent === '') {
          const calloutNode = $from.node(-1)
          if (calloutNode?.type.name === 'callout' && calloutNode.childCount === 1) {
            // Delete the callout and insert a paragraph
            const calloutPos = $from.before(-1)
            const tr = state.tr.replaceWith(
              calloutPos,
              calloutPos + calloutNode.nodeSize,
              state.schema.nodes.paragraph.create()
            )
            view.dispatch(tr)
            return true
          }
        }
        return false
      },
    }
  },
})

export default Callout
