import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ImageView } from './ImageView'

export interface ImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * Add an image
       */
      setImage: (options: {
        src: string
        alt?: string
        title?: string
        width?: number
        height?: number
        alignment?: 'left' | 'center' | 'right'
        float?: 'none' | 'left' | 'right' | 'center-wrap'
        freePosition?: boolean
        positionX?: number
        positionY?: number
      }) => ReturnType
    }
  }
}

export const ResizableImage = Node.create<ImageOptions>({
  name: 'image',

  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  draggable: true,

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      alignment: {
        default: 'center',
      },
      float: {
        default: 'none',
        parseHTML: (element) => element.getAttribute('data-float') || 'none',
        renderHTML: (attributes) => {
          if (!attributes.float || attributes.float === 'none') return {}
          return { 'data-float': attributes.float }
        },
      },
      freePosition: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-free-position') === 'true',
        renderHTML: (attributes) => {
          if (!attributes.freePosition) return {}
          return { 'data-free-position': 'true' }
        },
      },
      positionX: {
        default: 50,
        parseHTML: (element) => parseFloat(element.getAttribute('data-position-x') || '50'),
        renderHTML: (attributes) => {
          if (!attributes.freePosition) return {}
          return { 'data-position-x': String(attributes.positionX) }
        },
      },
      positionY: {
        default: 0,
        parseHTML: (element) => parseFloat(element.getAttribute('data-position-y') || '0'),
        renderHTML: (attributes) => {
          if (!attributes.freePosition) return {}
          return { 'data-position-y': String(attributes.positionY) }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView)
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})
