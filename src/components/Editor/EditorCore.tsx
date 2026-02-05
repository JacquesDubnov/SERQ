/**
 * EditorCore - TipTap Editor with Critical Configuration
 *
 * Phase 1: Full extension set + performance config from research.
 *
 * CRITICAL PATTERNS (from 01-RESEARCH.md):
 * 1. Single instance - never recreate, use setContent() for doc switching
 * 2. shouldRerenderOnTransaction: false - prevents re-render avalanche
 * 3. enableContentCheck: true - catches schema validation errors
 */

import { forwardRef, useImperativeHandle, useMemo, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Pages } from '@tiptap-pro/extension-pages';
import { Markdown } from 'tiptap-markdown';
import type { Editor, JSONContent } from '@tiptap/core';
import type { PageSize } from '@/stores/editorStore';

// Custom extensions for font styling
import { FontSize } from '@/extensions/font-size';
import { FontWeight } from '@/extensions/font-weight';
import { LineHeight } from '@/extensions/line-height';
import { LetterSpacing } from '@/extensions/letter-spacing';
// ParagraphSpacing is now global via CSS variables (see styleStore)
import { StubCommands } from '@/extensions/stub-commands';
import { VirtualCursor } from '@/extensions/virtual-cursor';
import { BlockIndicator } from '@/extensions/block-indicator';
import { ZoomCoordinateFix } from '@/extensions/zoom-coordinate-fix';
import { BlockIndicator as BlockIndicatorComponent } from '@/components/BlockIndicator';
// import { MultiSelection } from '@/extensions/multi-selection'; // Disabled for debugging

export interface EditorCoreRef {
  setContent: (html: string) => void;
  getHTML: () => string;
  getJSON: () => JSONContent;
  focus: () => void;
  getEditor: () => Editor | null;
}

interface EditorCoreProps {
  initialContent?: string;
  placeholder?: string;
  onUpdate?: (content: JSONContent) => void;
  onSelectionChange?: () => void;
  paginationEnabled?: boolean;
  pageSize?: PageSize;
  isDark?: boolean;
}

// Page format mapping - maps our PageSize to TipTap's PageFormat
const PAGE_FORMAT_MAP = {
  a4: 'A4',
  letter: 'Letter',
  legal: 'Legal',
} as const;

export const EditorCore = forwardRef<EditorCoreRef, EditorCoreProps>(
  function EditorCore({
    initialContent,
    placeholder = 'Start writing...',
    onUpdate,
    onSelectionChange,
    paginationEnabled = false,
    pageSize = 'a4',
    isDark = false,
  }, ref) {
    // Build extensions list - Pages only included when pagination enabled
    const extensions = useMemo(() => {
      const baseExtensions = [
        StarterKit.configure({
          undoRedo: { depth: 100, newGroupDelay: 500 },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            class: 'editor-link',
            rel: 'noopener noreferrer',
          },
        }),
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        FontFamily,
        FontSize,
        FontWeight,
        LineHeight,
        LetterSpacing,
        Color,
        Placeholder.configure({
          placeholder,
        }),
        CharacterCount,
        Subscript,
        Superscript,
        StubCommands,
        // Virtual cursor renders custom caret, preventing visual stretching in pagination
        VirtualCursor,
        // Block indicator - shows subtle blue line on hovered block
        BlockIndicator,
        // Patches caretRangeFromPoint to handle transform:scale zoom correctly
        ZoomCoordinateFix,
        // Markdown paste support - converts pasted markdown to rich text
        Markdown.configure({
          html: true, // Allow HTML in markdown
          transformPastedText: true, // Convert pasted markdown to rich text
          transformCopiedText: false, // Don't convert copied text to markdown (keep rich text)
        }),
      ];

      // Add Pages extension when pagination is enabled
      if (paginationEnabled) {
        baseExtensions.push(
          Pages.configure({
            pageFormat: PAGE_FORMAT_MAP[pageSize],
            pageGap: 24,
            // Gap color must match the app background (bgSurface in App.tsx)
            pageBreakBackground: isDark ? '#262626' : '#f5f5f5',
            footer: 'Page {page} of {total}',
            header: '',
          })
        );
      }

      return baseExtensions;
    }, [paginationEnabled, pageSize, placeholder, isDark]);

    const editor = useEditor({
      extensions,
      content: initialContent || `<p></p>`,

      // CRITICAL: Performance configuration (from research)
      immediatelyRender: true, // Desktop app, not SSR
      shouldRerenderOnTransaction: false, // Prevent 60+ renders/second during typing

      // CRITICAL: Schema validation (from research)
      enableContentCheck: true,
      onContentError: ({ error }) => {
        console.error('[EditorCore] Content validation failed:', error);
        // TODO: Wire to toast notification system in Phase 5
      },

      onUpdate: ({ editor }) => {
        onUpdate?.(editor.getJSON());
      },

      onSelectionUpdate: () => {
        onSelectionChange?.();
      },

    });

    // Expose methods for document operations
    useImperativeHandle(ref, () => ({
      setContent: (html: string) => {
        editor?.commands.setContent(html, {
          emitUpdate: false,
          parseOptions: { preserveWhitespace: 'full' },
        });
      },
      getHTML: () => editor?.getHTML() ?? '',
      getJSON: () => editor?.getJSON() ?? { type: 'doc', content: [] },
      focus: () => editor?.commands.focus(),
      getEditor: () => editor,
    }), [editor]);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Apply theme colors to pagination elements
    // TipTap Pages uses inline styles that need JavaScript override
    const applyPageTheme = useCallback(() => {
      if (!wrapperRef.current || !paginationEnabled) return;

      const pageColor = isDark ? '#1f1f1f' : '#ffffff';
      const gapColor = isDark ? '#262626' : '#f5f5f5';

      // Target the pagination container
      const paginationContainer = wrapperRef.current.querySelector('[data-tiptap-pagination]');
      if (!paginationContainer) return;

      // Style gap elements (including borders to hide the white lines)
      const gaps = paginationContainer.querySelectorAll('.tiptap-pagination-gap');
      gaps.forEach((gap) => {
        const el = gap as HTMLElement;
        el.style.setProperty('background', gapColor, 'important');
        el.style.setProperty('background-color', gapColor, 'important');
        el.style.setProperty('border-color', gapColor, 'important');
      });

      // Style page elements - target .page class and page-break wrappers
      // TipTap creates .page and .tiptap-page-break elements
      const pageElements = paginationContainer.querySelectorAll('.page, .tiptap-page-break');
      pageElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.setProperty('background', pageColor, 'important');
        htmlEl.style.setProperty('background-color', pageColor, 'important');
      });

      // Also style headers/footers to match page color
      const headerFooters = paginationContainer.querySelectorAll('.tiptap-page-header, .tiptap-page-footer');
      headerFooters.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.setProperty('background', pageColor, 'important');
        htmlEl.style.setProperty('background-color', pageColor, 'important');
      });
    }, [isDark, paginationEnabled]);

    useEffect(() => {
      if (!paginationEnabled) return;

      // Apply immediately on theme change
      applyPageTheme();

      // Apply after TipTap renders (multiple delays for reliability)
      const timeouts = [
        setTimeout(applyPageTheme, 50),
        setTimeout(applyPageTheme, 150),
        setTimeout(applyPageTheme, 500),
      ];

      // Watch for DOM changes (new pages added, etc.)
      const observer = new MutationObserver(() => {
        requestAnimationFrame(applyPageTheme);
      });

      if (wrapperRef.current) {
        observer.observe(wrapperRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class'],
        });
      }

      return () => {
        timeouts.forEach(clearTimeout);
        observer.disconnect();
      };
    }, [paginationEnabled, isDark, applyPageTheme]);

    if (!editor) {
      return null;
    }

    return (
      <div
        ref={wrapperRef}
        className={`editor-content-wrapper ${isDark ? 'theme-dark' : 'theme-light'}`}
        data-theme={isDark ? 'dark' : 'light'}
      >
        <EditorContent
          editor={editor}
          className="editor-content"
        />
        <BlockIndicatorComponent />
      </div>
    );
  }
);
