import { useCallback, useState } from 'react';
import DragHandle from '@tiptap/extension-drag-handle-react';
import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

interface DragHandleComponentProps {
  editor: Editor | null;
}

interface NodeInfo {
  node: ProseMirrorNode;
  pos: number;
}

/**
 * Notion-style drag handle component for block-level content manipulation.
 * Shows a grip handle on hover that allows dragging blocks to reorder them.
 */
export function DragHandleComponent({ editor }: DragHandleComponentProps) {
  const [hoveredNode, setHoveredNode] = useState<NodeInfo | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleNodeChange = useCallback(
    ({ node, pos }: { node: ProseMirrorNode | null; editor: Editor; pos: number }) => {
      if (node) {
        setHoveredNode({ node, pos });
      } else {
        setHoveredNode(null);
        setShowMenu(false);
      }
    },
    []
  );

  const handleDuplicate = useCallback(() => {
    if (!editor || !hoveredNode) return;

    const { pos, node } = hoveredNode;
    const endPos = pos + node.nodeSize;

    // Insert a copy after the current node
    editor.chain().focus().insertContentAt(endPos, node.toJSON()).run();
    setShowMenu(false);
  }, [editor, hoveredNode]);

  const handleDelete = useCallback(() => {
    if (!editor || !hoveredNode) return;

    const { pos, node } = hoveredNode;
    editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
    setShowMenu(false);
  }, [editor, hoveredNode]);

  const handleCopyBlock = useCallback(() => {
    if (!editor || !hoveredNode) return;

    // Get HTML of the block and copy to clipboard
    const html = editor.view.nodeDOM(hoveredNode.pos);
    if (html instanceof HTMLElement) {
      navigator.clipboard.writeText(html.innerHTML);
    }
    setShowMenu(false);
  }, [editor, hoveredNode]);

  if (!editor) return null;

  return (
    <DragHandle
      editor={editor}
      onNodeChange={handleNodeChange}
      computePositionConfig={{
        placement: 'left-start',
      }}
    >
      <div
        className="drag-handle-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '4px',
          cursor: 'grab',
          opacity: 0.5,
          transition: 'opacity 150ms ease',
          borderRadius: '4px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-surface, rgba(0,0,0,0.05))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.5';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Add button */}
        <button
          type="button"
          onClick={() => {
            if (!editor || !hoveredNode) return;
            const { pos } = hoveredNode;
            editor.chain().focus().insertContentAt(pos, { type: 'paragraph' }).run();
          }}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary, #666)',
          }}
          title="Add block above"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </button>

        {/* Grip handle with menu */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            onMouseDown={(e) => {
              if (e.button === 0 && !showMenu) {
                // Allow drag on left click when menu is closed
                e.currentTarget.style.cursor = 'grabbing';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.cursor = 'grab';
            }}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'grab',
              padding: '2px 4px',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary, #666)',
            }}
            title="Drag to move • Click for options"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </button>

          {/* Context menu */}
          {showMenu && (
            <>
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 99,
                }}
                onClick={() => setShowMenu(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: 0,
                  marginLeft: '4px',
                  backgroundColor: 'var(--color-bg, #fff)',
                  border: '1px solid var(--color-border, #e5e5e5)',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  minWidth: '150px',
                  padding: '4px',
                }}
              >
                <MenuItem onClick={handleDuplicate}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="8" y="8" width="12" height="12" rx="2" />
                    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                  </svg>
                  Duplicate
                </MenuItem>
                <MenuItem onClick={handleCopyBlock}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </MenuItem>
                <div
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--color-border, #e5e5e5)',
                    margin: '4px 0',
                  }}
                />
                <MenuItem onClick={handleDelete} danger>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
                </MenuItem>
              </div>
            </>
          )}
        </div>
      </div>
    </DragHandle>
  );
}

interface MenuItemProps {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}

function MenuItem({ onClick, children, danger }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        borderRadius: '4px',
        fontSize: '13px',
        color: danger ? 'var(--color-error, #dc2626)' : 'var(--color-text-primary, #333)',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger
          ? 'rgba(220, 38, 38, 0.1)'
          : 'var(--color-bg-surface, rgba(0,0,0,0.05))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

export default DragHandleComponent;
