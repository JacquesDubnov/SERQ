import { useRef, useCallback, ReactNode } from 'react'
import { Editor } from '@tiptap/core'

interface EditorWrapperProps {
  editor: Editor | null
  children: ReactNode
  className?: string
}

export function EditorWrapper({ editor, children, className = '' }: EditorWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleWrapperClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor || !wrapperRef.current) return

    // Only handle direct clicks on wrapper, not on content
    if (e.target !== wrapperRef.current) return

    const editorElement = wrapperRef.current.querySelector('.tiptap')
    if (!editorElement) return

    const wrapperRect = wrapperRef.current.getBoundingClientRect()
    const clickY = e.clientY - wrapperRect.top
    const contentHeight = editorElement.scrollHeight

    if (clickY > contentHeight) {
      // Click below content - focus at end, create paragraph if needed
      editor.commands.focus('end')
      const { doc } = editor.state
      const lastNode = doc.lastChild
      const isEmpty = lastNode?.type.name === 'paragraph' && lastNode.content.size === 0
      if (!isEmpty) {
        editor.chain().focus('end').createParagraphNear().focus('end').run()
      }
    } else {
      // Click in margin - just focus
      editor.commands.focus()
    }
  }, [editor])

  return (
    <div
      ref={wrapperRef}
      onClick={handleWrapperClick}
      className={`click-anywhere-wrapper min-h-screen cursor-text ${className}`}
    >
      {children}
    </div>
  )
}
