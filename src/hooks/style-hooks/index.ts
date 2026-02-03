/**
 * Unified Style Hooks
 *
 * These hooks provide a consistent interface for reading and writing style
 * properties across different contexts (headings, paragraphs, etc.).
 *
 * Usage:
 * ```tsx
 * function FontFamilyControl({ editor }) {
 *   const { value, displayName, setFontFamily, isHeadingLevel } = useUnifiedFontFamily(editor);
 *
 *   return (
 *     <Dropdown
 *       value={value}
 *       label={displayName}
 *       onChange={setFontFamily}
 *       indicator={isHeadingLevel ? 'heading' : undefined}
 *     />
 *   );
 * }
 * ```
 */

// Base hook
export {
  useUnifiedStyle,
  useUnifiedToggle,
  type UseUnifiedStyleResult,
  type UseUnifiedToggleResult,
  type UseUnifiedStyleOptions,
} from './useUnifiedStyle';

// Typography
// NOTE: Font options (fonts, weights, sizes) come from styleStore (dynamic, user-configurable)
// Never export hardcoded lists from hooks - read from store instead
export {
  useUnifiedFontFamily,
  type UseUnifiedFontFamilyResult,
} from './useUnifiedFontFamily';

export {
  useUnifiedFontSize,
  FONT_SIZES,  // Preset font sizes for quick selection (user can input custom values)
  type UseUnifiedFontSizeResult,
} from './useUnifiedFontSize';

export {
  useUnifiedFontWeight,
  type UseUnifiedFontWeightResult,
} from './useUnifiedFontWeight';

// Colors
export {
  useUnifiedColor,
  useUnifiedHighlight,
  useUnifiedBackgroundColor,
  type UseUnifiedColorResult,
  type UseUnifiedHighlightResult,
  type UseUnifiedBackgroundColorResult,
} from './useUnifiedColor';

// Marks
export {
  useUnifiedMark,
  useUnifiedBold,
  useUnifiedItalic,
  useUnifiedUnderline,
  useUnifiedStrikethrough,
  useUnifiedCode,
  MARK_META,
  type MarkType,
  type UseUnifiedMarkResult,
} from './useUnifiedMark';

// Spacing
export {
  useUnifiedLineHeight,
  useUnifiedLetterSpacing,
  useUnifiedSpacingBefore,
  useUnifiedSpacingAfter,
  LINE_HEIGHTS,
  LETTER_SPACINGS,
  PARAGRAPH_SPACINGS,
  type UseUnifiedLineHeightResult,
  type UseUnifiedLetterSpacingResult,
  type UseUnifiedSpacingBeforeResult,
  type UseUnifiedSpacingAfterResult,
} from './useUnifiedSpacing';

// Text Align
export {
  useUnifiedTextAlign,
  useAlignmentButton,
  ALIGNMENTS,
  type TextAlignment,
  type UseUnifiedTextAlignResult,
  type UseAlignmentButtonResult,
} from './useUnifiedTextAlign';
