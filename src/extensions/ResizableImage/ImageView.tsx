import { useCallback, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { BlockContextMenu } from '../../components/Editor/BlockContextMenu'

const MIN_WIDTH = 100
const ALIGNMENT_OPTIONS = ['left', 'center', 'right'] as const
type FloatOption = 'none' | 'left' | 'right' | 'center-wrap'

export function ImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const { src, alt, title, width, alignment = 'center', float: floatValue = 'none' } = node.attrs
  const imageRef = useRef<HTMLImageElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  // Show toolbar only when selected (no delay on deselection)
  const showToolbar = selected

  const handleMouseDown = useCallback(
    (corner: 'nw' | 'ne' | 'sw' | 'se') => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const image = imageRef.current
      if (!image) return

      const startX = e.clientX
      const startWidth = image.offsetWidth
      const aspectRatio = image.naturalHeight / image.naturalWidth
      // For left-side handles, X movement is inverted
      const isLeftSide = corner === 'nw' || corner === 'sw'

      setIsResizing(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentX = moveEvent.clientX
        const deltaX = currentX - startX
        // Invert delta for left-side handles
        let newWidth = isLeftSide ? startWidth - deltaX : startWidth + deltaX

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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleChangeFloat = useCallback(
    (newFloat: FloatOption) => {
      updateAttributes({ float: newFloat })
    },
    [updateAttributes]
  )

  const handleInsertClearBreak = useCallback(() => {
    if (editor) {
      // Insert a horizontal rule after the current node as a clear break
      editor.chain().focus().insertContent({ type: 'horizontalRule' }).run()
    }
  }, [editor])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Determine wrapper class based on float value
  const floatClass = floatValue && floatValue !== 'none' ? `block-float-${floatValue}` : ''
  const wrapperClass = `resizable-image-wrapper ${floatValue === 'none' ? `alignment-${alignment}` : ''} ${floatClass}`.trim()

  return (
    <>
      <NodeViewWrapper
        className={wrapperClass}
        data-alignment={floatValue === 'none' ? alignment : undefined}
        data-float={floatValue !== 'none' ? floatValue : undefined}
        draggable={selected}
        data-drag-handle=""
        onContextMenu={handleContextMenu}
      >
        <div className={`resizable-image-container ${selected ? 'selected' : ''}`}>
        {/* Drag handle overlay - visible indicator when selected */}
        {selected && (
          <div
            className="image-drag-handle"
            contentEditable={false}
            title="Drag to move"
          />
        )}
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

        {/* Resize handles (all 4 corners) */}
        {selected && (
          <>
            <div
              className={`resize-handle resize-handle-nw ${isResizing ? 'resizing' : ''}`}
              onMouseDown={handleMouseDown('nw')}
              title="Resize NW"
            />
            <div
              className={`resize-handle resize-handle-ne ${isResizing ? 'resizing' : ''}`}
              onMouseDown={handleMouseDown('ne')}
              title="Resize NE"
            />
            <div
              className={`resize-handle resize-handle-sw ${isResizing ? 'resizing' : ''}`}
              onMouseDown={handleMouseDown('sw')}
              title="Resize SW"
            />
            <div
              className={`resize-handle resize-handle-se ${isResizing ? 'resizing' : ''}`}
              onMouseDown={handleMouseDown('se')}
              title="Resize SE"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>

    {/* Context Menu for Float Options */}
    {contextMenu && (
      <BlockContextMenu
        position={contextMenu}
        currentFloat={floatValue as FloatOption}
        onChangeFloat={handleChangeFloat}
        onInsertClearBreak={handleInsertClearBreak}
        onClose={handleCloseContextMenu}
      />
    )}
  </>
  )
}
