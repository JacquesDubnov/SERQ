/**
 * UnifiedToolbar - TipTap Native UI with Unified Style System
 *
 * This is the ONLY toolbar. It uses the ORIGINAL dropdown components
 * (FontSizeDropdown, LineHeightDropdown, etc.) which have proper UI
 * (input fields, +/- buttons, etc.). These components read from
 * editor-utils.ts which is now heading-style-aware.
 *
 * Structure matches the original EditorToolbar exactly:
 * - Row 1: History, Fonts, Marks, Colors, Links, Clear
 * - Row 2: Headings, Lists, Alignment, Spacing
 */

import type { Editor } from '@tiptap/core';

// TipTap UI Primitives
import { Toolbar, ToolbarContainer, ToolbarGroup, ToolbarSeparator } from '@/components/tiptap-ui-primitive/toolbar';

// TipTap Feature Components
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button';
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu';
import { MarkButton } from '@/components/tiptap-ui/mark-button';
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button';
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button';
import { LinkPopover } from '@/components/tiptap-ui/link-popover';

// Heading-Aware Components (read from styleStore for headings)
import { HeadingAwareMarkButton } from '@/components/tiptap-ui-custom/heading-aware-mark-button';
import { HeadingAwareColorPopover } from '@/components/tiptap-ui-custom/heading-aware-color-popover';

// ORIGINAL Custom Components (with proper input fields, +/- buttons, etc.)
import { FontFamilyDropdown } from '@/components/tiptap-ui-custom/font-family-dropdown';
import { FontSizeDropdown } from '@/components/tiptap-ui-custom/font-size-dropdown';
import { FontWeightDropdown } from '@/components/tiptap-ui-custom/font-weight-dropdown';
import { LineHeightDropdown } from '@/components/tiptap-ui-custom/line-height-dropdown';
import { LetterSpacingDropdown } from '@/components/tiptap-ui-custom/letter-spacing-dropdown';
import { SpacingBeforeDropdown, SpacingAfterDropdown } from '@/components/tiptap-ui-custom/paragraph-spacing-dropdown';
import { HeadingToggleButtons } from '@/components/tiptap-ui-custom/heading-toggle-buttons';
import { ClearFormattingButton, ClearSpacingButton } from '@/components/tiptap-ui-custom/clear-formatting-buttons';
import { BlockIndicatorToggle } from '@/components/tiptap-ui-custom/block-indicator-toggle';

// Import TipTap component styles
import '@/components/tiptap-ui-primitive/toolbar/toolbar.scss';
import '@/components/tiptap-ui-primitive/button/button.scss';
import '@/components/tiptap-ui-primitive/button/button-colors.scss';
import '@/components/tiptap-ui-primitive/button/button-group.scss';
import '@/components/tiptap-ui-primitive/separator/separator.scss';
import '@/components/tiptap-ui-primitive/badge/badge.scss';
import '@/components/tiptap-ui-primitive/badge/badge-colors.scss';
import '@/components/tiptap-ui-primitive/badge/badge-group.scss';
import '@/components/tiptap-ui-primitive/dropdown-menu/dropdown-menu.scss';
import '@/components/tiptap-ui-primitive/card/card.scss';
import '@/components/tiptap-ui-primitive/popover/popover.scss';
import '@/components/tiptap-ui-primitive/input/input.scss';
import '@/components/tiptap-ui-primitive/tooltip/tooltip.scss';
import '@/components/tiptap-ui/color-text-popover/color-text-popover.scss';

interface UnifiedToolbarProps {
  editor: Editor | null;
}

export function UnifiedToolbar({ editor }: UnifiedToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <ToolbarContainer rows={2}>
      {/* Row 1: Primary editing controls */}
      <Toolbar variant="row">
        {/* History */}
        <ToolbarGroup>
          <UndoRedoButton editor={editor} action="undo" />
          <UndoRedoButton editor={editor} action="redo" />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Font controls - ORIGINAL components (now heading-aware via editor-utils) */}
        <ToolbarGroup>
          <FontFamilyDropdown editor={editor} />
          <FontSizeDropdown editor={editor} />
          <FontWeightDropdown editor={editor} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Text formatting - heading-aware for bold/italic/underline/strike */}
        <ToolbarGroup>
          <HeadingAwareMarkButton editor={editor} type="bold" />
          <HeadingAwareMarkButton editor={editor} type="italic" />
          <HeadingAwareMarkButton editor={editor} type="underline" />
          <HeadingAwareMarkButton editor={editor} type="strike" />
          <MarkButton editor={editor} type="code" />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Colors - heading-aware to show heading custom style colors */}
        <ToolbarGroup>
          <HeadingAwareColorPopover editor={editor} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Links */}
        <ToolbarGroup>
          <LinkPopover editor={editor} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Clear */}
        <ToolbarGroup>
          <ClearFormattingButton editor={editor} />
          <ClearSpacingButton />
        </ToolbarGroup>
      </Toolbar>

      {/* Row 2: Block formatting, alignment, spacing */}
      <Toolbar variant="row">
        {/* Headings */}
        <ToolbarGroup>
          <HeadingToggleButtons editor={editor} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Lists & Blocks */}
        <ToolbarGroup>
          <ListDropdownMenu editor={editor} types={['bulletList', 'orderedList', 'taskList']} />
          <BlockquoteButton editor={editor} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Text alignment */}
        <ToolbarGroup>
          <TextAlignButton editor={editor} align="left" />
          <TextAlignButton editor={editor} align="center" />
          <TextAlignButton editor={editor} align="right" />
          <TextAlignButton editor={editor} align="justify" />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Spacing - ORIGINAL components (now heading-aware via editor-utils) */}
        <ToolbarGroup>
          <LineHeightDropdown editor={editor} />
          <LetterSpacingDropdown editor={editor} />
          <SpacingBeforeDropdown editor={editor} />
          <SpacingAfterDropdown editor={editor} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* View options */}
        <ToolbarGroup>
          <BlockIndicatorToggle />
        </ToolbarGroup>
      </Toolbar>
    </ToolbarContainer>
  );
}

export default UnifiedToolbar;
