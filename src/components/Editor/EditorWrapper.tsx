import { ReactNode, useEffect, useState, useCallback, useRef } from 'react'
import { Editor } from '@tiptap/core'
import { Selection } from '@tiptap/pm/state'
import { CellSelection } from '@tiptap/pm/tables'
import { TableContextMenu } from './TableContextMenu'
import { useAutoSnapshot } from '../../hooks'
import { useEditorStore } from '../../stores/editorStore'

interface SelectionInfo {
  cellCount: number
  rowCount: number
  colCount: number
}

interface CellRect {
  top: number
  left: number
  width: number
  height: number
}

interface EditorWrapperProps {
  editor: Editor | null
  children: ReactNode
  className?: string
}

/**
 * EditorWrapper provides click-anywhere functionality and table context menu.
 */
export function EditorWrapper({ editor, children, className = '' }: EditorWrapperProps) {
  // Auto-snapshot for version history
  const documentPath = useEditorStore((s) => s.document.path);
  useAutoSnapshot(editor, documentPath, { enabled: !!documentPath });

  // Capture selection state on mousedown BEFORE ProseMirror can change it
  const capturedSelectionRef = useRef<{
    selection: Selection | null
    selectionInfo: SelectionInfo
    cellRects: CellRect[]
  }>({ selection: null, selectionInfo: { cellCount: 1, rowCount: 1, colCount: 1 }, cellRects: [] })

  // Table context menu state - includes cell rects for overlays
  const [tableMenuState, setTableMenuState] = useState<{
    x: number
    y: number
    selectionInfo: SelectionInfo
    savedSelection: Selection
    cellRects: CellRect[]
  } | null>(null)

  // Capture selection state AND cell rectangles on mousedown
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only for right-click
    if (e.button !== 2) return

    const target = e.target as HTMLElement
    if (!target.closest('td, th')) return

    // CRITICAL: Capture everything NOW, before ProseMirror can change anything
    if (editor) {
      const { selection } = editor.state
      let selectionInfo: SelectionInfo = { cellCount: 1, rowCount: 1, colCount: 1 }
      const cellRects: CellRect[] = []

      if (selection instanceof CellSelection) {
        let cellCount = 0
        selection.forEachCell((_node, pos) => {
          cellCount++
          // Get DOM element and capture its rectangle
          try {
            const domNode = editor.view.nodeDOM(pos)
            if (domNode instanceof HTMLElement) {
              const rect = domNode.getBoundingClientRect()
              cellRects.push({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              })
            }
          } catch {
            // Ignore errors
          }
        })

        const { $anchorCell, $headCell } = selection
        const anchorRow = $anchorCell.index(-1)
        const headRow = $headCell.index(-1)
        const anchorCol = $anchorCell.index(0)
        const headCol = $headCell.index(0)

        const rowCount = Math.abs(headRow - anchorRow) + 1
        const colCount = Math.abs(headCol - anchorCol) + 1

        selectionInfo = { cellCount, rowCount, colCount }
      }

      // If no cells in selection, capture the clicked cell
      if (cellRects.length === 0) {
        const clickedCell = target.closest('td, th') as HTMLElement
        if (clickedCell) {
          const rect = clickedCell.getBoundingClientRect()
          cellRects.push({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          })
        }
      }

      capturedSelectionRef.current = { selection, selectionInfo, cellRects }
    }
  }, [editor])

  // Handle right-click for table context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const tableCell = target.closest('td, th')

    if (tableCell && editor) {
      e.preventDefault()
      e.stopPropagation()

      // Use the data captured in mousedown
      const { selection, selectionInfo, cellRects } = capturedSelectionRef.current
      const savedSelection = selection || editor.state.selection

      // Set menu state with cell rects for overlays
      setTableMenuState({ x: e.clientX, y: e.clientY, selectionInfo, savedSelection, cellRects })
    }
  }, [editor])

  // Close table context menu and clean up overlays
  const closeTableMenu = useCallback(() => {
    // Reset captured state
    capturedSelectionRef.current = { selection: null, selectionInfo: { cellCount: 1, rowCount: 1, colCount: 1 }, cellRects: [] }

    // Setting to null clears both menu and overlays (they're in the same state)
    setTableMenuState(null)
  }, [])

  // Click-anywhere to extend document
  useEffect(() => {
    if (!editor) return

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      if (
        target.closest('header') ||
        target.closest('button') ||
        target.closest('select') ||
        target.closest('[role="toolbar"]') ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'INPUT'
      ) {
        return
      }

      const proseMirror = document.querySelector('.ProseMirror') as HTMLElement
      if (!proseMirror) return

      const contentElements = proseMirror.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, hr, table')

      let contentBottom = 0
      if (contentElements.length > 0) {
        const lastElement = contentElements[contentElements.length - 1]
        const rect = lastElement.getBoundingClientRect()
        contentBottom = rect.bottom
      } else {
        contentBottom = proseMirror.getBoundingClientRect().top + 50
      }

      const clickY = e.clientY

      if (clickY > contentBottom + 10) {
        e.preventDefault()
        e.stopPropagation()

        const computedStyle = window.getComputedStyle(proseMirror)
        const lineHeight = parseFloat(computedStyle.lineHeight) || 24
        const distanceBelowContent = clickY - contentBottom
        const paragraphsNeeded = Math.max(1, Math.floor(distanceBelowContent / lineHeight))

        editor.view.focus()

        setTimeout(() => {
          const paragraphs = Array(paragraphsNeeded).fill({ type: 'paragraph' })
          const endPos = editor.state.doc.content.size
          editor
            .chain()
            .focus('end')
            .insertContentAt(endPos, paragraphs)
            .focus('end')
            .run()
        }, 0)
      }
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => document.removeEventListener('click', handleDocumentClick, true)
  }, [editor])

  return (
    <div
      className={`click-anywhere-wrapper ${className}`}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      {children}

      {/* Cell selection overlays - tied to tableMenuState so they disappear with menu */}
      {tableMenuState?.cellRects.map((rect, index) => (
        <div
          key={index}
          style={{
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            border: '2px solid #2563eb',
            pointerEvents: 'none',
            zIndex: 999,
            boxSizing: 'border-box',
          }}
        />
      ))}

      {tableMenuState && editor && (
        <TableContextMenu
          editor={editor}
          position={{ x: tableMenuState.x, y: tableMenuState.y }}
          selectionInfo={tableMenuState.selectionInfo}
          savedSelection={tableMenuState.savedSelection}
          onClose={closeTableMenu}
        />
      )}
    </div>
  )
}
