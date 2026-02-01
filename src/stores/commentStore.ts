/**
 * Comment Store
 * Zustand store for comment state management
 */
import { create } from 'zustand';
import type { CommentRecord } from '../lib/comment-storage';

export interface Comment {
  id: string;
  text: string;
  createdAt: number;
  resolvedAt: number | null;
  from: number;
  to: number;
  textDeleted?: boolean; // True if the commented text was deleted from document
}

interface CommentState {
  comments: Comment[];
  activeCommentId: string | null;
  isPanelOpen: boolean;
  showTooltips: boolean;
  isContextMenuOpen: boolean; // Track context menu to hide tooltip

  // Actions
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  updateComment: (id: string, updates: Partial<Comment>) => void;
  removeComment: (id: string) => void;
  markTextDeleted: (id: string) => void; // Auto-resolve when text is deleted
  setActiveComment: (id: string | null) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setShowTooltips: (show: boolean) => void;
  setContextMenuOpen: (open: boolean) => void;
}

export const useCommentStore = create<CommentState>((set) => ({
  comments: [],
  activeCommentId: null,
  isPanelOpen: false,
  showTooltips: true,
  isContextMenuOpen: false,

  setComments: (comments) => set({ comments }),

  addComment: (comment) =>
    set((state) => ({
      comments: [...state.comments, comment],
    })),

  updateComment: (id, updates) =>
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeComment: (id) =>
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== id),
      activeCommentId: state.activeCommentId === id ? null : state.activeCommentId,
    })),

  markTextDeleted: (id) =>
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === id
          ? { ...c, textDeleted: true, resolvedAt: c.resolvedAt || Date.now() }
          : c
      ),
    })),

  setActiveComment: (id) => set({ activeCommentId: id }),

  setPanelOpen: (open) => set({ isPanelOpen: open }),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  setShowTooltips: (show) => set({ showTooltips: show }),

  setContextMenuOpen: (open) => set({ isContextMenuOpen: open }),
}));

/**
 * Convert database record to store Comment
 */
export function recordToComment(record: CommentRecord): Comment {
  return {
    id: record.id,
    text: record.text,
    createdAt: record.created_at,
    resolvedAt: record.resolved_at,
    from: record.position_from,
    to: record.position_to,
  };
}

export type { CommentState };
