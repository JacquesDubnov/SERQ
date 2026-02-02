import { useState, useCallback } from 'react';
import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { FormatPainter } from '../FormatPainter';
import { TablePicker } from './TablePicker';
import { FontControls } from './FontControls';
import { TextColorPicker } from './TextColorPicker';
import { SpacingControls } from './SpacingControls';
import { CaseControls } from './CaseControls';
import { useEditorStore, type PageSize } from '../../stores/editorStore';

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
  onContextMenu?: (e: React.MouseEvent) => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  colors: InterfaceColors;
}

// Storage keys for custom block styles
const STYLE_STORAGE_PREFIX = 'serq-block-style-';

interface BlockStyle {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

function ToolbarButton({ onClick, onContextMenu, isActive, disabled, title, children, colors }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
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
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [styleMenuTarget, setStyleMenuTarget] = useState<{ type: string; x: number; y: number } | null>(null);

  // Pagination state from store
  const pagination = useEditorStore((state) => state.pagination);
  const togglePagination = useEditorStore((state) => state.togglePagination);
  const setPageSize = useEditorStore((state) => state.setPageSize);

  const handleInsertTable = useCallback((rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: false }).run();
    setShowTablePicker(false);
  }, [editor]);

  // Get style from the block where cursor is positioned (no selection needed)
  const getCurrentBlockStyle = useCallback((): BlockStyle => {
    const { state } = editor;
    const { $from } = state.selection;

    // Get the parent block node
    const parentNode = $from.parent;

    // Get block-level attributes (lineHeight is on the block)
    const lineHeight = parentNode.attrs?.lineHeight || undefined;

    // Get text style marks from the first text node in the block, or from cursor position
    let fontFamily: string | undefined;
    let fontSize: string | undefined;
    let fontWeight: string | undefined;
    let color: string | undefined;
    let letterSpacing: string | undefined;

    // Check marks at cursor position
    const marks = $from.marks();
    const textStyleMark = marks.find((m) => m.type.name === 'textStyle');
    if (textStyleMark) {
      fontFamily = textStyleMark.attrs.fontFamily || undefined;
      fontSize = textStyleMark.attrs.fontSize || undefined;
      fontWeight = textStyleMark.attrs.fontWeight || undefined;
      color = textStyleMark.attrs.color || undefined;
      letterSpacing = textStyleMark.attrs.letterSpacing || undefined;
    }

    // If no marks at cursor, try to get from first text node in block
    if (!textStyleMark && parentNode.content.size > 0) {
      parentNode.content.forEach((child) => {
        if (child.isText && !fontFamily) {
          const mark = child.marks.find((m) => m.type.name === 'textStyle');
          if (mark) {
            fontFamily = mark.attrs.fontFamily || undefined;
            fontSize = mark.attrs.fontSize || undefined;
            fontWeight = mark.attrs.fontWeight || undefined;
            color = mark.attrs.color || undefined;
            letterSpacing = mark.attrs.letterSpacing || undefined;
          }
        }
      });
    }

    return {
      fontFamily,
      fontSize,
      fontWeight,
      color,
      lineHeight,
      letterSpacing,
    };
  }, [editor]);

  // Apply style to ALL blocks of a given type in the document
  const applyStyleToAllBlocks = useCallback((blockType: string, style: BlockStyle | null) => {
    const { state, view } = editor;
    const { tr } = state;
    const nodeType = blockType === 'paragraph' ? 'paragraph' : 'heading';
    const level = blockType.startsWith('heading') ? parseInt(blockType.replace('heading', '')) : null;

    // Find all matching blocks and apply style
    state.doc.descendants((node, pos) => {
      const isMatch = nodeType === 'paragraph'
        ? node.type.name === 'paragraph'
        : node.type.name === 'heading' && node.attrs.level === level;

      if (isMatch) {
        // Update block attributes (lineHeight)
        if (style === null) {
          // Reset - remove lineHeight
          const { lineHeight, ...restAttrs } = node.attrs;
          tr.setNodeMarkup(pos, undefined, restAttrs);
        } else if (style.lineHeight) {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight: style.lineHeight });
        }

        // Apply text marks to all text within this block
        node.descendants((child, childPos) => {
          if (child.isText) {
            const from = pos + 1 + childPos;
            const to = from + child.nodeSize;

            if (style === null) {
              // Reset - remove all style marks
              const textStyleType = state.schema.marks.textStyle;
              if (textStyleType) {
                tr.removeMark(from, to, textStyleType);
              }
            } else {
              // Apply new style marks
              const textStyleType = state.schema.marks.textStyle;
              if (textStyleType) {
                const markAttrs: Record<string, string | undefined> = {};
                if (style.fontFamily) markAttrs.fontFamily = style.fontFamily;
                if (style.fontSize) markAttrs.fontSize = style.fontSize;
                if (style.fontWeight) markAttrs.fontWeight = style.fontWeight;
                if (style.color) markAttrs.color = style.color;
                if (style.letterSpacing) markAttrs.letterSpacing = style.letterSpacing;

                if (Object.keys(markAttrs).length > 0) {
                  tr.addMark(from, to, textStyleType.create(markAttrs));
                }
              }
            }
          }
        });
      }
    });

    if (tr.docChanged) {
      view.dispatch(tr);
    }
  }, [editor]);

  // Save style to localStorage AND apply to all blocks
  const handleAssignStyle = useCallback((blockType: string) => {
    const style = getCurrentBlockStyle();
    localStorage.setItem(STYLE_STORAGE_PREFIX + blockType, JSON.stringify(style));

    // Apply to all existing blocks of this type
    applyStyleToAllBlocks(blockType, style);

    setStyleMenuTarget(null);
  }, [getCurrentBlockStyle, applyStyleToAllBlocks]);

  // Reset style AND apply default to all blocks
  const handleResetStyle = useCallback((blockType: string) => {
    localStorage.removeItem(STYLE_STORAGE_PREFIX + blockType);

    // Reset all existing blocks of this type to default
    applyStyleToAllBlocks(blockType, null);

    setStyleMenuTarget(null);
  }, [applyStyleToAllBlocks]);

  // Apply saved style when setting block type
  const applyBlockWithStyle = useCallback((blockType: string, level?: number) => {
    const savedStyleJson = localStorage.getItem(STYLE_STORAGE_PREFIX + blockType);

    // First, set the block type
    if (blockType === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else if (blockType.startsWith('heading')) {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
    }

    // Then apply saved style if exists
    if (savedStyleJson) {
      try {
        const style: BlockStyle = JSON.parse(savedStyleJson);
        const chain = editor.chain().focus();

        if (style.fontFamily) chain.setFontFamily(style.fontFamily);
        if (style.fontSize) chain.setFontSize(style.fontSize);
        if (style.fontWeight) chain.setFontWeight(style.fontWeight);
        if (style.color) chain.setColor(style.color);
        if (style.lineHeight) chain.setLineHeight(style.lineHeight);
        if (style.letterSpacing) chain.setLetterSpacing(style.letterSpacing);

        chain.run();
      } catch {
        // Ignore parse errors
      }
    }
  }, [editor]);

  // Right-click handler for block type buttons
  const handleBlockContextMenu = useCallback((e: React.MouseEvent, blockType: string) => {
    e.preventDefault();
    setStyleMenuTarget({ type: blockType, x: e.clientX, y: e.clientY });
  }, []);

  // CRITICAL: Use selector to avoid re-render avalanche
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

  const menuItemStyle: React.CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    color: interfaceColors.textPrimary,
    whiteSpace: 'nowrap',
  };

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
      {/* Font Controls */}
      <FontControls editor={editor} interfaceColors={interfaceColors} />

      <Divider color={interfaceColors.border} />

      {/* Text Color */}
      <TextColorPicker editor={editor} interfaceColors={interfaceColors} />

      <Divider color={interfaceColors.border} />

      {/* Spacing Controls */}
      <SpacingControls editor={editor} interfaceColors={interfaceColors} />

      <Divider color={interfaceColors.border} />

      {/* Case Controls */}
      <CaseControls editor={editor} interfaceColors={interfaceColors} />

      <Divider color={interfaceColors.border} />

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

      {/* Block Types with right-click style assignment */}
      <ToolbarButton
        onClick={() => applyBlockWithStyle('paragraph')}
        onContextMenu={(e) => handleBlockContextMenu(e, 'paragraph')}
        isActive={state.isParagraph && !state.isHeading1 && !state.isHeading2 && !state.isHeading3}
        title="Paragraph (right-click to assign style)"
        colors={interfaceColors}
      >
        P
      </ToolbarButton>
      <ToolbarButton
        onClick={() => applyBlockWithStyle('heading1', 1)}
        onContextMenu={(e) => handleBlockContextMenu(e, 'heading1')}
        isActive={state.isHeading1}
        title="Heading 1 (right-click to assign style)"
        colors={interfaceColors}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => applyBlockWithStyle('heading2', 2)}
        onContextMenu={(e) => handleBlockContextMenu(e, 'heading2')}
        isActive={state.isHeading2}
        title="Heading 2 (right-click to assign style)"
        colors={interfaceColors}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => applyBlockWithStyle('heading3', 3)}
        onContextMenu={(e) => handleBlockContextMenu(e, 'heading3')}
        isActive={state.isHeading3}
        title="Heading 3 (right-click to assign style)"
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
        title="Strikethrough"
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
        title="Subscript"
        colors={interfaceColors}
      >
        X₂
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={state.isSuperscript}
        title="Superscript"
        colors={interfaceColors}
      >
        X²
      </ToolbarButton>

      <Divider color={interfaceColors.border} />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={state.isBulletList}
        title="Bullet List"
        colors={interfaceColors}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={state.isOrderedList}
        title="Numbered List"
        colors={interfaceColors}
      >
        1. List
      </ToolbarButton>

      <Divider color={interfaceColors.border} />

      {/* Block Elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={state.isBlockquote}
        title="Blockquote"
        colors={interfaceColors}
      >
        Quote
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={state.isCodeBlock}
        title="Code Block"
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

      {/* Callout */}
      <ToolbarButton
        onClick={() => editor.chain().focus().insertCallout({ color: 'blue' }).run()}
        title="Insert Callout"
        colors={interfaceColors}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{ display: 'block' }}
        >
          <rect x="1" y="2" width="2" height="12" rx="1" />
          <rect x="4" y="2" width="11" height="12" rx="1" opacity="0.4" />
          <circle cx="9" cy="6" r="1.5" />
          <rect x="7" y="9" width="4" height="1.5" rx="0.5" />
        </svg>
      </ToolbarButton>

      <Divider color={interfaceColors.border} />

      {/* Text Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={state.alignLeft}
        title="Align Left"
        colors={interfaceColors}
      >
        Left
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={state.alignCenter}
        title="Align Center"
        colors={interfaceColors}
      >
        Center
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={state.alignRight}
        title="Align Right"
        colors={interfaceColors}
      >
        Right
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={state.alignJustify}
        title="Justify"
        colors={interfaceColors}
      >
        Justify
      </ToolbarButton>

      <Divider color={interfaceColors.border} />

      {/* Pagination Controls */}
      <ToolbarButton
        onClick={togglePagination}
        isActive={pagination.enabled}
        title="Toggle Pagination Mode"
        colors={interfaceColors}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{ display: 'block' }}
        >
          {/* Page icon with break line */}
          <rect x="2" y="1" width="12" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1" />
        </svg>
      </ToolbarButton>

      {/* Page Size Selector - only visible when pagination enabled */}
      {pagination.enabled && (
        <select
          value={pagination.pageSize}
          onChange={(e) => setPageSize(e.target.value as PageSize)}
          className="text-xs rounded px-1.5 py-1 focus:outline-none"
          style={{
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

      <Divider color={interfaceColors.border} />

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={() => {
          // Complete reset: remove ALL inline marks and reset block attributes
          editor
            .chain()
            .focus()
            .unsetAllMarks()
            .setTextAlign('left')
            .run();

          // Explicitly unset textStyle attributes that may persist
          if (editor.can().unsetFontFamily?.()) editor.commands.unsetFontFamily();
          if (editor.can().unsetFontSize?.()) editor.commands.unsetFontSize();
          if (editor.can().unsetFontWeight?.()) editor.commands.unsetFontWeight();
          if (editor.can().unsetColor?.()) editor.commands.unsetColor();
          if (editor.can().unsetLetterSpacing?.()) editor.commands.unsetLetterSpacing();
          if (editor.can().unsetLineHeight?.()) editor.commands.unsetLineHeight();
        }}
        title="Clear Formatting (Cmd+\)"
        colors={interfaceColors}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{ display: 'block' }}
        >
          {/* Eraser icon */}
          <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414l-3.879-3.879zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z"/>
        </svg>
      </ToolbarButton>

      {/* Format Painter */}
      <FormatPainter editor={editor} colors={interfaceColors} />

      {/* Style Assignment Context Menu */}
      {styleMenuTarget && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
            }}
            onClick={() => setStyleMenuTarget(null)}
          />
          <div
            style={{
              position: 'fixed',
              left: styleMenuTarget.x,
              top: styleMenuTarget.y,
              backgroundColor: interfaceColors.bg,
              border: `1px solid ${interfaceColors.border}`,
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div
              style={menuItemStyle}
              onClick={() => handleAssignStyle(styleMenuTarget.type)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = interfaceColors.bgSurface;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Assign Current Style
            </div>
            <div
              style={menuItemStyle}
              onClick={() => handleResetStyle(styleMenuTarget.type)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = interfaceColors.bgSurface;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Reset to Default
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default EditorToolbar;
