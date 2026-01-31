/**
 * Export Handlers
 * Functions for exporting TipTap content to various formats
 */
import type { Editor } from '@tiptap/core'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'

/**
 * Export to standalone HTML file
 * Includes inline styles for full visual fidelity
 */
export async function exportToHTML(
  editor: Editor,
  documentName: string
): Promise<boolean> {
  const content = editor.getHTML()

  // Get current CSS variables from document for inline styles
  const computedStyle = getComputedStyle(document.documentElement)
  const fontFamily = computedStyle.getPropertyValue('--font-family') || 'system-ui'
  const fontSize = computedStyle.getPropertyValue('--font-size') || '16px'
  const lineHeight = computedStyle.getPropertyValue('--line-height') || '1.6'
  const textColor = computedStyle.getPropertyValue('--color-text') || '#1a1a1a'
  const bgColor = computedStyle.getPropertyValue('--canvas-bg') || '#ffffff'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentName}</title>
  <style>
    body {
      font-family: ${fontFamily};
      font-size: ${fontSize};
      line-height: ${lineHeight};
      color: ${textColor};
      background-color: ${bgColor};
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    p { margin: 1em 0; }
    ul, ol { padding-left: 1.5em; margin: 1em 0; }
    li { margin: 0.25em 0; }
    blockquote {
      border-left: 3px solid #ddd;
      margin: 1em 0;
      padding-left: 1em;
      color: #666;
    }
    code {
      background-color: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre {
      background-color: #f5f5f5;
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5em;
      text-align: left;
    }
    th { background-color: #f5f5f5; }
    img { max-width: 100%; height: auto; }
    .callout {
      padding: 1em;
      border-radius: 4px;
      margin: 1em 0;
      border-left: 4px solid;
    }
    .callout[data-color="blue"] { background-color: #e7f3ff; border-left-color: #0969da; }
    .callout[data-color="green"] { background-color: #dafbe1; border-left-color: #1a7f37; }
    .callout[data-color="yellow"] { background-color: #fff8c5; border-left-color: #9a6700; }
    .callout[data-color="red"] { background-color: #ffebe9; border-left-color: #cf222e; }
    .callout[data-color="purple"] { background-color: #fbefff; border-left-color: #8250df; }
  </style>
</head>
<body>
${content}
</body>
</html>`

  const defaultName = documentName.replace(/\.(serq\.html|html)$/i, '') + '.html'

  const filePath = await save({
    defaultPath: defaultName,
    filters: [{ name: 'HTML', extensions: ['html'] }],
  })

  if (filePath) {
    await writeTextFile(filePath, html)
    return true
  }

  return false
}

/**
 * Export to Markdown
 * Manual conversion from TipTap JSON to Markdown (no @tiptap/markdown extension needed)
 */
export async function exportToMarkdown(
  editor: Editor,
  documentName: string
): Promise<boolean> {
  const json = editor.getJSON()
  const markdown = jsonToMarkdown(json)

  const defaultName = documentName.replace(/\.(serq\.html|html)$/i, '') + '.md'

  const filePath = await save({
    defaultPath: defaultName,
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  })

  if (filePath) {
    await writeTextFile(filePath, markdown)
    return true
  }

  return false
}

interface TipTapNode {
  type?: string
  content?: TipTapNode[]
  attrs?: Record<string, unknown>
  marks?: TipTapMark[]
  text?: string
}

interface TipTapMark {
  type: string
  attrs?: Record<string, unknown>
}

/**
 * Convert TipTap JSON to Markdown
 */
function jsonToMarkdown(doc: TipTapNode): string {
  if (!doc.content) return ''

  return doc.content.map((node) => nodeToMarkdown(node)).join('\n\n')
}

function nodeToMarkdown(node: TipTapNode): string {
  switch (node.type) {
    case 'paragraph':
      return inlineContent(node.content || [])

    case 'heading': {
      const level = (node.attrs?.level as number) || 1
      const hashes = '#'.repeat(level)
      return `${hashes} ${inlineContent(node.content || [])}`
    }

    case 'bulletList':
      return (node.content || [])
        .map((item: TipTapNode) => `- ${listItemContent(item)}`)
        .join('\n')

    case 'orderedList':
      return (node.content || [])
        .map((item: TipTapNode, i: number) => `${i + 1}. ${listItemContent(item)}`)
        .join('\n')

    case 'listItem':
      return listItemContent(node)

    case 'blockquote': {
      const quoteContent = (node.content || [])
        .map((n: TipTapNode) => nodeToMarkdown(n))
        .join('\n')
      return quoteContent.split('\n').map((line: string) => `> ${line}`).join('\n')
    }

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) || ''
      const code = (node.content || [])
        .map((n: TipTapNode) => n.text || '')
        .join('')
      return `\`\`\`${lang}\n${code}\n\`\`\``
    }

    case 'horizontalRule':
      return '---'

    case 'table':
      return tableToMarkdown(node)

    case 'callout': {
      const calloutContent = (node.content || [])
        .map((n: TipTapNode) => nodeToMarkdown(n))
        .join('\n')
      const icon = (node.attrs?.icon as string) || ''
      return `> ${icon} **Note**\n> ${calloutContent.split('\n').join('\n> ')}`
    }

    case 'image': {
      const alt = (node.attrs?.alt as string) || 'image'
      const src = (node.attrs?.src as string) || ''
      return `![${alt}](${src})`
    }

    default:
      // Unknown node type, try to extract text
      if (node.content) {
        return (node.content || []).map((n: TipTapNode) => nodeToMarkdown(n)).join('')
      }
      return ''
  }
}

function inlineContent(content: TipTapNode[]): string {
  return content
    .map((node) => {
      if (node.type === 'text') {
        let text = node.text || ''

        // Apply marks
        const marks = node.marks || []
        for (const mark of marks) {
          switch (mark.type) {
            case 'bold':
            case 'strong':
              text = `**${text}**`
              break
            case 'italic':
            case 'em':
              text = `*${text}*`
              break
            case 'code':
              text = `\`${text}\``
              break
            case 'strike':
              text = `~~${text}~~`
              break
            case 'link':
              text = `[${text}](${(mark.attrs?.href as string) || ''})`
              break
          }
        }

        return text
      }
      return ''
    })
    .join('')
}

function listItemContent(item: TipTapNode): string {
  return (item.content || [])
    .map((node: TipTapNode) => {
      if (node.type === 'paragraph') {
        return inlineContent(node.content || [])
      }
      return nodeToMarkdown(node)
    })
    .join('\n')
}

function tableToMarkdown(node: TipTapNode): string {
  const rows = node.content || []
  if (rows.length === 0) return ''

  const tableRows: string[] = []

  rows.forEach((row: TipTapNode, rowIndex: number) => {
    const cells = row.content || []
    const cellTexts = cells.map((cell: TipTapNode) => {
      const content = cell.content || []
      return content.map((n: TipTapNode) => inlineContent(n.content || [])).join(' ')
    })

    tableRows.push(`| ${cellTexts.join(' | ')} |`)

    // Add separator after header row
    if (rowIndex === 0) {
      const separator = cells.map(() => '---').join(' | ')
      tableRows.push(`| ${separator} |`)
    }
  })

  return tableRows.join('\n')
}

/**
 * Export to PDF via browser print dialog
 */
export function exportToPDF(editor: Editor, documentName: string): void {
  const content = editor.getHTML()

  // Get current styles
  const computedStyle = getComputedStyle(document.documentElement)
  const fontFamily = computedStyle.getPropertyValue('--font-family') || 'system-ui'

  // Open print window
  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    alert('Please allow pop-ups to export PDF')
    return
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${documentName}</title>
  <style>
    @media print {
      @page {
        margin: 1in;
        size: letter;
      }
    }
    body {
      font-family: ${fontFamily};
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }
    h1 { font-size: 18pt; }
    h2 { font-size: 14pt; }
    h3 { font-size: 12pt; }
    p { margin: 0.5em 0; }
    ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
    blockquote {
      border-left: 2px solid #666;
      margin: 0.5em 0;
      padding-left: 1em;
      color: #333;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.5em 0;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #000;
      padding: 0.25em 0.5em;
    }
    th { background-color: #f0f0f0; }
    img { max-width: 100%; height: auto; }
    .callout {
      padding: 0.5em;
      margin: 0.5em 0;
      border: 1px solid #ccc;
      border-left: 3px solid #666;
    }
    pre, code {
      font-family: monospace;
      font-size: 10pt;
    }
    pre {
      white-space: pre-wrap;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
${content}
</body>
</html>`)

  printWindow.document.close()

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print()
  }

  // Fallback if onload doesn't fire
  setTimeout(() => {
    printWindow.print()
  }, 500)
}
