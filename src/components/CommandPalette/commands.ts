import type { Editor } from '@tiptap/core'
import { exportToHTML, exportToMarkdown, exportToPDF, exportToEPUB } from '../../lib/export-handlers'
import {
  importWordDocument,
  importMarkdownFile,
  importTextFile,
  importEPUBFile,
} from '../../lib/import-handlers'
import { useEditorStore } from '../../stores/editorStore'
import { useCommentStore } from '../../stores/commentStore'

/**
 * Detect if running on Mac for keyboard shortcut display
 */
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const modKey = isMac ? 'Cmd' : 'Ctrl'

/**
 * Command item interface for the command palette
 */
export interface CommandItem {
  id: string
  title: string
  shortcut?: string
  group: CommandGroup
  action: (editor: Editor) => void
}

export type CommandGroup =
  | 'format'
  | 'headings'
  | 'blocks'
  | 'alignment'
  | 'insert'
  | 'file'
  | 'view'

/**
 * All available commands for the command palette
 */
export const commands: CommandItem[] = [
  // Format group
  {
    id: 'bold',
    title: 'Bold',
    shortcut: `${modKey}+B`,
    group: 'format',
    action: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: 'italic',
    title: 'Italic',
    shortcut: `${modKey}+I`,
    group: 'format',
    action: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: 'underline',
    title: 'Underline',
    shortcut: `${modKey}+U`,
    group: 'format',
    action: (editor) => editor.chain().focus().toggleUnderline().run(),
  },
  {
    id: 'strikethrough',
    title: 'Strikethrough',
    shortcut: `${modKey}+Shift+X`,
    group: 'format',
    action: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    id: 'code',
    title: 'Inline Code',
    shortcut: `${modKey}+E`,
    group: 'format',
    action: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    id: 'highlight',
    title: 'Highlight',
    shortcut: `${modKey}+Alt+H`,
    group: 'format',
    action: (editor) => editor.chain().focus().toggleHighlight().run(),
  },
  {
    id: 'subscript',
    title: 'Subscript',
    group: 'format',
    action: (editor) => editor.chain().focus().toggleSubscript().run(),
  },
  {
    id: 'superscript',
    title: 'Superscript',
    group: 'format',
    action: (editor) => editor.chain().focus().toggleSuperscript().run(),
  },
  {
    id: 'clear-formatting',
    title: 'Clear Formatting',
    shortcut: `${modKey}+\\`,
    group: 'format',
    action: (editor) => editor.chain().focus().unsetAllMarks().run(),
  },

  // Headings group
  {
    id: 'heading1',
    title: 'Heading 1',
    shortcut: `${modKey}+Alt+1`,
    group: 'headings',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'heading2',
    title: 'Heading 2',
    shortcut: `${modKey}+Alt+2`,
    group: 'headings',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'heading3',
    title: 'Heading 3',
    shortcut: `${modKey}+Alt+3`,
    group: 'headings',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'heading4',
    title: 'Heading 4',
    shortcut: `${modKey}+Alt+4`,
    group: 'headings',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    id: 'heading5',
    title: 'Heading 5',
    shortcut: `${modKey}+Alt+5`,
    group: 'headings',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 5 }).run(),
  },
  {
    id: 'heading6',
    title: 'Heading 6',
    shortcut: `${modKey}+Alt+6`,
    group: 'headings',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 6 }).run(),
  },

  // Blocks group
  {
    id: 'paragraph',
    title: 'Paragraph',
    shortcut: `${modKey}+Alt+0`,
    group: 'blocks',
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: 'blockquote',
    title: 'Blockquote',
    shortcut: `${modKey}+Shift+B`,
    group: 'blocks',
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'code-block',
    title: 'Code Block',
    shortcut: `${modKey}+Alt+C`,
    group: 'blocks',
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'bullet-list',
    title: 'Bullet List',
    shortcut: `${modKey}+Shift+8`,
    group: 'blocks',
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'numbered-list',
    title: 'Numbered List',
    shortcut: `${modKey}+Shift+7`,
    group: 'blocks',
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },

  // Alignment group
  {
    id: 'align-left',
    title: 'Align Left',
    shortcut: `${modKey}+Shift+L`,
    group: 'alignment',
    action: (editor) => editor.chain().focus().setTextAlign('left').run(),
  },
  {
    id: 'align-center',
    title: 'Align Center',
    shortcut: `${modKey}+Shift+E`,
    group: 'alignment',
    action: (editor) => editor.chain().focus().setTextAlign('center').run(),
  },
  {
    id: 'align-right',
    title: 'Align Right',
    shortcut: `${modKey}+Shift+R`,
    group: 'alignment',
    action: (editor) => editor.chain().focus().setTextAlign('right').run(),
  },
  {
    id: 'align-justify',
    title: 'Justify',
    shortcut: `${modKey}+Shift+J`,
    group: 'alignment',
    action: (editor) => editor.chain().focus().setTextAlign('justify').run(),
  },

  // Insert group
  {
    id: 'insert-2-columns',
    title: 'Insert 2 Columns',
    group: 'insert',
    action: (editor) => editor.chain().focus().insertColumns({ count: 2 }).run(),
  },
  {
    id: 'insert-3-columns',
    title: 'Insert 3 Columns',
    group: 'insert',
    action: (editor) => editor.chain().focus().insertColumns({ count: 3 }).run(),
  },
  {
    id: 'insert-4-columns',
    title: 'Insert 4 Columns',
    group: 'insert',
    action: (editor) => editor.chain().focus().insertColumns({ count: 4 }).run(),
  },
  {
    id: 'insert-table',
    title: 'Insert Table',
    group: 'insert',
    action: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run(),
  },
  {
    id: 'add-comment',
    title: 'Add Comment',
    group: 'insert',
    action: (editor: Editor) => {
      // Get the stored selection (captured when command palette opened)
      const storedSelection = useEditorStore.getState().storedSelection

      // Validate we have a selection
      if (!storedSelection || storedSelection.from === storedSelection.to) {
        // No selection - just open panel
        useCommentStore.getState().setPanelOpen(true)
        return
      }

      const { from, to } = storedSelection
      const commentId = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      // Add placeholder comment to store (user will edit in panel)
      useCommentStore.getState().addComment({
        id: commentId,
        text: '', // Empty - user types in panel
        createdAt: Date.now(),
        resolvedAt: null,
        from,
        to,
      })

      // Use setTimeout to let the command palette close first
      setTimeout(() => {
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .setComment({ id: commentId })
          .run()

        // Open panel and set this comment as active
        useCommentStore.getState().setActiveComment(commentId)
        useCommentStore.getState().setPanelOpen(true)

        // Clear stored selection
        useEditorStore.getState().setStoredSelection(null)
      }, 50)
    },
  },
  {
    id: 'insert-horizontal-rule',
    title: 'Horizontal Rule',
    group: 'insert',
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: 'insert-link',
    title: 'Insert Link',
    shortcut: `${modKey}+K`,
    group: 'insert',
    action: (editor) => {
      const url = window.prompt('Enter URL:')
      if (url) {
        editor.chain().focus().setLink({ href: url }).run()
      }
    },
  },
  {
    id: 'remove-link',
    title: 'Remove Link',
    group: 'insert',
    action: (editor) => editor.chain().focus().unsetLink().run(),
  },

  // View group
  {
    id: 'toggle-dark-mode',
    title: 'Toggle Dark Mode',
    group: 'view',
    action: () => {
      const root = document.documentElement
      const currentTheme = root.dataset.theme
      root.dataset.theme = currentTheme === 'dark' ? 'light' : 'dark'
    },
  },
  {
    id: 'focus-mode',
    title: 'Focus Mode',
    group: 'view',
    action: () => {
      // Placeholder for focus mode - will be implemented later
      console.log('Focus mode not yet implemented')
    },
  },
  {
    id: 'show-outline',
    title: 'Show Document Outline',
    shortcut: `${modKey}+Shift+O`,
    group: 'view',
    action: () => {
      // This will be handled by CommandPalette via onShowOutline callback
    },
  },
  {
    id: 'toggle-comment-tooltips',
    title: 'Toggle Comment Tooltips',
    group: 'view',
    action: () => {
      const store = useCommentStore.getState()
      store.setShowTooltips(!store.showTooltips)
    },
  },
  {
    id: 'open-comments-panel',
    title: 'Open Comments Panel',
    group: 'view',
    action: () => {
      useCommentStore.getState().setPanelOpen(true)
    },
  },
  {
    id: 'open-version-history',
    title: 'Open Version History',
    group: 'view',
    action: () => {
      // This will be handled by CommandPalette via onShowVersionHistory callback
    },
  },

  // File group - Export commands
  {
    id: 'export-html',
    title: 'Export to HTML',
    group: 'file',
    action: (editor: Editor) => {
      const documentName = useEditorStore.getState().document.name
      exportToHTML(editor, documentName)
    },
  },
  {
    id: 'export-markdown',
    title: 'Export to Markdown',
    group: 'file',
    action: (editor: Editor) => {
      const documentName = useEditorStore.getState().document.name
      exportToMarkdown(editor, documentName)
    },
  },
  {
    id: 'export-pdf',
    title: 'Export to PDF',
    group: 'file',
    action: (editor: Editor) => {
      const documentName = useEditorStore.getState().document.name
      exportToPDF(editor, documentName)
    },
  },
  {
    id: 'export-epub',
    title: 'Export to EPUB',
    group: 'file',
    action: (editor: Editor) => {
      const documentName = useEditorStore.getState().document.name
      exportToEPUB(editor, documentName)
    },
  },

  // Import commands
  {
    id: 'import-word',
    title: 'Import Word Document (.docx)',
    group: 'file',
    action: (editor: Editor) => {
      importWordDocument(editor)
    },
  },
  {
    id: 'import-markdown',
    title: 'Import Markdown File',
    group: 'file',
    action: (editor: Editor) => {
      importMarkdownFile(editor)
    },
  },
  {
    id: 'import-text',
    title: 'Import Plain Text',
    group: 'file',
    action: (editor: Editor) => {
      importTextFile(editor)
    },
  },
  {
    id: 'import-epub',
    title: 'Import EPUB',
    group: 'file',
    action: (editor: Editor) => {
      importEPUBFile(editor)
    },
  },
]

/**
 * Get commands grouped by category
 */
export function getGroupedCommands(): Record<CommandGroup, CommandItem[]> {
  const grouped: Record<CommandGroup, CommandItem[]> = {
    format: [],
    headings: [],
    blocks: [],
    alignment: [],
    insert: [],
    file: [],
    view: [],
  }

  for (const command of commands) {
    grouped[command.group].push(command)
  }

  return grouped
}

/**
 * Group display names
 */
export const groupLabels: Record<CommandGroup, string> = {
  format: 'Format',
  headings: 'Headings',
  blocks: 'Blocks',
  alignment: 'Alignment',
  insert: 'Insert',
  file: 'File',
  view: 'View',
}
