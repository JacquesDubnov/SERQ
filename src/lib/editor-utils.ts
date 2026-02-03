/**
 * Editor utility functions for getting current styles at cursor position
 */

import type { Editor } from '@tiptap/core';

// Default styles for different node types
const DEFAULT_STYLES = {
  paragraph: {
    fontFamily: 'Inter, sans-serif', // Default editor font
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  heading: {
    1: { fontSize: '32px', fontWeight: '700', lineHeight: '1.2' },
    2: { fontSize: '24px', fontWeight: '700', lineHeight: '1.3' },
    3: { fontSize: '20px', fontWeight: '600', lineHeight: '1.4' },
    4: { fontSize: '18px', fontWeight: '600', lineHeight: '1.4' },
    5: { fontSize: '16px', fontWeight: '600', lineHeight: '1.5' },
    6: { fontSize: '14px', fontWeight: '600', lineHeight: '1.5' },
  },
};

/**
 * Get the current block node info at cursor position
 */
export function getBlockInfoAtCursor(editor: Editor): { type: string; level?: number; attrs: Record<string, unknown> } {
  const { state } = editor;
  const { from } = state.selection;
  const $pos = state.doc.resolve(from);
  const blockNode = $pos.parent;

  return {
    type: blockNode.type.name,
    level: blockNode.attrs.level as number | undefined,
    attrs: { ...blockNode.attrs },
  };
}

/**
 * Get the textStyle attributes at the current cursor position
 * Returns explicit marks merged with defaults based on node type
 */
export function getTextStyleAtCursor(editor: Editor): Record<string, unknown> {
  const { state } = editor;
  const { from } = state.selection;

  // Get the block context for defaults
  const blockInfo = getBlockInfoAtCursor(editor);

  // Determine defaults based on block type
  let defaults: Record<string, unknown> = { ...DEFAULT_STYLES.paragraph };
  if (blockInfo.type === 'heading' && blockInfo.level) {
    const headingDefaults = DEFAULT_STYLES.heading[blockInfo.level as keyof typeof DEFAULT_STYLES.heading];
    if (headingDefaults) {
      defaults = { ...defaults, ...headingDefaults };
    }
  }

  // Now get explicit marks
  let explicitAttrs: Record<string, unknown> = {};

  // First try stored marks (pending marks to apply)
  if (state.storedMarks) {
    const textStyleMark = state.storedMarks.find(m => m.type.name === 'textStyle');
    if (textStyleMark) {
      explicitAttrs = { ...textStyleMark.attrs };
    }
  } else {
    // Then try to get marks from the position
    const $pos = state.doc.resolve(from);
    const node = $pos.parent;

    // If we're in a text node, check its marks
    if ($pos.textOffset > 0) {
      const marks = $pos.marks();
      const textStyleMark = marks.find(m => m.type.name === 'textStyle');
      if (textStyleMark) {
        explicitAttrs = { ...textStyleMark.attrs };
      }
    } else {
      // Check if there's text before the cursor position in this node
      const index = $pos.index();
      if (index > 0) {
        const nodeBefore = node.child(index - 1);
        if (nodeBefore.isText) {
          const textStyleMark = nodeBefore.marks.find(m => m.type.name === 'textStyle');
          if (textStyleMark) {
            explicitAttrs = { ...textStyleMark.attrs };
          }
        }
      }
    }

    // Fallback to getAttributes which works for selections
    if (Object.keys(explicitAttrs).length === 0) {
      const attrs = editor.getAttributes('textStyle');
      if (attrs && Object.keys(attrs).length > 0) {
        explicitAttrs = attrs;
      }
    }
  }

  // Merge explicit attrs over defaults (explicit values override defaults)
  // Filter out null/undefined explicit values
  const result = { ...defaults };
  for (const [key, value] of Object.entries(explicitAttrs)) {
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }

  console.log('[EditorUtils] Block:', blockInfo.type, blockInfo.level, '| Defaults:', defaults, '| Explicit:', explicitAttrs, '| Result:', result);

  return result;
}

/**
 * Get paragraph/block attributes at cursor position (like textAlign)
 */
export function getBlockAttrsAtCursor(editor: Editor): Record<string, unknown> {
  const blockInfo = getBlockInfoAtCursor(editor);
  return blockInfo.attrs;
}
