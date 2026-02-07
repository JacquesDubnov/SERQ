/**
 * EditorWrapper - TRUE Click-Anywhere Cursor Placement
 *
 * PARADIGM SHIFT: Click anywhere on the canvas, cursor appears THERE.
 * No more hitting Enter 20 times to start writing in the middle of the page.
 */

import { useRef, useCallback, ReactNode } from 'react';
import type { Editor } from '@tiptap/core';

interface EditorWrapperProps {
  editor: Editor | null;
  children: ReactNode;
  minHeight?: number;
  zoom?: number; // Zoom percentage (100 = 100%)
}

const PARAGRAPH_HEIGHT = 42; // Approximate height per paragraph (line-height + margin)

export function EditorWrapper({ editor, children, minHeight = 800, zoom = 100 }: EditorWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor || !wrapperRef.current) return;

    // Check if click was on the wrapper itself (not on editor content)
    const target = e.target as HTMLElement;
    const isClickOnWrapper = target === wrapperRef.current;
    const isClickOnBackground = target.classList.contains('click-anywhere-bg');

    if (!isClickOnWrapper && !isClickOnBackground) {
      return; // Click was on editor content, let TipTap handle it
    }

    e.preventDefault();
    e.stopPropagation();

    // Calculate click position relative to wrapper.
    // With CSS zoom, getBoundingClientRect() and event coords are in the same space.
    // No zoom adjustment needed.
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const adjustedClickY = e.clientY - wrapperRect.top;

    // Calculate target line from Y position (in content coordinates)
    const targetLine = Math.max(0, Math.floor(adjustedClickY / PARAGRAPH_HEIGHT));

    // Get current paragraph count
    const currentCount = editor.state.doc.childCount;

    // If we need more paragraphs, add them
    if (targetLine >= currentCount) {
      const toAdd = targetLine - currentCount + 1;

      // Move to end first
      editor.commands.focus('end');

      // Add paragraphs by pressing Enter repeatedly (this actually works)
      for (let i = 0; i < toAdd; i++) {
        editor.commands.splitBlock();
      }
    }

    // Now position cursor at target line
    // Need to recalculate after adding paragraphs
    setTimeout(() => {
      const doc = editor.state.doc;
      const newCount = doc.childCount;
      const actualTarget = Math.min(targetLine, newCount - 1);

      // Calculate position: each block node is wrapped, so we need to find the right offset
      let pos = 1; // Start inside doc
      let lineIndex = 0;

      doc.forEach((_node, offset) => {
        if (lineIndex === actualTarget) {
          pos = offset + 1; // +1 to be inside the node, not before it
        }
        lineIndex++;
      });

      editor.commands.setTextSelection(pos);
      editor.commands.focus();
    }, 20);
  }, [editor, zoom]);

  return (
    <div
      ref={wrapperRef}
      onClick={handleCanvasClick}
      style={{
        minHeight: `${minHeight}px`,
        cursor: 'text',
        position: 'relative',
      }}
    >
      {/* Editor content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>

      {/* Background layer for click detection */}
      <div
        className="click-anywhere-bg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      />
    </div>
  );
}
