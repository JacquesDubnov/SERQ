/**
 * useUnifiedMark - Hook for mark operations (bold, italic, underline, etc.)
 */

import type { Editor } from '@tiptap/core';
import { useUnifiedToggle, type UseUnifiedToggleResult } from './useUnifiedStyle';
import type { StyleProperty } from '@/lib/style-operations';

// Icons for marks
import { BoldIcon } from '@/components/tiptap-icons/bold-icon';
import { ItalicIcon } from '@/components/tiptap-icons/italic-icon';
import { UnderlineIcon } from '@/components/tiptap-icons/underline-icon';
import { StrikeIcon } from '@/components/tiptap-icons/strike-icon';
import { Code2Icon } from '@/components/tiptap-icons/code2-icon';
import { SuperscriptIcon } from '@/components/tiptap-icons/superscript-icon';
import { SubscriptIcon } from '@/components/tiptap-icons/subscript-icon';

export type MarkType = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'superscript' | 'subscript';

// Map mark types to style properties
const MARK_TO_PROPERTY: Record<MarkType, StyleProperty> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strikethrough: 'strikethrough',
  code: 'code',
  superscript: 'superscript',
  subscript: 'subscript',
};

// Mark metadata
export const MARK_META: Record<MarkType, { label: string; icon: React.FC<{ className?: string }>; shortcut: string }> = {
  bold: { label: 'Bold', icon: BoldIcon, shortcut: 'mod+b' },
  italic: { label: 'Italic', icon: ItalicIcon, shortcut: 'mod+i' },
  underline: { label: 'Underline', icon: UnderlineIcon, shortcut: 'mod+u' },
  strikethrough: { label: 'Strikethrough', icon: StrikeIcon, shortcut: 'mod+shift+s' },
  code: { label: 'Code', icon: Code2Icon, shortcut: 'mod+e' },
  superscript: { label: 'Superscript', icon: SuperscriptIcon, shortcut: 'mod+.' },
  subscript: { label: 'Subscript', icon: SubscriptIcon, shortcut: 'mod+,' },
};

export interface UseUnifiedMarkResult extends UseUnifiedToggleResult {
  /** Mark type */
  type: MarkType;
  /** Display label */
  label: string;
  /** Icon component */
  Icon: React.FC<{ className?: string }>;
  /** Keyboard shortcut */
  shortcut: string;
}

export function useUnifiedMark(
  editor: Editor | null,
  type: MarkType
): UseUnifiedMarkResult {
  const property = MARK_TO_PROPERTY[type];
  const result = useUnifiedToggle(editor, property);
  const meta = MARK_META[type];

  return {
    ...result,
    type,
    label: meta.label,
    Icon: meta.icon,
    shortcut: meta.shortcut,
  };
}

/**
 * Hook for bold specifically
 */
export function useUnifiedBold(editor: Editor | null): UseUnifiedMarkResult {
  return useUnifiedMark(editor, 'bold');
}

/**
 * Hook for italic specifically
 */
export function useUnifiedItalic(editor: Editor | null): UseUnifiedMarkResult {
  return useUnifiedMark(editor, 'italic');
}

/**
 * Hook for underline specifically
 */
export function useUnifiedUnderline(editor: Editor | null): UseUnifiedMarkResult {
  return useUnifiedMark(editor, 'underline');
}

/**
 * Hook for strikethrough specifically
 */
export function useUnifiedStrikethrough(editor: Editor | null): UseUnifiedMarkResult {
  return useUnifiedMark(editor, 'strikethrough');
}

/**
 * Hook for code specifically
 */
export function useUnifiedCode(editor: Editor | null): UseUnifiedMarkResult {
  return useUnifiedMark(editor, 'code');
}
