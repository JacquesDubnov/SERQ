/**
 * Style Operations - Public API
 *
 * Unified style system for SERQ. Provides consistent read/write operations
 * for all style properties across different contexts (headings, paragraphs, etc.).
 *
 * Usage:
 * ```typescript
 * import { getStyleContext, readStyle, writeStyle } from '@/lib/style-operations';
 *
 * // Get current context from selection
 * const ctx = getStyleContext(editor);
 *
 * // Read a property
 * const fontFamily = readStyle(ctx, 'fontFamily');
 * console.log(fontFamily.value, fontFamily.source); // 'Inter', 'cssVar'
 *
 * // Write a property (routes automatically based on context)
 * writeStyle(ctx, 'fontFamily', 'Merriweather, serif');
 * ```
 */

// Types
export type {
  StyleContext,
  StyleScope,
  StyleProperty,
  StyleValue,
  StyleSource,
  StylePropertyMeta,
  BlockType,
  HeadingLevel,
} from './types';

export {
  STYLE_PROPERTY_META,
  HEADING_LEVEL_PROPERTIES,
  MARK_PROPERTIES,
  isHeadingLevelProperty,
  isMarkProperty,
} from './types';

// Context
export {
  getStyleContext,
  isHeadingContext,
  supportsHeadingLevelStyling,
  getHeadingLevel,
  isInCodeBlock,
  isMultiBlockSelection,
  getHeadingLevelsInSelection,
  contextToString,
} from './context';

// Read operations
export {
  readStyle,
  readStyles,
  getStyleValue,
  isStyleActive,
  getStyleSource,
} from './read';

// Write operations
export {
  writeStyle,
  toggleStyle,
  clearStyle,
  clearAllFormatting,
} from './write';
