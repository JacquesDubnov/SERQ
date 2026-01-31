import { Node, mergeAttributes } from '@tiptap/core'
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
        ({ commands }) => {
          return commands.insertContent({
            type: 'callout',
            attrs: {
              color: attrs.color ?? 'blue',
              icon: attrs.icon ?? null,
              collapsed: attrs.collapsed ?? false,
              collapsible: attrs.collapsible ?? false,
            },
            content: [{ type: 'paragraph' }],
          })
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
