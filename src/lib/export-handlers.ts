/**
 * Export Handlers
 * Functions for exporting TipTap content to various formats
 */
import type { Editor } from '@tiptap/core'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile, writeFile } from '@tauri-apps/plugin-fs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'

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
 * Check if document contains custom font styling
 */
function hasCustomFontStyling(editor: Editor): boolean {
  let hasCustomFonts = false;
  editor.state.doc.descendants((node) => {
    if (node.marks) {
      node.marks.forEach((mark) => {
        if (mark.type.name === 'textStyle') {
          const attrs = mark.attrs;
          if (attrs.fontFamily || attrs.fontSize || attrs.fontWeight) {
            hasCustomFonts = true;
          }
        }
      });
    }
  });
  return hasCustomFonts;
}

/**
 * Export to Markdown
 * Manual conversion from TipTap JSON to Markdown (no @tiptap/markdown extension needed)
 * NOTE: Markdown does not support custom fonts, sizes, or weights
 */
export async function exportToMarkdown(
  editor: Editor,
  documentName: string
): Promise<boolean> {
  // Check if document has custom font styling
  if (hasCustomFontStyling(editor)) {
    const proceed = window.confirm(
      'Warning: This document contains custom font styles (font family, size, or weight).\n\n' +
      'Markdown format does not support these styles and they will be lost in the export.\n\n' +
      'For full style preservation, consider exporting to HTML, PDF, EPUB, or Word format instead.\n\n' +
      'Continue with Markdown export?'
    );
    if (!proceed) {
      return false;
    }
  }

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
 * Export to PDF using jsPDF + html2canvas
 * Creates an actual PDF file directly
 */
export async function exportToPDF(editor: Editor, documentName: string): Promise<boolean> {
  console.log('[PDF Export] Starting export for:', documentName)

  // Show loading indicator
  const originalCursor = document.body.style.cursor
  document.body.style.cursor = 'wait'

  try {
    // Get HTML content from editor
    const htmlContent = editor.getHTML()
    console.log('[PDF Export] Got HTML content, length:', htmlContent.length)

    // Get current styles for PDF
    const computedStyle = getComputedStyle(document.documentElement)
    const fontFamily = computedStyle.getPropertyValue('--font-family') || 'Helvetica, Arial, sans-serif'

    // Create a hidden container for rendering
    const container = document.createElement('div')
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 800px;
      padding: 40px;
      background: white;
      font-family: ${fontFamily};
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
    `
    container.innerHTML = `
      <style>
        h1, h2, h3, h4, h5, h6 { margin-top: 1em; margin-bottom: 0.5em; color: #000; }
        h1 { font-size: 24pt; }
        h2 { font-size: 18pt; }
        h3 { font-size: 14pt; }
        p { margin: 0.5em 0; }
        ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
        li { margin: 0.25em 0; }
        blockquote { border-left: 3px solid #ccc; margin: 0.5em 0; padding-left: 1em; color: #666; }
        table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; }
        img { max-width: 100%; height: auto; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
      </style>
      ${htmlContent}
    `
    document.body.appendChild(container)
    console.log('[PDF Export] Created render container')

    // Wait a moment for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100))

    // Render to canvas using html2canvas
    console.log('[PDF Export] Calling html2canvas...')
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 800,
      windowHeight: container.scrollHeight,
    })
    console.log('[PDF Export] Canvas created:', canvas.width, 'x', canvas.height)

    // Remove the container
    document.body.removeChild(container)

    // A4 dimensions in mm
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20 // Standard A4 margin

    const contentWidth = pageWidth - (margin * 2)
    const contentHeight = pageHeight - (margin * 2)

    // Calculate scaling factor (canvas pixels to PDF mm)
    const scale = contentWidth / canvas.width
    const scaledCanvasHeight = canvas.height * scale

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    console.log('[PDF Export] Canvas size:', canvas.width, 'x', canvas.height)
    console.log('[PDF Export] Scaled height:', scaledCanvasHeight, 'mm')

    // Calculate the ideal height of each page slice in canvas pixels
    const idealPageSliceHeight = contentHeight / scale

    // Function to find a whitespace row (for clean page breaks)
    const findWhitespaceRow = (startY: number, searchUp: boolean, maxSearch: number): number => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return startY

      const searchDirection = searchUp ? -1 : 1
      const lineHeight = 30 // Approximate line height in pixels at scale 2

      for (let offset = 0; offset < maxSearch; offset++) {
        const y = startY + (offset * searchDirection)
        if (y < 0 || y >= canvas.height) break

        // Sample pixels across the row (check if it's mostly white/empty)
        const imageData = ctx.getImageData(40, y, canvas.width - 80, 1)
        const data = imageData.data
        let isWhitespace = true

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          // Check if pixel is close to white (allowing for anti-aliasing)
          if (r < 250 || g < 250 || b < 250) {
            isWhitespace = false
            break
          }
        }

        if (isWhitespace) {
          // Found whitespace, look for a few consecutive rows to ensure it's a gap
          let consecutiveWhite = 0
          for (let checkY = y; checkY < Math.min(y + lineHeight, canvas.height); checkY++) {
            const checkData = ctx.getImageData(40, checkY, canvas.width - 80, 1).data
            let rowWhite = true
            for (let i = 0; i < checkData.length; i += 16) { // Sample every 4th pixel
              if (checkData[i] < 250 || checkData[i + 1] < 250 || checkData[i + 2] < 250) {
                rowWhite = false
                break
              }
            }
            if (rowWhite) consecutiveWhite++
            else break
          }
          if (consecutiveWhite >= 5) { // At least 5 consecutive white rows = a gap
            return y
          }
        }
      }
      return startY // Fallback to original position
    }

    // Build page slices with smart breaks
    const pageSlices: { start: number; height: number }[] = []
    let currentY = 0

    while (currentY < canvas.height) {
      const remainingHeight = canvas.height - currentY

      if (remainingHeight <= idealPageSliceHeight) {
        // Last page - take everything remaining
        pageSlices.push({ start: currentY, height: remainingHeight })
        break
      }

      // Find a good break point near the ideal page end
      const idealBreak = currentY + idealPageSliceHeight
      const searchRange = Math.min(idealPageSliceHeight * 0.15, 100) // Search 15% of page height

      // Search upward from ideal break point for whitespace
      const breakPoint = findWhitespaceRow(Math.floor(idealBreak), true, searchRange)
      const sliceHeight = breakPoint - currentY

      pageSlices.push({ start: currentY, height: sliceHeight })
      currentY = breakPoint
    }

    console.log('[PDF Export] Total pages:', pageSlices.length)

    for (let page = 0; page < pageSlices.length; page++) {
      if (page > 0) {
        pdf.addPage()
      }

      const slice = pageSlices[page]

      // Create a temporary canvas for this page slice
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = slice.height

      const ctx = pageCanvas.getContext('2d')
      if (ctx) {
        // Draw the portion of the original canvas for this page
        ctx.drawImage(
          canvas,
          0, slice.start,  // Source x, y
          canvas.width, slice.height,  // Source width, height
          0, 0,  // Destination x, y
          pageCanvas.width, pageCanvas.height  // Destination width, height
        )
      }

      // Add this slice to the PDF with proper margins
      const sliceImgData = pageCanvas.toDataURL('image/png')
      const sliceHeightMm = slice.height * scale

      pdf.addImage(
        sliceImgData,
        'PNG',
        margin,  // Left margin
        margin,  // Top margin (same on every page!)
        contentWidth,
        sliceHeightMm
      )

      console.log(`[PDF Export] Page ${page + 1}: slice height ${sliceHeightMm.toFixed(1)}mm`)
    }

    // Get PDF as array buffer
    const pdfOutput = pdf.output('arraybuffer')
    console.log('[PDF Export] PDF generated, size:', pdfOutput.byteLength)

    // Prompt for save location
    const defaultName = documentName.replace(/\.(serq\.html|html)$/i, '') + '.pdf'
    const filePath = await save({
      defaultPath: defaultName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })

    if (filePath) {
      await writeFile(filePath, new Uint8Array(pdfOutput))
      console.log('[PDF Export] File saved to:', filePath)
      return true
    }

    return false
  } catch (error) {
    console.error('[PDF Export] Failed with error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    alert(`PDF export failed: ${errorMessage}`)
    return false
  } finally {
    document.body.style.cursor = originalCursor
  }
}

/**
 * Export to EPUB format
 * Creates a valid EPUB 3.0 file with proper structure
 */
export async function exportToEPUB(
  editor: Editor,
  documentName: string
): Promise<boolean> {
  const content = editor.getHTML()
  const title = documentName.replace(/\.(serq\.html|html)$/i, '')
  const now = new Date().toISOString()
  const uuid = `urn:uuid:${crypto.randomUUID()}`

  // Get current CSS variables for styling
  const computedStyle = getComputedStyle(document.documentElement)
  const fontFamily = computedStyle.getPropertyValue('--font-family') || 'serif'
  const fontSize = computedStyle.getPropertyValue('--font-size') || '1em'
  const lineHeight = computedStyle.getPropertyValue('--line-height') || '1.6'

  // Create EPUB structure using JSZip
  const zip = new JSZip()

  // Add mimetype (must be first, uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  // Add META-INF/container.xml
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`)

  // Add OEBPS/content.opf (package document)
  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${uuid}</dc:identifier>
    <dc:title>${escapeXML(title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>SERQ</dc:creator>
    <meta property="dcterms:modified">${now.substring(0, 19)}Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="nav"/>
    <itemref idref="content"/>
  </spine>
</package>`)

  // Add OEBPS/nav.xhtml (navigation document)
  zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Navigation</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="content.xhtml">${escapeXML(title)}</a></li>
    </ol>
  </nav>
</body>
</html>`)

  // Add OEBPS/style.css
  zip.file('OEBPS/style.css', `body {
  font-family: ${fontFamily};
  font-size: ${fontSize};
  line-height: ${lineHeight};
  margin: 1em;
  padding: 0;
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
  white-space: pre-wrap;
}
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 0.5em; text-align: left; }
th { background-color: #f5f5f5; }
img { max-width: 100%; height: auto; }
`)

  // Add OEBPS/content.xhtml (main content)
  // Convert HTML to valid XHTML (self-closing tags, etc.)
  const xhtmlContent = convertToXHTML(content)

  zip.file('OEBPS/content.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXML(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${escapeXML(title)}</h1>
  ${xhtmlContent}
</body>
</html>`)

  try {
    // Generate the EPUB file
    const blob = await zip.generateAsync({
      type: 'arraybuffer',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    })

    // Save with dialog
    const defaultName = title + '.epub'
    const filePath = await save({
      defaultPath: defaultName,
      filters: [{ name: 'EPUB', extensions: ['epub'] }],
    })

    if (filePath) {
      await writeFile(filePath, new Uint8Array(blob))
      console.log('[EPUB Export] File saved to:', filePath)
      return true
    }

    return false
  } catch (error) {
    console.error('[EPUB Export] Failed:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    alert(`EPUB export failed: ${errorMessage}`)
    return false
  }
}

/**
 * Escape special XML characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Convert HTML to valid XHTML
 * - Convert void elements to self-closing tags
 * - Ensure proper tag closure
 */
function convertToXHTML(html: string): string {
  let xhtml = html

  // Convert void elements to self-closing XHTML format
  const voidElements = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']

  for (const tag of voidElements) {
    // Match <tag> or <tag ...> (without closing slash)
    const pattern = new RegExp(`<${tag}(\\s[^>]*)?>(?!\\s*<\\/${tag}>)`, 'gi')
    xhtml = xhtml.replace(pattern, (match) => {
      // If already self-closing, leave it
      if (match.endsWith('/>')) return match
      // Add self-closing slash
      return match.slice(0, -1) + ' />'
    })
  }

  // Ensure img tags have alt attribute (required in XHTML)
  xhtml = xhtml.replace(/<img(?![^>]*alt=)([^>]*)\/>/gi, '<img alt=""$1/>')

  return xhtml
}
