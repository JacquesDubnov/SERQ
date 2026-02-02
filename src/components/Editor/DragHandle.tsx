import { useCallback, useState, useRef, useEffect } from 'react';
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

// Menu view states
type MenuView = 'main' | 'turnInto' | 'addBlock';

// Block types for insertion menu
const BLOCK_TYPES = [
  { id: 'paragraph', label: 'Text', icon: 'T', description: 'Plain text' },
  { id: 'heading1', label: 'Heading 1', icon: 'H1', description: 'Large heading' },
  { id: 'heading2', label: 'Heading 2', icon: 'H2', description: 'Medium heading' },
  { id: 'heading3', label: 'Heading 3', icon: 'H3', description: 'Small heading' },
  { id: 'bulletList', label: 'Bullet List', icon: '•', description: 'Unordered list' },
  { id: 'orderedList', label: 'Numbered List', icon: '1.', description: 'Ordered list' },
  { id: 'blockquote', label: 'Quote', icon: '"', description: 'Blockquote' },
  { id: 'codeBlock', label: 'Code', icon: '</>', description: 'Code block' },
  { id: 'callout', label: 'Callout', icon: '!', description: 'Info callout' },
  { id: 'table', label: 'Table', icon: '⊞', description: '3x3 table' },
  { id: 'horizontalRule', label: 'Divider', icon: '—', description: 'Horizontal line' },
];

// Turn into options (for existing blocks)
const TURN_INTO_TYPES = [
  { id: 'paragraph', label: 'Text', icon: 'T' },
  { id: 'heading1', label: 'Heading 1', icon: 'H1' },
  { id: 'heading2', label: 'Heading 2', icon: 'H2' },
  { id: 'heading3', label: 'Heading 3', icon: 'H3' },
  { id: 'bulletList', label: 'Bullet List', icon: '•' },
  { id: 'orderedList', label: 'Numbered List', icon: '1.' },
  { id: 'blockquote', label: 'Quote', icon: '"' },
  { id: 'codeBlock', label: 'Code Block', icon: '</>' },
];

/**
 * Notion-style drag handle component for block-level content manipulation.
 * Shows a grip handle on hover that allows dragging blocks to reorder them.
 */
export function DragHandleComponent({ editor }: DragHandleComponentProps) {
  const [hoveredNode, setHoveredNode] = useState<NodeInfo | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuView, setMenuView] = useState<MenuView>('main');
  const menuRef = useRef<HTMLDivElement>(null);

  const handleNodeChange = useCallback(
    ({ node, pos }: { node: ProseMirrorNode | null; editor: Editor; pos: number }) => {
      console.log('[DragHandle] onNodeChange:', node?.type.name, 'pos:', pos);
      if (node) {
        setHoveredNode({ node, pos });
      } else {
        setHoveredNode(null);
        setShowMenu(false);
        setMenuView('main');
      }
    },
    []
  );

  // Store dragged node info (hoveredNode changes during drag, so we need to capture it)
  const draggedNodeRef = useRef<NodeInfo | null>(null);

  // Set global flags and store editor reference for Tauri hook to use
  const handleDragStart = useCallback((e: DragEvent) => {
    console.log('[DragHandle] onElementDragStart', e);
    (window as any).__internalDragActive = true;
    (window as any).__dragHandleDragActive = true;
    // Store editor and dragged node globally so Tauri hook can access them
    (window as any).__dragHandleEditor = editor;
    (window as any).__dragHandleNode = hoveredNode;
    draggedNodeRef.current = hoveredNode;
    console.log('[DragHandle] Dragging node:', hoveredNode?.node.type.name, 'from pos:', hoveredNode?.pos);
  }, [hoveredNode, editor]);

  const handleDragEnd = useCallback((e: DragEvent) => {
    console.log('[DragHandle] onElementDragEnd', e);

    // Get drop position from Tauri (stored by useTauriFileDrop)
    const dropPos = (window as any).__blockDropPosition;
    const draggedNode = draggedNodeRef.current;

    console.log('[DragHandle] Drop position:', dropPos, 'draggedNode:', draggedNode?.node.type.name);

    if (editor && typeof dropPos === 'number' && draggedNode) {
      const { pos: fromPos, node } = draggedNode;

      // Don't move if dropping in the same position
      if (dropPos !== fromPos && dropPos !== fromPos + node.nodeSize) {
        console.log('[DragHandle] Moving node from', fromPos, 'to', dropPos);

        // Execute the move transaction
        const { tr } = editor.state;
        const nodeSize = node.nodeSize;

        // Calculate adjusted positions for the move
        let insertPos = dropPos;

        // If dropping after the original position, adjust for the deletion
        if (dropPos > fromPos) {
          insertPos = dropPos - nodeSize;
        }

        // Delete from original position and insert at new position
        tr.delete(fromPos, fromPos + nodeSize);
        tr.insert(Math.max(0, insertPos), node);

        // Dispatch the transaction
        editor.view.dispatch(tr);
        console.log('[DragHandle] Move transaction dispatched');
      }
    }

    // Clean up all global state
    (window as any).__internalDragActive = false;
    (window as any).__dragHandleDragActive = false;
    delete (window as any).__dragHandleEditor;
    delete (window as any).__dragHandleNode;
    delete (window as any).__blockDropPosition;
    draggedNodeRef.current = null;

    // Hide indicator
    const indicator = document.getElementById('block-drop-indicator');
    if (indicator) indicator.style.display = 'none';
  }, [editor]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setMenuView('main');
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Close menu and reset view
  const closeMenu = useCallback(() => {
    setShowMenu(false);
    setMenuView('main');
  }, []);

  // Insert block at position
  const insertBlock = useCallback((blockType: string) => {
    if (!editor || !hoveredNode) return;

    const { pos, node } = hoveredNode;
    const insertPos = pos + node.nodeSize; // Always insert after

    editor.chain().focus();

    switch (blockType) {
      case 'paragraph':
        editor.chain().insertContentAt(insertPos, { type: 'paragraph' }).run();
        break;
      case 'heading1':
        editor.chain().insertContentAt(insertPos, { type: 'heading', attrs: { level: 1 } }).run();
        break;
      case 'heading2':
        editor.chain().insertContentAt(insertPos, { type: 'heading', attrs: { level: 2 } }).run();
        break;
      case 'heading3':
        editor.chain().insertContentAt(insertPos, { type: 'heading', attrs: { level: 3 } }).run();
        break;
      case 'bulletList':
        editor.chain().insertContentAt(insertPos, { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] }).run();
        break;
      case 'orderedList':
        editor.chain().insertContentAt(insertPos, { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] }).run();
        break;
      case 'blockquote':
        editor.chain().insertContentAt(insertPos, { type: 'blockquote', content: [{ type: 'paragraph' }] }).run();
        break;
      case 'codeBlock':
        editor.chain().insertContentAt(insertPos, { type: 'codeBlock' }).run();
        break;
      case 'callout':
        editor.chain().insertContentAt(insertPos, { type: 'callout', attrs: { color: 'blue' }, content: [{ type: 'paragraph' }] }).run();
        break;
      case 'table':
        editor.chain().insertContentAt(insertPos, {
          type: 'table',
          content: Array(3).fill(null).map(() => ({
            type: 'tableRow',
            content: Array(3).fill(null).map(() => ({
              type: 'tableCell',
              content: [{ type: 'paragraph' }]
            }))
          }))
        }).run();
        break;
      case 'horizontalRule':
        editor.chain().insertContentAt(insertPos, { type: 'horizontalRule' }).run();
        break;
    }

    // Move cursor to the new block
    editor.commands.setTextSelection(insertPos + 1);
    closeMenu();
  }, [editor, hoveredNode, closeMenu]);

  // Turn current block into another type
  // Uses direct transaction to transform the specific node, not relying on cursor position
  const turnInto = useCallback((blockType: string) => {
    if (!editor || !hoveredNode) return;

    const { pos, node } = hoveredNode;
    const { tr } = editor.state;
    const nodeContent = node.content;

    // Create the new node based on block type
    let newNode;
    const schema = editor.state.schema;

    switch (blockType) {
      case 'paragraph':
        newNode = schema.nodes.paragraph.create(null, nodeContent);
        break;
      case 'heading1':
        newNode = schema.nodes.heading.create({ level: 1 }, nodeContent);
        break;
      case 'heading2':
        newNode = schema.nodes.heading.create({ level: 2 }, nodeContent);
        break;
      case 'heading3':
        newNode = schema.nodes.heading.create({ level: 3 }, nodeContent);
        break;
      case 'bulletList':
        // For lists, wrap content in listItem
        const bulletItem = schema.nodes.listItem.create(null, [
          schema.nodes.paragraph.create(null, nodeContent)
        ]);
        newNode = schema.nodes.bulletList.create(null, [bulletItem]);
        break;
      case 'orderedList':
        const orderedItem = schema.nodes.listItem.create(null, [
          schema.nodes.paragraph.create(null, nodeContent)
        ]);
        newNode = schema.nodes.orderedList.create(null, [orderedItem]);
        break;
      case 'blockquote':
        newNode = schema.nodes.blockquote.create(null, [
          schema.nodes.paragraph.create(null, nodeContent)
        ]);
        break;
      case 'codeBlock':
        // Code block needs text content, not inline nodes
        const textContent = node.textContent;
        newNode = schema.nodes.codeBlock.create(null, textContent ? schema.text(textContent) : null);
        break;
      default:
        return;
    }

    // Replace the node at the stored position
    tr.replaceWith(pos, pos + node.nodeSize, newNode);
    editor.view.dispatch(tr);

    closeMenu();
  }, [editor, hoveredNode, closeMenu]);

  const handleDuplicate = useCallback(() => {
    if (!editor || !hoveredNode) return;

    const { pos, node } = hoveredNode;
    const endPos = pos + node.nodeSize;

    editor.chain().focus().insertContentAt(endPos, node.toJSON()).run();
    closeMenu();
  }, [editor, hoveredNode, closeMenu]);

  const handleDelete = useCallback(() => {
    if (!editor || !hoveredNode) return;

    const { pos, node } = hoveredNode;
    editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
    closeMenu();
  }, [editor, hoveredNode, closeMenu]);

  const handleCopyBlock = useCallback(async () => {
    if (!editor || !hoveredNode) return;

    const { pos } = hoveredNode;

    // Copy as both HTML and plain text
    const domNode = editor.view.nodeDOM(pos);
    if (domNode instanceof HTMLElement) {
      const html = domNode.outerHTML;
      const text = domNode.textContent || '';

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          })
        ]);
      } catch {
        // Fallback to text only
        await navigator.clipboard.writeText(text);
      }
    }
    closeMenu();
  }, [editor, hoveredNode, closeMenu]);

  const handleCopyAnchorLink = useCallback(async () => {
    if (!editor || !hoveredNode) return;

    const { node } = hoveredNode;

    // For headings, create an anchor link
    if (node.type.name === 'heading') {
      const text = node.textContent;
      const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const url = `${window.location.href.split('#')[0]}#${slug}`;
      await navigator.clipboard.writeText(url);
    } else {
      // For other blocks, just copy a generic position reference
      await navigator.clipboard.writeText(`Block at position ${hoveredNode.pos}`);
    }
    closeMenu();
  }, [editor, hoveredNode, closeMenu]);

  const handleMoveUp = useCallback(() => {
    if (!editor || !hoveredNode) return;

    const { pos, node } = hoveredNode;

    // Find the previous sibling node
    const $pos = editor.state.doc.resolve(pos);
    if ($pos.index() === 0) return; // Already at top

    const prevNodePos = $pos.before() - 1;
    const prevNode = editor.state.doc.nodeAt(prevNodePos);
    if (!prevNode) return;

    // Swap positions
    const tr = editor.state.tr;
    tr.delete(pos, pos + node.nodeSize);
    tr.insert(prevNodePos - prevNode.nodeSize + 1, node);
    editor.view.dispatch(tr);
    closeMenu();
  }, [editor, hoveredNode, closeMenu]);

  const handleMoveDown = useCallback(() => {
    if (!editor || !hoveredNode) return;

    const { pos, node } = hoveredNode;
    const endPos = pos + node.nodeSize;

    // Check if there's a next sibling
    if (endPos >= editor.state.doc.content.size) return;

    const nextNode = editor.state.doc.nodeAt(endPos);
    if (!nextNode) return;

    // Swap positions
    const tr = editor.state.tr;
    tr.delete(pos, endPos);
    tr.insert(pos + nextNode.nodeSize, node);
    editor.view.dispatch(tr);
    closeMenu();
  }, [editor, hoveredNode, closeMenu]);

  if (!editor) return null;

  const menuStyles: React.CSSProperties = {
    position: 'absolute',
    left: '100%',
    top: 0,
    marginLeft: '4px',
    backgroundColor: 'var(--color-bg, #fff)',
    border: '1px solid var(--color-border, #e5e5e5)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    zIndex: 9999,
    minWidth: '220px',
    padding: '4px',
    maxHeight: '400px',
    overflowY: 'auto',
  };

  // Render the current menu view
  const renderMenuContent = () => {
    switch (menuView) {
      case 'addBlock':
        return (
          <>
            {/* Back button header */}
            <button
              type="button"
              onClick={() => setMenuView('main')}
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
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-secondary, #666)',
                textAlign: 'left',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-surface, rgba(0,0,0,0.05))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Insert block below
            </button>
            <MenuDivider />
            {BLOCK_TYPES.map((block) => (
              <MenuItem
                key={block.id}
                onClick={() => insertBlock(block.id)}
                icon={block.icon}
                label={block.label}
                description={block.description}
              />
            ))}
          </>
        );

      case 'turnInto':
        return (
          <>
            {/* Back button header */}
            <button
              type="button"
              onClick={() => setMenuView('main')}
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
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-secondary, #666)',
                textAlign: 'left',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-surface, rgba(0,0,0,0.05))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Turn into
            </button>
            <MenuDivider />
            {TURN_INTO_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => turnInto(type.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: 'var(--color-text-primary, #333)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-surface, rgba(0,0,0,0.05))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-bg-surface, rgba(0,0,0,0.05))',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary, #666)',
                  }}
                >
                  {type.icon}
                </span>
                {type.label}
              </button>
            ))}
          </>
        );

      case 'main':
      default:
        return (
          <>
            {/* Turn into - navigates to submenu */}
            <button
              type="button"
              onClick={() => setMenuView('turnInto')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '13px',
                color: 'var(--color-text-primary, #333)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-surface, rgba(0,0,0,0.05))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12H3M21 6H3M21 18H3" />
                </svg>
                Turn into
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <MenuDivider />

            <ActionMenuItem onClick={handleDuplicate} icon="duplicate" label="Duplicate" shortcut="⌘D" />
            <ActionMenuItem onClick={handleCopyBlock} icon="copy" label="Copy" shortcut="⌘C" />
            <ActionMenuItem onClick={handleCopyAnchorLink} icon="link" label="Copy link to block" />

            <MenuDivider />

            <ActionMenuItem onClick={handleMoveUp} icon="moveUp" label="Move up" />
            <ActionMenuItem onClick={handleMoveDown} icon="moveDown" label="Move down" />

            <MenuDivider />

            <ActionMenuItem onClick={handleDelete} icon="delete" label="Delete" danger shortcut="⌫" />
          </>
        );
    }
  };

  return (
    <DragHandle
      editor={editor}
      onNodeChange={handleNodeChange}
      onElementDragStart={handleDragStart}
      onElementDragEnd={handleDragEnd}
      computePositionConfig={{
        placement: 'left-start',
      }}
    >
      <div
        className="drag-handle"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '2px',
          borderRadius: '4px',
        }}
      >
        {/* Add button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(true);
            setMenuView('addBlock');
          }}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary, #666)',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-surface, rgba(0,0,0,0.05))';
            e.currentTarget.style.color = 'var(--color-text-primary, #333)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary, #666)';
          }}
          title="Add block below"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* Grip handle with context menu */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <div
            onClick={(e) => {
              // Only open menu on click, not on drag
              e.stopPropagation();
              setShowMenu(!showMenu);
              setMenuView('main');
            }}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'grab',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary, #666)',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-surface, rgba(0,0,0,0.05))';
              e.currentTarget.style.color = 'var(--color-text-primary, #333)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary, #666)';
            }}
            title="Drag to move • Click for options"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="5" r="1.5" />
              <circle cx="15" cy="5" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="19" r="1.5" />
              <circle cx="15" cy="19" r="1.5" />
            </svg>
          </div>

          {/* Single menu that changes content based on view */}
          {showMenu && (
            <div style={menuStyles}>
              {renderMenuContent()}
            </div>
          )}
        </div>
      </div>
    </DragHandle>
  );
}

// Menu item for block insertion
function MenuItem({ onClick, icon, label, description }: { onClick: () => void; icon: string; label: string; description?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        borderRadius: '4px',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-bg-surface, rgba(0,0,0,0.05))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          backgroundColor: 'var(--color-bg-surface, rgba(0,0,0,0.05))',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-text-secondary, #666)',
        }}
      >
        {icon}
      </span>
      <div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-primary, #333)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary, #888)' }}>{description}</div>
        )}
      </div>
    </button>
  );
}

// Action menu item with icon
function ActionMenuItem({ onClick, icon, label, shortcut, danger }: { onClick: () => void; icon: string; label: string; shortcut?: string; danger?: boolean }) {
  const getIcon = () => {
    switch (icon) {
      case 'duplicate':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="8" y="8" width="12" height="12" rx="2" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          </svg>
        );
      case 'copy':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        );
      case 'link':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        );
      case 'moveUp':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        );
      case 'moveDown':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        );
      case 'delete':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
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
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {getIcon()}
        {label}
      </span>
      {shortcut && (
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary, #888)' }}>{shortcut}</span>
      )}
    </button>
  );
}

function MenuDivider() {
  return (
    <div
      style={{
        height: '1px',
        backgroundColor: 'var(--color-border, #e5e5e5)',
        margin: '4px 0',
      }}
    />
  );
}

export default DragHandleComponent;
