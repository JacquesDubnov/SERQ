/**
 * useUnifiedFontWeight - Hook for font weight operations
 *
 * IMPORTANT: Weight options come from styleStore (dynamic, user-configurable).
 * Never hardcode lists here - read from store.
 */

import { useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import { useUnifiedStyle } from './useUnifiedStyle';
import { useStyleStore, type FontWeightOption } from '@/stores/styleStore';

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
function getWeightLabel(value: number | null, availableFontWeights: FontWeightOption[]): string {
  if (value === null || availableFontWeights.length === 0) return 'Weight';

  const match = availableFontWeights.find(w => w.value === value);
  if (match) return match.label;

  // Find closest weight
  let closest = availableFontWeights[0];
  let minDiff = Math.abs(value - closest.value);

  for (const w of availableFontWeights) {
    const diff = Math.abs(value - w.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w;
    }
  }

  return closest.label;
}

export function useUnifiedFontWeight(editor: Editor | null): UseUnifiedFontWeightResult {
  // Get dynamic weight list from store
  const availableFontWeights = useStyleStore((state) => state.availableFontWeights);

  const result = useUnifiedStyle<number | null>({
    editor,
    property: 'fontWeight',
    defaultValue: null,
  });

  const displayLabel = useMemo(() => {
    return getWeightLabel(result.value, availableFontWeights);
  }, [result.value, availableFontWeights]);

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
