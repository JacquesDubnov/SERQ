import { useState, useCallback } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import CalloutContextMenu from './CalloutContextMenu'

export default function CalloutView({
  node,
  updateAttributes,
  selected,
  deleteNode,
}: NodeViewProps) {
  const { color, icon, collapsed, collapsible, borderStyle, float: floatValue = 'none' } = node.attrs
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      updateAttributes({ collapsed: !collapsed })
    },
    [collapsed, updateAttributes]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleChangeColor = useCallback(
    (newColor: string) => {
      updateAttributes({ color: newColor })
    },
    [updateAttributes]
  )

  const handleChangeIcon = useCallback(
    (newIcon: string | null) => {
      updateAttributes({ icon: newIcon })
    },
    [updateAttributes]
  )

  const handleToggleCollapsible = useCallback(() => {
    updateAttributes({ collapsible: !collapsible })
  }, [collapsible, updateAttributes])

  const handleChangeBorderStyle = useCallback(
    (newBorderStyle: 'left' | 'right' | 'top' | 'bottom' | 'full' | 'none') => {
      updateAttributes({ borderStyle: newBorderStyle })
    },
    [updateAttributes]
  )

  const handleChangeFloat = useCallback(
    (newFloat: 'none' | 'left' | 'right' | 'center-wrap') => {
      updateAttributes({ float: newFloat })
    },
    [updateAttributes]
  )

  const handleDelete = useCallback(() => {
    deleteNode()
  }, [deleteNode])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Determine wrapper class based on float value
  const floatClass = floatValue && floatValue !== 'none' ? `block-float-${floatValue}` : ''
  const wrapperClass = `callout ${selected ? 'callout-selected' : ''} ${collapsed ? 'callout-collapsed' : ''} ${floatClass}`.trim()

  return (
    <>
      <NodeViewWrapper
        className={wrapperClass}
        data-color={color}
        data-border-style={borderStyle || 'left'}
        data-float={floatValue !== 'none' ? floatValue : undefined}
        onContextMenu={handleContextMenu}
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

      {/* Context Menu */}
      {contextMenu && (
        <CalloutContextMenu
          position={contextMenu}
          currentColor={color}
          currentIcon={icon}
          currentBorderStyle={borderStyle || 'left'}
          currentFloat={floatValue as 'none' | 'left' | 'right' | 'center-wrap'}
          isCollapsible={collapsible}
          onChangeColor={handleChangeColor}
          onChangeIcon={handleChangeIcon}
          onChangeBorderStyle={handleChangeBorderStyle}
          onChangeFloat={handleChangeFloat}
          onToggleCollapsible={handleToggleCollapsible}
          onDelete={handleDelete}
          onClose={handleCloseContextMenu}
        />
      )}
    </>
  )
}
