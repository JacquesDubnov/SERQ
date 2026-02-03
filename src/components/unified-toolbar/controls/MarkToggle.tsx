/**
 * MarkToggle - Unified mark toggle buttons
 *
 * Uses useUnifiedMark hook for context-aware styling.
 * Shows blue dot when displaying heading-level style.
 */

import { forwardRef, useCallback } from 'react';
import type { Editor } from '@tiptap/core';

import { Button } from '@/components/tiptap-ui-primitive/button';
import { useUnifiedMark, type MarkType } from '@/hooks/style-hooks';

interface MarkToggleProps {
  editor: Editor;
  type: MarkType;
}

export const MarkToggle = forwardRef<HTMLButtonElement, MarkToggleProps>(
  ({ editor, type }, ref) => {
    const {
      isActive,
      isHeadingLevel,
      toggle,
      canToggle,
      label,
      Icon,
    } = useUnifiedMark(editor, type);

    const handleClick = useCallback(() => {
      toggle();
    }, [toggle]);

    return (
      <Button
        type="button"
        data-style="ghost"
        data-active-state={isActive ? 'on' : 'off'}
        disabled={!canToggle}
        onClick={handleClick}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        ref={ref}
        style={{ position: 'relative' }}
      >
        <Icon className="tiptap-button-icon" />
        {isHeadingLevel && (
          <span
            className="heading-level-indicator"
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent, #3b82f6)',
            }}
            title="Applies to all headings of this level"
          />
        )}
      </Button>
    );
  }
);

MarkToggle.displayName = 'MarkToggle';

/**
 * Pre-configured mark toggle buttons
 */
export const BoldToggle = forwardRef<HTMLButtonElement, { editor: Editor }>(
  ({ editor }, ref) => <MarkToggle editor={editor} type="bold" ref={ref} />
);
BoldToggle.displayName = 'BoldToggle';

export const ItalicToggle = forwardRef<HTMLButtonElement, { editor: Editor }>(
  ({ editor }, ref) => <MarkToggle editor={editor} type="italic" ref={ref} />
);
ItalicToggle.displayName = 'ItalicToggle';

export const UnderlineToggle = forwardRef<HTMLButtonElement, { editor: Editor }>(
  ({ editor }, ref) => <MarkToggle editor={editor} type="underline" ref={ref} />
);
UnderlineToggle.displayName = 'UnderlineToggle';

export const StrikethroughToggle = forwardRef<HTMLButtonElement, { editor: Editor }>(
  ({ editor }, ref) => <MarkToggle editor={editor} type="strikethrough" ref={ref} />
);
StrikethroughToggle.displayName = 'StrikethroughToggle';

export const CodeToggle = forwardRef<HTMLButtonElement, { editor: Editor }>(
  ({ editor }, ref) => <MarkToggle editor={editor} type="code" ref={ref} />
);
CodeToggle.displayName = 'CodeToggle';
