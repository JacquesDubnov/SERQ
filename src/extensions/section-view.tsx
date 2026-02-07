/**
 * SectionView - React NodeView for Section nodes
 *
 * Reads activeMode from presentationStore and applies different CSS classes:
 * - Continuous: minimal structural wrapper (Canvas styling is on parent wrapper)
 * - Paginated: page-sized container with margins, shadow, background
 *
 * CRITICAL: Must pass data-section-id to NodeViewWrapper so block indicator
 * and other code can find section boundaries via DOM queries.
 */

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/core';
import { usePresentationStore } from '@/stores/presentationStore';

export function SectionView({ node }: NodeViewProps) {
  const { activeMode, pageFormat } = usePresentationStore();
  const sectionId = node.attrs.sectionId as string | null;

  if (activeMode === 'paginated') {
    const { width, height, margins } = pageFormat;

    return (
      <NodeViewWrapper
        as="section"
        className="section-page"
        data-section-id={sectionId}
        style={{
          '--page-width': `${width}px`,
          '--page-height': `${height}px`,
          '--page-margin-top': `${margins.top}px`,
          '--page-margin-right': `${margins.right}px`,
          '--page-margin-bottom': `${margins.bottom}px`,
          '--page-margin-left': `${margins.left}px`,
        } as React.CSSProperties}
      >
        <NodeViewContent />
      </NodeViewWrapper>
    );
  }

  // Continuous mode -- minimal wrapper, Canvas styling is on editor-content-wrapper
  return (
    <NodeViewWrapper
      as="section"
      className="section-continuous"
      data-section-id={sectionId}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}
