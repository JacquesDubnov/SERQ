/**
 * MarkdownEditor Component
 * CodeMirror-based Markdown source editor with syntax highlighting
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { languages } from '@codemirror/language-data'
import '../../styles/markdown-editor.css'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  isDarkMode?: boolean
  className?: string
}

/**
 * Light theme configuration for CodeMirror
 */
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: 'var(--color-text, #1a1a1a)',
  },
  '.cm-content': {
    caretColor: 'var(--color-accent, #2563eb)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-accent, #2563eb)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--color-muted, #999)',
    borderRight: '1px solid var(--color-border, #e0e0e0)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
})

/**
 * Base extensions shared between themes
 */
const baseExtensions = [
  markdown({
    base: markdownLanguage,
    codeLanguages: languages,
  }),
  EditorView.lineWrapping,
]

export function MarkdownEditor({
  value,
  onChange,
  isDarkMode = false,
  className = '',
}: MarkdownEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null)

  // Build extensions array based on theme
  const extensions = useMemo(() => {
    return [...baseExtensions, isDarkMode ? oneDark : lightTheme]
  }, [isDarkMode])

  // Handle value changes
  const handleChange = useCallback(
    (val: string) => {
      onChange(val)
    },
    [onChange]
  )

  // Focus editor on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      editorRef.current?.view?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`markdown-editor ${className}`}>
      <CodeMirror
        ref={editorRef}
        value={value}
        onChange={handleChange}
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false, // Disable autocompletion for markdown
          rectangularSelection: true,
          crosshairCursor: false,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          searchKeymap: true,
          foldKeymap: true,
          completionKeymap: false,
          lintKeymap: false,
        }}
        placeholder="Start writing in Markdown..."
      />
    </div>
  )
}

export default MarkdownEditor
