/**
 * LineNumbers Extension
 * Renders line numbers in a gutter or margin with viewport optimization
 * Supports code-style (1, 2, 3...) or legal-style (5, 10, 15...)
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { LineNumberSettings } from '../../stores/editorStore';

export interface LineNumbersOptions {
  /** Callback to get current settings from store */
  getSettings: () => LineNumberSettings;
}

// Plugin key for state tracking
const lineNumbersPluginKey = new PluginKey('lineNumbers');

// CSS class for the gutter container
const GUTTER_CLASS = 'line-number-gutter';
const LINE_NUMBER_CLASS = 'line-number';

/**
 * Create or get the gutter DOM element
 */
function getOrCreateGutter(view: EditorView): HTMLElement {
  const editorWrapper = view.dom.closest('.editor-wrapper');
  if (!editorWrapper) return document.createElement('div');

  let gutter = editorWrapper.querySelector(`.${GUTTER_CLASS}`) as HTMLElement;
  if (!gutter) {
    gutter = document.createElement('div');
    gutter.className = GUTTER_CLASS;
    editorWrapper.insertBefore(gutter, editorWrapper.firstChild);
  }
  return gutter;
}

/**
 * Get line positions in the document
 * Returns array of { lineNumber, top } for each block-level node
 */
function getLinePositions(view: EditorView): Array<{ lineNumber: number; top: number }> {
  const lines: Array<{ lineNumber: number; top: number }> = [];
  const { doc } = view.state;
  let lineNumber = 1;

  // Get the editor DOM rect for relative positioning
  const editorRect = view.dom.getBoundingClientRect();

  // Iterate through top-level nodes
  doc.forEach((_node: unknown, offset: number) => {
    // Get coordinates at the start of this node
    const coords = view.coordsAtPos(offset + 1);
    if (coords) {
      lines.push({
        lineNumber,
        top: coords.top - editorRect.top,
      });
    }
    lineNumber++;
  });

  return lines;
}

/**
 * Get visible viewport bounds
 */
function getViewportBounds(): { top: number; bottom: number } {
  return {
    top: window.scrollY,
    bottom: window.scrollY + window.innerHeight,
  };
}

/**
 * Filter lines to only those visible in viewport (with buffer)
 */
function getVisibleLines(
  lines: Array<{ lineNumber: number; top: number }>,
  editorRect: DOMRect,
  viewportBounds: { top: number; bottom: number }
): Array<{ lineNumber: number; top: number }> {
  const buffer = 200; // Render a bit outside viewport for smooth scrolling
  const viewportTop = viewportBounds.top - editorRect.top - buffer;
  const viewportBottom = viewportBounds.bottom - editorRect.top + buffer;

  return lines.filter(line =>
    line.top >= viewportTop && line.top <= viewportBottom
  );
}

/**
 * Render line numbers to gutter
 */
function renderLineNumbers(
  view: EditorView,
  settings: LineNumberSettings
): void {
  const gutter = getOrCreateGutter(view);

  if (!settings.enabled) {
    gutter.style.display = 'none';
    gutter.innerHTML = '';
    return;
  }

  gutter.style.display = 'block';
  gutter.dataset.position = settings.position;

  const lines = getLinePositions(view);
  const editorRect = view.dom.getBoundingClientRect();
  const viewportBounds = getViewportBounds();

  // Only render visible lines (viewport optimization)
  const visibleLines = getVisibleLines(lines, editorRect, viewportBounds);

  // Build line number elements
  const fragment = document.createDocumentFragment();

  for (const line of visibleLines) {
    // Legal style: only show every 5th line
    if (settings.style === 'legal' && line.lineNumber % 5 !== 0) {
      continue;
    }

    const lineEl = document.createElement('span');
    lineEl.className = LINE_NUMBER_CLASS;
    lineEl.textContent = String(line.lineNumber);
    lineEl.style.top = `${line.top}px`;
    fragment.appendChild(lineEl);
  }

  gutter.innerHTML = '';
  gutter.appendChild(fragment);
}

/**
 * Debounce function for scroll/resize handlers
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export const LineNumbers = Extension.create<LineNumbersOptions>({
  name: 'lineNumbers',

  addOptions() {
    return {
      getSettings: () => ({
        enabled: false,
        position: 'gutter' as const,
        style: 'code' as const,
      }),
    };
  },

  addProseMirrorPlugins() {
    const { getSettings } = this.options;

    return [
      new Plugin({
        key: lineNumbersPluginKey,

        view(editorView) {
          // Initial render
          const settings = getSettings();
          renderLineNumbers(editorView, settings);

          // Create debounced scroll handler
          const handleScroll = debounce(() => {
            const currentSettings = getSettings();
            if (currentSettings.enabled) {
              renderLineNumbers(editorView, currentSettings);
            }
          }, 16); // ~60fps

          // Create resize handler
          const handleResize = debounce(() => {
            const currentSettings = getSettings();
            if (currentSettings.enabled) {
              renderLineNumbers(editorView, currentSettings);
            }
          }, 100);

          // Add scroll and resize listeners
          window.addEventListener('scroll', handleScroll, { passive: true });
          window.addEventListener('resize', handleResize, { passive: true });

          return {
            update(view) {
              // Re-render on doc changes
              const currentSettings = getSettings();
              renderLineNumbers(view, currentSettings);
            },

            destroy() {
              // Clean up
              window.removeEventListener('scroll', handleScroll);
              window.removeEventListener('resize', handleResize);

              // Remove gutter
              const gutter = editorView.dom.closest('.editor-wrapper')?.querySelector(`.${GUTTER_CLASS}`);
              gutter?.remove();
            },
          };
        },
      }),
    ];
  },
});

export default LineNumbers;
