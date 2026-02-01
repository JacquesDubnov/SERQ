import { useState, useCallback, useRef, useEffect } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { ColumnContextMenu } from './ColumnContextMenu'

/**
 * ColumnsView - React NodeView for column section with CSS Grid and resize handles
 *
 * Resize handles only appear on hover. Minimum column width prevents overflow.
 */
export default function ColumnsView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const { columnCount, columnWidths, showBorders, gap } = node.attrs
  const containerRef = useRef<HTMLDivElement>(null)
  const [resizing, setResizing] = useState<number | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocusedWithin, setIsFocusedWithin] = useState(false)
  const [localWidths, setLocalWidths] = useState<number[]>(() => {
    return columnWidths || Array(columnCount).fill(1)
  })
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  // Minimum column width in pixels (prevents resize handles from overlapping text)
  const MIN_COLUMN_WIDTH_PX = 80

  // Update local widths when props change
  useEffect(() => {
    setLocalWidths(columnWidths || Array(columnCount).fill(1))
  }, [columnWidths, columnCount])

  // Calculate grid template from widths
  const gridTemplateColumns = localWidths.map((w) => `minmax(${MIN_COLUMN_WIDTH_PX}px, ${w}fr)`).join(' ')

  // Handle resize start
  const handleResizeStart = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setResizing(index)
    },
    []
  )

  // Handle resize move
  useEffect(() => {
    if (resizing === null) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const containerWidth = rect.width
      const mouseX = e.clientX - rect.left

      // Calculate the gap width in pixels (parse gap value)
      const gapPx = parseFloat(gap) || 24
      const totalGapWidth = gapPx * (columnCount - 1)
      const availableWidth = containerWidth - totalGapWidth

      // Calculate minimum fr value based on MIN_COLUMN_WIDTH_PX
      const minFr = (MIN_COLUMN_WIDTH_PX / availableWidth) * localWidths.reduce((sum, w) => sum + w, 0)

      // Calculate cumulative width up to the resize handle
      let cumulativeWidth = 0
      const totalFr = localWidths.reduce((sum, w) => sum + w, 0)

      for (let i = 0; i < resizing; i++) {
        cumulativeWidth += (localWidths[i] / totalFr) * availableWidth + gapPx
      }

      // Calculate new width for the left column (enforce minimum)
      const leftColWidth = Math.max(MIN_COLUMN_WIDTH_PX, mouseX - cumulativeWidth)
      const rightColWidth = Math.max(
        MIN_COLUMN_WIDTH_PX,
        cumulativeWidth + (localWidths[resizing] / totalFr + localWidths[resizing + 1] / totalFr) * availableWidth - mouseX
      )

      // Calculate new fr values
      const totalWidth = leftColWidth + rightColWidth
      const leftFr = (leftColWidth / totalWidth) * (localWidths[resizing] + localWidths[resizing + 1])
      const rightFr = (rightColWidth / totalWidth) * (localWidths[resizing] + localWidths[resizing + 1])

      // Update local widths (enforce minimum fr)
      const newWidths = [...localWidths]
      newWidths[resizing] = Math.max(minFr, leftFr)
      newWidths[resizing + 1] = Math.max(minFr, rightFr)
      setLocalWidths(newWidths)
    }

    const handleMouseUp = () => {
      // Commit the widths to the node
      updateAttributes({ columnWidths: localWidths })
      setResizing(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing, localWidths, columnCount, gap, updateAttributes])

  // Handle context menu - prevent selection
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Prevent any selection that might occur
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
    }

    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Track hover and focus state
  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])
  const handleFocusIn = useCallback(() => setIsFocusedWithin(true), [])
  const handleFocusOut = useCallback((e: React.FocusEvent) => {
    // Only set to false if focus is leaving the column section entirely
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsFocusedWithin(false)
    }
  }, [])

  // Get the node position (getPos can return undefined)
  const nodePos = typeof getPos === 'function' ? (getPos() ?? 0) : 0

  // Show resize handles only when hovered, focused within, selected, or actively resizing
  const showHandles = isHovered || isFocusedWithin || selected || resizing !== null

  return (
    <>
      <NodeViewWrapper
        ref={containerRef}
        className={`column-section ${selected ? 'column-section-selected' : ''} ${showBorders ? 'column-section-bordered' : ''}`}
        data-column-count={columnCount}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocusIn}
        onBlur={handleFocusOut}
      >
        {/* Grid container for columns */}
        <div
          className="column-section-grid"
          style={{
            display: 'grid',
            gridTemplateColumns,
            gap,
            position: 'relative',
          }}
        >
          {/* NodeViewContent renders the column children */}
          <NodeViewContent
            as="div"
            className="column-section-content"
            style={{ display: 'contents' }}
          />

          {/* Resize handles between columns - only visible on hover/focus */}
          {showHandles && Array(columnCount - 1)
            .fill(null)
            .map((_, index) => {
              // Calculate handle position
              const widthsBefore = localWidths.slice(0, index + 1)
              const totalFr = localWidths.reduce((sum, w) => sum + w, 0)
              const percentBefore = widthsBefore.reduce((sum, w) => sum + w, 0) / totalFr

              return (
                <div
                  key={index}
                  className={`column-resize-handle ${resizing === index ? 'column-resize-handle-active' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `calc(${percentBefore * 100}% - 4px)`,
                    top: 0,
                    bottom: 0,
                    width: '8px',
                    cursor: 'col-resize',
                    zIndex: 10,
                  }}
                  onMouseDown={(e) => handleResizeStart(index, e)}
                  contentEditable={false}
                >
                  <div className="column-resize-handle-bar" />
                </div>
              )
            })}
        </div>
      </NodeViewWrapper>

      {/* Context Menu */}
      {contextMenu && (
        <ColumnContextMenu
          position={contextMenu}
          editor={editor}
          nodePos={nodePos}
          currentColumnCount={columnCount}
          showBorders={showBorders}
          onClose={handleCloseContextMenu}
        />
      )}
    </>
  )
}
