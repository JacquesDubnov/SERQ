/**
 * SERQ Document Format (.serq.html)
 *
 * The .serq.html format is a valid HTML document that:
 * 1. Opens in any browser and renders correctly
 * 2. Embeds SERQ-specific metadata in a JSON script tag
 * 3. Can be edited by the TipTap editor
 *
 * Structure:
 * - <script type="application/json" id="serq-metadata">{ ... }</script>
 * - <body class="serq-document">{ editor HTML content }</body>
 */

import type { HeadingCustomStyle, HeadingSpacingConfig } from '@/stores/styleStore';

export interface SerqMetadata {
  version: string;
  created: string;
  modified: string;
  wordCount: number;
  presets?: {
    typography?: string;
    colors?: string;
    canvas?: string;
    layout?: string;
    masterTheme?: string | null;
    themeMode?: 'light' | 'dark' | 'system';
    paragraphSpacingBefore?: number;
    paragraphSpacingAfter?: number;
    headingSpacing?: {
      h1?: HeadingSpacingConfig;
      h2?: HeadingSpacingConfig;
      h3?: HeadingSpacingConfig;
      h4?: HeadingSpacingConfig;
      h5?: HeadingSpacingConfig;
      h6?: HeadingSpacingConfig;
    };
    headingCustomStyles?: {
      h1?: HeadingCustomStyle | null;
      h2?: HeadingCustomStyle | null;
      h3?: HeadingCustomStyle | null;
      h4?: HeadingCustomStyle | null;
      h5?: HeadingCustomStyle | null;
      h6?: HeadingCustomStyle | null;
    };
  };
}

export interface StyleMetadataInput {
  typography: string;
  colors: string;
  canvas: string;
  layout: string;
  masterTheme: string | null;
  themeMode: 'light' | 'dark' | 'system';
  paragraphSpacingBefore?: number;
  paragraphSpacingAfter?: number;
  headingSpacing?: {
    h1?: HeadingSpacingConfig;
    h2?: HeadingSpacingConfig;
    h3?: HeadingSpacingConfig;
    h4?: HeadingSpacingConfig;
    h5?: HeadingSpacingConfig;
    h6?: HeadingSpacingConfig;
  };
  headingCustomStyles?: {
    h1?: HeadingCustomStyle | null;
    h2?: HeadingCustomStyle | null;
    h3?: HeadingCustomStyle | null;
    h4?: HeadingCustomStyle | null;
    h5?: HeadingCustomStyle | null;
    h6?: HeadingCustomStyle | null;
  };
}

export interface SerqDocument {
  html: string;
  metadata: SerqMetadata;
}

/**
 * Count words in HTML content by stripping tags
 */
export function countWords(html: string): number {
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');
  // Normalize whitespace and split
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Escape HTML special characters for safe embedding
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Escape </script> in JSON content to prevent breaking HTML
 */
function escapeScriptClose(json: string): string {
  return json.replace(/<\/script>/gi, '<\\/script>');
}

/**
 * Unescape </script> when reading JSON from HTML
 */
function unescapeScriptClose(json: string): string {
  return json.replace(/<\\\/script>/gi, '</script>');
}

/**
 * Basic inline styles for browser rendering
 */
const SERQ_INLINE_STYLES = `
  body.serq-document {
    max-width: 720px;
    margin: 40px auto;
    padding: 0 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #1a1a1a;
  }
  body.serq-document h1 { font-size: 2em; margin: 0.67em 0; }
  body.serq-document h2 { font-size: 1.5em; margin: 0.83em 0; }
  body.serq-document h3 { font-size: 1.17em; margin: 1em 0; }
  body.serq-document p { margin: 1em 0; }
  body.serq-document ul, body.serq-document ol { margin: 1em 0; padding-left: 2em; }
  body.serq-document blockquote {
    margin: 1em 0;
    padding-left: 1em;
    border-left: 3px solid #ddd;
    color: #666;
  }
  body.serq-document code {
    background: #f5f5f5;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
  }
  body.serq-document pre {
    background: #f5f5f5;
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto;
  }
  @media (prefers-color-scheme: dark) {
    body.serq-document { background: #1a1a1a; color: #f5f5f5; }
    body.serq-document blockquote { border-color: #444; color: #999; }
    body.serq-document code, body.serq-document pre { background: #2a2a2a; }
  }
`;

/**
 * Serialize editor HTML and metadata into .serq.html format
 */
export function serializeSerqDocument(
  html: string,
  documentMeta: { name: string; path?: string | null },
  existingMetadata?: SerqMetadata,
  styleMetadata?: StyleMetadataInput
): string {
  const now = new Date().toISOString();

  // Build presets object from style metadata or preserve existing
  const presets = styleMetadata
    ? {
        typography: styleMetadata.typography,
        colors: styleMetadata.colors,
        canvas: styleMetadata.canvas,
        layout: styleMetadata.layout,
        masterTheme: styleMetadata.masterTheme,
        themeMode: styleMetadata.themeMode,
        paragraphSpacingBefore: styleMetadata.paragraphSpacingBefore,
        paragraphSpacingAfter: styleMetadata.paragraphSpacingAfter,
        headingSpacing: styleMetadata.headingSpacing,
        headingCustomStyles: styleMetadata.headingCustomStyles,
      }
    : existingMetadata?.presets;

  const metadata: SerqMetadata = {
    version: '1.0',
    created: existingMetadata?.created ?? now,
    modified: now,
    wordCount: countWords(html),
    presets,
  };

  const metadataJson = escapeScriptClose(JSON.stringify(metadata, null, 2));
  const title = escapeHtml(documentMeta.name.replace(/\.serq\.html$/i, ''));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="SERQ Document Editor">
  <title>${title}</title>
  <style>${SERQ_INLINE_STYLES}</style>
  <script type="application/json" id="serq-metadata">
${metadataJson}
  </script>
</head>
<body class="serq-document">
${html}
</body>
</html>`;
}

/**
 * Parse .serq.html content into HTML and metadata
 */
export function parseSerqDocument(content: string): SerqDocument {
  // Extract metadata from script tag
  const metadataMatch = content.match(
    /<script[^>]*id=["']serq-metadata["'][^>]*>([\s\S]*?)<\/script>/i
  );

  let metadata: SerqMetadata;

  if (metadataMatch) {
    try {
      const jsonStr = unescapeScriptClose(metadataMatch[1].trim());
      metadata = JSON.parse(jsonStr);
    } catch {
      // Fallback if JSON parsing fails
      metadata = createDefaultMetadata();
    }
  } else {
    metadata = createDefaultMetadata();
  }

  // Extract body content
  const bodyMatch = content.match(
    /<body[^>]*class=["']serq-document["'][^>]*>([\s\S]*?)<\/body>/i
  );

  let html: string;

  if (bodyMatch) {
    html = bodyMatch[1].trim();
  } else {
    // If no serq-document body, try to extract any body content
    const anyBodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (anyBodyMatch) {
      html = anyBodyMatch[1].trim();
    } else {
      // Last resort: treat entire content as HTML (non-.serq file)
      html = content;
    }
  }

  return { html, metadata };
}

/**
 * Create default metadata for new or unrecognized documents
 */
function createDefaultMetadata(): SerqMetadata {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    created: now,
    modified: now,
    wordCount: 0,
  };
}

/**
 * Check if content appears to be a .serq.html document
 */
export function isSerqDocument(content: string): boolean {
  return content.includes('id="serq-metadata"') ||
         content.includes("id='serq-metadata'");
}

/**
 * Extract just the document title from a .serq.html file
 */
export function extractTitle(content: string): string | null {
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}
