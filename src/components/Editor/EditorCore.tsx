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
import type { Editor, JSONContent } from '@tiptap/core';
import '../../styles/editor.css';

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
