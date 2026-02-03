/**
 * useUnifiedSpacing - Hooks for line height, letter spacing, and paragraph spacing
 */

import { useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import { useUnifiedStyle } from './useUnifiedStyle';

// Line height options
export const LINE_HEIGHTS = [
  { value: 1.0, label: '1.0' },
  { value: 1.15, label: '1.15' },
  { value: 1.25, label: '1.25' },
  { value: 1.5, label: '1.5' },
  { value: 1.75, label: '1.75' },
  { value: 2.0, label: '2.0' },
  { value: 2.5, label: '2.5' },
  { value: 3.0, label: '3.0' },
];

// Letter spacing options (in px)
export const LETTER_SPACINGS = [
  { value: -2, label: '-2' },
  { value: -1, label: '-1' },
  { value: -0.5, label: '-0.5' },
  { value: 0, label: '0' },
  { value: 0.5, label: '0.5' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
];

// Paragraph spacing options (in line units)
export const PARAGRAPH_SPACINGS = [
  { value: 0, label: '0' },
  { value: 0.25, label: '0.25' },
  { value: 0.5, label: '0.5' },
  { value: 0.75, label: '0.75' },
  { value: 1, label: '1' },
  { value: 1.5, label: '1.5' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
];

/**
 * useUnifiedLineHeight - Hook for line height operations
 */
export interface UseUnifiedLineHeightResult {
  /** Current line height value (unitless ratio) */
  value: number | null;
  /** Display value */
  displayValue: string;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Heading level if applicable */
  headingLevel: number | null;
  /** Set the line height */
  setLineHeight: (value: number) => void;
  /** Reset to default */
  clearLineHeight: () => void;
}

export function useUnifiedLineHeight(editor: Editor | null): UseUnifiedLineHeightResult {
  const result = useUnifiedStyle<number | null>({
    editor,
    property: 'lineHeight',
    defaultValue: null,
  });

  const displayValue = useMemo(() => {
    if (result.value === null) return 'Line';
    return String(result.value);
  }, [result.value]);

  return {
    value: result.value,
    displayValue,
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    headingLevel: result.headingLevel,
    setLineHeight: result.setValue,
    clearLineHeight: result.clearValue,
  };
}

/**
 * useUnifiedLetterSpacing - Hook for letter spacing operations
 */
export interface UseUnifiedLetterSpacingResult {
  /** Current letter spacing value (in pixels) */
  value: number | null;
  /** Display value */
  displayValue: string;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Heading level if applicable */
  headingLevel: number | null;
  /** Set the letter spacing */
  setLetterSpacing: (value: number) => void;
  /** Reset to default */
  clearLetterSpacing: () => void;
}

export function useUnifiedLetterSpacing(editor: Editor | null): UseUnifiedLetterSpacingResult {
  const result = useUnifiedStyle<number | null>({
    editor,
    property: 'letterSpacing',
    defaultValue: null,
  });

  const displayValue = useMemo(() => {
    if (result.value === null) return 'Char';
    return `${result.value}`;
  }, [result.value]);

  return {
    value: result.value,
    displayValue,
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    headingLevel: result.headingLevel,
    setLetterSpacing: result.setValue,
    clearLetterSpacing: result.clearValue,
  };
}

/**
 * useUnifiedSpacingBefore - Hook for paragraph spacing before
 */
export interface UseUnifiedSpacingBeforeResult {
  /** Current spacing before value (in line units) */
  value: number | null;
  /** Display value */
  displayValue: string;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Heading level if applicable */
  headingLevel: number | null;
  /** Set the spacing before */
  setSpacingBefore: (value: number) => void;
  /** Reset to default */
  clearSpacingBefore: () => void;
}

export function useUnifiedSpacingBefore(editor: Editor | null): UseUnifiedSpacingBeforeResult {
  const result = useUnifiedStyle<number | null>({
    editor,
    property: 'spacingBefore',
    defaultValue: 0,
  });

  const displayValue = useMemo(() => {
    if (result.value === null || result.value === 0) return 'Before';
    return `${result.value}`;
  }, [result.value]);

  return {
    value: result.value,
    displayValue,
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    headingLevel: result.headingLevel,
    setSpacingBefore: result.setValue,
    clearSpacingBefore: result.clearValue,
  };
}

/**
 * useUnifiedSpacingAfter - Hook for paragraph spacing after
 */
export interface UseUnifiedSpacingAfterResult {
  /** Current spacing after value (in line units) */
  value: number | null;
  /** Display value */
  displayValue: string;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Heading level if applicable */
  headingLevel: number | null;
  /** Set the spacing after */
  setSpacingAfter: (value: number) => void;
  /** Reset to default */
  clearSpacingAfter: () => void;
}

export function useUnifiedSpacingAfter(editor: Editor | null): UseUnifiedSpacingAfterResult {
  const result = useUnifiedStyle<number | null>({
    editor,
    property: 'spacingAfter',
    defaultValue: null,
  });

  const displayValue = useMemo(() => {
    if (result.value === null || result.value === 0) return 'After';
    return `${result.value}`;
  }, [result.value]);

  return {
    value: result.value,
    displayValue,
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    headingLevel: result.headingLevel,
    setSpacingAfter: result.setValue,
    clearSpacingAfter: result.clearValue,
  };
}
