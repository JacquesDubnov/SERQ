/**
 * TextCase Extension
 * Transforms selected text case: uppercase, lowercase, title case, sentence case
 */
import { Extension } from '@tiptap/core';

export type CaseType = 'uppercase' | 'lowercase' | 'titlecase' | 'sentencecase';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textCase: {
      setTextCase: (caseType: CaseType) => ReturnType;
    };
  }
}

function toTitleCase(text: string): string {
  return text.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

function toSentenceCase(text: string): string {
  return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (match) => {
    return match.toUpperCase();
  });
}

function transformCase(text: string, caseType: CaseType): string {
  switch (caseType) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'titlecase':
      return toTitleCase(text);
    case 'sentencecase':
      return toSentenceCase(text);
    default:
      return text;
  }
}

export const TextCase = Extension.create({
  name: 'textCase',

  addCommands() {
    return {
      setTextCase:
        (caseType: CaseType) =>
        ({ tr, state, dispatch }) => {
          const { from, to, empty } = state.selection;
          console.log('[TextCase] setTextCase called with:', caseType, 'selection:', { from, to, empty });

          if (empty) {
            console.log('[TextCase] Empty selection, cannot transform');
            return false;
          }

          // Collect text nodes and their positions
          const textNodes: { from: number; to: number; text: string }[] = [];

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isText && node.text) {
              const nodeStart = pos;
              const nodeEnd = pos + node.nodeSize;

              // Calculate overlap with selection
              const overlapStart = Math.max(from, nodeStart);
              const overlapEnd = Math.min(to, nodeEnd);

              if (overlapStart < overlapEnd) {
                const textStart = overlapStart - nodeStart;
                const textEnd = overlapEnd - nodeStart;
                const text = node.text.substring(textStart, textEnd);

                textNodes.push({
                  from: overlapStart,
                  to: overlapEnd,
                  text,
                });
              }
            }
          });

          if (textNodes.length === 0) {
            return false;
          }

          // Apply transformations in reverse order to preserve positions
          textNodes.reverse().forEach(({ from: nodeFrom, to: nodeTo, text }) => {
            const transformed = transformCase(text, caseType);
            if (text !== transformed) {
              tr.insertText(transformed, nodeFrom, nodeTo);
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

export default TextCase;
