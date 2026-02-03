/**
 * HeadingAwareMarkButton - Mark button that respects heading custom styles
 *
 * When cursor is in a heading with custom styles assigned (via styleStore),
 * this button shows the mark state from the heading custom style instead of
 * checking TipTap marks directly.
 *
 * For non-heading content, behaves exactly like the standard MarkButton.
 */

import { forwardRef, useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

// --- Lib ---
import { parseShortcutKeys } from '@/lib/tiptap-utils';
import { getBlockInfoAtCursor } from '@/lib/editor-utils';

// --- Store ---
import { useStyleStore } from '@/stores/styleStore';

// --- Tiptap UI ---
import type { Mark, UseMarkConfig } from '@/components/tiptap-ui/mark-button';
import {
  MARK_SHORTCUT_KEYS,
  markIcons,
  canToggleMark,
  toggleMark,
  shouldShowButton,
  getFormattedMarkName,
} from '@/components/tiptap-ui/mark-button';

// --- UI Primitives ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button';
import { Button } from '@/components/tiptap-ui-primitive/button';
import { Badge } from '@/components/tiptap-ui-primitive/badge';

export interface HeadingAwareMarkButtonProps
  extends Omit<ButtonProps, 'type'>,
    UseMarkConfig {
  text?: string;
  showShortcut?: boolean;
}

/**
 * Get heading-aware mark state
 * For headings with custom styles, return the style's mark state
 * For everything else, use TipTap's isActive
 */
function getHeadingAwareMarkState(editor: Editor | null, type: Mark): boolean {
  if (!editor || !editor.isEditable) return false;

  const blockInfo = getBlockInfoAtCursor(editor);

  // Check if we're in a heading with custom style
  if (blockInfo.type === 'heading' && blockInfo.level) {
    const level = blockInfo.level as 1 | 2 | 3 | 4 | 5 | 6;
    const customStyle = useStyleStore.getState().getHeadingCustomStyle(level);

    if (customStyle) {
      // Map mark type to custom style property
      switch (type) {
        case 'bold':
          return customStyle.bold;
        case 'italic':
          return customStyle.italic;
        case 'underline':
          return customStyle.underline;
        case 'strike':
          return customStyle.strikethrough;
        default:
          // For other marks (code, etc.), fall through to editor.isActive
          break;
      }
    }
  }

  // Default: use TipTap's isActive
  return editor.isActive(type);
}

export function MarkShortcutBadge({
  type,
  shortcutKeys = MARK_SHORTCUT_KEYS[type],
}: {
  type: Mark;
  shortcutKeys?: string;
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>;
}

/**
 * Heading-aware mark button that shows correct state for heading custom styles
 */
export const HeadingAwareMarkButton = forwardRef<
  HTMLButtonElement,
  HeadingAwareMarkButtonProps
>(
  (
    {
      editor: providedEditor,
      type,
      text,
      hideWhenUnavailable = false,
      onToggled,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [isActive, setIsActive] = useState<boolean>(false);

    const canToggle = canToggleMark(editor, type);
    const Icon = markIcons[type];
    const label = getFormattedMarkName(type);
    const shortcutKeys = MARK_SHORTCUT_KEYS[type];

    // Update visibility and active state on selection changes
    useEffect(() => {
      if (!editor) return;

      const handleUpdate = () => {
        setIsVisible(shouldShowButton({ editor, type, hideWhenUnavailable }));
        setIsActive(getHeadingAwareMarkState(editor, type));
      };

      handleUpdate();

      editor.on('selectionUpdate', handleUpdate);
      editor.on('transaction', handleUpdate);

      return () => {
        editor.off('selectionUpdate', handleUpdate);
        editor.off('transaction', handleUpdate);
      };
    }, [editor, type, hideWhenUnavailable]);

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        if (editor) {
          const success = toggleMark(editor, type);
          if (success) {
            onToggled?.();
          }
        }
      },
      [editor, type, onToggled, onClick]
    );

    if (!isVisible) {
      return null;
    }

    return (
      <Button
        type="button"
        disabled={!canToggle}
        data-style="ghost"
        data-active-state={isActive ? 'on' : 'off'}
        data-disabled={!canToggle}
        role="button"
        tabIndex={-1}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <Icon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
            {showShortcut && (
              <MarkShortcutBadge type={type} shortcutKeys={shortcutKeys} />
            )}
          </>
        )}
      </Button>
    );
  }
);

HeadingAwareMarkButton.displayName = 'HeadingAwareMarkButton';

export default HeadingAwareMarkButton;
