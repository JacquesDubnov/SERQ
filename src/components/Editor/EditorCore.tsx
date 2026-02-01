import { forwardRef, useImperativeHandle, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import { FontSize } from '../../extensions/FontSize';
import { FontWeight } from '../../extensions/FontWeight';
import { FontKeyboardShortcuts } from '../../extensions/FontKeyboardShortcuts';
import { LetterSpacing } from '../../extensions/LetterSpacing';
import { LineHeight } from '../../extensions/LineHeight';
import { TextCase } from '../../extensions/TextCase';
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
import { MultiSelect } from '../../extensions/MultiSelect';
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
        FontFamily,
        FontSize,
        FontWeight,
        FontKeyboardShortcuts,
        LetterSpacing,
        LineHeight,
        TextCase,
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
        MultiSelect,
      ],
      content: initialContent || '',

      // Handle image drag/drop and paste
      editorProps: {
        handleDOMEvents: {
          // Show drop cursor during internal drags (images, content)
          dragstart: (view, event) => {
            console.log('[dragstart] fired', event.target)
            // Store the dragged content and view reference for later
            const { selection } = view.state
            if (selection) {
              (window as any).__draggedSelection = {
                from: selection.from,
                to: selection.to,
                content: view.state.doc.slice(selection.from, selection.to),
                view: view,
              }
            }

            // Create thumbnail drag image for images
            const target = event.target as HTMLElement
            const img = target.closest('.resizable-image-wrapper')?.querySelector('img') ||
                        target.querySelector('img') ||
                        (target.tagName === 'IMG' ? target : null)

            if (img && event.dataTransfer) {
              // Create a small thumbnail clone
              const thumbnail = document.createElement('div')
              thumbnail.style.cssText = `
                position: absolute;
                left: -9999px;
                width: 80px;
                height: 80px;
                background-image: url(${(img as HTMLImageElement).src});
                background-size: cover;
                background-position: center;
                border-radius: 4px;
                border: 2px solid #2563eb;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                opacity: 0.9;
              `
              document.body.appendChild(thumbnail)

              // Set as drag image with cursor at top-left corner
              event.dataTransfer.setDragImage(thumbnail, 0, 0)

              // Remove thumbnail after a short delay
              setTimeout(() => thumbnail.remove(), 0)

              // Add one-time drop listener to document to catch the drop
              const handleDocDrop = (dropEvent: DragEvent) => {
                console.log('[Document drop]', dropEvent.clientX, dropEvent.clientY)
                document.removeEventListener('drop', handleDocDrop, true)

                const draggedSelection = (window as any).__draggedSelection
                if (!draggedSelection) return

                const editorView = draggedSelection.view
                const coordinates = editorView.posAtCoords({
                  left: dropEvent.clientX,
                  top: dropEvent.clientY,
                })

                if (coordinates) {
                  dropEvent.preventDefault()
                  dropEvent.stopPropagation()

                  const { state } = editorView
                  const { tr } = state

                  const content = draggedSelection.content.content
                  const deleteFrom = draggedSelection.from
                  const deleteTo = draggedSelection.to
                  let insertPos = coordinates.pos

                  if (insertPos > deleteFrom) {
                    insertPos = insertPos - (deleteTo - deleteFrom)
                  }

                  tr.delete(deleteFrom, deleteTo)
                  tr.insert(Math.max(0, insertPos), content)

                  const newPos = Math.min(insertPos + content.size, tr.doc.content.size)
                  tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)))

                  editorView.dispatch(tr)

                  // Hide cursor
                  const cursor = document.getElementById('editor-drop-cursor')
                  if (cursor) cursor.style.display = 'none'
                }

                delete (window as any).__draggedSelection
              }

              document.addEventListener('drop', handleDocDrop, true)

              // Also listen for dragend to see if drag completes
              const handleDragEnd = (e: DragEvent) => {
                console.log('[Document dragend]', e.type, 'dropEffect:', e.dataTransfer?.dropEffect)
                document.removeEventListener('dragend', handleDragEnd, true)
                document.removeEventListener('drop', handleDocDrop, true)
                // Hide cursor
                const cursor = document.getElementById('editor-drop-cursor')
                if (cursor) cursor.style.display = 'none'
                delete (window as any).__draggedSelection
              }
              document.addEventListener('dragend', handleDragEnd, true)

              console.log('[dragstart] Document drop listener attached')
            }

            // Create drop cursor if it doesn't exist
            let cursor = document.getElementById('editor-drop-cursor')
            if (!cursor) {
              cursor = document.createElement('div')
              cursor.id = 'editor-drop-cursor'
              cursor.style.cssText = `
                position: fixed;
                width: 3px;
                background-color: #2563eb;
                pointer-events: none;
                z-index: 10000;
                display: none;
                box-shadow: 0 0 8px rgba(37, 99, 235, 0.8), 0 0 2px rgba(37, 99, 235, 1);
                border-radius: 2px;
              `
              document.body.appendChild(cursor)
            }
            return false
          },
          dragover: (view, event) => {
            // Only show cursor if we have a dragged selection (internal drag)
            if (!(window as any).__draggedSelection) return false

            const cursor = document.getElementById('editor-drop-cursor')
            if (!cursor) return false

            // Get drop position
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            })

            if (coordinates) {
              try {
                const cursorCoords = view.coordsAtPos(coordinates.pos)
                cursor.style.display = 'block'
                cursor.style.left = `${cursorCoords.left}px`
                cursor.style.top = `${cursorCoords.top}px`
                cursor.style.height = `${Math.max(20, cursorCoords.bottom - cursorCoords.top)}px`
              } catch {
                // coordsAtPos can throw - hide cursor
                cursor.style.display = 'none'
              }
            } else {
              cursor.style.display = 'none'
            }

            return false
          },
          dragend: () => {
            const cursor = document.getElementById('editor-drop-cursor')
            if (cursor) cursor.style.display = 'none'
            // Clear stored selection
            delete (window as any).__draggedSelection
            return false
          },
          drop: (view, event) => {
            console.log('[drop] Event fired', {
              hasDraggedSelection: !!(window as any).__draggedSelection,
              clientX: event.clientX,
              clientY: event.clientY
            })

            const cursor = document.getElementById('editor-drop-cursor')
            if (cursor) cursor.style.display = 'none'

            // Check if we have stored dragged content (internal drag)
            const draggedSelection = (window as any).__draggedSelection
            if (draggedSelection) {
              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              })

              console.log('[drop] coordinates', coordinates, 'draggedSelection', draggedSelection)

              if (coordinates) {
                event.preventDefault()
                event.stopPropagation()

                const { state } = view
                const { tr } = state

                // Get the content to move
                const content = draggedSelection.content.content

                // Calculate positions
                const deleteFrom = draggedSelection.from
                const deleteTo = draggedSelection.to
                let insertPos = coordinates.pos

                // If dropping after the original position, adjust for the deletion
                if (insertPos > deleteFrom) {
                  insertPos = insertPos - (deleteTo - deleteFrom)
                }

                // Delete original, then insert at new position
                tr.delete(deleteFrom, deleteTo)
                tr.insert(Math.max(0, insertPos), content)

                // Set selection after the inserted content
                const newPos = Math.min(insertPos + content.size, tr.doc.content.size)
                tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)))

                view.dispatch(tr)

                console.log('[drop] Transaction dispatched')

                // Clear the stored selection
                delete (window as any).__draggedSelection

                return true
              }
            }

            // Clear stored selection even if drop didn't work
            delete (window as any).__draggedSelection
            return false
          },
          dragleave: (view, event) => {
            // Only hide if leaving the editor entirely
            const relatedTarget = event.relatedTarget as Node | null
            if (!relatedTarget || !view.dom.contains(relatedTarget)) {
              const cursor = document.getElementById('editor-drop-cursor')
              if (cursor) cursor.style.display = 'none'
            }
            return false
          },
        },
        handleDrop: (view, event, slice, moved) => {
          // Hide drop cursor
          const cursor = document.getElementById('editor-drop-cursor')
          if (cursor) cursor.style.display = 'none'

          console.log('[handleDrop]', { moved, hasSlice: !!slice, sliceContent: slice?.content.childCount, selection: view.state.selection.toJSON() })

          // Handle internal moves (dragging content within the editor)
          if (slice && slice.content.childCount > 0) {
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            })

            if (coordinates) {
              event.preventDefault()
              const { state } = view
              const { tr } = state

              // If this is a move operation, delete the original first
              if (moved) {
                tr.deleteSelection()
              }

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

        // Check if document is empty (only has empty paragraph)
        const isEmpty = editor.isEmpty || (
          editor.state.doc.content.size <= 4 && // Empty doc has size ~4
          editor.state.doc.textContent.trim() === ''
        );

        // When document becomes empty, scroll to top so canvas is visible at top of viewport
        if (isEmpty) {
          const mainElement = document.querySelector('main');
          if (mainElement && mainElement.scrollTop > 0) {
            mainElement.scrollTo({ top: 0, behavior: 'smooth' });
          }
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
