/**
 * Style Operations - Write Operations
 *
 * Functions for setting style values in the editor or store.
 */

import type { Editor } from '@tiptap/core';
import { useStyleStore, type HeadingCustomStyle } from '@/stores/styleStore';
import type {
  StyleContext,
  StyleProperty,
  HeadingLevel,
} from './types';
import { STYLE_PROPERTY_META, isHeadingLevelProperty, isMarkProperty } from './types';
import { isHeadingContext } from './context';

/**
 * Apply an inline mark style to the editor
 */
function applyInlineMark(
  editor: Editor,
  property: StyleProperty,
  value: unknown
): boolean {
  const meta = STYLE_PROPERTY_META[property];

  if (!meta.markName) {
    console.warn(`[StyleOps] Property ${property} has no mark name`);
    return false;
  }

  // Boolean marks (bold, italic, etc.)
  if (meta.type === 'boolean') {
    if (value) {
      return editor.chain().focus().setMark(meta.markName).run();
    } else {
      return editor.chain().focus().unsetMark(meta.markName).run();
    }
  }

  // textStyle attributes (fontFamily, fontSize, etc.)
  if (meta.markName === 'textStyle' && meta.markAttr) {
    if (value === null || value === undefined) {
      // Unset the specific attribute
      return unsetTextStyleAttribute(editor, meta.markAttr);
    }

    // Set the attribute
    return editor.chain().focus().setMark('textStyle', {
      [meta.markAttr]: formatValueForMark(property, value),
    }).run();
  }

  // highlight mark
  if (meta.markName === 'highlight' && meta.markAttr) {
    if (value === null || value === undefined) {
      return editor.chain().focus().unsetHighlight().run();
    }
    return editor.chain().focus().setHighlight({ color: value as string }).run();
  }

  return false;
}

/**
 * Unset a specific textStyle attribute
 */
function unsetTextStyleAttribute(editor: Editor, attr: string): boolean {
  // Use the specific unset command if available
  switch (attr) {
    case 'fontFamily':
      return editor.chain().focus().unsetFontFamily().run();
    case 'fontSize':
      return editor.chain().focus().unsetFontSize().run();
    case 'fontWeight':
      return editor.chain().focus().unsetFontWeight().run();
    case 'color':
      return editor.chain().focus().unsetColor().run();
    case 'lineHeight':
      return editor.chain().focus().unsetLineHeight().run();
    case 'letterSpacing':
      return editor.chain().focus().unsetLetterSpacing().run();
    default:
      // Generic fallback - update mark with null
      return editor.chain().focus().updateAttributes('textStyle', { [attr]: null }).run();
  }
}

/**
 * Format a value for storage in a TipTap mark
 */
function formatValueForMark(property: StyleProperty, value: unknown): unknown {
  const meta = STYLE_PROPERTY_META[property];

  // Add units to numeric values where needed
  if (meta.type === 'number') {
    switch (property) {
      case 'fontSize':
        return `${value}px`;
      case 'letterSpacing':
        return `${value}px`;
      case 'lineHeight':
        return String(value);
      case 'fontWeight':
        return String(value);
      default:
        return value;
    }
  }

  return value;
}

/**
 * Apply a node attribute
 */
function applyNodeAttribute(
  editor: Editor,
  property: StyleProperty,
  value: unknown
): boolean {
  const meta = STYLE_PROPERTY_META[property];

  if (!meta.nodeAttr) {
    console.warn(`[StyleOps] Property ${property} has no node attribute`);
    return false;
  }

  // Text align uses a specific command
  if (property === 'textAlign') {
    if (value === null || value === 'left') {
      return editor.chain().focus().unsetTextAlign().run();
    }
    return editor.chain().focus().setTextAlign(value as string).run();
  }

  // Generic node attribute update
  const { $from } = editor.state.selection;
  const nodeType = $from.parent.type.name;

  return editor.chain().focus().updateAttributes(nodeType, {
    [meta.nodeAttr]: value,
  }).run();
}

/**
 * Update a heading-level style in the store
 */
function updateHeadingStyle(
  level: HeadingLevel,
  property: StyleProperty,
  value: unknown
): void {
  const store = useStyleStore.getState();
  const currentStyle = store.getHeadingCustomStyle(level);
  const meta = STYLE_PROPERTY_META[property];

  if (!meta.storeKey) {
    console.warn(`[StyleOps] Property ${property} has no store key`);
    return;
  }

  // Build the updated style object
  const newStyle: HeadingCustomStyle = currentStyle
    ? { ...currentStyle }
    : {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        textColor: null,
        backgroundColor: null,
        divider: null,
      };

  // Update the specific property
  (newStyle as unknown as Record<string, unknown>)[meta.storeKey] = value;

  // Apply to store (this will also update CSS variables)
  store.assignStyleToHeading(level, newStyle);
}

/**
 * Write a style property value
 *
 * This is the main entry point for writing styles. It routes to the correct
 * destination based on the context (heading vs paragraph).
 */
export function writeStyle(
  ctx: StyleContext,
  property: StyleProperty,
  value: unknown
): boolean {
  // For headings, route to store for heading-level properties
  if (isHeadingContext(ctx) && isHeadingLevelProperty(property)) {
    updateHeadingStyle(ctx.headingLevel, property, value);

    // Also clear any inline marks on this heading to ensure CSS takes effect
    clearInlineMarksForProperty(ctx.editor, ctx.headingLevel, property);

    return true;
  }

  // For inline content, apply marks/attributes
  const meta = STYLE_PROPERTY_META[property];

  if (meta.nodeAttr && !meta.markName) {
    // Node attribute only (like textAlign)
    return applyNodeAttribute(ctx.editor, property, value);
  }

  if (meta.markName) {
    // Mark-based property
    return applyInlineMark(ctx.editor, property, value);
  }

  console.warn(`[StyleOps] Don't know how to write property: ${property}`);
  return false;
}

/**
 * Clear inline marks for a specific property on all headings of a level
 *
 * This ensures CSS variables take effect (inline marks override CSS).
 */
function clearInlineMarksForProperty(
  editor: Editor,
  level: HeadingLevel,
  property: StyleProperty
): void {
  const meta = STYLE_PROPERTY_META[property];

  if (!meta.markName) return;

  const { doc, tr } = editor.state;
  let modified = false;

  doc.descendants((node, pos) => {
    if (node.type.name !== 'heading' || node.attrs.level !== level) {
      return;
    }

    // For boolean marks, remove the entire mark
    if (isMarkProperty(property)) {
      node.descendants((child, childPos) => {
        if (child.isText && child.marks.length > 0) {
          const mark = child.marks.find(m => m.type.name === meta.markName);
          if (mark) {
            const from = pos + 1 + childPos;
            const to = from + child.nodeSize;
            tr.removeMark(from, to, mark.type);
            modified = true;
          }
        }
      });
    }

    // For textStyle attributes, we need to handle differently
    if (meta.markName === 'textStyle' && meta.markAttr) {
      node.descendants((child, childPos) => {
        if (child.isText && child.marks.length > 0) {
          const mark = child.marks.find(m => m.type.name === 'textStyle');
          if (mark && mark.attrs[meta.markAttr!]) {
            const from = pos + 1 + childPos;
            const to = from + child.nodeSize;
            // Remove the entire textStyle mark and re-add without this attr
            const newAttrs = { ...mark.attrs };
            delete newAttrs[meta.markAttr!];

            tr.removeMark(from, to, mark.type);

            // Only re-add if there are remaining attributes
            if (Object.keys(newAttrs).some(k => newAttrs[k] !== null && newAttrs[k] !== undefined)) {
              const newMark = editor.schema.marks.textStyle.create(newAttrs);
              tr.addMark(from, to, newMark);
            }
            modified = true;
          }
        }
      });
    }
  });

  if (modified) {
    editor.view.dispatch(tr);
  }
}

/**
 * Toggle a boolean style property
 */
export function toggleStyle(
  ctx: StyleContext,
  property: StyleProperty
): boolean {
  const meta = STYLE_PROPERTY_META[property];

  if (meta.type !== 'boolean') {
    console.warn(`[StyleOps] Cannot toggle non-boolean property: ${property}`);
    return false;
  }

  // For headings, toggle in store
  if (isHeadingContext(ctx) && isHeadingLevelProperty(property)) {
    const store = useStyleStore.getState();
    const currentStyle = store.getHeadingCustomStyle(ctx.headingLevel);
    const currentValue = currentStyle?.[meta.storeKey as keyof HeadingCustomStyle] ?? false;

    updateHeadingStyle(ctx.headingLevel, property, !currentValue);
    clearInlineMarksForProperty(ctx.editor, ctx.headingLevel, property);

    return true;
  }

  // For inline content, use editor toggle
  if (meta.markName) {
    return ctx.editor.chain().focus().toggleMark(meta.markName).run();
  }

  return false;
}

/**
 * Clear a specific style property (reset to default)
 */
export function clearStyle(
  ctx: StyleContext,
  property: StyleProperty
): boolean {
  const meta = STYLE_PROPERTY_META[property];

  // For headings, update store with default value
  if (isHeadingContext(ctx) && isHeadingLevelProperty(property)) {
    updateHeadingStyle(ctx.headingLevel, property, meta.defaultValue);
    return true;
  }

  // For inline, unset the mark/attribute
  if (meta.markName) {
    if (meta.type === 'boolean') {
      return ctx.editor.chain().focus().unsetMark(meta.markName).run();
    }
    if (meta.markName === 'textStyle' && meta.markAttr) {
      return unsetTextStyleAttribute(ctx.editor, meta.markAttr);
    }
    if (meta.markName === 'highlight') {
      return ctx.editor.chain().focus().unsetHighlight().run();
    }
  }

  if (meta.nodeAttr) {
    return applyNodeAttribute(ctx.editor, property, meta.defaultValue);
  }

  return false;
}

/**
 * Clear all formatting from the current context
 */
export function clearAllFormatting(ctx: StyleContext): boolean {
  const { editor } = ctx;

  // Clear all marks
  editor.chain().focus().unsetAllMarks().run();

  // For headings, also reset heading-level styles
  if (isHeadingContext(ctx)) {
    const store = useStyleStore.getState();
    store.resetHeadingStyle(ctx.headingLevel);
  }

  return true;
}
