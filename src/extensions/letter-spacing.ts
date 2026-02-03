/**
 * LetterSpacing Extension
 *
 * Dual-mode letter-spacing:
 * - When text is selected: applies as inline mark (TextStyle) to selection only
 * - When no selection (just cursor): applies to entire paragraph/block
 */

import { Extension } from '@tiptap/core';

export interface LetterSpacingOptions {
  types: string[];
  blockTypes: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    letterSpacing: {
      setLetterSpacing: (spacing: string) => ReturnType;
      unsetLetterSpacing: () => ReturnType;
    };
  }
}

export const LetterSpacing = Extension.create<LetterSpacingOptions>({
  name: 'letterSpacing',

  addOptions() {
    return {
      types: ['textStyle'],
      blockTypes: ['paragraph', 'heading'],
    };
  },

  addGlobalAttributes() {
    return [
      // Inline attribute (TextStyle) for selected text
      {
        types: this.options.types,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: (element) => element.style.letterSpacing?.replace(/['"]+/g, '') || null,
            renderHTML: (attributes) => {
              if (!attributes.letterSpacing) {
                return {};
              }
              return {
                style: `letter-spacing: ${attributes.letterSpacing}`,
              };
            },
          },
        },
      },
      // Block attribute for paragraphs/headings (when no selection)
      {
        types: this.options.blockTypes,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: (element) => element.style.letterSpacing?.replace(/['"]+/g, '') || null,
            renderHTML: (attributes) => {
              if (!attributes.letterSpacing) {
                return {};
              }
              return {
                style: `letter-spacing: ${attributes.letterSpacing}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLetterSpacing:
        (letterSpacing: string) =>
        ({ chain, state, commands }) => {
          const { empty } = state.selection;

          if (empty) {
            // No selection - apply to entire block
            return this.options.blockTypes.every((type) =>
              commands.updateAttributes(type, { letterSpacing })
            );
          } else {
            // Has selection - apply as inline mark to selected text only
            return chain().setMark('textStyle', { letterSpacing }).run();
          }
        },
      unsetLetterSpacing:
        () =>
        ({ chain, state, commands }) => {
          const { empty } = state.selection;

          if (empty) {
            // No selection - remove from block
            return this.options.blockTypes.every((type) =>
              commands.updateAttributes(type, { letterSpacing: null })
            );
          } else {
            // Has selection - remove inline mark
            return chain().setMark('textStyle', { letterSpacing: null }).removeEmptyTextStyle().run();
          }
        },
    };
  },
});

export default LetterSpacing;
