import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { FormatPainter } from '../FormatPainter';

interface ToolbarProps {
  editor: Editor;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        px-2 py-1.5 rounded text-sm font-medium transition-colors
        ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-300 mx-1" />;
}

export function EditorToolbar({ editor }: ToolbarProps) {
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
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1 flex-wrap">
      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!state.canUndo}
        title="Undo (Cmd+Z)"
      >
        Undo
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!state.canRedo}
        title="Redo (Cmd+Shift+Z)"
      >
        Redo
      </ToolbarButton>

      <Divider />

      {/* Block Types */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={state.isParagraph && !state.isHeading1 && !state.isHeading2 && !state.isHeading3}
        title="Paragraph"
      >
        P
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={state.isHeading1}
        title="Heading 1 (Cmd+Alt+1)"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={state.isHeading2}
        title="Heading 2 (Cmd+Alt+2)"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={state.isHeading3}
        title="Heading 3 (Cmd+Alt+3)"
      >
        H3
      </ToolbarButton>

      <Divider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={state.isBold}
        title="Bold (Cmd+B)"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={state.isItalic}
        title="Italic (Cmd+I)"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={state.isUnderline}
        title="Underline (Cmd+U)"
      >
        U
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={state.isStrike}
        title="Strikethrough (Cmd+Shift+S)"
      >
        S
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={state.isCode}
        title="Inline Code (Cmd+E)"
      >
        {'</>'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={state.isSubscript}
        title="Subscript (Cmd+,)"
      >
        X₂
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={state.isSuperscript}
        title="Superscript (Cmd+.)"
      >
        X²
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={state.isBulletList}
        title="Bullet List (Cmd+Shift+8)"
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={state.isOrderedList}
        title="Numbered List (Cmd+Shift+7)"
      >
        1. List
      </ToolbarButton>

      <Divider />

      {/* Block Elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={state.isBlockquote}
        title="Blockquote (Cmd+Shift+B)"
      >
        Quote
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={state.isCodeBlock}
        title="Code Block (Cmd+Alt+C)"
      >
        Code Block
      </ToolbarButton>

      <Divider />

      {/* Text Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={state.alignLeft}
        title="Align Left (Cmd+Shift+L)"
      >
        Left
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={state.alignCenter}
        title="Align Center (Cmd+Shift+E)"
      >
        Center
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={state.alignRight}
        title="Align Right (Cmd+Shift+R)"
      >
        Right
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={state.alignJustify}
        title="Justify (Cmd+Shift+J)"
      >
        Justify
      </ToolbarButton>

      <Divider />

      {/* Format Painter */}
      <FormatPainter editor={editor} />
    </div>
  );
}

export default EditorToolbar;
