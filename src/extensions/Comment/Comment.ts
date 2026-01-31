/**
 * Comment Extension
 * Mark-based comment highlighting for TipTap
 * Stores comment ID in mark attribute, actual text in SQLite
 *
 * Self-contained: Configure onCommentActivated option to wire click handling to your store.
 * Example usage in EditorCore.tsx:
 *   Comment.configure({
 *     onCommentActivated: (commentId) => {
 *       useCommentStore.getState().setActiveComment(commentId);
 *       useCommentStore.getState().setPanelOpen(true);
 *     },
 *   })
 */
import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface CommentOptions {
  HTMLAttributes: Record<string, unknown>;
  /**
   * Callback when a comment mark is clicked in the editor.
   * Use this to update your store and open the comment panel.
   */
  onCommentActivated?: (commentId: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      /**
       * Set a comment mark on the current selection
       */
      setComment: (attributes: { id: string }) => ReturnType;
      /**
       * Unset the comment mark
       */
      unsetComment: () => ReturnType;
    };
  }
}

const commentPluginKey = new PluginKey('commentClick');

export const Comment = Mark.create<CommentOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'comment-mark',
      },
      onCommentActivated: undefined,
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return {
            'data-comment-id': attributes.id,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },

      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  // Handle click on comment to activate it
  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: commentPluginKey,
        props: {
          handleClick(_view, _pos, event) {
            const target = event.target as HTMLElement;
            const commentMark = target.closest('[data-comment-id]');

            if (commentMark) {
              const commentId = commentMark.getAttribute('data-comment-id');
              if (commentId && extension.options.onCommentActivated) {
                extension.options.onCommentActivated(commentId);
              }
            }

            return false; // Don't prevent default
          },
        },
      }),
    ];
  },
});

export default Comment;
