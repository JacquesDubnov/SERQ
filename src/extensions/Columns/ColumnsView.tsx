import { useState, useCallback, useRef, useEffect } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

/**
 * ColumnsView - React NodeView for column section with CSS Grid and resize handles
 */
export default function ColumnsView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const { columnCount, columnWidths, showBorders, gap } = node.attrs
  const containerRef = useRef<HTMLDivElement>(null)
  const [resizing, setResizing] = useState<number | null>(null)
  const [localWidths, setLocalWidths] = useState<number[]>(() => {
    return columnWidths || Array(columnCount).fill(1)
  })

  // Update local widths when props change
  useEffect(() => {
    setLocalWidths(columnWidths || Array(columnCount).fill(1))
  }, [columnWidths, columnCount])

  // Calculate grid template from widths
  const gridTemplateColumns = localWidths.map((w) => `${w}fr`).join(' ')

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

      // Calculate cumulative width up to the resize handle
      let cumulativeWidth = 0
      const totalFr = localWidths.reduce((sum, w) => sum + w, 0)

      for (let i = 0; i < resizing; i++) {
        cumulativeWidth += (localWidths[i] / totalFr) * availableWidth + gapPx
      }

      // Calculate new width for the left column
      const leftColWidth = Math.max(50, mouseX - cumulativeWidth + (resizing > 0 ? 0 : 0))
      const rightColWidth = Math.max(
        50,
        cumulativeWidth + (localWidths[resizing] / totalFr + localWidths[resizing + 1] / totalFr) * availableWidth - mouseX
      )

      // Calculate new fr values
      const totalWidth = leftColWidth + rightColWidth
      const leftFr = (leftColWidth / totalWidth) * (localWidths[resizing] + localWidths[resizing + 1])
      const rightFr = (rightColWidth / totalWidth) * (localWidths[resizing] + localWidths[resizing + 1])

      // Update local widths
      const newWidths = [...localWidths]
      newWidths[resizing] = Math.max(0.2, leftFr)
      newWidths[resizing + 1] = Math.max(0.2, rightFr)
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

  return (
    <NodeViewWrapper
      ref={containerRef}
      className={`column-section ${selected ? 'column-section-selected' : ''} ${showBorders ? 'column-section-bordered' : ''}`}
      data-column-count={columnCount}
      style={{
        display: 'grid',
        gridTemplateColumns,
        gap,
        position: 'relative',
      }}
    >
      {/* NodeViewContent renders the column children */}
      <NodeViewContent
        className="column-section-content"
        style={{ display: 'contents' }}
      />

      {/* Resize handles between columns */}
      {Array(columnCount - 1)
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
    </NodeViewWrapper>
  )
}
