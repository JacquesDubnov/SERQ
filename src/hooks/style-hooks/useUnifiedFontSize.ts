/**
 * useUnifiedFontSize - Hook for font size operations
 */

import type { Editor } from '@tiptap/core';
import { useUnifiedStyle } from './useUnifiedStyle';

// Standard font sizes
export const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 128
];

export interface UseUnifiedFontSizeResult {
  /** Current font size value (in pixels) */
  value: number | null;
  /** Display value (formatted string) */
  displayValue: string;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Heading level if applicable */
  headingLevel: number | null;
  /** Set the font size (in pixels) */
  setFontSize: (value: number) => void;
  /** Reset to default font size */
  clearFontSize: () => void;
}

export function useUnifiedFontSize(editor: Editor | null): UseUnifiedFontSizeResult {
  const result = useUnifiedStyle<number | null>({
    editor,
    property: 'fontSize',
    defaultValue: null,
  });

  return {
    value: result.value,
    displayValue: result.value !== null ? `${result.value}` : 'Size',
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    headingLevel: result.headingLevel,
    setFontSize: result.setValue,
    clearFontSize: result.clearValue,
  };
}
