/**
 * Selection Context Menu
 * Right-click menu for selected text with common actions
 */
import { useEffect, useState, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { useCommentStore } from '../../stores/commentStore';

interface Position {
  x: number;
  y: number;
}

interface SelectionContextMenuProps {
  editor: Editor | null;
  interfaceColors: {
    bg: string;
    bgSurface: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export function SelectionContextMenu({ editor, interfaceColors }: SelectionContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);

  // Get comment tooltip setting from store
  const showCommentTooltips = useCommentStore((s) => s.showTooltips);
  const setShowTooltips = useCommentStore((s) => s.setShowTooltips);
  const setContextMenuOpen = useCommentStore((s) => s.setContextMenuOpen);

  // Handle context menu
  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (e: MouseEvent) => {
      let { from, to } = editor.state.selection;

      // If no selection, select the word at click position
      if (from === to) {
        // Get position from click coordinates
        const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
        if (pos) {
          // Expand selection to word boundaries
          const $pos = editor.state.doc.resolve(pos.pos);
          const textBefore = $pos.parent.textBetween(0, $pos.parentOffset, undefined, '\ufffc');
          const textAfter = $pos.parent.textBetween($pos.parentOffset, $pos.parent.content.size, undefined, '\ufffc');

          // Find word boundaries
          const wordStart = textBefore.search(/\S+$/) !== -1
            ? $pos.start() + textBefore.search(/\S+$/)
            : pos.pos;
          const wordEndMatch = textAfter.match(/^\S+/);
          const wordEnd = wordEndMatch
            ? pos.pos + wordEndMatch[0].length
            : pos.pos;

          // Only proceed if we found a word
          if (wordStart < wordEnd) {
            from = wordStart;
            to = wordEnd;
            // Set the selection in the editor
            editor.commands.setTextSelection({ from, to });
          }
        }
      }

      // Show context menu if we have a valid selection
      if (from !== to) {
        e.preventDefault();
        setPosition({ x: e.clientX, y: e.clientY });
        setSelectionRange({ from, to });
        setHasSelection(true);
        setIsOpen(true);
        setContextMenuOpen(true); // Hide tooltip
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [editor]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = () => {
      setIsOpen(false);
      setContextMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setContextMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setContextMenuOpen]);

  // Add comment action
  const handleAddComment = useCallback(() => {
    if (!editor || !selectionRange) return;

    const { from, to } = selectionRange;
    const commentId = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Add to store
    useCommentStore.getState().addComment({
      id: commentId,
      text: '',
      createdAt: Date.now(),
      resolvedAt: null,
      from,
      to,
    });

    // Apply mark
    editor.chain().focus().setTextSelection({ from, to }).setComment({ id: commentId }).run();

    // Open panel
    useCommentStore.getState().setActiveComment(commentId);
    useCommentStore.getState().setPanelOpen(true);

    setIsOpen(false);
  }, [editor, selectionRange]);

  // Highlight actions
  const handleHighlight = useCallback((color?: string) => {
    if (!editor) return;
    if (color) {
      editor.chain().focus().toggleHighlight({ color }).run();
    } else {
      editor.chain().focus().toggleHighlight().run();
    }
    setIsOpen(false);
  }, [editor]);

  // Bold/Italic/etc
  const handleBold = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleBold().run();
    setIsOpen(false);
  }, [editor]);

  const handleItalic = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleItalic().run();
    setIsOpen(false);
  }, [editor]);

  const handleStrike = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleStrike().run();
    setIsOpen(false);
  }, [editor]);

  const handleCode = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleCode().run();
    setIsOpen(false);
  }, [editor]);

  // Toggle comment tooltips
  const handleToggleTooltips = useCallback(() => {
    setShowTooltips(!showCommentTooltips);
    setIsOpen(false);
  }, [showCommentTooltips, setShowTooltips]);

  if (!isOpen || !hasSelection) return null;

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    backgroundColor: interfaceColors.bg,
    border: `1px solid ${interfaceColors.border}`,
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
    padding: '4px',
    zIndex: 1000,
    minWidth: '180px',
  };

  const itemStyle: React.CSSProperties = {
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '14px',
    color: interfaceColors.textPrimary,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const separatorStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: interfaceColors.border,
    margin: '4px 0',
  };

  return (
    <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
      {/* Comments */}
      <div
        style={itemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={handleAddComment}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Add Comment</span>
      </div>

      <div style={separatorStyle} />

      {/* Formatting */}
      <div
        style={itemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={handleBold}
      >
        <span style={{ fontWeight: 'bold' }}>B</span>
        <span>Bold</span>
      </div>
      <div
        style={itemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={handleItalic}
      >
        <span style={{ fontStyle: 'italic' }}>I</span>
        <span>Italic</span>
      </div>
      <div
        style={itemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={handleStrike}
      >
        <span style={{ textDecoration: 'line-through' }}>S</span>
        <span>Strikethrough</span>
      </div>
      <div
        style={itemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={handleCode}
      >
        <span style={{ fontFamily: 'monospace' }}>&lt;/&gt;</span>
        <span>Code</span>
      </div>

      <div style={separatorStyle} />

      {/* Highlights */}
      <div
        style={itemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={() => handleHighlight()}
      >
        <span style={{ backgroundColor: '#fef08a', padding: '0 4px', borderRadius: '2px' }}>H</span>
        <span>Highlight</span>
      </div>
      <div
        style={{ ...itemStyle, paddingLeft: '24px' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={() => handleHighlight('#fef08a')}
      >
        <span style={{ width: '16px', height: '16px', backgroundColor: '#fef08a', borderRadius: '2px' }} />
        <span>Yellow</span>
      </div>
      <div
        style={{ ...itemStyle, paddingLeft: '24px' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={() => handleHighlight('#bbf7d0')}
      >
        <span style={{ width: '16px', height: '16px', backgroundColor: '#bbf7d0', borderRadius: '2px' }} />
        <span>Green</span>
      </div>
      <div
        style={{ ...itemStyle, paddingLeft: '24px' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={() => handleHighlight('#bfdbfe')}
      >
        <span style={{ width: '16px', height: '16px', backgroundColor: '#bfdbfe', borderRadius: '2px' }} />
        <span>Blue</span>
      </div>
      <div
        style={{ ...itemStyle, paddingLeft: '24px' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={() => handleHighlight('#fecaca')}
      >
        <span style={{ width: '16px', height: '16px', backgroundColor: '#fecaca', borderRadius: '2px' }} />
        <span>Red</span>
      </div>

      <div style={separatorStyle} />

      {/* Tooltip toggle */}
      <div
        style={itemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = interfaceColors.bgSurface)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={handleToggleTooltips}
      >
        <span style={{ width: '16px', textAlign: 'center' }}>{showCommentTooltips ? '•' : ''}</span>
        <span>Show Comment Tooltips</span>
      </div>
    </div>
  );
}

export default SelectionContextMenu;
