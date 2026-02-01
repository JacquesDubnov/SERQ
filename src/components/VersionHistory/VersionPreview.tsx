/**
 * Version Preview Component
 * Uses a read-only TipTap editor with the same extensions as the main editor
 * This ensures all content types render correctly without maintaining separate parsers
 */
import { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Callout } from '../../extensions/Callout';
import { ColumnSection, Column } from '../../extensions/Columns';
import { ResizableImage } from '../../extensions/ResizableImage';
import type { Version } from '../../lib/version-storage';
import { useStyleStore } from '../../stores/styleStore';
import '../../styles/editor.css';
import '../../styles/columns.css';
import '../../styles/callout.css';
import '../../styles/tables.css';

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
    currentTypography: typography,
    currentCanvas: canvasPreset,
  } = useStyleStore();

  // Parse version content
  const content = useMemo(() => {
    if (!version) return null;
    try {
      return JSON.parse(version.content);
    } catch (err) {
      console.error('[VersionPreview] Failed to parse version content:', err);
      return null;
    }
  }, [version]);

  // Create a read-only TipTap editor with the same extensions as the main editor
  const previewEditor = useEditor({
    extensions: [
      StarterKit.configure({
        dropcursor: false,
        gapcursor: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Callout,
      ColumnSection,
      Column,
      ResizableImage.configure({
        inline: false,
      }),
    ],
    content: content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'preview-editor',
      },
    },
  });

  // Update editor content when version changes
  useEffect(() => {
    if (previewEditor && content) {
      previewEditor.commands.setContent(content);
    }
  }, [previewEditor, content]);

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
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        backgroundColor: interfaceColors.bgSurface,
        padding: '40px',
      }}
    >
      {/* Scrollable wrapper */}
      <div
        style={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {/* The canvas paper */}
        <div
          className="editor-content"
          style={{
            width: '100%',
            maxWidth: '700px',
            flexShrink: 0,
            backgroundColor: canvasColors.bg,
            color: canvasColors.text,
            padding: '80px 100px',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            ...typographyStyles,
          }}
        >
          <EditorContent editor={previewEditor} />
        </div>
      </div>

      {/* Additional styles for read-only preview */}
      <style>{`
        .preview-editor {
          outline: none;
        }
        .preview-editor .ProseMirror {
          outline: none;
        }
        .preview-editor .ProseMirror:focus {
          outline: none;
        }
        /* Hide any interactive elements in preview */
        .preview-editor .column-layout-handle,
        .preview-editor .column-handles-container {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

export default VersionPreview;
