/**
 * Clear Formatting Buttons
 *
 * Two buttons for clearing different types of formatting:
 * 1. ClearFormattingButton - Clears inline marks (bold, italic, colors, font sizes, etc.)
 *    Keeps block structure (headings, lists, etc.) intact.
 * 2. ClearSpacingButton - Resets all paragraph/heading spacing to defaults.
 */

import { useCallback } from 'react';
import type { Editor } from '@tiptap/core';

// Store
import { useStyleStore } from '@/stores/styleStore';

// TipTap UI Primitives
import { Button } from '@/components/tiptap-ui-primitive/button';

// Clear formatting icon (eraser)
const ClearFormattingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16" />
    <path d="M10 3v4" />
    <path d="M12 21l4-8 4 8" />
    <path d="M14 19h4" />
    <path d="m3 21 9-9" />
    <path d="M9 21H3" />
  </svg>
);

// Clear spacing icon (spacing lines with X)
const ClearSpacingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <line x1="8" y1="10" x2="16" y2="14" />
    <line x1="16" y1="10" x2="8" y2="14" />
  </svg>
);

interface ClearFormattingButtonProps {
  editor: Editor;
}

/**
 * Clears all inline formatting (marks) from selected text or entire document.
 * Also clears all heading custom styles including dividers.
 * Preserves block structure (headings, lists, etc.)
 */
export function ClearFormattingButton({ editor }: ClearFormattingButtonProps) {
  const { resetHeadingStyle } = useStyleStore();

  const handleClearFormatting = useCallback(() => {
    const { from, empty } = editor.state.selection;

    if (empty) {
      // No selection - clear marks from entire document
      editor
        .chain()
        .selectAll()
        .unsetAllMarks()
        .setTextSelection({ from, to: from }) // Restore cursor position
        .run();

      // Also clear all heading custom styles (including dividers)
      ([1, 2, 3, 4, 5, 6] as const).forEach((level) => {
        resetHeadingStyle(level);
      });
    } else {
      // Has selection - clear marks from selection only
      editor.chain().focus().unsetAllMarks().run();
    }
  }, [editor, resetHeadingStyle]);

  return (
    <Button
      type="button"
      data-style="ghost"
      onClick={handleClearFormatting}
      aria-label="Clear formatting"
      tooltip="Clear Formatting (Marks)"
    >
      <ClearFormattingIcon />
    </Button>
  );
}

/**
 * Resets all paragraph and heading spacing to defaults.
 * Clears global paragraph spacing and all per-heading overrides.
 */
export function ClearSpacingButton() {
  const { clearAllSpacing } = useStyleStore();

  const handleClearSpacing = useCallback(() => {
    clearAllSpacing();
  }, [clearAllSpacing]);

  return (
    <Button
      type="button"
      data-style="ghost"
      onClick={handleClearSpacing}
      aria-label="Clear spacing"
      tooltip="Clear All Spacing"
    >
      <ClearSpacingIcon />
    </Button>
  );
}

export default { ClearFormattingButton, ClearSpacingButton };
