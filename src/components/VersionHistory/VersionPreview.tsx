/**
 * Version Preview Component
 * Read-only display of a version's content
 *
 * Note: This is a simple content preview, not a diff view.
 * Visual diff comparison (side-by-side, highlighted changes) is a v2 feature.
 * Users can copy text from this preview and paste into their current document
 * for partial restoration (VER-06 workaround).
 */
import { useMemo } from 'react';
import type { Version } from '../../lib/version-storage';

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
  // Parse and render version content as HTML
  const htmlContent = useMemo(() => {
    if (!version) return '';

    try {
      const json = JSON.parse(version.content);
      // Simple JSON to HTML conversion for preview
      // This is read-only so we don't need full TipTap rendering
      return jsonToPreviewHTML(json);
    } catch (err) {
      console.error('[VersionPreview] Failed to parse version content:', err);
      return '<p style="color: red;">Failed to load preview</p>';
    }
  }, [version]);

  if (!version) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: interfaceColors.textMuted }}
      >
        <p className="text-sm">Select a version to preview</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Preview header */}
      <div
        className="shrink-0 px-4 py-2 text-xs"
        style={{
          backgroundColor: interfaceColors.bgSurface,
          borderBottom: `1px solid ${interfaceColors.border}`,
          color: interfaceColors.textMuted,
        }}
      >
        {version.is_checkpoint && version.checkpoint_name ? (
          <span className="font-medium" style={{ color: interfaceColors.textPrimary }}>
            {version.checkpoint_name}
          </span>
        ) : (
          <span>Auto-save</span>
        )}
        <span className="mx-2">|</span>
        <span>{new Date(version.timestamp).toLocaleString()}</span>
        <span className="mx-2">|</span>
        <span>{version.word_count.toLocaleString()} words</span>
        <span className="mx-2">|</span>
        <span className="italic" style={{ color: interfaceColors.textMuted }}>
          Tip: Select and copy text to partially restore
        </span>
      </div>

      {/* Preview content - selectable for copy */}
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{
          backgroundColor: interfaceColors.bg,
          color: interfaceColors.textPrimary,
          userSelect: 'text', // Allow text selection for copy
        }}
      >
        <div
          className="prose prose-sm max-w-none version-preview-content"
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}

/**
 * Simple JSON to HTML conversion for preview
 * Not full fidelity - just enough to show content
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
      return `<p>${inlineHTML(node.content || [])}</p>`;

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
      return `<div class="callout" style="background: #f0f7ff; padding: 12px; border-left: 4px solid #0066cc; margin: 16px 0;">${calloutContent}</div>`;

    case 'image':
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      return `<img src="${src}" alt="${escapeHTML(alt)}" style="max-width: 100%;" />`;

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
          }
        }

        return text;
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
          return `<${tag} style="border: 1px solid #ddd; padding: 8px;">${content}</${tag}>`;
        })
        .join('');
      return `<tr>${cellsHTML}</tr>`;
    })
    .join('');

  return `<table style="border-collapse: collapse; width: 100%;">${rowsHTML}</table>`;
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
