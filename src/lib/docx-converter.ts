/**
 * TipTap JSON to docx.js Document Converter
 * Converts TipTap editor content to Word document format
 */
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
} from 'docx'

// TipTap JSON types
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
 * Convert TipTap JSON document to docx.js Document
 */
export function convertTipTapToDocx(json: TipTapNode): Document {
  const children = (json.content ?? []).flatMap(convertNodeToDocx)

  return new Document({
    sections: [{
      properties: {},
      children: children.flat(),
    }],
  })
}

/**
 * Convert a single TipTap node to docx Paragraph(s) or Table
 */
function convertNodeToDocx(node: TipTapNode): (Paragraph | Table)[] {
  switch (node.type) {
    case 'heading':
      return [new Paragraph({
        heading: getHeadingLevel(node.attrs?.level as number),
        children: convertInlineContent(node.content),
      })]

    case 'paragraph':
      return [new Paragraph({
        children: convertInlineContent(node.content),
        alignment: getAlignment(node.attrs?.textAlign as string),
      })]

    case 'bulletList':
      return (node.content ?? []).flatMap((li, index) =>
        convertListItem(li, 'bullet', index)
      )

    case 'orderedList':
      return (node.content ?? []).flatMap((li, index) =>
        convertListItem(li, 'number', index)
      )

    case 'blockquote':
      return (node.content ?? []).map(child => new Paragraph({
        children: convertInlineContent(child.content),
        indent: { left: 720 }, // 0.5 inch indent
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: 'CCCCCC' },
        },
      }))

    case 'codeBlock':
      return [new Paragraph({
        children: [new TextRun({
          text: (node.content ?? []).map(n => n.text ?? '').join(''),
          font: 'Courier New',
          size: 20, // 10pt
        })],
        shading: { fill: 'F5F5F5' },
      })]

    case 'horizontalRule':
      return [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
      })]

    case 'table':
      return [convertTable(node)]

    case 'image':
      return convertImage(node)

    case 'callout':
      // Convert callout as indented paragraphs with left border
      return (node.content ?? []).map(child => new Paragraph({
        children: convertInlineContent(child.content),
        indent: { left: 360 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 24, color: getCalloutColor(node.attrs?.color as string) },
        },
        shading: { fill: getCalloutBgColor(node.attrs?.color as string) },
      }))

    default:
      // Try to extract any text content from unknown nodes
      if (node.content) {
        return node.content.flatMap(convertNodeToDocx)
      }
      return []
  }
}

/**
 * Convert inline content (text with marks) to TextRun array
 */
function convertInlineContent(content?: TipTapNode[]): TextRun[] {
  if (!content) return []

  return content.map(node => {
    if (node.type !== 'text' || !node.text) {
      return new TextRun({ text: '' })
    }

    const marks = node.marks ?? []

    return new TextRun({
      text: node.text,
      bold: marks.some(m => m.type === 'bold'),
      italics: marks.some(m => m.type === 'italic'),
      underline: marks.some(m => m.type === 'underline') ? {} : undefined,
      strike: marks.some(m => m.type === 'strike'),
      highlight: getHighlightColor(marks),
      font: getFontFamily(marks),
      size: getFontSize(marks),
    })
  })
}

/**
 * Convert list item to Paragraph with bullet/number
 */
function convertListItem(
  li: TipTapNode,
  type: 'bullet' | 'number',
  _index: number
): Paragraph[] {
  const content = li.content ?? []

  return content.map((child, childIndex) => {
    // Only first paragraph gets the bullet/number
    if (child.type === 'paragraph' && childIndex === 0) {
      return new Paragraph({
        children: convertInlineContent(child.content),
        bullet: type === 'bullet' ? { level: 0 } : undefined,
        numbering: type === 'number' ? { reference: 'default-numbering', level: 0 } : undefined,
      })
    }
    // Nested content
    return new Paragraph({
      children: convertInlineContent(child.content),
      indent: { left: 720 },
    })
  })
}

/**
 * Convert TipTap table to docx Table
 */
function convertTable(node: TipTapNode): Table {
  const rows = (node.content ?? []).map((row) => {
    const cells = (row.content ?? []).map(cell => {
      const isHeader = cell.type === 'tableHeader'
      const content = (cell.content ?? []).flatMap(child =>
        convertInlineContent(child.content)
      )

      return new TableCell({
        children: [new Paragraph({ children: content })],
        shading: isHeader ? { fill: 'F0F0F0' } : undefined,
        width: { size: 100 / (row.content?.length ?? 1), type: WidthType.PERCENTAGE },
      })
    })

    return new TableRow({ children: cells })
  })

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}

/**
 * Convert image node to Paragraph with ImageRun
 * Note: Images must be converted from base64 to Uint8Array
 */
function convertImage(node: TipTapNode): Paragraph[] {
  const src = node.attrs?.src as string
  if (!src || !src.startsWith('data:image')) {
    return [] // Skip non-base64 images for now
  }

  try {
    // Extract base64 data and convert to Uint8Array
    const base64Data = src.split(',')[1]
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Get dimensions (default to reasonable size if not specified)
    const width = (node.attrs?.width as number) ?? 400
    const height = (node.attrs?.height as number) ?? 300

    return [new Paragraph({
      children: [new ImageRun({
        data: bytes,
        transformation: { width, height },
        type: src.includes('png') ? 'png' : 'jpg',
      })],
    })]
  } catch (e) {
    console.warn('[Word Export] Failed to convert image:', e)
    return [new Paragraph({
      children: [new TextRun({ text: '[Image could not be exported]', italics: true })],
    })]
  }
}

// Highlight color type from docx library
type HighlightColor = 'yellow' | 'green' | 'cyan' | 'magenta' | 'blue' | 'red' | 'darkBlue' | 'darkCyan' | 'darkGreen' | 'darkMagenta' | 'darkRed' | 'darkYellow' | 'lightGray' | 'darkGray' | 'black' | 'white' | 'none'

// Helper functions
function getHeadingLevel(level?: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  switch (level) {
    case 1: return HeadingLevel.HEADING_1
    case 2: return HeadingLevel.HEADING_2
    case 3: return HeadingLevel.HEADING_3
    case 4: return HeadingLevel.HEADING_4
    case 5: return HeadingLevel.HEADING_5
    case 6: return HeadingLevel.HEADING_6
    default: return HeadingLevel.HEADING_1
  }
}

function getAlignment(align?: string): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  switch (align) {
    case 'center': return AlignmentType.CENTER
    case 'right': return AlignmentType.RIGHT
    case 'justify': return AlignmentType.JUSTIFIED
    default: return undefined
  }
}

function getHighlightColor(marks: TipTapMark[]): HighlightColor | undefined {
  const highlight = marks.find(m => m.type === 'highlight')
  if (!highlight) return undefined
  const color = highlight.attrs?.color as string
  // Map TipTap highlight colors to docx highlight colors
  const colorMap: Record<string, HighlightColor> = {
    yellow: 'yellow',
    green: 'green',
    cyan: 'cyan',
    blue: 'blue',
    red: 'red',
    magenta: 'magenta',
  }
  return colorMap[color] ?? undefined
}

function getFontFamily(marks: TipTapMark[]): string | undefined {
  const textStyle = marks.find(m => m.type === 'textStyle')
  return textStyle?.attrs?.fontFamily as string | undefined
}

function getFontSize(marks: TipTapMark[]): number | undefined {
  const textStyle = marks.find(m => m.type === 'textStyle')
  const size = textStyle?.attrs?.fontSize as string | undefined
  if (!size) return undefined
  // Convert CSS size to half-points (docx uses half-points)
  const match = size.match(/(\d+)/)
  return match ? parseInt(match[1]) * 2 : undefined
}

function getCalloutColor(color?: string): string {
  const colors: Record<string, string> = {
    blue: '0969DA',
    green: '1A7F37',
    yellow: '9A6700',
    orange: 'BC4C00',
    red: 'CF222E',
    purple: '8250DF',
    pink: 'BF3989',
    gray: '57606A',
  }
  return colors[color ?? 'blue'] ?? '0969DA'
}

function getCalloutBgColor(color?: string): string {
  const colors: Record<string, string> = {
    blue: 'E7F3FF',
    green: 'DAFBE1',
    yellow: 'FFF8C5',
    orange: 'FFF1E5',
    red: 'FFEBE9',
    purple: 'FBEFFF',
    pink: 'FFEFF7',
    gray: 'F6F8FA',
  }
  return colors[color ?? 'blue'] ?? 'E7F3FF'
}
