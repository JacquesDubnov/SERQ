import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

/**
 * ColumnView - React NodeView for individual column within a ColumnSection
 *
 * Each column needs its own NodeView to be properly editable.
 * Without this, TipTap can't handle focus/click events in nested structures.
 */
export default function ColumnView({ selected }: NodeViewProps) {
  return (
    <NodeViewWrapper
      className={`column ${selected ? 'column-selected' : ''}`}
      data-column=""
    >
      <NodeViewContent className="column-content" />
    </NodeViewWrapper>
  )
}
