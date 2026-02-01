/**
 * LineHeight Extension
 * Applies line-height to blocks (paragraphs, headings)
 */
import { Extension } from '@tiptap/core';

export interface LineHeightOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export const LineHeight = Extension.create<LineHeightOptions>({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem', 'blockquote'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight?.replace(/['"]+/g, '') || null,
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
        ({ tr, state, dispatch }) => {
          console.log('[LineHeight] setLineHeight called with:', lineHeight);
          const { selection } = state;
          const { $from } = selection;

          // Get the parent block node - this is where line-height applies
          const parentNode = $from.parent;
          const parentPos = $from.before($from.depth);

          console.log('[LineHeight] Parent node:', parentNode.type.name, 'at pos:', parentPos);

          if (this.options.types.includes(parentNode.type.name)) {
            console.log('[LineHeight] Applying lineHeight:', lineHeight, 'to', parentNode.type.name);
            tr.setNodeMarkup(parentPos, undefined, {
              ...parentNode.attrs,
              lineHeight,
            });
          }

          if (dispatch) {
            dispatch(tr);
          }
          return true;
        },
      unsetLineHeight:
        () =>
        ({ tr, state, dispatch }) => {
          console.log('[LineHeight] unsetLineHeight called');
          const { selection } = state;
          const { $from } = selection;

          const parentNode = $from.parent;
          const parentPos = $from.before($from.depth);

          if (this.options.types.includes(parentNode.type.name) && parentNode.attrs.lineHeight) {
            const { lineHeight: _, ...restAttrs } = parentNode.attrs;
            tr.setNodeMarkup(parentPos, undefined, restAttrs);
          }

          if (dispatch) {
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

export default LineHeight;
