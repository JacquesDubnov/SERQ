/**
 * MultiSelect Extension
 * Allows selecting non-sequential text ranges with Cmd modifier
 *
 * Usage:
 * 1. Select your first chunk normally (click and drag)
 * 2. Hold Cmd
 * 3. Click and drag to select another chunk elsewhere
 * 4. Keep holding Cmd to add more selections
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface MultiSelectOptions {
  selectionClass?: string;
}

export interface SelectionRange {
  from: number;
  to: number;
}

interface MultiSelectState {
  ranges: SelectionRange[];
  pendingSelection: SelectionRange | null;
}

export const multiSelectPluginKey = new PluginKey<MultiSelectState>('multiSelect');

export const MultiSelect = Extension.create<MultiSelectOptions>({
  name: 'multiSelect',

  addOptions() {
    return {
      selectionClass: 'multi-selection',
    };
  },

  addProseMirrorPlugins() {
    const { selectionClass } = this.options;
    let isDragging = false;
    let cmdHeldOnMouseDown = false;

    return [
      new Plugin({
        key: multiSelectPluginKey,

        state: {
          init(): MultiSelectState {
            return {
              ranges: [],
              pendingSelection: null,
            };
          },

          apply(tr, pluginState): MultiSelectState {
            const meta = tr.getMeta(multiSelectPluginKey);

            if (meta) {
              if (meta.type === 'clear') {
                return { ranges: [], pendingSelection: null };
              }
              if (meta.type === 'addRange') {
                // Avoid duplicates
                const exists = pluginState.ranges.some(
                  r => r.from === meta.range.from && r.to === meta.range.to
                );
                if (!exists) {
                  return {
                    ...pluginState,
                    ranges: [...pluginState.ranges, meta.range],
                  };
                }
              }
              if (meta.type === 'setRanges') {
                return { ...pluginState, ranges: meta.ranges };
              }
            }

            return pluginState;
          },
        },

        props: {
          decorations(state) {
            const pluginState = multiSelectPluginKey.getState(state);
            if (!pluginState || pluginState.ranges.length === 0) {
              return DecorationSet.empty;
            }

            const decorations = pluginState.ranges.map((range) =>
              Decoration.inline(range.from, range.to, {
                class: selectionClass,
              })
            );

            return DecorationSet.create(state.doc, decorations);
          },

          handleDOMEvents: {
            mousedown(view, event) {
              cmdHeldOnMouseDown = event.metaKey || event.ctrlKey;

              if (cmdHeldOnMouseDown) {
                const { from, to } = view.state.selection;

                // If there's a real selection, save it before starting new one
                if (from !== to) {
                  console.log('[MultiSelect] Cmd+mousedown - saving current selection:', from, to);
                  const { tr } = view.state;
                  tr.setMeta(multiSelectPluginKey, {
                    type: 'addRange',
                    range: { from, to },
                  });
                  view.dispatch(tr);
                }

                isDragging = true;
              } else {
                // No Cmd - clear all additional selections
                const pluginState = multiSelectPluginKey.getState(view.state);
                if (pluginState && pluginState.ranges.length > 0) {
                  console.log('[MultiSelect] Clearing selections (no Cmd held)');
                  const { tr } = view.state;
                  tr.setMeta(multiSelectPluginKey, { type: 'clear' });
                  view.dispatch(tr);
                }
              }

              return false; // Don't prevent default
            },

            mouseup(view, event) {
              if (isDragging && cmdHeldOnMouseDown) {
                isDragging = false;
                // The new selection is now the browser's selection
                // It will be captured on next Cmd+mousedown
                console.log('[MultiSelect] Cmd+mouseup - new selection created');
              }
              cmdHeldOnMouseDown = false;
              return false;
            },
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      clearMultiSelect:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(multiSelectPluginKey, { type: 'clear' });
            dispatch(tr);
          }
          return true;
        },

      getMultiSelectRanges:
        () =>
        ({ state }) => {
          const pluginState = multiSelectPluginKey.getState(state);
          const { from, to } = state.selection;
          const currentSelection = from !== to ? [{ from, to }] : [];
          const additionalRanges = pluginState?.ranges || [];
          return [...additionalRanges, ...currentSelection];
        },
    };
  },
});

export default MultiSelect;
