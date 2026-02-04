/**
 * BlockTypography Extension
 *
 * Adds block-level typography attributes to paragraphs and headings:
 * - fontFamily (block default, overridden by inline marks)
 * - fontSize (block default, overridden by inline marks)
 * - fontWeight (block default, overridden by inline marks)
 * - color (block default, overridden by inline marks)
 *
 * These are BLOCK-LEVEL defaults. Any text with explicit inline marks
 * will override these via CSS specificity.
 */

import { Extension } from '@tiptap/core'

export interface BlockTypographyOptions {
  types: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockTypography: {
      /**
       * Set block-level font family
       */
      setBlockFontFamily: (fontFamily: string | null) => ReturnType
      /**
       * Set block-level font size
       */
      setBlockFontSize: (fontSize: string | null) => ReturnType
      /**
       * Set block-level font weight
       */
      setBlockFontWeight: (fontWeight: string | null) => ReturnType
      /**
       * Set block-level text color
       */
      setBlockColor: (color: string | null) => ReturnType
      /**
       * Set multiple block typography attributes at once
       */
      setBlockTypography: (attrs: {
        fontFamily?: string | null
        fontSize?: string | null
        fontWeight?: string | null
        color?: string | null
      }) => ReturnType
    }
  }
}

export const BlockTypography = Extension.create<BlockTypographyOptions>({
  name: 'blockTypography',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          blockFontFamily: {
            default: null,
            parseHTML: (element) => {
              // Only read if it's set as a data attribute (to distinguish from inherited)
              return element.getAttribute('data-block-font-family') || null
            },
            renderHTML: (attributes) => {
              if (!attributes.blockFontFamily) {
                return {}
              }
              return {
                'data-block-font-family': attributes.blockFontFamily,
                style: `font-family: ${attributes.blockFontFamily}`,
              }
            },
          },
          blockFontSize: {
            default: null,
            parseHTML: (element) => {
              return element.getAttribute('data-block-font-size') || null
            },
            renderHTML: (attributes) => {
              if (!attributes.blockFontSize) {
                return {}
              }
              return {
                'data-block-font-size': attributes.blockFontSize,
                style: `font-size: ${attributes.blockFontSize}`,
              }
            },
          },
          blockFontWeight: {
            default: null,
            parseHTML: (element) => {
              return element.getAttribute('data-block-font-weight') || null
            },
            renderHTML: (attributes) => {
              if (!attributes.blockFontWeight) {
                return {}
              }
              return {
                'data-block-font-weight': attributes.blockFontWeight,
                style: `font-weight: ${attributes.blockFontWeight}`,
              }
            },
          },
          blockColor: {
            default: null,
            parseHTML: (element) => {
              return element.getAttribute('data-block-color') || null
            },
            renderHTML: (attributes) => {
              if (!attributes.blockColor) {
                return {}
              }
              return {
                'data-block-color': attributes.blockColor,
                style: `color: ${attributes.blockColor}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setBlockFontFamily:
        (fontFamily: string | null) =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { blockFontFamily: fontFamily })
          )
        },

      setBlockFontSize:
        (fontSize: string | null) =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { blockFontSize: fontSize })
          )
        },

      setBlockFontWeight:
        (fontWeight: string | null) =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { blockFontWeight: fontWeight })
          )
        },

      setBlockColor:
        (color: string | null) =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { blockColor: color })
          )
        },

      setBlockTypography:
        (attrs) =>
        ({ commands }) => {
          const updates: Record<string, unknown> = {}
          if (attrs.fontFamily !== undefined) updates.blockFontFamily = attrs.fontFamily
          if (attrs.fontSize !== undefined) updates.blockFontSize = attrs.fontSize
          if (attrs.fontWeight !== undefined) updates.blockFontWeight = attrs.fontWeight
          if (attrs.color !== undefined) updates.blockColor = attrs.color

          return this.options.types.every((type) =>
            commands.updateAttributes(type, updates)
          )
        },
    }
  },
})

export default BlockTypography
