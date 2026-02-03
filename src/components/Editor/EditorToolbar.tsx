/**
 * EditorToolbar - TipTap Native UI Components
 *
 * Built with TipTap's official UI primitives and feature components.
 * Dark mode supported via .dark class on parent elements.
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
import { ColorTextPopover } from '@/components/tiptap-ui/color-text-popover';

// Custom Components
import { FontFamilyDropdown } from '@/components/tiptap-ui-custom/font-family-dropdown';
import { FontSizeDropdown } from '@/components/tiptap-ui-custom/font-size-dropdown';
import { FontWeightDropdown } from '@/components/tiptap-ui-custom/font-weight-dropdown';
import { LineHeightDropdown } from '@/components/tiptap-ui-custom/line-height-dropdown';
import { LetterSpacingDropdown } from '@/components/tiptap-ui-custom/letter-spacing-dropdown';
import { SpacingBeforeDropdown, SpacingAfterDropdown } from '@/components/tiptap-ui-custom/paragraph-spacing-dropdown';
import { HeadingToggleButtons } from '@/components/tiptap-ui-custom/heading-toggle-buttons';
import { ClearFormattingButton, ClearSpacingButton } from '@/components/tiptap-ui-custom/clear-formatting-buttons';

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

interface ToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: ToolbarProps) {
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

        {/* Font controls */}
        <ToolbarGroup>
          <FontFamilyDropdown editor={editor} />
          <FontSizeDropdown editor={editor} />
          <FontWeightDropdown editor={editor} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Text formatting */}
        <ToolbarGroup>
          <MarkButton editor={editor} type="bold" />
          <MarkButton editor={editor} type="italic" />
          <MarkButton editor={editor} type="underline" />
          <MarkButton editor={editor} type="strike" />
          <MarkButton editor={editor} type="code" />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Colors */}
        <ToolbarGroup>
          <ColorTextPopover editor={editor} />
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

        {/* Spacing */}
        <ToolbarGroup>
          <LineHeightDropdown editor={editor} />
          <LetterSpacingDropdown editor={editor} />
          <SpacingBeforeDropdown editor={editor} />
          <SpacingAfterDropdown editor={editor} />
        </ToolbarGroup>
      </Toolbar>
    </ToolbarContainer>
  );
}
