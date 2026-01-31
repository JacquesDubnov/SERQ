import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import CalloutView from './CalloutView'

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      insertCallout: (attrs?: {
        color?: string
        icon?: string | null
        collapsed?: boolean
        collapsible?: boolean
      }) => ReturnType
      toggleCalloutCollapse: () => ReturnType
    }
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      color: {
        default: 'blue',
        parseHTML: (element) => element.getAttribute('data-color') || 'blue',
        renderHTML: (attributes) => ({ 'data-color': attributes.color }),
      },
      icon: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-icon') || null,
        renderHTML: (attributes) => {
          if (!attributes.icon) return {}
          return { 'data-icon': attributes.icon }
        },
      },
      collapsed: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-collapsed') === 'true',
        renderHTML: (attributes) => ({ 'data-collapsed': attributes.collapsed ? 'true' : 'false' }),
      },
      collapsible: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-collapsible') === 'true',
        renderHTML: (attributes) => ({ 'data-collapsible': attributes.collapsible ? 'true' : 'false' }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-callout': '' }, this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },

  addCommands() {
    return {
      insertCallout: (attrs = {}) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { color: 'blue', icon: null, collapsed: false, collapsible: false, ...attrs },
          content: [{ type: 'paragraph' }],
        })
      },
      toggleCalloutCollapse: () => ({ tr, state }) => {
        const { from } = state.selection
        const node = state.doc.nodeAt(from)
        if (node?.type.name === this.name) {
          tr.setNodeMarkup(from, undefined, { ...node.attrs, collapsed: !node.attrs.collapsed })
          return true
        }
        return false
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor
        const { $from, empty } = state.selection
        if (!empty) return false
        const calloutNode = $from.node(-1)
        if (calloutNode?.type.name !== this.name) return false
        const parentPos = $from.before(-1)
        const calloutEnd = parentPos + calloutNode.nodeSize - 1
        const atEnd = $from.pos === calloutEnd - 1
        if (atEnd) {
          const tr = state.tr
          tr.insert(calloutEnd, state.schema.nodes.paragraph.create())
          tr.setSelection(TextSelection.near(tr.doc.resolve(calloutEnd + 1)))
          editor.view.dispatch(tr)
          return true
        }
        return false
      },
    }
  },
})

export default Callout
