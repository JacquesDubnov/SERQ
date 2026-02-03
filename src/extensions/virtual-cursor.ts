/**
 * Virtual Cursor Extension
 *
 * Hides the native browser caret and renders a custom cursor using decorations.
 * This prevents the cursor from visually stretching across page gaps in pagination mode.
 *
 * Based on prosemirror-virtual-cursor by ocavue.
 */

import { Extension } from '@tiptap/core';
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

export const VirtualCursor = Extension.create<VirtualCursorOptions>({
  name: 'virtualCursor',

  addOptions() {
    return {
      skipWarning: true, // Skip warnings by default
    };
  },

  addProseMirrorPlugins() {
    return [
      createVirtualCursor({
        skipWarning: this.options.skipWarning,
      }),
    ];
  },
});
