/**
 * LineHeight Extension
 *
 * Block-level line-height attribute for paragraphs and headings.
 * ALWAYS affects the entire block, regardless of text selection.
 */

import { Extension } from '@tiptap/core';

export interface LineHeightOptions {
  types: string[];
  defaultLineHeight: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (height: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export const LineHeight = Extension.create<LineHeightOptions>({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultLineHeight: '1.5',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) => {
          // Apply to all block types in the selection
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { lineHeight })
          );
        },
      unsetLineHeight:
        () =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { lineHeight: null })
          );
        },
    };
  },
});

export default LineHeight;
