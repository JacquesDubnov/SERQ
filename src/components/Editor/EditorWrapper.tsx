import { ReactNode, useEffect, useState, useCallback } from 'react'
import { Editor } from '@tiptap/core'
import { TableContextMenu } from './TableContextMenu'

interface EditorWrapperProps {
  editor: Editor | null
  children: ReactNode
  className?: string
}

/**
 * EditorWrapper provides click-anywhere functionality and table context menu.
 * Clicking below the content creates empty paragraphs to position
 * the cursor at the approximate click location.
 */
export function EditorWrapper({ editor, children, className = '' }: EditorWrapperProps) {
  // Table context menu state
  const [tableMenuState, setTableMenuState] = useState<{ x: number; y: number } | null>(null)

  // Handle right-click for table context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement

    // Check if right-click is inside a table cell
    const tableCell = target.closest('td, th')
    if (tableCell && editor) {
      e.preventDefault()
      setTableMenuState({ x: e.clientX, y: e.clientY })
    }
  }, [editor])

  // Close table context menu
  const closeTableMenu = useCallback(() => {
    setTableMenuState(null)
  }, [])

  useEffect(() => {
    if (!editor) return

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Ignore clicks on toolbar, header, or interactive elements
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

      // Get the ProseMirror element
      const proseMirror = document.querySelector('.ProseMirror') as HTMLElement
      if (!proseMirror) return

      // Get the actual text content bounds (not including padding)
      const contentElements = proseMirror.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, hr, table')

      let contentBottom = 0
      if (contentElements.length > 0) {
        const lastElement = contentElements[contentElements.length - 1]
        const rect = lastElement.getBoundingClientRect()
        contentBottom = rect.bottom
      } else {
        // No content, use the top of the editor
        contentBottom = proseMirror.getBoundingClientRect().top + 50
      }

      const clickY = e.clientY

      // If click is below actual content
      if (clickY > contentBottom + 10) {
        e.preventDefault()
        e.stopPropagation()

        // Calculate how many paragraphs needed to reach the click position
        const computedStyle = window.getComputedStyle(proseMirror)
        const lineHeight = parseFloat(computedStyle.lineHeight) || 24
        const distanceBelowContent = clickY - contentBottom
        const paragraphsNeeded = Math.max(1, Math.floor(distanceBelowContent / lineHeight))

        // Focus editor
        editor.view.focus()

        setTimeout(() => {
          // Build array of empty paragraphs to insert
          const paragraphs = Array(paragraphsNeeded).fill({ type: 'paragraph' })

          // Insert all paragraphs at once at the end
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
      onContextMenu={handleContextMenu}
    >
      {children}
      {tableMenuState && editor && (
        <TableContextMenu
          editor={editor}
          position={tableMenuState}
          onClose={closeTableMenu}
        />
      )}
    </div>
  )
}
