/**
 * Style Operations - Type Definitions
 *
 * Core types for the unified style system.
 */

import type { Editor } from '@tiptap/core';

// ===== STYLE CONTEXT =====

/**
 * Block types in the editor
 */
export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'blockquote'
  | 'codeBlock'
  | 'listItem'
  | 'taskItem';

/**
 * Heading levels
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Style scope - where the style applies
 */
export type StyleScope =
  | 'inline'     // Applies to selected text only (marks)
  | 'block'      // Applies to entire block (heading-level styles)
  | 'document';  // Applies to all blocks of this type in document

/**
 * Context for style operations - describes WHERE we're operating
 */
export interface StyleContext {
  editor: Editor;
  scope: StyleScope;
  blockType: BlockType;
  headingLevel?: HeadingLevel;
  selection: {
    from: number;
    to: number;
    isEmpty: boolean;
  };
  // Future extensions
  documentId?: string;
  projectId?: string;
}

// ===== STYLE PROPERTIES =====

/**
 * All styleable properties
 */
export type StyleProperty =
  // Typography
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'letterSpacing'
  | 'lineHeight'
  // Marks (boolean)
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'superscript'
  | 'subscript'
  // Colors
  | 'textColor'
  | 'backgroundColor'
  | 'highlightColor'
  // Block-level
  | 'textAlign'
  | 'spacingBefore'
  | 'spacingAfter';

/**
 * Source of a style value
 */
export type StyleSource =
  | 'mark'      // From TipTap mark on text
  | 'nodeAttr'  // From TipTap node attribute
  | 'cssVar'    // From CSS variable (styleStore)
  | 'default';  // Default/inherited value

/**
 * Result of reading a style property
 */
export interface StyleValue<T = unknown> {
  property: StyleProperty;
  value: T;
  source: StyleSource;
  isCustomized: boolean;  // True if explicitly set (not default)
}

// ===== PROPERTY METADATA =====

/**
 * Metadata about a style property
 */
export interface StylePropertyMeta {
  property: StyleProperty;
  type: 'string' | 'number' | 'boolean' | 'enum';
  markName?: string;           // TipTap mark name (e.g., 'textStyle', 'bold')
  markAttr?: string;           // Attribute within mark (e.g., 'fontFamily')
  nodeAttr?: string;           // Node attribute name
  cssVar?: string;             // CSS variable name pattern (e.g., '--h{level}-font-family')
  storeKey?: string;           // Key in HeadingCustomStyle
  defaultValue: unknown;
  enumValues?: string[];       // For enum types
}

/**
 * Registry of all style properties and their metadata
 */
export const STYLE_PROPERTY_META: Record<StyleProperty, StylePropertyMeta> = {
  // Typography
  fontFamily: {
    property: 'fontFamily',
    type: 'string',
    markName: 'textStyle',
    markAttr: 'fontFamily',
    cssVar: '--h{level}-font-family',
    storeKey: 'fontFamily',
    defaultValue: null,
  },
  fontSize: {
    property: 'fontSize',
    type: 'number',
    markName: 'textStyle',
    markAttr: 'fontSize',
    cssVar: '--h{level}-font-size',
    storeKey: 'fontSize',
    defaultValue: null,
  },
  fontWeight: {
    property: 'fontWeight',
    type: 'number',
    markName: 'textStyle',
    markAttr: 'fontWeight',
    cssVar: '--h{level}-font-weight',
    storeKey: 'fontWeight',
    defaultValue: null,
  },
  letterSpacing: {
    property: 'letterSpacing',
    type: 'number',
    markName: 'textStyle',
    markAttr: 'letterSpacing',
    cssVar: '--h{level}-letter-spacing',
    storeKey: 'letterSpacing',
    defaultValue: null,
  },
  lineHeight: {
    property: 'lineHeight',
    type: 'number',
    markName: 'textStyle',
    markAttr: 'lineHeight',
    cssVar: '--h{level}-line-height',
    storeKey: 'lineHeight',
    defaultValue: null,
  },

  // Boolean marks
  bold: {
    property: 'bold',
    type: 'boolean',
    markName: 'bold',
    storeKey: 'bold',
    defaultValue: false,
  },
  italic: {
    property: 'italic',
    type: 'boolean',
    markName: 'italic',
    storeKey: 'italic',
    defaultValue: false,
  },
  underline: {
    property: 'underline',
    type: 'boolean',
    markName: 'underline',
    storeKey: 'underline',
    defaultValue: false,
  },
  strikethrough: {
    property: 'strikethrough',
    type: 'boolean',
    markName: 'strike',
    storeKey: 'strikethrough',
    defaultValue: false,
  },
  code: {
    property: 'code',
    type: 'boolean',
    markName: 'code',
    defaultValue: false,
  },
  superscript: {
    property: 'superscript',
    type: 'boolean',
    markName: 'superscript',
    defaultValue: false,
  },
  subscript: {
    property: 'subscript',
    type: 'boolean',
    markName: 'subscript',
    defaultValue: false,
  },

  // Colors
  textColor: {
    property: 'textColor',
    type: 'string',
    markName: 'textStyle',
    markAttr: 'color',
    cssVar: '--h{level}-color',
    storeKey: 'textColor',
    defaultValue: null,
  },
  backgroundColor: {
    property: 'backgroundColor',
    type: 'string',
    nodeAttr: 'backgroundColor',
    cssVar: '--h{level}-background-color',
    storeKey: 'backgroundColor',
    defaultValue: null,
  },
  highlightColor: {
    property: 'highlightColor',
    type: 'string',
    markName: 'highlight',
    markAttr: 'color',
    defaultValue: null,
  },

  // Block-level
  textAlign: {
    property: 'textAlign',
    type: 'enum',
    nodeAttr: 'textAlign',
    defaultValue: 'left',
    enumValues: ['left', 'center', 'right', 'justify'],
  },
  spacingBefore: {
    property: 'spacingBefore',
    type: 'number',
    cssVar: '--h{level}-spacing-before',
    defaultValue: 0,
  },
  spacingAfter: {
    property: 'spacingAfter',
    type: 'number',
    cssVar: '--h{level}-spacing-after',
    defaultValue: 0,
  },
};

// ===== UTILITY TYPES =====

/**
 * Properties that apply to headings at document level
 */
export const HEADING_LEVEL_PROPERTIES: StyleProperty[] = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'textColor',
  'backgroundColor',
  'spacingBefore',
  'spacingAfter',
];

/**
 * Properties that are marks (inline)
 */
export const MARK_PROPERTIES: StyleProperty[] = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'code',
  'superscript',
  'subscript',
];

/**
 * Check if a property supports heading-level styling
 */
export function isHeadingLevelProperty(property: StyleProperty): boolean {
  return HEADING_LEVEL_PROPERTIES.includes(property);
}

/**
 * Check if a property is a mark
 */
export function isMarkProperty(property: StyleProperty): boolean {
  return MARK_PROPERTIES.includes(property);
}
