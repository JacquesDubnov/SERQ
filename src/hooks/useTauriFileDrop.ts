import { useEffect, useRef } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { readFile } from '@tauri-apps/plugin-fs'
import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

// Create a visual drop cursor element
function createDropCursor(): HTMLDivElement {
  const cursor = document.createElement('div')
  cursor.className = 'tauri-drop-cursor'
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
  return cursor
}

/**
 * Hook to handle Tauri file drop events for images
 * Tauri intercepts native file drops, so we need to listen to Tauri events
 * instead of browser drag-drop events
 *
 * Also tracks cursor position during drag so images drop at mouse location
 */
export function useTauriFileDrop(editor: Editor | null) {
  // Store drop position during drag
  const dropPosRef = useRef<number | null>(null)
  const dropCursorRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef<boolean>(false)
  const windowPosRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!editor) return

    // Create drop cursor element
    if (!dropCursorRef.current) {
      dropCursorRef.current = createDropCursor()
    }
    const dropCursor = dropCursorRef.current

    let unlisten: (() => void) | undefined

    const setupListener = async () => {
      try {
        const webview = getCurrentWebviewWindow()

        unlisten = await webview.onDragDropEvent(async (event) => {
          const payload = event.payload

          // Start tracking on drag enter
          if (payload.type === 'enter') {
            isDraggingRef.current = true

            // Get window position from Tauri BEFORE showing cursor
            // This is critical - over events fire immediately after enter
            try {
              const win = getCurrentWindow()
              const pos = await win.outerPosition()
              windowPosRef.current = { x: pos.x, y: pos.y }
              console.log('[Tauri enter] window position:', pos)

              // Also need to account for title bar - get inner position offset
              // outerPosition is the window frame, we need content area
              const innerPos = await win.innerPosition()
              const titleBarHeight = innerPos.y - pos.y
              windowPosRef.current = {
                x: innerPos.x,
                y: innerPos.y
              }
              console.log('[Tauri enter] inner position:', innerPos, 'title bar height:', titleBarHeight)
            } catch (e) {
              console.log('[Tauri enter] failed to get window position:', e)
              // Fallback to 0,0 - cursor will be wrong but at least visible
              windowPosRef.current = { x: 0, y: 0 }
            }

            // Now safe to show cursor
            dropCursor.style.display = 'block'
          }

          // Track position during drag using Tauri's coordinates
          if (payload.type === 'over') {
            const position = payload.position
            if (!position) return

            isDraggingRef.current = true
            const view = editor.view

            // Tauri's position appears to already be window-relative on macOS
            // Don't subtract window position - use directly
            const clientX = position.x
            const clientY = position.y

            console.log('[Tauri over]', {
              tauriX: position.x,
              tauriY: position.y,
              clientX,
              clientY
            })

            // Try to get document position for accurate cursor placement
            const coordinates = view.posAtCoords({
              left: clientX,
              top: clientY,
            })

            if (coordinates) {
              dropPosRef.current = coordinates.pos

              try {
                const cursorCoords = view.coordsAtPos(coordinates.pos)
                dropCursor.style.display = 'block'
                dropCursor.style.left = `${cursorCoords.left}px`
                dropCursor.style.top = `${cursorCoords.top}px`
                dropCursor.style.height = `${Math.max(20, cursorCoords.bottom - cursorCoords.top)}px`
              } catch {
                // Fallback: show cursor at mouse position
                dropCursor.style.display = 'block'
                dropCursor.style.left = `${clientX}px`
                dropCursor.style.top = `${clientY - 10}px`
                dropCursor.style.height = '24px'
              }
            } else {
              // Outside editor - show cursor at mouse position as indicator
              dropCursor.style.display = 'block'
              dropCursor.style.left = `${clientX}px`
              dropCursor.style.top = `${clientY - 10}px`
              dropCursor.style.height = '24px'
            }
          }

          // Handle the actual drop
          if (payload.type === 'drop') {
            // Stop tracking
            isDraggingRef.current = false

            // Hide drop cursor
            dropCursor.style.display = 'none'

            const paths = payload.paths

            for (const filePath of paths) {
              // Check if it's an image file
              const ext = filePath.toLowerCase().split('.').pop()
              const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp']

              if (ext && imageExtensions.includes(ext)) {
                try {
                  // Read the file as binary
                  const fileData = await readFile(filePath)

                  // Convert to base64
                  const base64 = btoa(
                    Array.from(fileData)
                      .map((byte) => String.fromCharCode(byte))
                      .join('')
                  )

                  // Determine MIME type
                  const mimeTypes: Record<string, string> = {
                    png: 'image/png',
                    jpg: 'image/jpeg',
                    jpeg: 'image/jpeg',
                    gif: 'image/gif',
                    webp: 'image/webp',
                    svg: 'image/svg+xml',
                    bmp: 'image/bmp',
                  }
                  const mimeType = mimeTypes[ext] || 'image/png'

                  // Create data URL
                  const dataUrl = `data:${mimeType};base64,${base64}`

                  // Insert at tracked drop position or current selection
                  const view = editor.view
                  const pos = dropPosRef.current ?? view.state.selection.to
                  console.log('[Tauri drop] inserting at pos:', pos, 'dropPosRef:', dropPosRef.current)
                  const imageNode = view.state.schema.nodes.image.create({ src: dataUrl })
                  const tr = view.state.tr.insert(pos, imageNode)
                  tr.setSelection(TextSelection.near(tr.doc.resolve(pos + imageNode.nodeSize)))
                  view.dispatch(tr)

                  // Reset drop position
                  dropPosRef.current = null
                } catch (err) {
                  console.error('Failed to read image file:', err)
                }
              }
            }
          }

          // Reset on drag leave
          if (payload.type === 'leave') {
            isDraggingRef.current = false
            dropPosRef.current = null
            dropCursor.style.display = 'none'
          }
        })
      } catch (err) {
        // Not running in Tauri, silently ignore
        console.log('Tauri file drop not available (running in browser?)')
      }
    }

    setupListener()

    return () => {
      if (unlisten) {
        unlisten()
      }
      // Clean up drop cursor
      if (dropCursorRef.current) {
        dropCursorRef.current.remove()
        dropCursorRef.current = null
      }
    }
  }, [editor])
}
