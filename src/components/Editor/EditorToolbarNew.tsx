/**
 * EditorToolbar - Hybrid TipTap UI + Custom Components
 *
 * Uses TipTap UI components for standard formatting, custom components
 * for SERQ-specific features (fonts, spacing, pagination, etc.)
 */

import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/core';

// TipTap UI Components
import { Toolbar, ToolbarGroup, ToolbarSeparator } from '@/components/tiptap-ui-primitive/toolbar';
import { MarkButton } from '@/components/tiptap-ui/mark-button';
import { HeadingButton } from '@/components/tiptap-ui/heading-button';
import { ListButton } from '@/components/tiptap-ui/list-button';
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button';
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button';
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button';
import { CodeBlockButton } from '@/components/tiptap-ui/code-block-button';
import { Button } from '@/components/tiptap-ui-primitive/button';

// Custom Components (SERQ-specific)
import { FormatPainter } from '../FormatPainter';
import { TablePicker } from './TablePicker';
import { FontControls } from './FontControls';
import { TextColorPicker } from './TextColorPicker';
import { SpacingControls } from './SpacingControls';
import { CaseControls } from './CaseControls';
import { useEditorStore, type PageSize } from '../../stores/editorStore';

// Icons
import { EraseIcon } from '@/components/tiptap-icons/erase-icon';
import { TableIcon } from './icons/TableIcon';
import { CalloutIcon } from './icons/CalloutIcon';
import { PaginationIcon } from './icons/PaginationIcon';

interface InterfaceColors {
  bg: string;
  bgSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
}

interface ToolbarProps {
  editor: Editor;
  interfaceColors: InterfaceColors;
}

export function EditorToolbarNew({ editor, interfaceColors }: ToolbarProps) {
  const [showTablePicker, setShowTablePicker] = useState(false);

  // Pagination state from store
  const pagination = useEditorStore((state) => state.pagination);
  const togglePagination = useEditorStore((state) => state.togglePagination);
  const setPageSize = useEditorStore((state) => state.setPageSize);

  const handleInsertTable = useCallback((rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: false }).run();
    setShowTablePicker(false);
  }, [editor]);

  const handleClearFormatting = useCallback(() => {
    editor
      .chain()
      .focus()
      .unsetAllMarks()
      .setTextAlign('left')
      .run();

    // Explicitly unset textStyle attributes
    if (editor.can().unsetFontFamily?.()) editor.commands.unsetFontFamily();
    if (editor.can().unsetFontSize?.()) editor.commands.unsetFontSize();
    if (editor.can().unsetFontWeight?.()) editor.commands.unsetFontWeight();
    if (editor.can().unsetColor?.()) editor.commands.unsetColor();
    if (editor.can().unsetLetterSpacing?.()) editor.commands.unsetLetterSpacing();
    if (editor.can().unsetLineHeight?.()) editor.commands.unsetLineHeight();
  }, [editor]);

  return (
    <Toolbar
      variant="fixed"
      style={{
        backgroundColor: interfaceColors.bg,
        borderTop: `1px solid ${interfaceColors.border}`,
        padding: '8px 20px',
        gap: '8px',
      }}
    >
      {/* Font Controls (Custom - SERQ specific) */}
      <ToolbarGroup>
        <FontControls editor={editor} interfaceColors={interfaceColors} />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Text Color (Custom) */}
      <ToolbarGroup>
        <TextColorPicker editor={editor} interfaceColors={interfaceColors} />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Spacing Controls (Custom) */}
      <ToolbarGroup>
        <SpacingControls editor={editor} interfaceColors={interfaceColors} />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Case Controls (Custom) */}
      <ToolbarGroup>
        <CaseControls editor={editor} interfaceColors={interfaceColors} />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* History - TipTap UI */}
      <ToolbarGroup>
        <UndoRedoButton editor={editor} action="undo" />
        <UndoRedoButton editor={editor} action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Headings - TipTap UI */}
      <ToolbarGroup>
        <HeadingButton editor={editor} level={1} text="H1" />
        <HeadingButton editor={editor} level={2} text="H2" />
        <HeadingButton editor={editor} level={3} text="H3" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Text Formatting - TipTap UI */}
      <ToolbarGroup>
        <MarkButton editor={editor} type="bold" />
        <MarkButton editor={editor} type="italic" />
        <MarkButton editor={editor} type="underline" />
        <MarkButton editor={editor} type="strike" />
        <MarkButton editor={editor} type="code" />
        <MarkButton editor={editor} type="subscript" />
        <MarkButton editor={editor} type="superscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Lists - TipTap UI */}
      <ToolbarGroup>
        <ListButton editor={editor} type="bulletList" />
        <ListButton editor={editor} type="orderedList" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Block Elements - TipTap UI + Custom */}
      <ToolbarGroup>
        <BlockquoteButton editor={editor} />
        <CodeBlockButton editor={editor} />

        {/* Table Picker - Custom */}
        <div style={{ position: 'relative' }}>
          <Button
            type="button"
            data-style="ghost"
            data-active-state={showTablePicker ? 'on' : 'off'}
            tooltip="Insert Table"
            onClick={() => setShowTablePicker(!showTablePicker)}
          >
            <TableIcon />
          </Button>
          {showTablePicker && (
            <TablePicker
              onSelect={handleInsertTable}
              onClose={() => setShowTablePicker(false)}
            />
          )}
        </div>

        {/* Callout - Custom */}
        <Button
          type="button"
          data-style="ghost"
          tooltip="Insert Callout"
          onClick={() => editor.chain().focus().insertCallout({ color: 'blue' }).run()}
        >
          <CalloutIcon />
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Text Alignment - TipTap UI */}
      <ToolbarGroup>
        <TextAlignButton editor={editor} align="left" />
        <TextAlignButton editor={editor} align="center" />
        <TextAlignButton editor={editor} align="right" />
        <TextAlignButton editor={editor} align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Pagination - Custom */}
      <ToolbarGroup>
        <Button
          type="button"
          data-style="ghost"
          data-active-state={pagination.enabled ? 'on' : 'off'}
          tooltip="Toggle Pagination Mode"
          onClick={togglePagination}
        >
          <PaginationIcon />
        </Button>

        {pagination.enabled && (
          <select
            value={pagination.pageSize}
            onChange={(e) => setPageSize(e.target.value as PageSize)}
            style={{
              fontSize: '12px',
              borderRadius: '4px',
              padding: '4px 8px',
              backgroundColor: interfaceColors.bg,
              border: `1px solid ${interfaceColors.border}`,
              color: interfaceColors.textPrimary,
            }}
            title="Page Size"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="legal">Legal</option>
          </select>
        )}
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Clear Formatting & Format Painter - Custom */}
      <ToolbarGroup>
        <Button
          type="button"
          data-style="ghost"
          tooltip="Clear Formatting (Cmd+\)"
          onClick={handleClearFormatting}
        >
          <EraseIcon />
        </Button>
        <FormatPainter editor={editor} colors={interfaceColors} />
      </ToolbarGroup>
    </Toolbar>
  );
}

export default EditorToolbarNew;
