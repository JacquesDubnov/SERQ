/**
 * ColumnView - React NodeView for individual columns
 *
 * Each column needs its own NodeView so ProseMirror can properly
 * manage cursor placement and click handling across columns.
 */

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'

export function ColumnView() {
  return (
    <NodeViewWrapper data-column="">
      <NodeViewContent className="column-content" />
    </NodeViewWrapper>
  )
}
