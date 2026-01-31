import { forwardRef, useImperativeHandle, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableOfContents, type TableOfContentData } from '@tiptap/extension-table-of-contents';
import { SlashCommands } from '../../extensions/SlashCommands';
import { Callout } from '../../extensions/Callout';
import { ResizableImage } from '../../extensions/ResizableImage';
import { useEditorStore, type OutlineAnchor } from '../../stores/editorStore';
import type { Editor, JSONContent } from '@tiptap/core';
import '../../styles/editor.css';
import '../../styles/tables.css';
import '../../styles/callout.css';
import '../../styles/images.css';

export interface EditorCoreRef {
  setContent: (content: string | JSONContent) => void;
  getHTML: () => string;
  getJSON: () => JSONContent;
  focus: () => void;
  getEditor: () => Editor | null;
}

interface EditorCoreProps {
  initialContent?: string | JSONContent;
  placeholder?: string;
  onUpdate?: (content: JSONContent) => void;
  className?: string;
}

/**
 * Handle TableOfContents update - converts to OutlineAnchor format for store
 */
function handleTocUpdate(data: TableOfContentData): void {
  const anchors: OutlineAnchor[] = data.map((item) => ({
    id: item.id,
    level: item.level,
    textContent: item.textContent,
    isActive: item.isActive,
    pos: item.pos,
  }));
  useEditorStore.getState().setOutlineAnchors(anchors);
}

const EditorCore = forwardRef<EditorCoreRef, EditorCoreProps>(
  ({ initialContent, placeholder = 'Start writing...', onUpdate, className = '' }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          // StarterKit includes: Document, Paragraph, Text, Bold, Italic,
          // Strike, Code, Heading, Blockquote, CodeBlock, HorizontalRule,
          // BulletList, OrderedList, ListItem, HardBreak, History
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        }),
        Highlight.configure({
          multicolor: true,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        Placeholder.configure({
          placeholder,
        }),
        CharacterCount.configure({
          limit: null, // No limit
        }),
        Subscript,
        Superscript,
        Table.configure({
          resizable: true,
          handleWidth: 5,
          cellMinWidth: 100,
          lastColumnResizable: true,
          allowTableNodeSelection: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        SlashCommands,
        Callout,
        ResizableImage,
        TableOfContents.configure({
          onUpdate: handleTocUpdate,
        }),
      ],
      content: initialContent || '',

      // CRITICAL PERFORMANCE OPTIONS
      // See: https://tiptap.dev/docs/editor/api/editor#shouldrerenderontransaction
      shouldRerenderOnTransaction: false, // Prevents render avalanche

      // Enable schema validation
      // See: https://tiptap.dev/docs/editor/api/editor#enablecontentcheck
      enableContentCheck: true,

      // Desktop app, not SSR - render immediately
      immediatelyRender: true,

      onUpdate: ({ editor }) => {
        if (onUpdate) {
          onUpdate(editor.getJSON());
        }
      },
    });

    const setContent = useCallback(
      (content: string | JSONContent) => {
        if (editor) {
          editor.commands.setContent(content);
        }
      },
      [editor]
    );

    const getHTML = useCallback(() => {
      return editor?.getHTML() ?? '';
    }, [editor]);

    const getJSON = useCallback(() => {
      return editor?.getJSON() ?? { type: 'doc', content: [] };
    }, [editor]);

    const focus = useCallback(() => {
      editor?.commands.focus();
    }, [editor]);

    const getEditor = useCallback(() => {
      return editor;
    }, [editor]);

    useImperativeHandle(
      ref,
      () => ({
        setContent,
        getHTML,
        getJSON,
        focus,
        getEditor,
      }),
      [setContent, getHTML, getJSON, focus, getEditor]
    );

    if (!editor) {
      return null;
    }

    return (
      <div className={`editor-wrapper ${className}`}>
        <EditorContent editor={editor} className="editor-content" />
      </div>
    );
  }
);

EditorCore.displayName = 'EditorCore';

export default EditorCore;
