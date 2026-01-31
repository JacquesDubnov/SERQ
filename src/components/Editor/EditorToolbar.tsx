import { useState, useCallback } from 'react';
import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { FormatPainter } from '../FormatPainter';
import { TablePicker } from './TablePicker';

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

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  colors: InterfaceColors;
}

function ToolbarButton({ onClick, isActive, disabled, title, children, colors }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1.5 rounded text-sm font-medium transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        backgroundColor: isActive ? colors.bgSurface : 'transparent',
        color: isActive ? colors.textPrimary : colors.textSecondary,
      }}
    >
      {children}
    </button>
  );
}

function Divider({ color }: { color: string }) {
  return <div className="w-px h-6 mx-1" style={{ backgroundColor: color }} />;
}

export function EditorToolbar({ editor, interfaceColors }: ToolbarProps) {
  const [showTablePicker, setShowTablePicker] = useState(false)

  const handleInsertTable = useCallback((rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: false }).run()
    setShowTablePicker(false)
  }, [editor])

  // CRITICAL: Use selector to avoid re-render avalanche
  // Only re-renders when selected values change, not on every transaction
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      // Text formatting
      isBold: ctx.editor.isActive('bold'),
      isItalic: ctx.editor.isActive('italic'),
      isUnderline: ctx.editor.isActive('underline'),
      isStrike: ctx.editor.isActive('strike'),
      isCode: ctx.editor.isActive('code'),
      isSubscript: ctx.editor.isActive('subscript'),
      isSuperscript: ctx.editor.isActive('superscript'),

      // Block types
      isParagraph: ctx.editor.isActive('paragraph'),
      isHeading1: ctx.editor.isActive('heading', { level: 1 }),
      isHeading2: ctx.editor.isActive('heading', { level: 2 }),
      isHeading3: ctx.editor.isActive('heading', { level: 3 }),
      isBulletList: ctx.editor.isActive('bulletList'),
      isOrderedList: ctx.editor.isActive('orderedList'),
      isBlockquote: ctx.editor.isActive('blockquote'),
      isCodeBlock: ctx.editor.isActive('codeBlock'),

      // Text alignment
      alignLeft: ctx.editor.isActive({ textAlign: 'left' }),
      alignCenter: ctx.editor.isActive({ textAlign: 'center' }),
      alignRight: ctx.editor.isActive({ textAlign: 'right' }),
      alignJustify: ctx.editor.isActive({ textAlign: 'justify' }),

      // History
      canUndo: ctx.editor.can().undo(),
      canRedo: ctx.editor.can().redo(),
    }),
  });

  return (
    <div
      className="py-2 flex items-center gap-2 flex-wrap"
      style={{
        backgroundColor: interfaceColors.bg,
        borderTop: `1px solid ${interfaceColors.border}`,
        paddingLeft: '20px',
        paddingRight: '20px',
      }}
    >
      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!state.canUndo}
        title="Undo (Cmd+Z)"
        colors={interfaceColors}
      >
        Undo
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!state.canRedo}
        title="Redo (Cmd+Shift+Z)"
        colors={interfaceColors}
      >
        Redo
      </ToolbarButton>

      <Divider color={interfaceColors.border} />

      {/* Block Types */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={state.isParagraph && !state.isHeading1 && !state.isHeading2 && !state.isHeading3}
        title="Paragraph"
        colors={interfaceColors}
      >
        P
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={state.isHeading1}
        title="Heading 1 (Cmd+Alt+1)"
        colors={interfaceColors}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={state.isHeading2}
        title="Heading 2 (Cmd+Alt+2)"
        colors={interfaceColors}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={state.isHeading3}
        title="Heading 3 (Cmd+Alt+3)"
        colors={interfaceColors}
      >
        H3
      </ToolbarButton>

      <Divider color={interfaceColors.border} />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={state.isBold}
        title="Bold (Cmd+B)"
        colors={interfaceColors}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={state.isItalic}
        title="Italic (Cmd+I)"
        colors={interfaceColors}
      >
        I
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={state.isUnderline}
        title="Underline (Cmd+U)"
        colors={interfaceColors}
      >
        U
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={state.isStrike}
        title="Strikethrough (Cmd+Shift+S)"
        colors={interfaceColors}
      >
        S
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={state.isCode}
        title="Inline Code (Cmd+E)"
        colors={interfaceColors}
      >
        {'</>'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={state.isSubscript}
        title="Subscript (Cmd+,)"
        colors={interfaceColors}
      >
        X₂
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={state.isSuperscript}
        title="Superscript (Cmd+.)"
        colors={interfaceColors}
      >
        X²
      </ToolbarButton>

      <Divider color={interfaceColors.border} />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={state.isBulletList}
        title="Bullet List (Cmd+Shift+8)"
        colors={interfaceColors}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={state.isOrderedList}
        title="Numbered List (Cmd+Shift+7)"
        colors={interfaceColors}
      >
        1. List
      </ToolbarButton>

      <Divider color={interfaceColors.border} />

      {/* Block Elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={state.isBlockquote}
        title="Blockquote (Cmd+Shift+B)"
        colors={interfaceColors}
      >
        Quote
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={state.isCodeBlock}
        title="Code Block (Cmd+Alt+C)"
        colors={interfaceColors}
      >
        Code Block
      </ToolbarButton>

      {/* Table */}
      <div style={{ position: 'relative' }}>
        <ToolbarButton
          onClick={() => setShowTablePicker(!showTablePicker)}
          isActive={showTablePicker}
          title="Insert Table"
          colors={interfaceColors}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ display: 'block' }}
          >
            {/* 2x2 grid icon */}
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
        </ToolbarButton>
        {showTablePicker && (
          <TablePicker
            onSelect={handleInsertTable}
            onClose={() => setShowTablePicker(false)}
          />
        )}
      </div>

      <Divider color={interfaceColors.border} />

      {/* Text Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={state.alignLeft}
        title="Align Left (Cmd+Shift+L)"
        colors={interfaceColors}
      >
        Left
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={state.alignCenter}
        title="Align Center (Cmd+Shift+E)"
        colors={interfaceColors}
      >
        Center
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={state.alignRight}
        title="Align Right (Cmd+Shift+R)"
        colors={interfaceColors}
      >
        Right
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={state.alignJustify}
        title="Justify (Cmd+Shift+J)"
        colors={interfaceColors}
      >
        Justify
      </ToolbarButton>

      <Divider color={interfaceColors.border} />

      {/* Format Painter */}
      <FormatPainter editor={editor} colors={interfaceColors} />
    </div>
  );
}

export default EditorToolbar;
