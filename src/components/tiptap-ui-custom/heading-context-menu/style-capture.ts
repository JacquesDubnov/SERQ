/**
 * Style Capture Utility
 *
 * Captures the current block's style (typography, marks) for assigning to heading types.
 *
 * IMPORTANT: TipTap stores styles in multiple places:
 * - NODE attributes (block-level): lineHeight, letterSpacing, backgroundColor, textAlign
 * - MARK attributes (textStyle mark): fontFamily, fontSize, fontWeight, color, letterSpacing, lineHeight
 * - Individual MARKS: bold, italic, underline, strike
 *
 * The capture priority is:
 * 1. First text node marks (most likely to have inline styling)
 * 2. Node attributes (block-level)
 * 3. Computed styles (DOM fallback)
 */

import type { Editor } from '@tiptap/core';
import type { HeadingCustomStyle } from '@/stores/styleStore';

/**
 * Parse a CSS value to extract numeric component
 */
function parseNumericValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const str = String(value);
  // Remove units like 'px', 'em', 'rem', '%'
  const cleaned = str.replace(/[a-z%]/gi, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Convert RGB/RGBA color string to hex
 */
function rgbToHex(rgb: string): string {
  if (!rgb) return '';
  // If already hex, return as-is
  if (rgb.startsWith('#')) return rgb;

  // Parse rgb(r, g, b) or rgba(r, g, b, a)
  const match = rgb.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return rgb;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Capture the style of the current selection's block for heading assignment.
 * This extracts typography attributes and marks from the current block.
 */
export function captureBlockStyle(editor: Editor): HeadingCustomStyle {
  const { state } = editor;
  const { $from } = state.selection;
  const node = $from.parent;

  // Initialize style object
  let fontFamily: string | null = null;
  let fontSize: number | null = null;
  let fontWeight: number | null = null;
  let letterSpacing: number | null = null;
  let lineHeight: number | null = null;
  let textColor: string | null = null;
  let backgroundColor: string | null = null;
  let bold = false;
  let italic = false;
  let underline = false;
  let strikethrough = false;

  // === SCAN ALL TEXT CONTENT FOR MARKS ===
  // This is more reliable than just checking $from.marks()
  if (node.content.size > 0) {
    node.descendants((child) => {
      if (!child.isText) return;

      child.marks.forEach((mark) => {
        if (mark.type.name === 'textStyle') {
          const attrs = mark.attrs;
          // Use first non-null value found
          if (!fontFamily && attrs.fontFamily) fontFamily = attrs.fontFamily;
          if (fontSize === null && attrs.fontSize) {
            fontSize = parseNumericValue(attrs.fontSize);
          }
          if (fontWeight === null && attrs.fontWeight) {
            fontWeight = parseNumericValue(attrs.fontWeight);
          }
          if (letterSpacing === null && attrs.letterSpacing) {
            letterSpacing = parseNumericValue(attrs.letterSpacing);
          }
          if (lineHeight === null && attrs.lineHeight) {
            lineHeight = parseNumericValue(attrs.lineHeight);
          }
          if (!textColor && attrs.color) {
            textColor = rgbToHex(attrs.color);
          }
        }
        if (mark.type.name === 'bold') bold = true;
        if (mark.type.name === 'italic') italic = true;
        if (mark.type.name === 'underline') underline = true;
        if (mark.type.name === 'strike') strikethrough = true;
      });
    });
  }

  // Also check marks at cursor position
  const cursorMarks = state.selection.$from.marks();
  cursorMarks.forEach((mark) => {
    if (mark.type.name === 'textStyle') {
      const attrs = mark.attrs;
      if (!fontFamily && attrs.fontFamily) fontFamily = attrs.fontFamily;
      if (fontSize === null && attrs.fontSize) {
        fontSize = parseNumericValue(attrs.fontSize);
      }
      if (fontWeight === null && attrs.fontWeight) {
        fontWeight = parseNumericValue(attrs.fontWeight);
      }
      if (letterSpacing === null && attrs.letterSpacing) {
        letterSpacing = parseNumericValue(attrs.letterSpacing);
      }
      if (lineHeight === null && attrs.lineHeight) {
        lineHeight = parseNumericValue(attrs.lineHeight);
      }
      if (!textColor && attrs.color) {
        textColor = rgbToHex(attrs.color);
      }
    }
    if (mark.type.name === 'bold') bold = true;
    if (mark.type.name === 'italic') italic = true;
    if (mark.type.name === 'underline') underline = true;
    if (mark.type.name === 'strike') strikethrough = true;
  });

  // === BLOCK-LEVEL NODE ATTRIBUTES ===
  if (node.attrs) {
    // lineHeight can be a block attribute
    if (lineHeight === null && node.attrs.lineHeight) {
      lineHeight = parseNumericValue(node.attrs.lineHeight);
    }
    // letterSpacing can be block-level
    if (letterSpacing === null && node.attrs.letterSpacing) {
      letterSpacing = parseNumericValue(node.attrs.letterSpacing);
    }
    // backgroundColor is a block attribute
    if (!backgroundColor && node.attrs.backgroundColor) {
      backgroundColor = rgbToHex(node.attrs.backgroundColor);
    }
    // Some extensions store typography on node
    if (!fontFamily && node.attrs.fontFamily) {
      fontFamily = node.attrs.fontFamily;
    }
    if (fontSize === null && node.attrs.fontSize) {
      fontSize = parseNumericValue(node.attrs.fontSize);
    }
    if (fontWeight === null && node.attrs.fontWeight) {
      fontWeight = parseNumericValue(node.attrs.fontWeight);
    }
  }

  console.log('[StyleCapture] Block style captured:', {
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    textColor,
    backgroundColor,
    bold,
    italic,
    underline,
    strikethrough,
  });

  return {
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    bold,
    italic,
    underline,
    strikethrough,
    textColor,
    backgroundColor,
    divider: null, // Divider is configured separately, not captured
  };
}

/**
 * Get computed style values from the DOM for a more accurate capture.
 * Uses captureBlockStyle first, then fills in missing values from computed styles.
 */
export function captureComputedStyle(editor: Editor): HeadingCustomStyle {
  const baseStyle = captureBlockStyle(editor);

  // Try to get computed styles from the DOM
  const { view, state } = editor;
  const { from } = state.selection;

  try {
    const domNode = view.domAtPos(from);
    if (domNode.node instanceof Element || domNode.node.parentElement) {
      const element = domNode.node instanceof Element
        ? domNode.node
        : domNode.node.parentElement;

      if (element) {
        const computed = window.getComputedStyle(element);

        // Only use computed values if we didn't get them from marks/attrs
        if (baseStyle.fontFamily === null) {
          // Clean up font family string
          let family = computed.fontFamily || null;
          if (family) {
            // Remove quotes and take first font in stack
            family = family.split(',')[0].replace(/['"]/g, '').trim();
          }
          baseStyle.fontFamily = family;
        }

        if (baseStyle.fontSize === null) {
          const size = parseFloat(computed.fontSize);
          if (!isNaN(size)) baseStyle.fontSize = Math.round(size);
        }

        if (baseStyle.fontWeight === null) {
          const weight = parseInt(computed.fontWeight, 10);
          if (!isNaN(weight)) baseStyle.fontWeight = weight;
        }

        if (baseStyle.letterSpacing === null && computed.letterSpacing !== 'normal') {
          const spacing = parseFloat(computed.letterSpacing);
          if (!isNaN(spacing)) baseStyle.letterSpacing = Math.round(spacing * 10) / 10;
        }

        if (baseStyle.lineHeight === null && computed.lineHeight !== 'normal') {
          const lh = parseFloat(computed.lineHeight);
          const fs = baseStyle.fontSize || parseFloat(computed.fontSize);
          if (!isNaN(lh) && !isNaN(fs) && fs > 0) {
            // Convert to ratio, round to 1 decimal
            baseStyle.lineHeight = Math.round((lh / fs) * 10) / 10;
          }
        }

        if (baseStyle.textColor === null) {
          baseStyle.textColor = rgbToHex(computed.color);
        }

        if (baseStyle.backgroundColor === null) {
          const bg = computed.backgroundColor;
          // Only capture if not transparent/default
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            baseStyle.backgroundColor = rgbToHex(bg);
          }
        }

        // Check text-decoration for underline and strikethrough
        const textDecoration = computed.textDecorationLine || computed.textDecoration || '';
        if (!baseStyle.underline && textDecoration.includes('underline')) {
          baseStyle.underline = true;
        }
        if (!baseStyle.strikethrough && textDecoration.includes('line-through')) {
          baseStyle.strikethrough = true;
        }

        // Check font-style for italic
        if (!baseStyle.italic && computed.fontStyle === 'italic') {
          baseStyle.italic = true;
        }

        // Check font-weight for bold (700+)
        const computedWeight = parseInt(computed.fontWeight, 10);
        if (!baseStyle.bold && computedWeight >= 700) {
          baseStyle.bold = true;
        }
      }
    }
  } catch (err) {
    console.warn('[StyleCapture] Error getting computed styles:', err);
  }

  console.log('[StyleCapture] Final captured style:', baseStyle);

  return baseStyle;
}
