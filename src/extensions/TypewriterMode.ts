/**
 * Typewriter Mode Extension
 * Keeps cursor vertically centered while typing
 * Optional feature that can be enabled/disabled
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface TypewriterModeOptions {
  /** Whether typewriter mode is enabled */
  enabled: boolean;
}

export interface TypewriterModeStorage {
  enabled: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    typewriterMode: {
      /**
       * Enable typewriter mode
       */
      enableTypewriterMode: () => ReturnType;
      /**
       * Disable typewriter mode
       */
      disableTypewriterMode: () => ReturnType;
      /**
       * Toggle typewriter mode
       */
      toggleTypewriterMode: () => ReturnType;
    };
  }
}

const typewriterPluginKey = new PluginKey('typewriterMode');

export const TypewriterMode = Extension.create<TypewriterModeOptions, TypewriterModeStorage>({
  name: 'typewriterMode',

  addOptions() {
    return {
      enabled: false,
    };
  },

  addStorage() {
    return {
      enabled: this.options.enabled,
    };
  },

  addCommands() {
    return {
      enableTypewriterMode:
        () =>
        ({ editor }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (editor.storage as any).typewriterMode.enabled = true;
          return true;
        },

      disableTypewriterMode:
        () =>
        ({ editor }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (editor.storage as any).typewriterMode.enabled = false;
          return true;
        },

      toggleTypewriterMode:
        () =>
        ({ editor }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const storage = (editor.storage as any).typewriterMode;
          storage.enabled = !storage.enabled;
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: typewriterPluginKey,

        view() {
          return {
            update(view, prevState) {
              // Check if typewriter mode is enabled
              if (!extension.storage.enabled) return;

              // Only scroll when editor has focus
              if (!view.hasFocus()) return;

              // Only scroll when selection changed
              const { from } = view.state.selection;
              const { from: prevFrom } = prevState.selection;
              if (from === prevFrom) return;

              // Get cursor coordinates
              const coords = view.coordsAtPos(from);
              if (!coords) return;

              // Get the editor's scroll container
              const editorDOM = view.dom;
              const scrollContainer =
                editorDOM.closest('.ProseMirror') ||
                editorDOM.parentElement ||
                editorDOM;

              if (!scrollContainer) return;

              // Calculate viewport center
              const rect = scrollContainer.getBoundingClientRect();
              const viewportCenter = rect.top + rect.height / 2;

              // Calculate how much to scroll
              const scrollOffset = coords.top - viewportCenter;

              // Only scroll if cursor is significantly off-center
              // This prevents jittery scrolling on small movements
              if (Math.abs(scrollOffset) > 50) {
                // Smooth scroll to center cursor
                window.scrollBy({
                  top: scrollOffset,
                  left: 0, // Never scroll horizontally
                  behavior: 'smooth',
                });
              }
            },
          };
        },
      }),
    ];
  },
});

export default TypewriterMode;
