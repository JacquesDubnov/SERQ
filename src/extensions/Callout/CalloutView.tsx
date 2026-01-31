import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

export default function CalloutView({ node, updateAttributes, selected }: NodeViewProps) {
  const { color, icon, collapsed, collapsible } = node.attrs

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateAttributes({ collapsed: !collapsed })
  }

  return (
    <NodeViewWrapper
      className={`callout ${selected ? 'callout-selected' : ''} ${collapsed ? 'callout-collapsed' : ''}`}
      data-color={color}
    >
      {/* Header with icon and collapse button */}
      {(icon || collapsible) && (
        <div className="callout-header" contentEditable={false}>
          {icon && <span className="callout-icon">{icon}</span>}
          <div className="callout-header-spacer" />
          {collapsible && (
            <button
              className="callout-collapse-btn"
              onClick={handleToggleCollapse}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M4 2l4 4-4 4V2z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2 4l4 4 4-4H2z" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
      {/* Editable content */}
      <NodeViewContent
        className="callout-content"
        style={{ display: collapsed ? 'none' : 'block' }}
      />
    </NodeViewWrapper>
  )
}
