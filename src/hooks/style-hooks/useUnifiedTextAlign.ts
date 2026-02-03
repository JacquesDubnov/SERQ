/**
 * useUnifiedTextAlign - Hook for text alignment operations
 */

import { useCallback, useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import { useUnifiedStyle } from './useUnifiedStyle';

// Icons for alignment
import { AlignLeftIcon } from '@/components/tiptap-icons/align-left-icon';
import { AlignCenterIcon } from '@/components/tiptap-icons/align-center-icon';
import { AlignRightIcon } from '@/components/tiptap-icons/align-right-icon';
import { AlignJustifyIcon } from '@/components/tiptap-icons/align-justify-icon';

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export const ALIGNMENTS: { value: TextAlignment; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'left', label: 'Align Left', icon: AlignLeftIcon },
  { value: 'center', label: 'Align Center', icon: AlignCenterIcon },
  { value: 'right', label: 'Align Right', icon: AlignRightIcon },
  { value: 'justify', label: 'Justify', icon: AlignJustifyIcon },
];

export interface UseUnifiedTextAlignResult {
  /** Current alignment value */
  value: TextAlignment;
  /** Source of the value */
  source: 'mark' | 'cssVar' | 'nodeAttr' | 'default';
  /** Set the alignment */
  setAlignment: (value: TextAlignment) => void;
  /** Reset to default (left) */
  clearAlignment: () => void;
  /** Check if a specific alignment is active */
  isAlignment: (align: TextAlignment) => boolean;
  /** Get icon for current alignment */
  Icon: React.FC<{ className?: string }>;
  /** Get label for current alignment */
  label: string;
}

export function useUnifiedTextAlign(editor: Editor | null): UseUnifiedTextAlignResult {
  const result = useUnifiedStyle<string | null>({
    editor,
    property: 'textAlign',
    defaultValue: 'left',
  });

  const value = (result.value || 'left') as TextAlignment;

  const isAlignment = useCallback((align: TextAlignment) => {
    return value === align;
  }, [value]);

  const alignmentMeta = useMemo(() => {
    return ALIGNMENTS.find(a => a.value === value) || ALIGNMENTS[0];
  }, [value]);

  const setAlignment = useCallback((align: TextAlignment) => {
    result.setValue(align);
  }, [result.setValue]);

  const clearAlignment = useCallback(() => {
    result.clearValue();
  }, [result.clearValue]);

  return {
    value,
    source: result.source,
    setAlignment,
    clearAlignment,
    isAlignment,
    Icon: alignmentMeta.icon,
    label: alignmentMeta.label,
  };
}

/**
 * Hook for a specific alignment button
 */
export interface UseAlignmentButtonResult {
  /** Whether this alignment is currently active */
  isActive: boolean;
  /** Set this alignment */
  setAlignment: () => void;
  /** Icon for this alignment */
  Icon: React.FC<{ className?: string }>;
  /** Label for this alignment */
  label: string;
}

export function useAlignmentButton(
  editor: Editor | null,
  alignment: TextAlignment
): UseAlignmentButtonResult {
  const { isAlignment, setAlignment } = useUnifiedTextAlign(editor);
  const meta = ALIGNMENTS.find(a => a.value === alignment) || ALIGNMENTS[0];

  return {
    isActive: isAlignment(alignment),
    setAlignment: useCallback(() => setAlignment(alignment), [setAlignment, alignment]),
    Icon: meta.icon,
    label: meta.label,
  };
}
