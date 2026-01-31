/**
 * Import Handlers
 * Functions for importing content from various file formats
 */
import type { Editor } from '@tiptap/core'
import { open } from '@tauri-apps/plugin-dialog'
import { readFile, readTextFile } from '@tauri-apps/plugin-fs'
import mammoth from 'mammoth'
import { useEditorStore } from '../stores/editorStore'

/**
 * Check if document has unsaved changes and confirm import
 * Returns true if import should proceed, false to cancel
 */
async function confirmImportIfDirty(): Promise<boolean> {
  const { document } = useEditorStore.getState()

  if (document.isDirty) {
    return window.confirm(
      'Your current document has unsaved changes.\n\nImporting a file will replace your current content. Do you want to continue?'
    )
  }

  return true
}

/**
 * Import a Word (.docx) document
 * Uses Mammoth.js to convert to HTML, then loads into TipTap
 */
export async function importWordDocument(editor: Editor): Promise<boolean> {
  // Check for unsaved changes
  if (!(await confirmImportIfDirty())) {
    return false
  }

  // Open file dialog
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Word Documents', extensions: ['docx'] }],
  })

  if (!selected) return false

  try {
    // Read file as binary
    const fileData = await readFile(selected)

    // Convert to HTML with Mammoth
    const result = await mammoth.convertToHtml(
      { arrayBuffer: fileData.buffer },
      {
        // Style mappings for better conversion
        styleMap: [
          "p[style-name='Heading 1'] => h1",
          "p[style-name='Heading 2'] => h2",
          "p[style-name='Heading 3'] => h3",
          "p[style-name='Heading 4'] => h4",
          "p[style-name='Title'] => h1",
          "p[style-name='Subtitle'] => h2",
          'b => strong',
          'i => em',
          'u => u',
        ],
      }
    )

    // Log any conversion warnings
    if (result.messages.length > 0) {
      console.warn('[Import] Mammoth conversion messages:', result.messages)

      // Show warning if there are significant issues
      const warnings = result.messages.filter((m) => m.type === 'warning')
      if (warnings.length > 0) {
        console.warn('[Import] Conversion warnings:', warnings)
      }
    }

    // Set content in editor
    editor.commands.setContent(result.value)

    // Clear document path (this is imported content, not a saved file)
    const fileName = extractFileName(selected)
    useEditorStore.getState().setDocument(null, `Imported - ${fileName}`)
    useEditorStore.getState().markDirty()

    return true
  } catch (err) {
    console.error('[Import] Failed to import Word document:', err)
    alert(`Failed to import Word document: ${err instanceof Error ? err.message : 'Unknown error'}`)
    return false
  }
}

/**
 * Import a Markdown file
 * Parses Markdown and converts to TipTap-compatible HTML
 */
export async function importMarkdownFile(editor: Editor): Promise<boolean> {
  // Check for unsaved changes
  if (!(await confirmImportIfDirty())) {
    return false
  }

  // Open file dialog
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
  })

  if (!selected) return false

  try {
    // Read file as text
    const content = await readTextFile(selected)

    // Convert Markdown to HTML (simple conversion)
    const html = markdownToHTML(content)

    // Set content in editor
    editor.commands.setContent(html)

    // Update document state
    const fileName = extractFileName(selected)
    useEditorStore.getState().setDocument(null, `Imported - ${fileName}`)
    useEditorStore.getState().markDirty()

    return true
  } catch (err) {
    console.error('[Import] Failed to import Markdown file:', err)
    alert(`Failed to import Markdown file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    return false
  }
}

/**
 * Import a plain text file
 * Wraps content in paragraphs
 */
export async function importTextFile(editor: Editor): Promise<boolean> {
  // Check for unsaved changes
  if (!(await confirmImportIfDirty())) {
    return false
  }

  // Open file dialog
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  })

  if (!selected) return false

  try {
    // Read file as text
    const content = await readTextFile(selected)

    // Convert to HTML paragraphs
    const html = textToHTML(content)

    // Set content in editor
    editor.commands.setContent(html)

    // Update document state
    const fileName = extractFileName(selected)
    useEditorStore.getState().setDocument(null, `Imported - ${fileName}`)
    useEditorStore.getState().markDirty()

    return true
  } catch (err) {
    console.error('[Import] Failed to import text file:', err)
    alert(`Failed to import text file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    return false
  }
}

/**
 * Simple Markdown to HTML converter
 * Handles basic Markdown syntax without external dependencies
 */
function markdownToHTML(markdown: string): string {
  let html = markdown

  // Escape HTML entities first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Code blocks (before other processing)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headers
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
  // Merge adjacent blockquotes
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, '\n')

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr />')
  html = html.replace(/^\*\*\*+$/gm, '<hr />')

  // Unordered lists
  html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Wrap consecutive list items
  html = html.replace(/(<li>[\s\S]*?<\/li>(\n<li>[\s\S]*?<\/li>)*)/g, '<ul>$1</ul>')

  // Paragraphs - wrap remaining lines
  const lines = html.split('\n\n')
  html = lines
    .map((line) => {
      line = line.trim()
      if (!line) return ''
      // Don't wrap if already a block element
      if (
        line.startsWith('<h') ||
        line.startsWith('<p') ||
        line.startsWith('<ul') ||
        line.startsWith('<ol') ||
        line.startsWith('<blockquote') ||
        line.startsWith('<pre') ||
        line.startsWith('<hr')
      ) {
        return line
      }
      // Wrap in paragraph
      return `<p>${line.replace(/\n/g, '<br />')}</p>`
    })
    .join('\n')

  return html
}

/**
 * Convert plain text to HTML paragraphs
 */
function textToHTML(text: string): string {
  // Escape HTML entities
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Split by double newlines for paragraphs
  const paragraphs = escaped.split(/\n\n+/)

  return paragraphs
    .map((p) => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      // Preserve single line breaks as <br>
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

/**
 * Extract filename from path
 */
function extractFileName(path: string): string {
  const parts = path.split(/[/\\]/)
  const fileName = parts[parts.length - 1]
  // Remove extension
  return fileName.replace(/\.[^.]+$/, '')
}
