import { useCallback, useRef, useEffect } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

const MIN_WIDTH = 100
const ALIGNMENT_OPTIONS = ['left', 'center', 'right'] as const

export function ImageView({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
  const {
    src,
    alt,
    title,
    width,
    alignment = 'center',
    textWrap = false,
  } = node.attrs
  const imageRef = useRef<HTMLImageElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Show toolbar only when selected
  const showToolbar = selected

  // Create resize handles via DOM OUTSIDE the editor entirely (appended to body)
  // This bypasses any TipTap/ProseMirror cursor interference
  useEffect(() => {
    const container = containerRef.current
    const image = imageRef.current
    if (!container || !image || !selected) return

    const handles: HTMLDivElement[] = []
    const corners: Array<{ name: 'nw' | 'ne' | 'sw' | 'se'; cursor: string }> = [
      { name: 'nw', cursor: 'nwse-resize' },
      { name: 'ne', cursor: 'nesw-resize' },
      { name: 'sw', cursor: 'nesw-resize' },
      { name: 'se', cursor: 'nwse-resize' },
    ]

    const updateHandlePositions = () => {
      const rect = container.getBoundingClientRect()
      handles.forEach((handle, i) => {
        const corner = corners[i]
        const isTop = corner.name.startsWith('n')
        const isLeft = corner.name.endsWith('w')
        handle.style.left = `${isLeft ? rect.left - 7 : rect.right - 7}px`
        handle.style.top = `${isTop ? rect.top - 7 : rect.bottom - 7}px`
      })
    }

    corners.forEach(({ name, cursor }) => {
      const handle = document.createElement('div')
      handle.className = `image-resize-handle-external image-resize-handle-${name}`
      handle.style.cssText = `
        position: fixed;
        width: 14px;
        height: 14px;
        background-color: #3b82f6;
        border: 2px solid white;
        border-radius: 3px;
        z-index: 10000;
        cursor: ${cursor} !important;
        pointer-events: auto;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        transition: transform 0.1s ease, background-color 0.1s ease;
      `

      // Hover effect + force cursor via multiple methods
      handle.addEventListener('mouseenter', () => {
        handle.style.transform = 'scale(1.3)'
        handle.style.backgroundColor = '#1d4ed8'
        // Force cursor via setProperty with !important
        handle.style.setProperty('cursor', cursor, 'important')
        // Also set on body as backup
        document.body.style.setProperty('cursor', cursor, 'important')
      })
      handle.addEventListener('mouseleave', () => {
        handle.style.transform = ''
        handle.style.backgroundColor = '#3b82f6'
        // Reset body cursor
        document.body.style.removeProperty('cursor')
      })

      // Mousedown handler for resizing
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()

        const startX = e.clientX
        const startWidth = image.offsetWidth
        const aspectRatio = image.naturalHeight / image.naturalWidth
        const isLeftSide = name === 'nw' || name === 'sw'

        const onMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX
          let newWidth = isLeftSide ? startWidth - deltaX : startWidth + deltaX
          newWidth = Math.max(MIN_WIDTH, newWidth)
          const newHeight = Math.round(newWidth * aspectRatio)
          updateAttributes({ width: Math.round(newWidth), height: newHeight })
          // Update handle positions as image resizes
          requestAnimationFrame(updateHandlePositions)
        }

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      })

      document.body.appendChild(handle)
      handles.push(handle)
    })

    // Initial position
    updateHandlePositions()

    // Update on scroll/resize
    const onScrollOrResize = () => requestAnimationFrame(updateHandlePositions)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)

    // Cleanup
    return () => {
      handles.forEach(h => h.remove())
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [selected, updateAttributes])

  const handleAlignmentChange = useCallback(
    (newAlignment: (typeof ALIGNMENT_OPTIONS)[number]) => {
      // Center alignment doesn't support wrap - auto-disable it
      if (newAlignment === 'center') {
        updateAttributes({ alignment: newAlignment, textWrap: false })
      } else {
        updateAttributes({ alignment: newAlignment })
      }
    },
    [updateAttributes]
  )

  const handleToggleWrap = useCallback(() => {
    updateAttributes({ textWrap: !textWrap })
  }, [textWrap, updateAttributes])

  // Handle right-click to select image (shows toolbar)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // Prevent default browser context menu
      e.preventDefault()

      // If not already selected, select this image node
      if (!selected && editor && typeof getPos === 'function') {
        const pos = getPos()
        if (typeof pos === 'number') {
          editor.commands.setNodeSelection(pos)
        }
      }
    },
    [selected, editor, getPos]
  )

  // Custom drag to reposition image in document
  const handleDragToReposition = useCallback(
    (e: React.MouseEvent) => {
      if (!selected || !editor) return
      if (e.button !== 0) return // Only left click

      // Don't start drag if clicking on resize handles or toolbar
      const target = e.target as HTMLElement
      if (target.closest('.resize-handle') || target.closest('.image-toolbar')) return

      e.preventDefault()
      e.stopPropagation()

      const view = editor.view
      const imgElement = imageRef.current

      // Get current node position
      const pos = editor.state.selection.from

      // Create thumbnail for dragging
      const thumbnail = document.createElement('div')
      thumbnail.id = 'image-drag-thumbnail'
      thumbnail.style.cssText = `
        position: fixed;
        width: 80px;
        height: 80px;
        background-image: url(${src});
        background-size: cover;
        background-position: center;
        border-radius: 4px;
        border: 2px solid #2563eb;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0.9;
        pointer-events: none;
        z-index: 10001;
        transform: translate(-50%, -50%) scale(1);
        transition: transform 0.15s ease-out;
      `
      document.body.appendChild(thumbnail)

      // Animate shrink from original size
      if (imgElement) {
        const rect = imgElement.getBoundingClientRect()
        const scaleX = rect.width / 80
        const scaleY = rect.height / 80
        thumbnail.style.left = `${rect.left + rect.width / 2}px`
        thumbnail.style.top = `${rect.top + rect.height / 2}px`
        thumbnail.style.transform = `translate(-50%, -50%) scale(${Math.max(scaleX, scaleY)})`

        // Trigger shrink animation
        requestAnimationFrame(() => {
          thumbnail.style.transform = 'translate(-50%, -50%) scale(1)'
        })
      }

      // Create drop cursor
      let cursor = document.getElementById('editor-drop-cursor')
      if (!cursor) {
        cursor = document.createElement('div')
        cursor.id = 'editor-drop-cursor'
        cursor.style.cssText = `
          position: fixed;
          width: 3px;
          background-color: #2563eb;
          pointer-events: none;
          z-index: 10000;
          display: none;
          box-shadow: 0 0 8px rgba(37, 99, 235, 0.8), 0 0 2px rgba(37, 99, 235, 1);
          border-radius: 2px;
        `
        document.body.appendChild(cursor)
      }

      let dropPos: number | null = null

      const handleMouseMove = (moveEvent: MouseEvent) => {
        // Move thumbnail to follow mouse
        thumbnail.style.left = `${moveEvent.clientX}px`
        thumbnail.style.top = `${moveEvent.clientY}px`

        // Get drop position in editor
        const coordinates = view.posAtCoords({
          left: moveEvent.clientX,
          top: moveEvent.clientY,
        })

        if (coordinates && cursor) {
          dropPos = coordinates.pos
          try {
            const cursorCoords = view.coordsAtPos(coordinates.pos)
            cursor.style.display = 'block'
            cursor.style.left = `${cursorCoords.left}px`
            cursor.style.top = `${cursorCoords.top}px`
            cursor.style.height = `${Math.max(20, cursorCoords.bottom - cursorCoords.top)}px`
          } catch {
            cursor.style.display = 'none'
          }
        } else if (cursor) {
          cursor.style.display = 'none'
          dropPos = null
        }
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)

        // Remove thumbnail
        thumbnail.remove()

        // Hide cursor
        if (cursor) cursor.style.display = 'none'

        // Move the image if we have a valid drop position
        if (dropPos !== null && dropPos !== pos) {
          const { state } = view
          const { tr } = state

          // Get the image node
          const node = state.doc.nodeAt(pos)
          if (node && node.type.name === 'image') {
            // Calculate adjusted position after deletion
            let insertPos = dropPos
            if (dropPos > pos) {
              insertPos = dropPos - node.nodeSize
            }

            // Delete the image from original position
            tr.delete(pos, pos + node.nodeSize)

            // Insert at new position
            tr.insert(Math.max(0, insertPos), node)

            view.dispatch(tr)
            view.focus()
          }
        }
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [selected, editor, src]
  )

  // Determine wrapper class based on text wrap and alignment
  // Wrap only available for left/right alignment (center never wraps)
  const getWrapClass = () => {
    if (!textWrap) return ''
    if (alignment === 'left') return 'image-wrap-left'
    if (alignment === 'right') return 'image-wrap-right'
    return '' // center alignment never wraps
  }

  const wrapperClass = `resizable-image-wrapper ${!textWrap ? `alignment-${alignment}` : ''} ${getWrapClass()}`.trim()

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={wrapperClass}
      data-alignment={alignment}
      data-text-wrap={textWrap ? 'true' : undefined}
      draggable={false}
    >
      <div
        ref={containerRef}
        className={`resizable-image-container ${selected ? 'selected' : ''}`}
        onMouseDown={selected ? handleDragToReposition : undefined}
        onContextMenu={handleContextMenu}
      >
        {/* Drag handle overlay - visible indicator when selected */}
        {selected && (
          <div
            className="image-drag-handle"
            contentEditable={false}
            title="Drag to move"
            onMouseDown={handleDragToReposition}
            style={{ cursor: 'grab' }}
          />
        )}
        {/* Alignment + Wrap toolbar */}
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
            {/* Text Wrap Toggle - only for left/right alignment */}
            {alignment !== 'center' && (
              <>
                <div className="toolbar-separator" />
                <button
                  className={`toolbar-btn ${textWrap ? 'active' : ''}`}
                  onClick={handleToggleWrap}
                  title={textWrap ? 'Disable text wrap' : 'Enable text wrap'}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="5" width="8" height="8" rx="1" />
                    <line x1="14" y1="6" x2="21" y2="6" />
                    <line x1="14" y1="9" x2="21" y2="9" />
                    <line x1="14" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                    <line x1="3" y1="20" x2="21" y2="20" />
                  </svg>
                </button>
              </>
            )}
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

        {/* Resize handles are created via DOM in useEffect (not React) for proper cursor behavior */}
      </div>
    </NodeViewWrapper>
  )
}
