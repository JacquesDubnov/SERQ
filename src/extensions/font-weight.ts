/**
 * FontWeight Extension
 *
 * Adds font-weight support to TipTap via TextStyle.
 */

import { Extension } from '@tiptap/core';

export interface FontWeightOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontWeight: {
      setFontWeight: (fontWeight: string) => ReturnType;
      unsetFontWeight: () => ReturnType;
    };
  }
}

export const FontWeight = Extension.create<FontWeightOptions>({
  name: 'fontWeight',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: (element) => element.style.fontWeight || null,
            renderHTML: (attributes) => {
              if (!attributes.fontWeight) {
                return {};
              }
              return {
                style: `font-weight: ${attributes.fontWeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontWeight:
        (fontWeight: string) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontWeight }).run();
        },
      unsetFontWeight:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { fontWeight: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

export default FontWeight;
