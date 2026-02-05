/**
 * Virtual Cursor Extension
 *
 * Hides the native browser caret and renders a custom cursor using decorations.
 * This prevents the cursor from visually stretching across page gaps in pagination mode.
 *
 * Includes zoom correction: the library sets left/top/height in visual px
 * (from getBoundingClientRect), but the cursor element lives inside the
 * transform:scale wrapper where CSS px are unscaled. A MutationObserver
 * divides the library's values by the zoom factor after each update.
 *
 * Based on prosemirror-virtual-cursor by ocavue.
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { createVirtualCursor } from 'prosemirror-virtual-cursor';

// Import the virtual cursor styles
import 'prosemirror-virtual-cursor/style/virtual-cursor.css';

export interface VirtualCursorOptions {
  /**
   * Skip warning for marks with inclusive: false
   * true = skip all warnings, string[] = skip specific marks
   */
  skipWarning?: true | string[];
}

const zoomFixKey = new PluginKey('virtualCursorZoomFix');

export const VirtualCursor = Extension.create<VirtualCursorOptions>({
  name: 'virtualCursor',

  addOptions() {
    return {
      skipWarning: true,
    };
  },

  addProseMirrorPlugins() {
    return [
      createVirtualCursor({
        skipWarning: this.options.skipWarning,
      }),

      // Zoom correction: watches the cursor element for style changes
      // and divides left/top/height by the zoom factor
      new Plugin({
        key: zoomFixKey,
        view(editorView) {
          let observer: MutationObserver | null = null;
          let cursorEl: HTMLElement | null = null;

          const correctStyles = () => {
            if (!cursorEl) return;

            const wrapper = editorView.dom.closest('[data-zoom-wrapper]') as HTMLElement | null;
            if (!wrapper || wrapper.offsetWidth === 0) return;

            const zoom = wrapper.getBoundingClientRect().width / wrapper.offsetWidth;
            if (Math.abs(zoom - 1) < 0.01) return;

            const left = parseFloat(cursorEl.style.left);
            const top = parseFloat(cursorEl.style.top);
            const height = parseFloat(cursorEl.style.height);

            // Disconnect before writing to prevent our changes from re-triggering
            observer?.disconnect();

            if (!isNaN(left)) cursorEl.style.left = `${left / zoom}px`;
            if (!isNaN(top)) cursorEl.style.top = `${top / zoom}px`;
            if (!isNaN(height)) cursorEl.style.height = `${height / zoom}px`;

            // Reconnect
            if (observer && cursorEl) {
              observer.observe(cursorEl, { attributes: true, attributeFilter: ['style'] });
            }
          };

          const findAndSetup = () => {
            const cursor = editorView.dom.querySelector('.prosemirror-virtual-cursor') as HTMLElement | null;
            if (!cursor || cursor === cursorEl) return;

            // New cursor element -- reconnect observer
            observer?.disconnect();
            cursorEl = cursor;
            observer = new MutationObserver(correctStyles);
            observer.observe(cursorEl, { attributes: true, attributeFilter: ['style'] });
          };

          // Initial setup after library has created the cursor
          queueMicrotask(findAndSetup);

          return {
            update: () => findAndSetup(),
            destroy: () => {
              observer?.disconnect();
              observer = null;
              cursorEl = null;
            },
          };
        },
      }),
    ];
  },
});
