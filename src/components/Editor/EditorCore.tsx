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
import { CustomTableCell } from '../../extensions/CustomTableCell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableOfContents, type TableOfContentData } from '@tiptap/extension-table-of-contents';
import { SlashCommands } from '../../extensions/SlashCommands';
import { TableWidthLimit } from '../../extensions/TableWidthLimit';
import { TableKeyboardNavigation } from '../../extensions/TableKeyboardNavigation';
import { Callout } from '../../extensions/Callout';
import { ColumnSection, Column } from '../../extensions/Columns';
import { ResizableImage } from '../../extensions/ResizableImage';
import { TypewriterMode } from '../../extensions/TypewriterMode';
import { Comment } from '../../extensions/Comment';
import { LineNumbers } from '../../extensions/LineNumbers';
import { ParagraphNumbers } from '../../extensions/ParagraphNumbers';
import { useEditorStore, type OutlineAnchor } from '../../stores/editorStore';
import { useCommentStore } from '../../stores/commentStore';
import { isImageFile, isLargeImage, fileToBase64, formatFileSize } from '../../lib/imageUtils';
import type { Editor, JSONContent } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
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
          dropcursor: {
            color: 'var(--color-accent, #2563eb)',
            width: 2,
          },
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
        CustomTableCell,
        TableWidthLimit,
        TableKeyboardNavigation,
        SlashCommands,
        Callout,
        ColumnSection,
        Column,
        ResizableImage,
        TableOfContents.configure({
          onUpdate: handleTocUpdate,
        }),
        TypewriterMode.configure({
          enabled: false, // Disabled by default, toggled via StatusBar
        }),
        Comment.configure({
          HTMLAttributes: {
            class: 'comment-mark',
          },
          onCommentActivated: (commentId: string) => {
            // Activate comment in store and open panel
            useCommentStore.getState().setActiveComment(commentId);
            useCommentStore.getState().setPanelOpen(true);
          },
        }),
        LineNumbers.configure({
          getSettings: () => useEditorStore.getState().lineNumbers,
        }),
        ParagraphNumbers.configure({
          getSettings: () => useEditorStore.getState().paragraphNumbers,
        }),
      ],
      content: initialContent || '',

      // Handle image drag/drop and paste
      editorProps: {
        handleDrop: (view, event, slice, moved) => {
          // Handle internal moves (dragging content within the editor)
          if (moved && slice && slice.content.childCount > 0) {
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            })

            if (coordinates) {
              event.preventDefault()
              const { state } = view
              const { tr } = state

              tr.deleteSelection()
              const insertPos = tr.mapping.map(coordinates.pos)
              tr.insert(insertPos, slice.content)

              const newPos = insertPos + slice.content.size
              tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(newPos, tr.doc.content.size))))

              view.dispatch(tr)
              return true
            }
          }

          const dataTransfer = event.dataTransfer
          if (!dataTransfer) return false

          const files = dataTransfer.files
          const items = dataTransfer.items

          let imageFiles: File[] = []
          if (files && files.length > 0) {
            imageFiles = Array.from(files).filter(isImageFile)
          }

          if (imageFiles.length === 0 && items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
              const item = items[i]
              if (item.kind === 'file' && item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file) imageFiles.push(file)
              }
            }
          }

          if (imageFiles.length === 0) return false

          event.preventDefault()
          event.stopPropagation()

          // Get drop position from coordinates
          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          })

          // Capture schema reference before async
          const imageNodeType = view.state.schema.nodes.image
          if (!imageNodeType) {
            console.error('Image node type not found in schema')
            return true
          }

          // Process images async
          const processImages = async () => {
            for (const file of imageFiles) {
              if (isLargeImage(file)) {
                const proceed = window.confirm(
                  `This image is ${formatFileSize(file.size)}. Large images may slow down the document. Continue?`
                )
                if (!proceed) continue
              }

              try {
                const dataUrl = await fileToBase64(file)
                // Get fresh state for each insert
                const currentState = view.state
                const pos = coordinates?.pos ?? currentState.selection.to
                const imageNode = imageNodeType.create({ src: dataUrl })
                const tr = currentState.tr.insert(pos, imageNode)
                tr.setSelection(TextSelection.near(tr.doc.resolve(pos + imageNode.nodeSize)))
                view.dispatch(tr)
              } catch (error) {
                console.error('Failed to insert image:', error)
              }
            }
          }

          processImages()
          return true
        },

        handlePaste: (view, event) => {
          const clipboardData = event.clipboardData
          if (!clipboardData) return false

          const files = clipboardData.files
          if (!files || files.length === 0) return false

          // Find image files
          const imageFiles = Array.from(files).filter(isImageFile)
          if (imageFiles.length === 0) return false

          event.preventDefault()

          // Process images async and insert them
          const processImages = async () => {
            for (const file of imageFiles) {
              // Show warning for large files
              if (isLargeImage(file)) {
                const proceed = window.confirm(
                  `This image is ${formatFileSize(file.size)}. Large images may slow down the document. Continue?`
                )
                if (!proceed) continue
              }

              try {
                const dataUrl = await fileToBase64(file)
                // Get fresh state for each insert
                const { state } = view
                const pos = state.selection.to
                const imageNode = state.schema.nodes.image.create({ src: dataUrl })
                const tr = state.tr.insert(pos, imageNode)
                // Move cursor after the image
                tr.setSelection(TextSelection.near(tr.doc.resolve(pos + imageNode.nodeSize)))
                view.dispatch(tr)
              } catch (error) {
                console.error('Failed to insert image:', error)
              }
            }
          }

          processImages()
          return true
        },
      },

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

        // Check for deleted comment marks
        const commentStore = useCommentStore.getState();
        const comments = commentStore.comments;

        // Collect all comment IDs currently in the document
        const docCommentIds = new Set<string>();
        editor.state.doc.descendants((node) => {
          node.marks.forEach((mark) => {
            if (mark.type.name === 'comment' && mark.attrs.id) {
              docCommentIds.add(mark.attrs.id);
            }
          });
        });

        // Mark as textDeleted any comments that are no longer in the document
        comments.forEach((comment) => {
          if (!comment.textDeleted && !docCommentIds.has(comment.id)) {
            commentStore.markTextDeleted(comment.id);
          }
        });
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
