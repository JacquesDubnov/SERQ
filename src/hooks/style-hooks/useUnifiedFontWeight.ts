/**
 * useUnifiedFontWeight - Hook for font weight operations
 */

import { useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import { useUnifiedStyle } from './useUnifiedStyle';

// Font weight options
export const FONT_WEIGHTS = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extralight' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extrabold' },
  { value: 900, label: 'Black' },
];

export interface UseUnifiedFontWeightResult {
  /** Current font weight value (100-900) */
  value: number | null;
  /** Display label (e.g., 'Bold') */
  displayLabel: string;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Heading level if applicable */
  headingLevel: number | null;
  /** Set the font weight */
  setFontWeight: (value: number) => void;
  /** Reset to default font weight */
  clearFontWeight: () => void;
}

/**
 * Get display label for a font weight value
 */
function getWeightLabel(value: number | null): string {
  if (value === null) return 'Weight';

  const match = FONT_WEIGHTS.find(w => w.value === value);
  if (match) return match.label;

  // Find closest weight
  let closest = FONT_WEIGHTS[0];
  let minDiff = Math.abs(value - closest.value);

  for (const w of FONT_WEIGHTS) {
    const diff = Math.abs(value - w.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w;
    }
  }

  return closest.label;
}

export function useUnifiedFontWeight(editor: Editor | null): UseUnifiedFontWeightResult {
  const result = useUnifiedStyle<number | null>({
    editor,
    property: 'fontWeight',
    defaultValue: null,
  });

  const displayLabel = useMemo(() => {
    return getWeightLabel(result.value);
  }, [result.value]);

  return {
    value: result.value,
    displayLabel,
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    headingLevel: result.headingLevel,
    setFontWeight: result.setValue,
    clearFontWeight: result.clearValue,
  };
}
