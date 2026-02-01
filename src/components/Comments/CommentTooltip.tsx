/**
 * Comment Tooltip
 * Shows comment text on hover over highlighted comment text
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { useCommentStore } from '../../stores/commentStore';

interface Position {
  x: number;
  y: number;
}

interface CommentTooltipProps {
  editor: Editor | null;
  interfaceColors: {
    bg: string;
    border: string;
    textPrimary: string;
    textMuted: string;
  };
}

export function CommentTooltip({ editor, interfaceColors }: CommentTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState('');
  const [commentDate, setCommentDate] = useState<string>('');
  const hideTimeoutRef = useRef<number | null>(null);
  const currentCommentIdRef = useRef<string | null>(null);

  const showTooltips = useCommentStore((s) => s.showTooltips);
  const comments = useCommentStore((s) => s.comments);
  const isContextMenuOpen = useCommentStore((s) => s.isContextMenuOpen);

  // Clear timeout helper
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Handle mouse events on comment marks
  useEffect(() => {
    if (!editor || !showTooltips || isContextMenuOpen) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const commentMark = target.closest('[data-comment-id]') as HTMLElement | null;

      if (commentMark) {
        const commentId = commentMark.getAttribute('data-comment-id');

        // Same comment - don't update
        if (commentId === currentCommentIdRef.current && isVisible) {
          clearHideTimeout();
          return;
        }

        const comment = comments.find((c) => c.id === commentId);

        if (comment) {
          clearHideTimeout();
          currentCommentIdRef.current = commentId;

          const rect = commentMark.getBoundingClientRect();
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
          setCommentText(comment.text || '(No comment text yet)');
          setCommentDate(new Date(comment.createdAt).toLocaleString());
          setIsVisible(true);
        }
      } else {
        // Not over a comment mark - schedule hide
        if (isVisible && !hideTimeoutRef.current) {
          hideTimeoutRef.current = window.setTimeout(() => {
            setIsVisible(false);
            currentCommentIdRef.current = null;
          }, 300);
        }
      }
    };

    const handleMouseLeave = () => {
      hideTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
        currentCommentIdRef.current = null;
      }, 200);
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('mousemove', handleMouseMove);
    editorElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      editorElement.removeEventListener('mousemove', handleMouseMove);
      editorElement.removeEventListener('mouseleave', handleMouseLeave);
      clearHideTimeout();
    };
  }, [editor, showTooltips, isContextMenuOpen, comments, isVisible, clearHideTimeout]);

  // Handle mouse entering the tooltip itself - keep it visible
  const handleTooltipMouseEnter = useCallback(() => {
    clearHideTimeout();
  }, [clearHideTimeout]);

  // Handle mouse leaving the tooltip
  const handleTooltipMouseLeave = useCallback(() => {
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      currentCommentIdRef.current = null;
    }, 200);
  }, []);

  // Hide tooltip when context menu is open or tooltips disabled
  if (!isVisible || !showTooltips || isContextMenuOpen) return null;

  return (
    <div
      className="comment-tooltip fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'auto',
      }}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
    >
      <div
        className="rounded-lg"
        style={{
          backgroundColor: interfaceColors.bg,
          border: `1px solid ${interfaceColors.border}`,
          padding: '12px 16px',
          maxWidth: '300px',
          minWidth: '160px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        <p
          className="text-sm"
          style={{
            color: commentText.startsWith('(') ? interfaceColors.textMuted : interfaceColors.textPrimary,
            fontStyle: commentText.startsWith('(') ? 'italic' : 'normal',
            lineHeight: '1.5',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {commentText}
        </p>
        <p
          className="text-xs mt-2"
          style={{ color: interfaceColors.textMuted }}
        >
          {commentDate}
        </p>
      </div>
      {/* Arrow pointing down */}
      <div
        style={{
          position: 'absolute',
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `8px solid ${interfaceColors.bg}`,
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
        }}
      />
    </div>
  );
}

export default CommentTooltip;
