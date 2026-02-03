/**
 * Unified Toolbar Controls
 *
 * These controls use the unified style hooks to provide context-aware
 * styling that works consistently for headings (CSS variables) and
 * paragraphs (TipTap marks).
 */

// Typography
export { FontFamilyControl } from './FontFamilyControl';
export { FontSizeControl } from './FontSizeControl';
export { FontWeightControl } from './FontWeightControl';

// Marks
export {
  MarkToggle,
  BoldToggle,
  ItalicToggle,
  UnderlineToggle,
  StrikethroughToggle,
  CodeToggle,
} from './MarkToggle';

// Colors
// NOTE: Color options come from styleStore (dynamic, user-configurable)
// Never export hardcoded color lists - read from store instead
export { TextColorControl } from './TextColorControl';
export { HighlightControl } from './HighlightControl';

// Alignment
export {
  TextAlignControl,
  TextAlignDropdown,
  TextAlignButtonGroup,
} from './TextAlignControl';

// Spacing
export { LineHeightControl } from './LineHeightControl';
export { LetterSpacingControl } from './LetterSpacingControl';
export {
  SpacingControls,
  SpacingBeforeControl,
  SpacingAfterControl,
} from './SpacingControls';
