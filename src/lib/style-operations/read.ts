/**
 * Style Operations - Read Operations
 *
 * Functions for reading current style values from the editor or store.
 */

import type { Editor } from '@tiptap/core';
import { useStyleStore } from '@/stores/styleStore';
import type {
  StyleContext,
  StyleProperty,
  StyleValue,
  StyleSource,
  HeadingLevel,
} from './types';
import { STYLE_PROPERTY_META, isHeadingLevelProperty } from './types';
import { isHeadingContext } from './context';

/**
 * Convert RGB color string to hex
 */
function rgbToHex(rgb: string): string {
  if (!rgb) return '';
  if (rgb.startsWith('#')) return rgb;

  const match = rgb.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return rgb;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse a numeric value from a string (removes units)
 */
function parseNumericValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const str = String(value);
  const cleaned = str.replace(/[a-z%]/gi, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Read a style property value from the styleStore (for headings)
 */
function readFromStore(
  level: HeadingLevel,
  property: StyleProperty
): StyleValue {
  const meta = STYLE_PROPERTY_META[property];
  const store = useStyleStore.getState();
  const customStyle = store.getHeadingCustomStyle(level);

  // Check if there's a custom value in the store
  if (customStyle && meta.storeKey) {
    const value = customStyle[meta.storeKey as keyof typeof customStyle];

    if (value !== null && value !== undefined) {
      return {
        property,
        value,
        source: 'cssVar',
        isCustomized: true,
      };
    }
  }

  // No custom value - return default
  return {
    property,
    value: meta.defaultValue,
    source: 'default',
    isCustomized: false,
  };
}

/**
 * Read a style property value from editor marks/attributes
 */
function readFromEditor(
  editor: Editor,
  property: StyleProperty
): StyleValue {
  const meta = STYLE_PROPERTY_META[property];
  const { state } = editor;
  const { $from } = state.selection;

  // For boolean marks, check if active
  if (meta.type === 'boolean' && meta.markName) {
    const isActive = editor.isActive(meta.markName);
    return {
      property,
      value: isActive,
      source: isActive ? 'mark' : 'default',
      isCustomized: isActive,
    };
  }

  // For textStyle attributes (fontFamily, fontSize, etc.)
  if (meta.markName === 'textStyle' && meta.markAttr) {
    // Check marks on current selection
    const marks = $from.marks();
    const textStyleMark = marks.find(m => m.type.name === 'textStyle');

    if (textStyleMark && textStyleMark.attrs[meta.markAttr]) {
      let value = textStyleMark.attrs[meta.markAttr];

      // Convert colors to hex
      if (meta.markAttr === 'color' && typeof value === 'string') {
        value = rgbToHex(value);
      }

      // Parse numeric values
      if (meta.type === 'number') {
        value = parseNumericValue(value);
      }

      return {
        property,
        value,
        source: 'mark',
        isCustomized: true,
      };
    }

    // Also scan text nodes in the current block for marks
    const node = $from.parent;
    let foundValue: unknown = null;

    if (node.content.size > 0) {
      node.descendants((child) => {
        if (!child.isText || foundValue !== null) return;

        const childMarks = child.marks;
        const mark = childMarks.find(m => m.type.name === 'textStyle');

        if (mark && mark.attrs[meta.markAttr!]) {
          foundValue = mark.attrs[meta.markAttr!];
        }
      });
    }

    if (foundValue !== null) {
      // Convert colors to hex
      if (meta.markAttr === 'color' && typeof foundValue === 'string') {
        foundValue = rgbToHex(foundValue);
      }

      // Parse numeric values
      if (meta.type === 'number') {
        foundValue = parseNumericValue(foundValue as string);
      }

      return {
        property,
        value: foundValue,
        source: 'mark',
        isCustomized: true,
      };
    }
  }

  // For highlight mark
  if (meta.markName === 'highlight' && meta.markAttr) {
    const marks = $from.marks();
    const highlightMark = marks.find(m => m.type.name === 'highlight');

    if (highlightMark && highlightMark.attrs[meta.markAttr]) {
      return {
        property,
        value: highlightMark.attrs[meta.markAttr],
        source: 'mark',
        isCustomized: true,
      };
    }
  }

  // For node attributes
  if (meta.nodeAttr) {
    const node = $from.parent;
    const value = node.attrs[meta.nodeAttr];

    if (value !== null && value !== undefined) {
      return {
        property,
        value,
        source: 'nodeAttr',
        isCustomized: true,
      };
    }
  }

  // Default value
  return {
    property,
    value: meta.defaultValue,
    source: 'default',
    isCustomized: false,
  };
}

/**
 * Read the current value of a style property
 *
 * This is the main entry point for reading styles. It routes to the correct
 * source based on the context (heading vs paragraph).
 */
export function readStyle(
  ctx: StyleContext,
  property: StyleProperty
): StyleValue {
  // For headings, check if this property supports heading-level styling
  if (isHeadingContext(ctx) && isHeadingLevelProperty(property)) {
    const storeValue = readFromStore(ctx.headingLevel, property);

    // If there's a custom heading style, use it
    if (storeValue.isCustomized) {
      return storeValue;
    }

    // Otherwise fall through to read from editor (for inline overrides)
  }

  // Read from editor marks/attributes
  return readFromEditor(ctx.editor, property);
}

/**
 * Read multiple style properties at once
 */
export function readStyles(
  ctx: StyleContext,
  properties: StyleProperty[]
): Record<StyleProperty, StyleValue> {
  const result: Record<string, StyleValue> = {};

  for (const property of properties) {
    result[property] = readStyle(ctx, property);
  }

  return result as Record<StyleProperty, StyleValue>;
}

/**
 * Get just the value (not the full StyleValue object)
 */
export function getStyleValue<T = unknown>(
  ctx: StyleContext,
  property: StyleProperty
): T {
  return readStyle(ctx, property).value as T;
}

/**
 * Check if a style property is currently active/set
 */
export function isStyleActive(
  ctx: StyleContext,
  property: StyleProperty
): boolean {
  const result = readStyle(ctx, property);

  if (result.source === 'default') {
    return false;
  }

  // For booleans, check the value
  if (typeof result.value === 'boolean') {
    return result.value;
  }

  // For other types, check if non-null
  return result.value !== null && result.value !== undefined;
}

/**
 * Get the source of a style property (mark, cssVar, default, etc.)
 */
export function getStyleSource(
  ctx: StyleContext,
  property: StyleProperty
): StyleSource {
  return readStyle(ctx, property).source;
}
