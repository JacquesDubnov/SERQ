/**
 * Version Preview Component
 * Zoomed-out canvas replica showing version content with full styling
 * Matches the main editor canvas appearance exactly
 */
import { useMemo } from 'react';
import type { Version } from '../../lib/version-storage';
import { useStyleStore } from '../../stores/styleStore';

interface InterfaceColors {
  bg: string;
  bgSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

interface VersionPreviewProps {
  version: Version | null;
  interfaceColors: InterfaceColors;
}

export function VersionPreview({ version, interfaceColors }: VersionPreviewProps) {
  // Get current style presets for rendering
  const {
    typography,
    canvas: canvasPreset,
  } = useStyleStore();

  // Parse and render version content as HTML
  const htmlContent = useMemo(() => {
    if (!version) return '';

    try {
      const json = JSON.parse(version.content);
      return jsonToPreviewHTML(json);
    } catch (err) {
      console.error('[VersionPreview] Failed to parse version content:', err);
      return '<p style="color: red;">Failed to load preview</p>';
    }
  }, [version]);

  // Get canvas colors based on preset
  const getCanvasColors = () => {
    switch (canvasPreset) {
      case 'cream':
        return { bg: '#faf8f5', text: '#2c2c2c' };
      case 'dark':
        return { bg: '#1a1a1a', text: '#e5e5e5' };
      case 'sepia':
        return { bg: '#f4ecd8', text: '#5c4b37' };
      default:
        return { bg: '#ffffff', text: '#1a1a1a' };
    }
  };

  const canvasColors = getCanvasColors();

  // Get typography styles
  const getTypographyStyles = () => {
    switch (typography) {
      case 'georgia':
        return { fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: '1.8' };
      case 'system':
        return { fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '15px', lineHeight: '1.6' };
      case 'mono':
        return { fontFamily: 'SF Mono, Menlo, monospace', fontSize: '14px', lineHeight: '1.5' };
      default:
        return { fontFamily: '"Source Serif 4", Georgia, serif', fontSize: '16px', lineHeight: '1.75' };
    }
  };

  const typographyStyles = getTypographyStyles();

  if (!version) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{
          backgroundColor: interfaceColors.bgSurface,
        }}
      >
        <div className="text-center" style={{ color: interfaceColors.textMuted }}>
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">Select a version to preview</p>
          <p className="text-xs mt-2 opacity-60">Use ↑↓ arrow keys to navigate</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: interfaceColors.bgSurface,
        padding: '40px',
      }}
    >
      {/* Canvas container - centered with shadow and rounded corners */}
      <div
        className="relative"
        style={{
          width: '100%',
          maxWidth: '700px',
          height: '100%',
          maxHeight: 'calc(100vh - 250px)',
          overflow: 'auto',
        }}
      >
        {/* The canvas paper */}
        <div
          className="rounded-lg shadow-lg"
          style={{
            backgroundColor: canvasColors.bg,
            color: canvasColors.text,
            padding: '80px 100px',
            minHeight: '100%',
            ...typographyStyles,
          }}
        >
          <div
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>

      {/* Inline styles for preview content */}
      <style>{`
        .preview-content h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 0 0 0.5em 0;
          line-height: 1.2;
        }
        .preview-content h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 1.5em 0 0.5em 0;
          line-height: 1.3;
        }
        .preview-content h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 1.5em 0 0.5em 0;
          line-height: 1.4;
        }
        .preview-content p {
          margin: 0 0 1em 0;
        }
        .preview-content ul, .preview-content ol {
          margin: 0 0 1em 0;
          padding-left: 1.5em;
        }
        .preview-content li {
          margin: 0.25em 0;
        }
        .preview-content blockquote {
          margin: 1em 0;
          padding: 0.5em 1em;
          border-left: 4px solid #0066cc;
          background: rgba(0, 102, 204, 0.05);
          font-style: italic;
        }
        .preview-content pre {
          margin: 1em 0;
          padding: 1em;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
          overflow-x: auto;
          font-family: SF Mono, Menlo, monospace;
          font-size: 0.9em;
        }
        .preview-content code {
          font-family: SF Mono, Menlo, monospace;
          font-size: 0.9em;
          background: rgba(0, 0, 0, 0.05);
          padding: 0.1em 0.3em;
          border-radius: 3px;
        }
        .preview-content pre code {
          background: none;
          padding: 0;
        }
        .preview-content hr {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          margin: 2em 0;
        }
        .preview-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        .preview-content th, .preview-content td {
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0.5em 0.75em;
          text-align: left;
        }
        .preview-content th {
          background: rgba(0, 0, 0, 0.03);
          font-weight: 600;
        }
        .preview-content img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        .preview-content .callout {
          margin: 1em 0;
          padding: 1em;
          border-left: 4px solid #0066cc;
          background: rgba(0, 102, 204, 0.05);
          border-radius: 0 4px 4px 0;
        }
        .preview-content a {
          color: #0066cc;
          text-decoration: underline;
        }
        .preview-content strong {
          font-weight: 600;
        }
        .preview-content em {
          font-style: italic;
        }
        .preview-content s {
          text-decoration: line-through;
        }
        .preview-content mark {
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

/**
 * Simple JSON to HTML conversion for preview
 */
function jsonToPreviewHTML(doc: any): string {
  if (!doc.content) return '';

  return doc.content
    .map((node: any) => nodeToHTML(node))
    .join('');
}

function nodeToHTML(node: any): string {
  switch (node.type) {
    case 'paragraph':
      const pContent = inlineHTML(node.content || []);
      return pContent ? `<p>${pContent}</p>` : '<p><br></p>';

    case 'heading':
      const level = node.attrs?.level || 1;
      return `<h${level}>${inlineHTML(node.content || [])}</h${level}>`;

    case 'bulletList':
      const bulletItems = (node.content || [])
        .map((item: any) => `<li>${listItemHTML(item)}</li>`)
        .join('');
      return `<ul>${bulletItems}</ul>`;

    case 'orderedList':
      const orderedItems = (node.content || [])
        .map((item: any) => `<li>${listItemHTML(item)}</li>`)
        .join('');
      return `<ol>${orderedItems}</ol>`;

    case 'blockquote':
      const quoteContent = (node.content || [])
        .map((n: any) => nodeToHTML(n))
        .join('');
      return `<blockquote>${quoteContent}</blockquote>`;

    case 'codeBlock':
      const code = (node.content || [])
        .map((n: any) => escapeHTML(n.text || ''))
        .join('');
      return `<pre><code>${code}</code></pre>`;

    case 'horizontalRule':
      return '<hr />';

    case 'table':
      return tableToHTML(node);

    case 'callout':
      const calloutContent = (node.content || [])
        .map((n: any) => nodeToHTML(n))
        .join('');
      return `<div class="callout">${calloutContent}</div>`;

    case 'image':
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      return `<img src="${src}" alt="${escapeHTML(alt)}" />`;

    default:
      if (node.content) {
        return node.content.map((n: any) => nodeToHTML(n)).join('');
      }
      return '';
  }
}

function inlineHTML(content: any[]): string {
  return content
    .map((node) => {
      if (node.type === 'text') {
        let text = escapeHTML(node.text || '');
        const marks = node.marks || [];

        for (const mark of marks) {
          switch (mark.type) {
            case 'bold':
            case 'strong':
              text = `<strong>${text}</strong>`;
              break;
            case 'italic':
            case 'em':
              text = `<em>${text}</em>`;
              break;
            case 'code':
              text = `<code>${text}</code>`;
              break;
            case 'strike':
              text = `<s>${text}</s>`;
              break;
            case 'link':
              text = `<a href="${escapeHTML(mark.attrs?.href || '')}">${text}</a>`;
              break;
            case 'highlight':
              const color = mark.attrs?.color || '#ffeb3b';
              text = `<mark style="background-color: ${color}">${text}</mark>`;
              break;
          }
        }

        return text;
      }
      if (node.type === 'hardBreak') {
        return '<br>';
      }
      return '';
    })
    .join('');
}

function listItemHTML(item: any): string {
  return (item.content || [])
    .map((node: any) => {
      if (node.type === 'paragraph') {
        return inlineHTML(node.content || []);
      }
      return nodeToHTML(node);
    })
    .join('');
}

function tableToHTML(node: any): string {
  const rows = node.content || [];
  if (rows.length === 0) return '';

  const rowsHTML = rows
    .map((row: any) => {
      const cells = row.content || [];
      const cellsHTML = cells
        .map((cell: any) => {
          const isHeader = cell.type === 'tableHeader';
          const tag = isHeader ? 'th' : 'td';
          const content = (cell.content || [])
            .map((n: any) => inlineHTML(n.content || []))
            .join(' ');
          return `<${tag}>${content}</${tag}>`;
        })
        .join('');
      return `<tr>${cellsHTML}</tr>`;
    })
    .join('');

  return `<table>${rowsHTML}</table>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default VersionPreview;
