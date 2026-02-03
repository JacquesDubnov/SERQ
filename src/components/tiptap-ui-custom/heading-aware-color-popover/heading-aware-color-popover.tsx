/**
 * HeadingAwareColorPopover - Color popover that respects heading custom styles
 *
 * When cursor is in a heading with custom styles assigned (via styleStore),
 * shows the colors from the heading custom style instead of checking TipTap marks.
 *
 * For non-heading content, behaves exactly like the standard ColorTextPopover.
 */

import { forwardRef, useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

// --- Lib ---
import { getBlockInfoAtCursor, resolveCssVariable } from '@/lib/editor-utils';
import { isMarkInSchema } from '@/lib/tiptap-utils';
import { getActiveMarkAttrs } from '@/lib/tiptap-advanced-utils';

// --- Store ---
import { useStyleStore } from '@/stores/styleStore';

// --- Icons ---
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';
import { TextColorSmallIcon } from '@/components/tiptap-icons/text-color-small-icon';

// --- Tiptap UI ---
import { canColorText } from '@/components/tiptap-ui/color-text-button';
import { canColorHighlight } from '@/components/tiptap-ui/color-highlight-button';
import { TextStyleColorPanel } from '@/components/tiptap-ui/color-text-popover';
import type { ColorType } from '@/components/tiptap-ui/color-text-popover';

// --- UI Primitives ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button';
import { Button } from '@/components/tiptap-ui-primitive/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/tiptap-ui-primitive/popover';

// --- Styles ---
import '@/components/tiptap-ui/color-text-popover/color-text-popover.scss';

export interface HeadingAwareColorPopoverProps extends Omit<ButtonProps, 'type'> {
  editor?: Editor | null;
  hideWhenUnavailable?: boolean;
  onColorChanged?: ({
    type,
    label,
    value,
  }: {
    type: ColorType;
    label: string;
    value: string;
  }) => void;
}

/**
 * Get heading-aware text color
 * For headings with custom styles, return the custom style's text color
 * For everything else, use TipTap's textStyle mark
 */
function getHeadingAwareTextColor(editor: Editor | null): string | undefined {
  if (!editor) return undefined;

  const blockInfo = getBlockInfoAtCursor(editor);

  // Check if we're in a heading with custom style
  if (blockInfo.type === 'heading' && blockInfo.level) {
    const level = blockInfo.level as 1 | 2 | 3 | 4 | 5 | 6;
    const customStyle = useStyleStore.getState().getHeadingCustomStyle(level);

    if (customStyle?.textColor) {
      // Resolve CSS variable to actual color
      return resolveCssVariable(customStyle.textColor) || undefined;
    }
  }

  // Default: use TipTap's textStyle mark
  const attrs = getActiveMarkAttrs(editor, 'textStyle') || {};
  return attrs.color || undefined;
}

/**
 * Get heading-aware highlight/background color
 * For headings with custom styles, return the custom style's background color
 * For everything else, use TipTap's highlight mark
 */
function getHeadingAwareHighlightColor(editor: Editor | null): string | undefined {
  if (!editor) return undefined;

  const blockInfo = getBlockInfoAtCursor(editor);

  // Check if we're in a heading with custom style
  if (blockInfo.type === 'heading' && blockInfo.level) {
    const level = blockInfo.level as 1 | 2 | 3 | 4 | 5 | 6;
    const customStyle = useStyleStore.getState().getHeadingCustomStyle(level);

    if (customStyle?.backgroundColor) {
      // Resolve CSS variable to actual color
      return resolveCssVariable(customStyle.backgroundColor) || undefined;
    }
  }

  // Default: use TipTap's highlight mark
  const attrs = getActiveMarkAttrs(editor, 'highlight') || {};
  return attrs.color || undefined;
}

/**
 * Heading-aware color text popover
 */
export const HeadingAwareColorPopover = forwardRef<
  HTMLButtonElement,
  HeadingAwareColorPopoverProps
>(
  (
    {
      editor: providedEditor,
      hideWhenUnavailable = false,
      onColorChanged,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [activeTextColor, setActiveTextColor] = useState<string | undefined>(undefined);
    const [activeHighlightColor, setActiveHighlightColor] = useState<string | undefined>(undefined);

    const textStyleInSchema = isMarkInSchema('textStyle', editor);
    const highlightInSchema = isMarkInSchema('highlight', editor);
    const canToggle = canColorText(editor) || canColorHighlight(editor);

    // Update visibility and colors on selection changes
    useEffect(() => {
      if (!editor) return;

      const handleUpdate = () => {
        // Update visibility
        if (hideWhenUnavailable && !editor.isActive('code')) {
          setIsVisible(canColorText(editor) || canColorHighlight(editor));
        } else {
          setIsVisible(true);
        }

        // Update colors
        setActiveTextColor(getHeadingAwareTextColor(editor));
        setActiveHighlightColor(getHeadingAwareHighlightColor(editor));
      };

      handleUpdate();

      editor.on('selectionUpdate', handleUpdate);
      editor.on('transaction', handleUpdate);

      return () => {
        editor.off('selectionUpdate', handleUpdate);
        editor.off('transaction', handleUpdate);
      };
    }, [editor, hideWhenUnavailable, textStyleInSchema, highlightInSchema]);

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setIsOpen(!isOpen);
      },
      [onClick, isOpen]
    );

    const handleColorChanged = useCallback(
      ({
        type,
        label,
        value,
      }: {
        type: ColorType;
        label: string;
        value: string;
      }) => {
        onColorChanged?.({ type, label, value });
      },
      [onColorChanged]
    );

    if (!isVisible) {
      return null;
    }

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            data-appearance="default"
            role="button"
            aria-label="Text color"
            tooltip="Text color"
            disabled={!canToggle}
            data-disabled={!canToggle}
            onClick={handleClick}
            {...buttonProps}
            ref={ref}
          >
            {children ?? (
              <>
                <span
                  className="tiptap-button-color-text-popover"
                  style={
                    activeHighlightColor
                      ? ({
                          '--active-highlight-color': activeHighlightColor,
                        } as React.CSSProperties)
                      : ({} as React.CSSProperties)
                  }
                >
                  <TextColorSmallIcon
                    className="tiptap-button-icon"
                    style={{
                      color: activeTextColor || undefined,
                    }}
                  />
                </span>
                <ChevronDownIcon className="tiptap-button-dropdown-small" />
              </>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          aria-label="Text color options"
          side="bottom"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <TextStyleColorPanel editor={editor} onColorChanged={handleColorChanged} />
        </PopoverContent>
      </Popover>
    );
  }
);

HeadingAwareColorPopover.displayName = 'HeadingAwareColorPopover';

export default HeadingAwareColorPopover;
