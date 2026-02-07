/**
 * EditorCore - TipTap Editor with Static Extension Set
 *
 * CRITICAL PATTERNS:
 * 1. Single instance - never recreated. Mode switching is a config change.
 * 2. shouldRerenderOnTransaction: false - prevents re-render avalanche
 * 3. enableContentCheck: true - catches schema validation errors
 * 4. Extensions are STATIC - no conditional extensions, no editor recreation triggers
 *
 * TipTap Pages extension REMOVED. Pagination is handled by SectionView
 * (React NodeView) which reads presentationStore and applies CSS classes.
 */

import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { usePresentationStore } from '@/stores/presentationStore';
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
import { Markdown } from 'tiptap-markdown';
import type { Editor, JSONContent } from '@tiptap/core';

// Custom extensions
import { FontSize } from '@/extensions/font-size';
import { FontWeight } from '@/extensions/font-weight';
import { LineHeight } from '@/extensions/line-height';
import { LetterSpacing } from '@/extensions/letter-spacing';
import { StubCommands } from '@/extensions/stub-commands';
import { VirtualCursor } from '@/extensions/virtual-cursor';
import { BlockIndicator } from '@/extensions/block-indicator';
import { ColumnBlock, Column } from '@/extensions/columns';
import { Section } from '@/extensions/section';
import { DocOverride } from '@/extensions/doc-override';
import { BlockquoteContainer, BulletListContainer, OrderedListContainer } from '@/extensions/container-groups';
import { UUIDPlugin } from '@/extensions/uuid-plugin';
import { installZoomPatch } from '@/lib/zoom/prosemirror-zoom-patch';
import { BlockIndicator as BlockIndicatorComponent } from '@/components/BlockIndicator';

// Install zoom patch at module level -- before any EditorView instances are created.
// This patches EditorView.prototype.posAtCoords to work with transform: scale() zoom.
// HMR-safe: the patch module handles hot disposal internally.
installZoomPatch();
import { SlashDropdownMenu } from '@/components/tiptap-ui/slash-dropdown-menu';

export interface EditorCoreRef {
  setContent: (html: string) => void;
  getHTML: () => string;
  getJSON: () => JSONContent;
  focus: () => void;
  getEditor: () => Editor | null;
}

interface EditorCoreProps {
  initialContent?: string | JSONContent | null;
  placeholder?: string;
  onUpdate?: (content: JSONContent) => void;
  onSelectionChange?: () => void;
}

export const EditorCore = forwardRef<EditorCoreRef, EditorCoreProps>(
  function EditorCore({
    initialContent,
    placeholder = 'Start writing...',
    onUpdate,
    onSelectionChange,
  }, ref) {
    // STATIC extensions list -- no conditional extensions, no recreation triggers
    const extensions = useMemo(() => [
      StarterKit.configure({
        undoRedo: { depth: 100, newGroupDelay: 500 },
        document: false,      // Replaced by DocOverride (content: 'section+')
        blockquote: false,    // Replaced by container-group version
        bulletList: false,    // Replaced by container-group version
        orderedList: false,   // Replaced by container-group version
      }),
      // Section-based document structure: doc > section+ > (block | container)+
      DocOverride,
      Section,
      // Container group overrides
      BlockquoteContainer,
      BulletListContainer,
      OrderedListContainer,
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
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Subscript,
      Superscript,
      StubCommands,
      VirtualCursor,
      BlockIndicator,
      ColumnBlock,
      Column,
      UUIDPlugin,
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: false,
      }),
    ], [placeholder]);

    // Default document: one section with an empty paragraph
    const defaultContent: JSONContent = {
      type: 'doc',
      content: [{ type: 'section', attrs: { sectionId: 'init', level: null, numbering: null }, content: [{ type: 'paragraph' }] }],
    };

    const editor = useEditor({
      extensions,
      content: initialContent || defaultContent,

      // Performance config
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,

      // Schema validation
      enableContentCheck: true,
      onContentError: ({ error }) => {
        console.error('[EditorCore] Content validation failed:', error);
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
    const { activeMode, contentWidth } = usePresentationStore();

    if (!editor) {
      return null;
    }

    return (
      <div
        ref={wrapperRef}
        className="editor-content-wrapper"
        data-mode={activeMode}
        data-content-width={contentWidth}
      >
        <EditorContent
          editor={editor}
          className="editor-content"
        />
        <SlashDropdownMenu editor={editor} />
        <BlockIndicatorComponent />
      </div>
    );
  }
);
