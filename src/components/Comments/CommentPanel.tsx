/**
 * Comment Panel
 * Side panel for viewing and managing document comments
 */
import { useEffect, useCallback, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useCommentStore, type Comment } from '../../stores/commentStore';

interface InterfaceColors {
  bg: string;
  bgSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

interface CommentPanelProps {
  editor: Editor | null;
  interfaceColors: InterfaceColors;
}

export function CommentPanel({ editor, interfaceColors }: CommentPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    comments,
    activeCommentId,
    isPanelOpen,
    setActiveComment,
    updateComment,
    removeComment,
    setPanelOpen,
  } = useCommentStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [resolvedCollapsed, setResolvedCollapsed] = useState(false);
  const lastClickedIdRef = useRef<string | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Auto-edit ONLY for brand new comments (empty text)
  useEffect(() => {
    if (activeCommentId) {
      const comment = comments.find(c => c.id === activeCommentId);
      if (comment && comment.text === '' && editingId !== activeCommentId) {
        setEditingId(activeCommentId);
        setEditText('');
      }
    }
  }, [activeCommentId, comments, editingId]);

  // Click outside to close panel
  useEffect(() => {
    if (!isPanelOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('.comment-mark')) return;
        setPanelOpen(false);
        setEditingId(null);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen, setPanelOpen]);

  // Escape key handling
  useEffect(() => {
    if (!isPanelOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) {
          setEditingId(null);
          setEditText('');
        } else {
          setPanelOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, editingId, setPanelOpen]);

  // Navigate to comment in editor and center in view
  const navigateToComment = useCallback(
    (comment: Comment) => {
      if (!editor) return;

      setActiveComment(comment.id);

      editor.chain().focus().setTextSelection({ from: comment.from, to: comment.to }).run();

      // Scroll to center the comment text in the viewport
      setTimeout(() => {
        try {
          // Find the comment mark element in the DOM
          const commentElement = document.querySelector(`[data-comment-id="${comment.id}"]`) as HTMLElement;

          if (commentElement) {
            // Use scrollIntoView with block: 'center' for proper centering
            commentElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          } else {
            // Fallback: use editor coordinates
            const view = editor.view;
            const coords = view.coordsAtPos(comment.from);
            if (!coords) return;

            // Find the main scrollable container
            const scrollContainer = document.querySelector('main') as HTMLElement;
            if (!scrollContainer) return;

            // Calculate target scroll position to center the text
            const containerRect = scrollContainer.getBoundingClientRect();
            const textRelativeY = coords.top - containerRect.top;
            const centerOffset = containerRect.height / 2;
            const newScrollTop = scrollContainer.scrollTop + textRelativeY - centerOffset;

            scrollContainer.scrollTo({
              top: Math.max(0, newScrollTop),
              behavior: 'smooth'
            });
          }
        } catch (e) {
          console.debug('[CommentPanel] Scroll error:', e);
        }
      }, 50);
    },
    [editor, setActiveComment]
  );

  // Handle click on comment - first click selects, second click edits
  const handleCommentClick = useCallback(
    (comment: Comment) => {
      // Don't allow interaction with text-deleted comments (only delete is available)
      if (comment.textDeleted) {
        setActiveComment(comment.id);
        return;
      }

      const now = Date.now();
      const isDoubleClick =
        lastClickedIdRef.current === comment.id &&
        (now - lastClickTimeRef.current) < 400;

      if (isDoubleClick) {
        // Second click - enter edit mode
        setEditingId(comment.id);
        setEditText(comment.text);
      } else {
        // First click - just select and navigate
        navigateToComment(comment);
        // Exit any current edit mode
        if (editingId && editingId !== comment.id) {
          setEditingId(null);
          setEditText('');
        }
      }

      lastClickedIdRef.current = comment.id;
      lastClickTimeRef.current = now;
    },
    [navigateToComment, editingId]
  );

  // Resolve/unresolve comment
  const handleToggleResolve = useCallback(
    (comment: Comment, e: React.MouseEvent) => {
      e.stopPropagation();
      if (comment.resolvedAt) {
        // Reopening - re-apply the comment mark
        if (editor) {
          try {
            editor
              .chain()
              .focus()
              .setTextSelection({ from: comment.from, to: comment.to })
              .setComment({ id: comment.id })
              .run();
          } catch (err) {
            console.error('[CommentPanel] Failed to re-apply mark:', err);
          }
        }
        updateComment(comment.id, { resolvedAt: null });
      } else {
        // Resolving - remove the comment mark (highlight)
        if (editor) {
          try {
            editor
              .chain()
              .focus()
              .setTextSelection({ from: comment.from, to: comment.to })
              .unsetComment()
              .run();
          } catch (err) {
            console.error('[CommentPanel] Failed to unset mark:', err);
          }
        }
        updateComment(comment.id, { resolvedAt: Date.now() });
      }
    },
    [editor, updateComment]
  );

  // Delete comment
  const handleDelete = useCallback(
    (comment: Comment, e: React.MouseEvent) => {
      e.stopPropagation();

      // Only try to unset mark if text wasn't deleted (mark still exists)
      if (!comment.textDeleted && editor) {
        try {
          editor
            .chain()
            .focus()
            .setTextSelection({ from: comment.from, to: comment.to })
            .unsetComment()
            .run();
        } catch (err) {
          console.error('[CommentPanel] Failed to unset mark:', err);
        }
      }

      removeComment(comment.id);

      if (editingId === comment.id) {
        setEditingId(null);
        setEditText('');
      }
    },
    [editor, removeComment, editingId]
  );

  // Save edit
  const saveEdit = useCallback(
    (commentId: string) => {
      const trimmedText = editText.trim();

      if (!trimmedText) {
        setEditingId(null);
        setEditText('');
        return;
      }

      updateComment(commentId, { text: trimmedText });
      setEditingId(null);
      setEditText('');
    },
    [editText, updateComment]
  );

  // Handle Enter key to save
  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent, commentId: string) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveEdit(commentId);
      }
    },
    [saveEdit]
  );

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText('');
  }, []);

  // Format resolution time
  const formatResolutionTime = (resolvedAt: number) => {
    const resolved = new Date(resolvedAt);
    const today = new Date();
    const isToday = resolved.toDateString() === today.toDateString();

    if (isToday) {
      return `Resolved at ${resolved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `Resolved ${resolved.toLocaleDateString()} at ${resolved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Separate resolved and unresolved comments
  const unresolvedComments = comments.filter((c) => !c.resolvedAt);
  const resolvedComments = comments.filter((c) => c.resolvedAt);

  if (!isPanelOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 bottom-0 flex flex-col z-40"
      style={{
        width: '320px',
        backgroundColor: interfaceColors.bg,
        borderLeft: `1px solid ${interfaceColors.border}`,
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          padding: '16px 20px',
          backgroundColor: interfaceColors.bgSurface,
          borderBottom: `1px solid ${interfaceColors.border}`,
        }}
      >
        <h2 className="font-semibold" style={{ color: interfaceColors.textPrimary }}>
          Comments
        </h2>
        <button
          onClick={() => {
            setPanelOpen(false);
            setEditingId(null);
          }}
          className="text-lg leading-none opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: interfaceColors.textPrimary }}
        >
          ✕
        </button>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px' }}>
        {comments.length === 0 ? (
          <div className="text-center" style={{ padding: '20px' }}>
            <p className="text-sm" style={{ color: interfaceColors.textMuted }}>
              No comments yet.
            </p>
            <p className="text-xs mt-2" style={{ color: interfaceColors.textMuted }}>
              Select text and right-click → "Add Comment"
            </p>
          </div>
        ) : (
          <>
            {/* Open comments */}
            {unresolvedComments.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: interfaceColors.textMuted, marginBottom: '12px' }}
                >
                  Open ({unresolvedComments.length})
                </p>
                {unresolvedComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    isActive={activeCommentId === comment.id}
                    isEditing={editingId === comment.id}
                    editText={editText}
                    onEditTextChange={setEditText}
                    onKeyDown={handleTextareaKeyDown}
                    onClick={handleCommentClick}
                    onToggleResolve={handleToggleResolve}
                    onDelete={handleDelete}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    interfaceColors={interfaceColors}
                  />
                ))}
              </div>
            )}

            {/* Resolved comments - collapsible */}
            {resolvedComments.length > 0 && (
              <div>
                <button
                  onClick={() => setResolvedCollapsed(!resolvedCollapsed)}
                  className="flex items-center gap-2 w-full text-left"
                  style={{ marginBottom: '12px' }}
                >
                  <span
                    className="text-xs"
                    style={{
                      color: interfaceColors.textMuted,
                      transform: resolvedCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      display: 'inline-block',
                    }}
                  >
                    ▼
                  </span>
                  <span
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: interfaceColors.textMuted }}
                  >
                    Resolved ({resolvedComments.length})
                  </span>
                </button>

                {!resolvedCollapsed && resolvedComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    isActive={activeCommentId === comment.id}
                    isEditing={editingId === comment.id}
                    editText={editText}
                    onEditTextChange={setEditText}
                    onKeyDown={handleTextareaKeyDown}
                    onClick={handleCommentClick}
                    onToggleResolve={handleToggleResolve}
                    onDelete={handleDelete}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    interfaceColors={interfaceColors}
                    formatResolutionTime={formatResolutionTime}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Individual comment item
 */
interface CommentItemProps {
  comment: Comment;
  isActive: boolean;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent, commentId: string) => void;
  onClick: (comment: Comment) => void;
  onToggleResolve: (comment: Comment, e: React.MouseEvent) => void;
  onDelete: (comment: Comment, e: React.MouseEvent) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  interfaceColors: InterfaceColors;
  formatResolutionTime?: (resolvedAt: number) => string;
}

function CommentItem({
  comment,
  isActive,
  isEditing,
  editText,
  onEditTextChange,
  onKeyDown,
  onClick,
  onToggleResolve,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  interfaceColors,
  formatResolutionTime,
}: CommentItemProps) {
  const isResolved = !!comment.resolvedAt;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  return (
    <div
      className="rounded-lg transition-all cursor-pointer"
      style={{
        padding: '14px',
        marginBottom: '10px',
        backgroundColor: isActive ? interfaceColors.bgSurface : 'transparent',
        border: `1px solid ${isActive ? interfaceColors.border : 'transparent'}`,
        opacity: isResolved ? 0.7 : 1,
      }}
      onClick={() => onClick(comment)}
    >
      {isEditing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onKeyDown={(e) => onKeyDown(e, comment.id)}
            placeholder="Type your comment... (Enter to save, Shift+Enter for newline)"
            className="w-full p-3 text-sm rounded-md border resize-none"
            style={{
              backgroundColor: interfaceColors.bg,
              borderColor: interfaceColors.border,
              color: interfaceColors.textPrimary,
              minHeight: '80px',
            }}
            rows={3}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onSaveEdit(comment.id)}
              className="px-4 py-2 text-xs rounded-md font-medium"
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
              }}
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 text-xs rounded-md"
              style={{
                backgroundColor: interfaceColors.bgSurface,
                color: interfaceColors.textPrimary,
                border: `1px solid ${interfaceColors.border}`,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Comment text */}
          <p
            className="text-sm"
            style={{
              color: comment.text ? interfaceColors.textPrimary : interfaceColors.textMuted,
              textDecoration: isResolved ? 'line-through' : 'none',
              fontStyle: comment.text ? 'normal' : 'italic',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}
          >
            {comment.text || '(Double-click to add comment...)'}
          </p>

          {/* Timestamp */}
          <p
            className="text-xs mt-2"
            style={{ color: interfaceColors.textMuted }}
          >
            {new Date(comment.createdAt).toLocaleString()}
          </p>

          {/* Resolution time for resolved comments */}
          {isResolved && comment.resolvedAt && formatResolutionTime && (
            <p
              className="text-xs mt-1"
              style={{ color: '#22c55e' }}
            >
              {formatResolutionTime(comment.resolvedAt)}
            </p>
          )}

          {/* Text deleted indicator */}
          {comment.textDeleted && (
            <p
              className="text-xs mt-1"
              style={{ color: '#f59e0b', fontStyle: 'italic' }}
            >
              (Referenced text was deleted)
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 mt-3" onClick={(e) => e.stopPropagation()}>
            {/* Only show Resolve/Reopen if text wasn't deleted */}
            {!comment.textDeleted && (
              <button
                onClick={(e) => onToggleResolve(comment, e)}
                className="text-xs font-medium hover:underline"
                style={{ color: isResolved ? '#22c55e' : interfaceColors.textSecondary }}
              >
                {isResolved ? '↩ Reopen' : '✓ Resolve'}
              </button>
            )}
            <button
              onClick={(e) => onDelete(comment, e)}
              className="text-xs font-medium hover:underline"
              style={{ color: '#dc2626' }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CommentPanel;
