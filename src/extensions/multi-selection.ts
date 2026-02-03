/**
 * MultiSelection Extension
 *
 * Enables Word-style multi-selection of non-consecutive text.
 * - Hold Cmd (Mac) / Ctrl (Win) and drag to select multiple ranges
 * - All ranges stay highlighted until modifier key is released
 * - Copy includes all selected ranges
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface MultiSelectionOptions {
  /**
   * CSS class for multi-selection highlights
   */
  highlightClass: string;
}

interface SelectionRange {
  from: number;
  to: number;
}

interface MultiSelectionState {
  ranges: SelectionRange[];
  modifierHeld: boolean;
}

const multiSelectionPluginKey = new PluginKey<MultiSelectionState>('multiSelection');

export const MultiSelection = Extension.create<MultiSelectionOptions>({
  name: 'multiSelection',

  addOptions() {
    return {
      highlightClass: 'multi-selection-highlight',
    };
  },

  addProseMirrorPlugins() {
    const { highlightClass } = this.options;

    return [
      new Plugin<MultiSelectionState>({
        key: multiSelectionPluginKey,

        state: {
          init() {
            return {
              ranges: [],
              modifierHeld: false,
            };
          },

          apply(tr, state) {
            // Check for meta updates from our handlers
            const meta = tr.getMeta(multiSelectionPluginKey);
            if (meta) {
              return { ...state, ...meta };
            }

            // If document changed, we need to map our ranges
            if (tr.docChanged && state.ranges.length > 0) {
              const mappedRanges = state.ranges
                .map((range) => ({
                  from: tr.mapping.map(range.from),
                  to: tr.mapping.map(range.to),
                }))
                .filter((range) => range.from < range.to);

              return { ...state, ranges: mappedRanges };
            }

            return state;
          },
        },

        props: {
          decorations(editorState) {
            const pluginState = multiSelectionPluginKey.getState(editorState);
            if (!pluginState || pluginState.ranges.length === 0) {
              return DecorationSet.empty;
            }

            const decorations = pluginState.ranges.map((range) =>
              Decoration.inline(range.from, range.to, {
                class: highlightClass,
              })
            );

            return DecorationSet.create(editorState.doc, decorations);
          },

          handleDOMEvents: {
            keydown(view, event) {
              // Cmd on Mac, Ctrl on Windows/Linux
              if (event.key === 'Meta' || event.key === 'Control') {
                const tr = view.state.tr.setMeta(multiSelectionPluginKey, {
                  modifierHeld: true,
                });
                view.dispatch(tr);
              }
              return false;
            },

            keyup(view, event) {
              if (event.key === 'Meta' || event.key === 'Control') {
                // pluginState not needed here, just clearing state

                // When modifier released, clear saved ranges
                // The current selection remains as the active selection
                const tr = view.state.tr.setMeta(multiSelectionPluginKey, {
                  modifierHeld: false,
                  ranges: [],
                });
                view.dispatch(tr);

                // If we had multiple ranges, we could merge them into a single selection
                // but ProseMirror doesn't support that natively
                // The ranges are preserved via decorations until key release
              }
              return false;
            },

            mouseup(view, _event) {
              const pluginState = multiSelectionPluginKey.getState(view.state);

              // Only save selection if modifier is held
              if (!pluginState?.modifierHeld) {
                return false;
              }

              const { from, to } = view.state.selection;

              // Don't add empty selections
              if (from === to) {
                return false;
              }

              // Add current selection to ranges
              const newRanges = [...pluginState.ranges];

              // Check if this range overlaps with existing ones
              const overlappingIndex = newRanges.findIndex(
                (r) => !(to < r.from || from > r.to)
              );

              if (overlappingIndex >= 0) {
                // Merge overlapping ranges
                const existing = newRanges[overlappingIndex];
                newRanges[overlappingIndex] = {
                  from: Math.min(from, existing.from),
                  to: Math.max(to, existing.to),
                };
              } else {
                // Add new range
                newRanges.push({ from, to });
              }

              // Sort ranges by position
              newRanges.sort((a, b) => a.from - b.from);

              const tr = view.state.tr.setMeta(multiSelectionPluginKey, {
                ranges: newRanges,
              });
              view.dispatch(tr);

              return false;
            },
          },

          // Handle copy to include all selections
          handleKeyDown(view, event) {
            // Intercept Cmd+C / Ctrl+C
            if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
              const pluginState = multiSelectionPluginKey.getState(view.state);

              if (pluginState && pluginState.ranges.length > 0) {
                event.preventDefault();

                // Gather text from all ranges
                const texts: string[] = [];
                const doc = view.state.doc;

                // Include saved ranges
                for (const range of pluginState.ranges) {
                  texts.push(doc.textBetween(range.from, range.to, '\n'));
                }

                // Also include current selection if not empty and not already in ranges
                const { from, to } = view.state.selection;
                if (from !== to) {
                  const currentInRanges = pluginState.ranges.some(
                    (r) => r.from === from && r.to === to
                  );
                  if (!currentInRanges) {
                    texts.push(doc.textBetween(from, to, '\n'));
                  }
                }

                // Copy all texts joined by newlines
                const combinedText = texts.join('\n');
                navigator.clipboard.writeText(combinedText);

                return true;
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});

export default MultiSelection;
