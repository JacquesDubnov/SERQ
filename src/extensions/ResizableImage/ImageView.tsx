import { useCallback, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

const MIN_WIDTH = 100
const ALIGNMENT_OPTIONS = ['left', 'center', 'right'] as const

export function ImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, title, width, alignment = 'center' } = node.attrs
  const imageRef = useRef<HTMLImageElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const image = imageRef.current
      if (!image) return

      const startX = e.clientX
      const startWidth = image.offsetWidth
      const aspectRatio = image.naturalHeight / image.naturalWidth

      setIsResizing(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentX = moveEvent.clientX
        const deltaX = currentX - startX
        let newWidth = startWidth + deltaX

        // Enforce minimum width
        newWidth = Math.max(MIN_WIDTH, newWidth)

        // Calculate height based on aspect ratio
        const newHeight = Math.round(newWidth * aspectRatio)

        updateAttributes({
          width: Math.round(newWidth),
          height: newHeight,
        })
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [updateAttributes]
  )

  const handleAlignmentChange = useCallback(
    (newAlignment: (typeof ALIGNMENT_OPTIONS)[number]) => {
      updateAttributes({ alignment: newAlignment })
    },
    [updateAttributes]
  )

  return (
    <NodeViewWrapper
      className={`resizable-image-wrapper alignment-${alignment}`}
      data-alignment={alignment}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => !selected && setShowToolbar(false)}
    >
      <div className={`resizable-image-container ${selected ? 'selected' : ''}`}>
        {/* Alignment toolbar */}
        {(selected || showToolbar) && (
          <div className="image-toolbar" contentEditable={false}>
            {ALIGNMENT_OPTIONS.map((option) => (
              <button
                key={option}
                className={`toolbar-btn ${alignment === option ? 'active' : ''}`}
                onClick={() => handleAlignmentChange(option)}
                title={`Align ${option}`}
                type="button"
              >
                {option === 'left' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="15" y2="12" />
                    <line x1="3" y1="18" x2="18" y2="18" />
                  </svg>
                )}
                {option === 'center' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="6" y1="12" x2="18" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                )}
                {option === 'right' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="9" y1="12" x2="21" y2="12" />
                    <line x1="6" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Image element */}
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          title={title || undefined}
          style={{
            width: width ? `${width}px` : 'auto',
            maxWidth: '100%',
          }}
          draggable={false}
        />

        {/* Resize handle (SE corner) */}
        {selected && (
          <div
            className={`resize-handle ${isResizing ? 'resizing' : ''}`}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>
    </NodeViewWrapper>
  )
}
