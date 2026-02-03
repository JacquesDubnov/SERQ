/**
 * useUnifiedFontFamily - Hook for font family operations
 */

import { useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import { useUnifiedStyle } from './useUnifiedStyle';

// Re-export the font list from the dropdown component
export { GOOGLE_FONTS } from '@/components/tiptap-ui-custom/font-family-dropdown';

export interface UseUnifiedFontFamilyResult {
  /** Current font family value (e.g., 'Inter, sans-serif') */
  value: string | null;
  /** Display name of the current font (e.g., 'Inter') */
  displayName: string;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Heading level if applicable */
  headingLevel: number | null;
  /** Set the font family */
  setFontFamily: (value: string) => void;
  /** Reset to default font */
  clearFontFamily: () => void;
}

// All fonts flattened for lookup
const ALL_FONTS = (() => {
  try {
    // Dynamic import might fail, so we have a fallback
    const { GOOGLE_FONTS } = require('@/components/tiptap-ui-custom/font-family-dropdown');
    return [
      ...GOOGLE_FONTS.sansSerif,
      ...GOOGLE_FONTS.serif,
      ...GOOGLE_FONTS.display,
      ...GOOGLE_FONTS.monospace,
    ];
  } catch {
    return [];
  }
})();

/**
 * Get display name for a font family value
 */
function getFontDisplayName(value: string | null): string {
  if (!value) return 'Font';

  // Try to find a matching font in our list
  const match = ALL_FONTS.find((f: { value: string }) => f.value === value);
  if (match) return match.name;

  // Partial match - check first font in stack
  const cleanValue = value.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
  const partialMatch = ALL_FONTS.find((f: { value: string }) => {
    const fontName = f.value.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
    return fontName === cleanValue || cleanValue.includes(fontName) || fontName.includes(cleanValue);
  });

  if (partialMatch) return partialMatch.name;

  // Return the first font name from the stack
  return value.split(',')[0].replace(/['"]/g, '').trim();
}

export function useUnifiedFontFamily(editor: Editor | null): UseUnifiedFontFamilyResult {
  const result = useUnifiedStyle<string | null>({
    editor,
    property: 'fontFamily',
    defaultValue: null,
  });

  const displayName = useMemo(() => {
    return getFontDisplayName(result.value);
  }, [result.value]);

  return {
    value: result.value,
    displayName,
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    headingLevel: result.headingLevel,
    setFontFamily: result.setValue,
    clearFontFamily: result.clearValue,
  };
}
