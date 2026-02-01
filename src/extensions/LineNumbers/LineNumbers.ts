/**
 * LineNumbers Extension
 * Two modes:
 * - Regular: Numbers each paragraph/block
 * - Legal: Numbers every visual line (including wrapped lines)
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { useEditorStore } from '../../stores/editorStore';
import type { LineNumberSettings } from '../../stores/editorStore';

export interface LineNumbersOptions {
  getSettings: () => LineNumberSettings;
}

const lineNumbersPluginKey = new PluginKey('lineNumbers');
const GUTTER_CLASS = 'line-number-gutter';

/**
 * Get line positions for REGULAR mode (per paragraph/block)
 * Centers the number with the first line of each block
 */
function getRegularLinePositions(view: EditorView): number[] {
  const tiptap = view.dom;
  const tiptapRect = tiptap.getBoundingClientRect();
  const { doc } = view.state;
  const positions: number[] = [];

  doc.forEach((_node, offset) => {
    try {
      const coords = view.coordsAtPos(offset + 1);
      if (coords) {
        // Get the DOM node for this position to calculate proper centering
        const domNode = view.nodeDOM(offset) as HTMLElement | null;
        let lineHeight = 24; // fallback

        if (domNode) {
          const style = window.getComputedStyle(domNode);
          lineHeight = parseFloat(style.lineHeight);
          if (isNaN(lineHeight) || style.lineHeight === 'normal') {
            const fontSize = parseFloat(style.fontSize) || 16;
            lineHeight = fontSize * 1.4;
          }
        }

        // Center: top position + half line height - half number height (13px font ~ 7px)
        const centeredTop = (coords.top - tiptapRect.top) + (lineHeight / 2) - 7;
        positions.push(centeredTop);
      }
    } catch {
      // coordsAtPos can throw
    }
  });

  return positions;
}

/**
 * Get line positions for LEGAL mode (every visual line)
 * Walks through actual block elements and calculates real line positions
 */
function getLegalLinePositions(view: EditorView): number[] {
  const tiptap = view.dom;
  const tiptapRect = tiptap.getBoundingClientRect();
  const positions: number[] = [];

  // Get all block-level elements (paragraphs, headings, list items, etc.)
  const blocks = tiptap.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote > p, .callout-content > p, pre');

  blocks.forEach((block) => {
    const blockEl = block as HTMLElement;
    const blockRect = blockEl.getBoundingClientRect();
    const blockStyle = window.getComputedStyle(blockEl);

    // Get the actual line height for this block
    let lineHeight = parseFloat(blockStyle.lineHeight);
    if (isNaN(lineHeight) || blockStyle.lineHeight === 'normal') {
      // 'normal' is typically 1.2 * font-size
      const fontSize = parseFloat(blockStyle.fontSize) || 16;
      lineHeight = fontSize * 1.4;
    }

    // Calculate how many visual lines this block contains
    const blockHeight = blockRect.height;
    const numLines = Math.max(1, Math.round(blockHeight / lineHeight));

    // Position relative to tiptap
    const blockTop = blockRect.top - tiptapRect.top;

    // Add a position for each line in this block
    for (let i = 0; i < numLines; i++) {
      // Center the number vertically within each line
      const lineTop = blockTop + (i * lineHeight) + (lineHeight / 2) - 7; // -7 to center the 13px font
      positions.push(lineTop);
    }
  });

  return positions;
}

/**
 * Render line numbers
 */
function renderLineNumbers(view: EditorView, settings: LineNumberSettings): void {
  const editorContent = view.dom.parentElement;
  if (!editorContent) return;

  let gutter = editorContent.querySelector(`.${GUTTER_CLASS}`) as HTMLElement;

  if (!settings.enabled) {
    if (gutter) {
      gutter.style.display = 'none';
    }
    return;
  }

  if (!gutter) {
    gutter = document.createElement('div');
    gutter.className = GUTTER_CLASS;
    editorContent.insertBefore(gutter, view.dom);
  }

  gutter.style.display = 'block';

  // Position gutter to match tiptap's vertical position
  const tiptapRect = view.dom.getBoundingClientRect();
  const editorContentRect = editorContent.getBoundingClientRect();
  const tiptapOffset = tiptapRect.top - editorContentRect.top;
  gutter.style.top = `${tiptapOffset}px`;

  // Get line positions based on style
  const positions = settings.style === 'legal'
    ? getLegalLinePositions(view)
    : getRegularLinePositions(view);

  // Build line numbers
  gutter.innerHTML = '';
  positions.forEach((top, index) => {
    const span = document.createElement('span');
    span.className = 'line-number';
    span.textContent = String(index + 1);
    span.style.top = `${top}px`;
    gutter.appendChild(span);
  });
}

export const LineNumbers = Extension.create<LineNumbersOptions>({
  name: 'lineNumbers',

  addOptions() {
    return {
      getSettings: () => ({
        enabled: false,
        style: 'regular' as const,
      }),
    };
  },

  addProseMirrorPlugins() {
    const { getSettings } = this.options;

    return [
      new Plugin({
        key: lineNumbersPluginKey,

        view(editorView) {
          // Subscribe to store changes
          let prevSettings = { ...getSettings() };
          const unsubscribe = useEditorStore.subscribe((state) => {
            const current = state.lineNumbers;
            if (current.enabled !== prevSettings.enabled || current.style !== prevSettings.style) {
              prevSettings = { ...current };
              renderLineNumbers(editorView, current);
            }
          });

          // Initial render
          setTimeout(() => {
            renderLineNumbers(editorView, getSettings());
          }, 100);

          return {
            update(view) {
              const settings = getSettings();
              if (settings.enabled) {
                renderLineNumbers(view, settings);
              }
            },

            destroy() {
              unsubscribe();
              const editorContent = editorView.dom.parentElement;
              const gutter = editorContent?.querySelector(`.${GUTTER_CLASS}`);
              gutter?.remove();
            },
          };
        },
      }),
    ];
  },
});

export default LineNumbers;
