/**
 * Editor utility functions for getting current styles at cursor position
 *
 * IMPORTANT: This file is the bridge between the toolbar components and the
 * unified style system. When in a heading, it reads custom styles from the
 * styleStore (which holds heading-level styles) and merges them with defaults.
 */

import type { Editor } from '@tiptap/core';
import { useStyleStore } from '@/stores/styleStore';

/**
 * Resolve a CSS variable to its computed value
 * Returns the original value if not a CSS variable or can't be resolved
 */
export function resolveCssVariable(value: string | null | undefined): string | null {
  if (!value) return null;

  if (value.startsWith('var(')) {
    const varName = value.slice(4, -1).trim(); // Extract variable name
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return resolved || value;
  }
  return value;
}

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
 * Returns the style values for the current block
 *
 * IMPORTANT: ONE SOURCE OF TRUTH
 * - For headings WITH custom styles: styleStore is THE source (no TipTap fallback)
 * - For headings WITHOUT custom styles: TipTap marks + defaults
 * - For paragraphs: TipTap marks + defaults
 */
export function getTextStyleAtCursor(editor: Editor): Record<string, unknown> {
  const { state } = editor;
  const { from } = state.selection;

  // Get the block context
  const blockInfo = getBlockInfoAtCursor(editor);

  // Check if this is a heading with a custom style assigned
  if (blockInfo.type === 'heading' && blockInfo.level) {
    const level = blockInfo.level as 1 | 2 | 3 | 4 | 5 | 6;
    const customStyle = useStyleStore.getState().getHeadingCustomStyle(level);

    if (customStyle) {
      // HEADING WITH CUSTOM STYLE: styleStore IS the source of truth
      // Do NOT fall back to TipTap marks - they should not exist
      const headingDefaults = DEFAULT_STYLES.heading[level as keyof typeof DEFAULT_STYLES.heading] || {};
      const result: Record<string, unknown> = {
        fontFamily: customStyle.fontFamily ?? DEFAULT_STYLES.paragraph.fontFamily,
        fontSize: customStyle.fontSize !== null ? `${customStyle.fontSize}px` : (headingDefaults.fontSize || DEFAULT_STYLES.paragraph.fontSize),
        fontWeight: customStyle.fontWeight !== null ? String(customStyle.fontWeight) : (headingDefaults.fontWeight || DEFAULT_STYLES.paragraph.fontWeight),
        letterSpacing: customStyle.letterSpacing !== null ? `${customStyle.letterSpacing}px` : DEFAULT_STYLES.paragraph.letterSpacing,
        lineHeight: customStyle.lineHeight !== null ? String(customStyle.lineHeight) : (headingDefaults.lineHeight || DEFAULT_STYLES.paragraph.lineHeight),
        color: customStyle.textColor ?? undefined,
      };

      console.log('[EditorUtils] Heading with custom style - H' + level + ' | Result:', result);
      return result;
    }
  }

  // PARAGRAPH or HEADING WITHOUT CUSTOM STYLE: Use TipTap marks + defaults
  let defaults: Record<string, unknown> = { ...DEFAULT_STYLES.paragraph };
  if (blockInfo.type === 'heading' && blockInfo.level) {
    const headingDefaults = DEFAULT_STYLES.heading[blockInfo.level as keyof typeof DEFAULT_STYLES.heading];
    if (headingDefaults) {
      defaults = { ...defaults, ...headingDefaults };
    }
  }

  // Get explicit marks from TipTap
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

  // Merge explicit attrs over defaults
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
 * Get mark states (bold, italic, underline, strikethrough) at cursor
 * For headings, checks styleStore for custom heading styles
 */
export function getMarkStatesAtCursor(editor: Editor): {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
} {
  const blockInfo = getBlockInfoAtCursor(editor);

  // Default: check TipTap editor state
  let bold = editor.isActive('bold');
  let italic = editor.isActive('italic');
  let underline = editor.isActive('underline');
  let strikethrough = editor.isActive('strike');

  // For headings, check styleStore for custom styles
  if (blockInfo.type === 'heading' && blockInfo.level) {
    const level = blockInfo.level as 1 | 2 | 3 | 4 | 5 | 6;
    const customStyle = useStyleStore.getState().getHeadingCustomStyle(level);
    if (customStyle) {
      // If heading has custom style, use those values
      bold = customStyle.bold;
      italic = customStyle.italic;
      underline = customStyle.underline;
      strikethrough = customStyle.strikethrough;
    }
  }

  return { bold, italic, underline, strikethrough };
}

/**
 * Get text color at cursor position
 * For headings, checks styleStore for custom heading styles
 */
export function getTextColorAtCursor(editor: Editor): string | null {
  const blockInfo = getBlockInfoAtCursor(editor);

  // For headings, check styleStore first
  if (blockInfo.type === 'heading' && blockInfo.level) {
    const level = blockInfo.level as 1 | 2 | 3 | 4 | 5 | 6;
    const customStyle = useStyleStore.getState().getHeadingCustomStyle(level);
    if (customStyle?.textColor) {
      // Resolve CSS variable to actual color
      const color = customStyle.textColor;
      if (color.startsWith('var(')) {
        const varName = color.slice(4, -1); // Extract variable name
        const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        return resolved || color;
      }
      return color;
    }
  }

  // Default: check TipTap editor state
  const attrs = editor.getAttributes('textStyle');
  return attrs.color || null;
}

/**
 * Get highlight/background color at cursor position
 * For headings, checks styleStore for custom heading styles
 */
export function getHighlightColorAtCursor(editor: Editor): string | null {
  const blockInfo = getBlockInfoAtCursor(editor);

  // For headings, check styleStore first
  if (blockInfo.type === 'heading' && blockInfo.level) {
    const level = blockInfo.level as 1 | 2 | 3 | 4 | 5 | 6;
    const customStyle = useStyleStore.getState().getHeadingCustomStyle(level);
    if (customStyle?.backgroundColor) {
      return customStyle.backgroundColor;
    }
  }

  // Default: check TipTap editor state
  const attrs = editor.getAttributes('highlight');
  return attrs.color || null;
}

/**
 * Get paragraph/block attributes at cursor position (like textAlign, lineHeight)
 *
 * For headings, merges custom heading styles from styleStore
 */
export function getBlockAttrsAtCursor(editor: Editor): Record<string, unknown> {
  const blockInfo = getBlockInfoAtCursor(editor);
  const attrs = { ...blockInfo.attrs };

  // For headings, check for custom styles in styleStore
  if (blockInfo.type === 'heading' && blockInfo.level) {
    const level = blockInfo.level as 1 | 2 | 3 | 4 | 5 | 6;
    const customStyle = useStyleStore.getState().getHeadingCustomStyle(level);
    if (customStyle) {
      // Apply custom lineHeight if set
      if (customStyle.lineHeight !== null) {
        attrs.lineHeight = String(customStyle.lineHeight);
      }
      // Apply custom letterSpacing if set (some components use block attrs)
      if (customStyle.letterSpacing !== null) {
        attrs.letterSpacing = `${customStyle.letterSpacing}px`;
      }
    }
  }

  return attrs;
}
