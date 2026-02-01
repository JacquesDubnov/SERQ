/**
 * LetterSpacing Extension
 * Allows setting letter-spacing on selected text via TextStyle mark
 */
import { Extension } from '@tiptap/core';

export interface LetterSpacingOptions {
  types: string[];
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
    };
  },

  addGlobalAttributes() {
    return [
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
    ];
  },

  addCommands() {
    return {
      setLetterSpacing:
        (spacing: string) =>
        ({ tr, state, dispatch }) => {
          console.log('[LetterSpacing] setLetterSpacing called with:', spacing, 'selection:', state.selection.from, '-', state.selection.to);
          const { from, to, empty } = state.selection;

          if (empty) {
            console.log('[LetterSpacing] Empty selection, cannot apply');
            return false;
          }

          const textStyleType = state.schema.marks.textStyle;
          if (!textStyleType) {
            console.log('[LetterSpacing] textStyle mark not found in schema');
            return false;
          }

          // Apply letterSpacing while preserving other textStyle attributes
          // We need to go through each text node and merge attributes
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isText) {
              const nodeFrom = Math.max(from, pos);
              const nodeTo = Math.min(to, pos + node.nodeSize);

              // Get existing textStyle mark attributes
              const existingMark = node.marks.find(m => m.type.name === 'textStyle');
              const existingAttrs = existingMark ? existingMark.attrs : {};

              console.log('[LetterSpacing] Applying to text node at', pos, 'existing attrs:', existingAttrs);

              // Create new mark with merged attributes
              const newMark = textStyleType.create({
                ...existingAttrs,
                letterSpacing: spacing,
              });

              tr.addMark(nodeFrom, nodeTo, newMark);
            }
          });

          if (dispatch) {
            dispatch(tr);
          }
          return true;
        },
      unsetLetterSpacing:
        () =>
        ({ tr, state, dispatch }) => {
          console.log('[LetterSpacing] unsetLetterSpacing called');
          const { from, to, empty } = state.selection;

          if (empty) {
            return false;
          }

          const textStyleType = state.schema.marks.textStyle;
          if (!textStyleType) {
            return false;
          }

          // Remove letterSpacing by setting it to null
          // We need to iterate through text nodes and update their marks
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isText) {
              const textStyleMark = node.marks.find(m => m.type.name === 'textStyle');
              if (textStyleMark && textStyleMark.attrs.letterSpacing) {
                // Remove the old mark
                tr.removeMark(pos, pos + node.nodeSize, textStyleType);
                // Add new mark without letterSpacing
                const { letterSpacing: _, ...restAttrs } = textStyleMark.attrs;
                const hasOtherAttrs = Object.values(restAttrs).some(v => v != null);
                if (hasOtherAttrs) {
                  tr.addMark(pos, pos + node.nodeSize, textStyleType.create(restAttrs));
                }
              }
            }
          });

          if (dispatch && tr.docChanged) {
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

export default LetterSpacing;
