/**
 * useUnifiedFontFamily - Hook for font family operations
 *
 * IMPORTANT: Font options come from styleStore (dynamic, user-configurable).
 * Never hardcode lists here - read from store.
 */

import { useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import { useUnifiedStyle } from './useUnifiedStyle';
import { useStyleStore, type FontOption } from '@/stores/styleStore';

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

/**
 * Get display name for a font family value
 */
function getFontDisplayName(value: string | null, availableFonts: FontOption[]): string {
  if (!value) return 'Font';

  // Try to find a matching font in our dynamic list
  const match = availableFonts.find((f) => f.value === value);
  if (match) return match.label;

  // Partial match - check first font in stack
  const cleanValue = value.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
  const partialMatch = availableFonts.find((f) => {
    const fontName = f.value.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
    return fontName === cleanValue || cleanValue.includes(fontName) || fontName.includes(cleanValue);
  });

  if (partialMatch) return partialMatch.label;

  // Return the first font name from the stack (for custom fonts not in list)
  return value.split(',')[0].replace(/['"]/g, '').trim();
}

export function useUnifiedFontFamily(editor: Editor | null): UseUnifiedFontFamilyResult {
  // Get dynamic font list from store
  const availableFonts = useStyleStore((state) => state.availableFonts);

  const result = useUnifiedStyle<string | null>({
    editor,
    property: 'fontFamily',
    defaultValue: null,
  });

  const displayName = useMemo(() => {
    return getFontDisplayName(result.value, availableFonts);
  }, [result.value, availableFonts]);

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
