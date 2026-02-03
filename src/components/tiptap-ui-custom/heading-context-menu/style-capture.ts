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
 *
 * IMPORTANT: This captures from TipTap marks, which is only valid BEFORE
 * marks are cleared. After assignment, styleStore becomes the source of truth.
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

  console.log('[StyleCapture] ========== STYLE CAPTURE START ==========');
  console.log('[StyleCapture] Cursor position node:', node.type.name, '| level:', node.attrs?.level);
  console.log('[StyleCapture] Node content size:', node.content.size);
  console.log('[StyleCapture] Node text content:', node.textContent?.substring(0, 50));

  // DUMP ALL MARKS ON ALL TEXT - comprehensive debug
  console.log('[StyleCapture] --- Scanning ALL text nodes for marks ---');
  let textNodeCount = 0;

  // === SCAN ALL TEXT CONTENT FOR MARKS ===
  // This is more reliable than just checking $from.marks()
  if (node.content.size > 0) {
    node.descendants((child) => {
      if (!child.isText) return;

      textNodeCount++;
      console.log(`[StyleCapture] Text node #${textNodeCount}: "${child.text?.substring(0, 30)}..." | marks: ${child.marks.length}`);

      child.marks.forEach((mark, idx) => {
        console.log(`[StyleCapture]   Mark ${idx}: ${mark.type.name} | ALL attrs:`, JSON.stringify(mark.attrs));

        if (mark.type.name === 'textStyle') {
          const attrs = mark.attrs;
          // Use first non-null value found
          if (!fontFamily && attrs.fontFamily) {
            fontFamily = attrs.fontFamily;
            console.log('[StyleCapture] Captured fontFamily from textStyle mark:', fontFamily);
          }
          if (fontSize === null && attrs.fontSize) {
            fontSize = parseNumericValue(attrs.fontSize);
            console.log('[StyleCapture] Captured fontSize:', fontSize);
          }
          if (fontWeight === null && attrs.fontWeight) {
            fontWeight = parseNumericValue(attrs.fontWeight);
            console.log('[StyleCapture] Captured fontWeight:', fontWeight);
          }
          if (letterSpacing === null && attrs.letterSpacing) {
            letterSpacing = parseNumericValue(attrs.letterSpacing);
            console.log('[StyleCapture] Captured letterSpacing:', letterSpacing);
          }
          if (lineHeight === null && attrs.lineHeight) {
            lineHeight = parseNumericValue(attrs.lineHeight);
            console.log('[StyleCapture] Captured lineHeight:', lineHeight);
          }
          if (!textColor && attrs.color) {
            textColor = rgbToHex(attrs.color);
            console.log('[StyleCapture] Captured textColor:', textColor);
          }
        }
        if (mark.type.name === 'bold') {
          bold = true;
          console.log('[StyleCapture] Captured bold mark');
        }
        if (mark.type.name === 'italic') {
          italic = true;
          console.log('[StyleCapture] Captured italic mark');
        }
        if (mark.type.name === 'underline') {
          underline = true;
          console.log('[StyleCapture] Captured underline mark');
        }
        if (mark.type.name === 'strike') {
          strikethrough = true;
          console.log('[StyleCapture] Captured strikethrough mark');
        }
      });
    });
  }

  // Also check marks at cursor position
  const cursorMarks = state.selection.$from.marks();
  console.log('[StyleCapture] Cursor has', cursorMarks.length, 'marks');

  cursorMarks.forEach((mark) => {
    if (mark.type.name === 'textStyle') {
      const attrs = mark.attrs;
      if (!fontFamily && attrs.fontFamily) {
        fontFamily = attrs.fontFamily;
        console.log('[StyleCapture] Captured fontFamily from cursor mark:', fontFamily);
      }
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
    console.log('[StyleCapture] Node attributes:', JSON.stringify(node.attrs));

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
      console.log('[StyleCapture] Captured fontFamily from node attrs:', fontFamily);
    }
    if (fontSize === null && node.attrs.fontSize) {
      fontSize = parseNumericValue(node.attrs.fontSize);
    }
    if (fontWeight === null && node.attrs.fontWeight) {
      fontWeight = parseNumericValue(node.attrs.fontWeight);
    }
  }

  // Also try editor.getAttributes which might catch things we missed
  const textStyleAttrs = editor.getAttributes('textStyle');
  console.log('[StyleCapture] editor.getAttributes(textStyle):', JSON.stringify(textStyleAttrs));

  if (!fontFamily && textStyleAttrs.fontFamily) {
    fontFamily = textStyleAttrs.fontFamily;
    console.log('[StyleCapture] Captured fontFamily from getAttributes:', fontFamily);
  }
  if (fontSize === null && textStyleAttrs.fontSize) {
    fontSize = parseNumericValue(textStyleAttrs.fontSize);
  }
  if (fontWeight === null && textStyleAttrs.fontWeight) {
    fontWeight = parseNumericValue(textStyleAttrs.fontWeight);
  }
  if (letterSpacing === null && textStyleAttrs.letterSpacing) {
    letterSpacing = parseNumericValue(textStyleAttrs.letterSpacing);
  }
  if (lineHeight === null && textStyleAttrs.lineHeight) {
    lineHeight = parseNumericValue(textStyleAttrs.lineHeight);
  }
  if (!textColor && textStyleAttrs.color) {
    textColor = rgbToHex(textStyleAttrs.color);
  }

  // Check highlight mark for background color
  const highlightAttrs = editor.getAttributes('highlight');
  if (!backgroundColor && highlightAttrs.color) {
    backgroundColor = rgbToHex(highlightAttrs.color);
    console.log('[StyleCapture] Captured backgroundColor from highlight:', backgroundColor);
  }

  console.log('[StyleCapture] --- FINAL CAPTURED VALUES ---');
  console.log('[StyleCapture] fontFamily:', fontFamily, '| (null means NOT captured)');
  console.log('[StyleCapture] fontSize:', fontSize);
  console.log('[StyleCapture] fontWeight:', fontWeight);
  console.log('[StyleCapture] letterSpacing:', letterSpacing);
  console.log('[StyleCapture] lineHeight:', lineHeight);
  console.log('[StyleCapture] textColor:', textColor);
  console.log('[StyleCapture] backgroundColor:', backgroundColor);
  console.log('[StyleCapture] marks:', { bold, italic, underline, strikethrough });
  console.log('[StyleCapture] ========== STYLE CAPTURE END ==========');

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
  console.log('[StyleCapture] === captureComputedStyle START ===');
  const baseStyle = captureBlockStyle(editor);
  console.log('[StyleCapture] After captureBlockStyle, fontFamily:', baseStyle.fontFamily);

  // Try to get computed styles from the DOM
  const { view, state } = editor;
  const { from } = state.selection;

  try {
    const domNode = view.domAtPos(from);
    console.log('[StyleCapture] DOM node type:', domNode.node.nodeType, '| nodeName:', domNode.node.nodeName);

    if (domNode.node instanceof Element || domNode.node.parentElement) {
      const element = domNode.node instanceof Element
        ? domNode.node
        : domNode.node.parentElement;

      if (element) {
        const computed = window.getComputedStyle(element);
        console.log('[StyleCapture] DOM computed fontFamily:', computed.fontFamily);

        // Only use computed values if we didn't get them from marks/attrs
        if (baseStyle.fontFamily === null) {
          // Clean up font family string
          let family = computed.fontFamily || null;
          console.log('[StyleCapture] fontFamily is null, falling back to computed:', family);
          if (family) {
            // Remove quotes and take first font in stack
            family = family.split(',')[0].replace(/['"]/g, '').trim();
            console.log('[StyleCapture] Cleaned family:', family);
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

  console.log('[StyleCapture] === captureComputedStyle FINAL RESULT ===');
  console.log('[StyleCapture] fontFamily:', baseStyle.fontFamily, baseStyle.fontFamily === null ? '⚠️ NULL - WILL USE DEFAULT' : '✓');
  console.log('[StyleCapture] fontSize:', baseStyle.fontSize);
  console.log('[StyleCapture] fontWeight:', baseStyle.fontWeight);
  console.log('[StyleCapture] Full style:', JSON.stringify(baseStyle, null, 2));

  return baseStyle;
}
