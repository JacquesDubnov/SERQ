/**
 * useUnifiedStyle - Base hook for all style operations
 *
 * This hook provides the foundation for reading and writing style properties
 * in a unified way across headings and paragraphs.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import {
  getStyleContext,
  readStyle,
  writeStyle,
  clearStyle,
  toggleStyle,
  isHeadingContext,
  type StyleProperty,
  type StyleValue,
  type StyleContext,
} from '@/lib/style-operations';
import { useStyleStore } from '@/stores/styleStore';

export interface UseUnifiedStyleResult<T = unknown> {
  /** Current value of the property */
  value: T;
  /** Source of the value (mark, cssVar, default) */
  source: StyleValue['source'];
  /** Whether this is a heading-level style (affects all headings of this level) */
  isHeadingLevel: boolean;
  /** Heading level if in a heading (1-6), null otherwise */
  headingLevel: number | null;
  /** Whether the property is explicitly set (not default) */
  isCustomized: boolean;
  /** Set the value */
  setValue: (value: T) => void;
  /** Clear/reset the value to default */
  clearValue: () => void;
  /** Current style context */
  context: StyleContext | null;
}

export interface UseUnifiedStyleOptions {
  /** The editor instance */
  editor: Editor | null;
  /** The style property to manage */
  property: StyleProperty;
  /** Optional default value to use when no value is set */
  defaultValue?: unknown;
}

/**
 * Base hook for unified style operations
 *
 * This hook handles:
 * - Reading the current value from the correct source (marks vs store)
 * - Writing values to the correct destination based on context
 * - Subscribing to editor and store updates
 */
export function useUnifiedStyle<T = unknown>(
  options: UseUnifiedStyleOptions
): UseUnifiedStyleResult<T> {
  const { editor, property, defaultValue } = options;

  // Local state for the style value
  const [styleValue, setStyleValue] = useState<StyleValue<T>>({
    property,
    value: (defaultValue ?? null) as T,
    source: 'default',
    isCustomized: false,
  });

  // Track the current context
  const [context, setContext] = useState<StyleContext | null>(null);

  // Subscribe to heading style changes in the store
  const headingCustomStyles = useStyleStore((state) => state.headingCustomStyles);

  // Update style value when editor selection or store changes
  useEffect(() => {
    if (!editor) {
      setContext(null);
      setStyleValue({
        property,
        value: (defaultValue ?? null) as T,
        source: 'default',
        isCustomized: false,
      });
      return;
    }

    const updateValue = () => {
      const ctx = getStyleContext(editor);
      setContext(ctx);

      const result = readStyle(ctx, property) as StyleValue<T>;
      setStyleValue(result);
    };

    // Initial update
    updateValue();

    // Subscribe to editor events
    editor.on('selectionUpdate', updateValue);
    editor.on('transaction', updateValue);

    return () => {
      editor.off('selectionUpdate', updateValue);
      editor.off('transaction', updateValue);
    };
  }, [editor, property, defaultValue, headingCustomStyles]);

  // Set value callback
  const setValue = useCallback((value: T) => {
    if (!editor || !context) return;

    writeStyle(context, property, value);
  }, [editor, context, property]);

  // Clear value callback
  const clearValue = useCallback(() => {
    if (!editor || !context) return;

    clearStyle(context, property);
  }, [editor, context, property]);

  // Compute derived values
  const isHeadingLevel = useMemo(() => {
    return context !== null && isHeadingContext(context) && styleValue.source === 'cssVar';
  }, [context, styleValue.source]);

  const headingLevel = useMemo(() => {
    return context?.headingLevel ?? null;
  }, [context]);

  return {
    value: styleValue.value,
    source: styleValue.source,
    isHeadingLevel,
    headingLevel,
    isCustomized: styleValue.isCustomized,
    setValue,
    clearValue,
    context,
  };
}

/**
 * Hook variant for boolean/toggle properties (bold, italic, etc.)
 */
export interface UseUnifiedToggleResult {
  /** Whether the property is active */
  isActive: boolean;
  /** Source of the value */
  source: StyleValue['source'];
  /** Whether this is a heading-level style */
  isHeadingLevel: boolean;
  /** Toggle the property on/off */
  toggle: () => void;
  /** Set to a specific value */
  setValue: (value: boolean) => void;
  /** Can the property be toggled right now */
  canToggle: boolean;
}

export function useUnifiedToggle(
  editor: Editor | null,
  property: StyleProperty
): UseUnifiedToggleResult {
  const result = useUnifiedStyle<boolean>({
    editor,
    property,
    defaultValue: false,
  });

  const toggle = useCallback(() => {
    if (!editor || !result.context) return;

    toggleStyle(result.context, property);
  }, [editor, result.context, property]);

  // Check if we can toggle (not in code block, etc.)
  const canToggle = useMemo(() => {
    if (!editor || !editor.isEditable) return false;
    if (result.context?.blockType === 'codeBlock') return false;
    return editor.can().toggleMark(property);
  }, [editor, result.context, property]);

  return {
    isActive: result.value,
    source: result.source,
    isHeadingLevel: result.isHeadingLevel,
    toggle,
    setValue: result.setValue,
    canToggle,
  };
}
