/**
 * useUnifiedColor - Hook for text color operations
 */

import type { Editor } from '@tiptap/core';
import { useUnifiedStyle } from './useUnifiedStyle';

export interface UseUnifiedColorResult {
  /** Current text color value (hex format) */
  value: string | null;
  /** Whether a custom color is set */
  hasColor: boolean;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Heading level if applicable */
  headingLevel: number | null;
  /** Set the text color */
  setColor: (value: string) => void;
  /** Reset to default color */
  clearColor: () => void;
}

export function useUnifiedColor(editor: Editor | null): UseUnifiedColorResult {
  const result = useUnifiedStyle<string | null>({
    editor,
    property: 'textColor',
    defaultValue: null,
  });

  return {
    value: result.value,
    hasColor: result.value !== null,
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    headingLevel: result.headingLevel,
    setColor: result.setValue,
    clearColor: result.clearValue,
  };
}

/**
 * useUnifiedHighlight - Hook for highlight/background operations
 */
export interface UseUnifiedHighlightResult {
  /** Current highlight color value */
  value: string | null;
  /** Whether a highlight is set */
  hasHighlight: boolean;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Set the highlight color */
  setHighlight: (value: string) => void;
  /** Remove the highlight */
  clearHighlight: () => void;
}

export function useUnifiedHighlight(editor: Editor | null): UseUnifiedHighlightResult {
  const result = useUnifiedStyle<string | null>({
    editor,
    property: 'highlightColor',
    defaultValue: null,
  });

  return {
    value: result.value,
    hasHighlight: result.value !== null,
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    setHighlight: result.setValue,
    clearHighlight: result.clearValue,
  };
}

/**
 * useUnifiedBackgroundColor - Hook for block background color
 */
export interface UseUnifiedBackgroundColorResult {
  /** Current background color value */
  value: string | null;
  /** Whether a background color is set */
  hasBackground: boolean;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Heading level if applicable */
  headingLevel: number | null;
  /** Set the background color */
  setBackgroundColor: (value: string) => void;
  /** Remove the background color */
  clearBackgroundColor: () => void;
}

export function useUnifiedBackgroundColor(editor: Editor | null): UseUnifiedBackgroundColorResult {
  const result = useUnifiedStyle<string | null>({
    editor,
    property: 'backgroundColor',
    defaultValue: null,
  });

  return {
    value: result.value,
    hasBackground: result.value !== null,
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    headingLevel: result.headingLevel,
    setBackgroundColor: result.setValue,
    clearBackgroundColor: result.clearValue,
  };
}
