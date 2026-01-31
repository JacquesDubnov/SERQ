/**
 * Comment Panel
 * Side panel for viewing and managing document comments
 */
import { useEffect, useCallback, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useCommentStore, type Comment } from '../../stores/commentStore';
import {
  resolveComment,
  unresolveComment,
  deleteComment as deleteCommentFromDB,
  updateCommentText,
} from '../../lib/comment-storage';

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

  // Keyboard handling
  useEffect(() => {
    if (!isPanelOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) {
          setEditingId(null);
        } else {
          setPanelOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, editingId, setPanelOpen]);

  // Navigate to comment in editor
  const navigateToComment = useCallback(
    (comment: Comment) => {
      if (!editor) return;

      setActiveComment(comment.id);

      // Focus and select the commented text
      editor.chain().focus().setTextSelection({ from: comment.from, to: comment.to }).run();

      // Scroll into view
      const view = editor.view;
      const domAtPos = view.domAtPos(comment.from);
      if (domAtPos.node instanceof HTMLElement) {
        domAtPos.node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [editor, setActiveComment]
  );

  // Resolve/unresolve comment
  const handleToggleResolve = useCallback(
    async (comment: Comment) => {
      try {
        if (comment.resolvedAt) {
          await unresolveComment(comment.id);
          updateComment(comment.id, { resolvedAt: null });
        } else {
          await resolveComment(comment.id);
          updateComment(comment.id, { resolvedAt: Date.now() });
        }
      } catch (err) {
        console.error('[CommentPanel] Failed to toggle resolve:', err);
      }
    },
    [updateComment]
  );

  // Delete comment
  const handleDelete = useCallback(
    async (comment: Comment) => {
      if (!editor) return;

      const confirmed = window.confirm('Delete this comment?');
      if (!confirmed) return;

      try {
        // Remove mark from editor
        editor
          .chain()
          .focus()
          .setTextSelection({ from: comment.from, to: comment.to })
          .unsetComment()
          .run();

        // Delete from database
        await deleteCommentFromDB(comment.id);

        // Remove from store
        removeComment(comment.id);
      } catch (err) {
        console.error('[CommentPanel] Failed to delete comment:', err);
      }
    },
    [editor, removeComment]
  );

  // Start editing
  const startEditing = useCallback((comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  }, []);

  // Save edit
  const saveEdit = useCallback(
    async (commentId: string) => {
      try {
        await updateCommentText(commentId, editText);
        updateComment(commentId, { text: editText });
        setEditingId(null);
      } catch (err) {
        console.error('[CommentPanel] Failed to update comment:', err);
      }
    },
    [editText, updateComment]
  );

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
        className="flex items-center justify-between shrink-0 p-4"
        style={{
          backgroundColor: interfaceColors.bgSurface,
          borderBottom: `1px solid ${interfaceColors.border}`,
        }}
      >
        <h2 className="font-semibold" style={{ color: interfaceColors.textPrimary }}>
          Comments
        </h2>
        <button
          onClick={() => setPanelOpen(false)}
          className="text-lg leading-none opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: interfaceColors.textPrimary }}
        >
          x
        </button>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm" style={{ color: interfaceColors.textMuted }}>
              No comments yet.
            </p>
            <p className="text-xs mt-2" style={{ color: interfaceColors.textMuted }}>
              Select text and use Cmd+K {">"} "Add Comment" to create one.
            </p>
          </div>
        ) : (
          <>
            {/* Unresolved comments */}
            {unresolvedComments.length > 0 && (
              <div className="p-2">
                <p
                  className="text-xs font-medium px-2 py-1"
                  style={{ color: interfaceColors.textMuted }}
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
                    onNavigate={navigateToComment}
                    onToggleResolve={handleToggleResolve}
                    onDelete={handleDelete}
                    onStartEdit={startEditing}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    interfaceColors={interfaceColors}
                  />
                ))}
              </div>
            )}

            {/* Resolved comments */}
            {resolvedComments.length > 0 && (
              <div className="p-2">
                <p
                  className="text-xs font-medium px-2 py-1"
                  style={{ color: interfaceColors.textMuted }}
                >
                  Resolved ({resolvedComments.length})
                </p>
                {resolvedComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    isActive={activeCommentId === comment.id}
                    isEditing={editingId === comment.id}
                    editText={editText}
                    onEditTextChange={setEditText}
                    onNavigate={navigateToComment}
                    onToggleResolve={handleToggleResolve}
                    onDelete={handleDelete}
                    onStartEdit={startEditing}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    interfaceColors={interfaceColors}
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
  onNavigate: (comment: Comment) => void;
  onToggleResolve: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  onStartEdit: (comment: Comment) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  interfaceColors: InterfaceColors;
}

function CommentItem({
  comment,
  isActive,
  isEditing,
  editText,
  onEditTextChange,
  onNavigate,
  onToggleResolve,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  interfaceColors,
}: CommentItemProps) {
  const isResolved = !!comment.resolvedAt;

  return (
    <div
      className="rounded-md mb-2 p-3 transition-colors cursor-pointer"
      style={{
        backgroundColor: isActive ? interfaceColors.bgSurface : 'transparent',
        border: `1px solid ${isActive ? interfaceColors.border : 'transparent'}`,
        opacity: isResolved ? 0.6 : 1,
      }}
      onClick={() => onNavigate(comment)}
    >
      {isEditing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <textarea
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="w-full p-2 text-sm rounded border resize-none"
            style={{
              backgroundColor: interfaceColors.bg,
              borderColor: interfaceColors.border,
              color: interfaceColors.textPrimary,
            }}
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onSaveEdit(comment.id)}
              className="px-2 py-1 text-xs rounded"
              style={{
                backgroundColor: '#0066cc',
                color: '#fff',
              }}
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-xs rounded"
              style={{
                backgroundColor: interfaceColors.bgSurface,
                color: interfaceColors.textPrimary,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p
            className="text-sm"
            style={{
              color: interfaceColors.textPrimary,
              textDecoration: isResolved ? 'line-through' : 'none',
            }}
          >
            {comment.text}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: interfaceColors.textMuted }}
          >
            {new Date(comment.createdAt).toLocaleString()}
          </p>
          <div
            className="flex gap-2 mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onToggleResolve(comment)}
              className="text-xs hover:underline"
              style={{ color: interfaceColors.textSecondary }}
            >
              {isResolved ? 'Unresolve' : 'Resolve'}
            </button>
            <button
              onClick={() => onStartEdit(comment)}
              className="text-xs hover:underline"
              style={{ color: interfaceColors.textSecondary }}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(comment)}
              className="text-xs hover:underline"
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
