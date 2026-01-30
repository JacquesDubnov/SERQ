/**
 * SERQ Document Format Library
 *
 * .serq.html files are valid HTML documents that embed JSON metadata.
 * This allows documents to:
 * 1. Open in any browser and render correctly
 * 2. Preserve SERQ-specific metadata (word count, presets, timestamps)
 * 3. Be edited by the TipTap editor
 */

export interface SerqMetadata {
  version: string
  created: string
  modified: string
  wordCount: number
  presets?: {
    typography?: string
    colors?: string
    canvas?: string
    layout?: string
    masterTheme?: string | null
    themeMode?: 'light' | 'dark' | 'system'
  }
}

/**
 * Style metadata for serialization
 */
export interface StyleMetadataInput {
  typography: string
  colors: string
  canvas: string
  layout: string
  masterTheme: string | null
  themeMode: 'light' | 'dark' | 'system'
}

/**
 * Count words in HTML content by stripping tags and counting whitespace-separated tokens
 */
export function countWords(html: string): number {
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ')
  // Normalize whitespace and split
  const words = text
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((word) => word.length > 0)
  return words.length
}

/**
 * Escape special characters for safe HTML embedding
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Escape </script> in JSON to prevent breaking the HTML structure
 * This is CRITICAL - without it, any content containing "</script>" breaks the document
 */
function escapeScriptClose(json: string): string {
  return json.replace(/<\/script>/gi, '<\\/script>')
}

/**
 * Unescape </script> when parsing
 */
function unescapeScriptClose(json: string): string {
  return json.replace(/<\\\/script>/gi, '</script>')
}

/**
 * Generate a basic inline stylesheet for reasonable browser rendering
 */
function getBaseStyles(): string {
  return `
    body.serq-document {
      font-family: Georgia, 'Times New Roman', Times, serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #1a1a1a;
      background: #fafafa;
    }
    body.serq-document h1, body.serq-document h2, body.serq-document h3 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    body.serq-document p {
      margin: 1em 0;
    }
    body.serq-document blockquote {
      border-left: 3px solid #ccc;
      margin-left: 0;
      padding-left: 1em;
      color: #555;
    }
    body.serq-document code {
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      background: #f0f0f0;
      padding: 0.1em 0.3em;
      border-radius: 3px;
    }
    body.serq-document pre {
      background: #f0f0f0;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
    }
  `.trim()
}

/**
 * Serialize editor HTML and document metadata to .serq.html format
 *
 * @param html - The HTML content from the TipTap editor
 * @param documentMeta - Document information (name and optional path)
 * @param styleMetadata - Optional style preset information to persist
 * @returns A complete HTML document string
 */
export function serializeSerqDocument(
  html: string,
  documentMeta: { name: string; path?: string | null },
  styleMetadata?: StyleMetadataInput
): string {
  const now = new Date().toISOString()

  const metadata: SerqMetadata = {
    version: '1.0',
    created: now,
    modified: now,
    wordCount: countWords(html),
    presets: styleMetadata
      ? {
          typography: styleMetadata.typography,
          colors: styleMetadata.colors,
          canvas: styleMetadata.canvas,
          layout: styleMetadata.layout,
          masterTheme: styleMetadata.masterTheme,
          themeMode: styleMetadata.themeMode,
        }
      : undefined,
  }

  const escapedMetadata = escapeScriptClose(JSON.stringify(metadata, null, 2))
  const escapedTitle = escapeHtml(documentMeta.name)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="SERQ Document Editor">
  <title>${escapedTitle}</title>
  <script type="application/json" id="serq-metadata">
${escapedMetadata}
  </script>
  <style>
${getBaseStyles()}
  </style>
</head>
<body class="serq-document">
${html}
</body>
</html>`
}

/**
 * Parse a .serq.html file back to HTML content and metadata
 *
 * @param content - The full HTML document content
 * @returns Object containing the body HTML and parsed metadata
 * @throws Error if the document format is invalid
 */
export function parseSerqDocument(content: string): {
  html: string
  metadata: SerqMetadata
} {
  // Extract metadata from script tag
  const metadataMatch = content.match(
    /<script[^>]*id="serq-metadata"[^>]*>([\s\S]*?)<\/script>/i
  )

  if (!metadataMatch) {
    throw new Error('Invalid .serq.html document: missing metadata script tag')
  }

  let metadata: SerqMetadata
  try {
    const jsonContent = unescapeScriptClose(metadataMatch[1].trim())
    metadata = JSON.parse(jsonContent)
  } catch (e) {
    throw new Error(`Invalid .serq.html document: malformed metadata JSON - ${e}`)
  }

  // Validate required metadata fields
  if (!metadata.version || !metadata.created || !metadata.modified) {
    throw new Error('Invalid .serq.html document: missing required metadata fields')
  }

  // Extract body content
  const bodyMatch = content.match(/<body[^>]*class="serq-document"[^>]*>([\s\S]*?)<\/body>/i)

  if (!bodyMatch) {
    throw new Error('Invalid .serq.html document: missing body with serq-document class')
  }

  const html = bodyMatch[1].trim()

  return {
    html,
    metadata,
  }
}

/**
 * Update metadata in an existing document while preserving created timestamp
 *
 * @param content - The existing document content
 * @param newHtml - The updated HTML content
 * @param styleMetadata - Optional new style metadata (if not provided, preserves existing)
 * @returns Updated document string
 */
export function updateSerqDocument(
  content: string,
  newHtml: string,
  styleMetadata?: StyleMetadataInput
): string {
  const { metadata } = parseSerqDocument(content)

  // Preserve created timestamp, update modified
  // Update presets if new style metadata provided, otherwise preserve existing
  const updatedMetadata: SerqMetadata = {
    ...metadata,
    modified: new Date().toISOString(),
    wordCount: countWords(newHtml),
    presets: styleMetadata
      ? {
          typography: styleMetadata.typography,
          colors: styleMetadata.colors,
          canvas: styleMetadata.canvas,
          layout: styleMetadata.layout,
          masterTheme: styleMetadata.masterTheme,
          themeMode: styleMetadata.themeMode,
        }
      : metadata.presets,
  }

  // Extract title from existing document
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1] : 'Untitled'

  const escapedMetadata = escapeScriptClose(JSON.stringify(updatedMetadata, null, 2))

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="SERQ Document Editor">
  <title>${title}</title>
  <script type="application/json" id="serq-metadata">
${escapedMetadata}
  </script>
  <style>
${getBaseStyles()}
  </style>
</head>
<body class="serq-document">
${newHtml}
</body>
</html>`
}

/**
 * Check if content is a valid SERQ document
 *
 * @param content - The content to check
 * @returns true if the content appears to be a valid .serq.html document
 */
export function isSerqDocument(content: string): boolean {
  return (
    content.includes('id="serq-metadata"') &&
    content.includes('class="serq-document"') &&
    content.includes('application/json')
  )
}
