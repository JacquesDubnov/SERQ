import type { Editor, Range } from '@tiptap/core'
import { fileToBase64, isImageFile, isLargeImage, formatFileSize } from '../../lib/imageUtils'
import { useCommentStore } from '../../stores/commentStore'

/**
 * Detect if running on Mac for keyboard shortcut display
 */
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const modKey = isMac ? '⌘' : 'Ctrl'

/**
 * Slash command item interface
 */
export interface SlashCommandItem {
  title: string
  description: string
  icon?: string
  shortcut?: string
  group: SlashCommandGroup
  aliases: string[]
  command: (props: { editor: Editor; range: Range }) => void
}

export type SlashCommandGroup =
  | 'format'
  | 'headings'
  | 'blocks'
  | 'alignment'
  | 'insert'
  | 'view'

/**
 * Group display names
 */
export const slashCommandGroupLabels: Record<SlashCommandGroup, string> = {
  format: 'Format',
  headings: 'Headings',
  blocks: 'Blocks',
  alignment: 'Alignment',
  insert: 'Insert',
  view: 'View',
}

/**
 * All available slash commands
 */
export const slashCommands: SlashCommandItem[] = [
  // === FORMAT GROUP ===
  {
    title: 'Bold',
    description: 'Make text bold',
    icon: 'B',
    shortcut: `${modKey}+B`,
    group: 'format',
    aliases: ['bold', 'strong', 'b'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBold().run()
    },
  },
  {
    title: 'Italic',
    description: 'Make text italic',
    icon: 'I',
    shortcut: `${modKey}+I`,
    group: 'format',
    aliases: ['italic', 'em', 'i'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleItalic().run()
    },
  },
  {
    title: 'Underline',
    description: 'Underline text',
    icon: 'U',
    shortcut: `${modKey}+U`,
    group: 'format',
    aliases: ['underline', 'u'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleUnderline().run()
    },
  },
  {
    title: 'Strikethrough',
    description: 'Strike through text',
    icon: 'S',
    shortcut: `${modKey}+⇧+X`,
    group: 'format',
    aliases: ['strikethrough', 'strike', 's'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleStrike().run()
    },
  },
  {
    title: 'Inline Code',
    description: 'Inline code formatting',
    icon: '`',
    shortcut: `${modKey}+E`,
    group: 'format',
    aliases: ['code', 'inline', 'mono'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCode().run()
    },
  },
  {
    title: 'Highlight',
    description: 'Highlight text',
    icon: 'HL',
    shortcut: `${modKey}+⇧+H`,
    group: 'format',
    aliases: ['highlight', 'mark', 'hl'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHighlight().run()
    },
  },
  {
    title: 'Subscript',
    description: 'Subscript text',
    icon: 'x₂',
    group: 'format',
    aliases: ['subscript', 'sub'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleSubscript().run()
    },
  },
  {
    title: 'Superscript',
    description: 'Superscript text',
    icon: 'x²',
    group: 'format',
    aliases: ['superscript', 'sup'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleSuperscript().run()
    },
  },
  {
    title: 'Clear Formatting',
    description: 'Remove all formatting',
    icon: 'Tx',
    shortcut: `${modKey}+\\`,
    group: 'format',
    aliases: ['clear', 'plain', 'reset'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).unsetAllMarks().run()
    },
  },

  // === HEADINGS GROUP ===
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    shortcut: `${modKey}+⌥+1`,
    group: 'headings',
    aliases: ['h1', 'heading1', '#'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    shortcut: `${modKey}+⌥+2`,
    group: 'headings',
    aliases: ['h2', 'heading2', '##'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    shortcut: `${modKey}+⌥+3`,
    group: 'headings',
    aliases: ['h3', 'heading3', '###'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
    },
  },
  {
    title: 'Heading 4',
    description: 'Fourth level heading',
    icon: 'H4',
    shortcut: `${modKey}+⌥+4`,
    group: 'headings',
    aliases: ['h4', 'heading4', '####'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 4 }).run()
    },
  },
  {
    title: 'Heading 5',
    description: 'Fifth level heading',
    icon: 'H5',
    shortcut: `${modKey}+⌥+5`,
    group: 'headings',
    aliases: ['h5', 'heading5', '#####'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 5 }).run()
    },
  },
  {
    title: 'Heading 6',
    description: 'Sixth level heading',
    icon: 'H6',
    shortcut: `${modKey}+⌥+6`,
    group: 'headings',
    aliases: ['h6', 'heading6', '######'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 6 }).run()
    },
  },

  // === BLOCKS GROUP ===
  {
    title: 'Paragraph',
    description: 'Plain text paragraph',
    icon: 'P',
    shortcut: `${modKey}+⌥+0`,
    group: 'blocks',
    aliases: ['paragraph', 'text', 'p'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('paragraph').run()
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list with bullets',
    icon: '•',
    shortcut: `${modKey}+⇧+8`,
    group: 'blocks',
    aliases: ['bullet', 'ul', 'unordered', 'list'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list with numbers',
    icon: '1.',
    shortcut: `${modKey}+⇧+7`,
    group: 'blocks',
    aliases: ['numbered', 'ol', 'ordered', 'number'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'Blockquote',
    description: 'Quote or callout block',
    icon: '"',
    shortcut: `${modKey}+⇧+B`,
    group: 'blocks',
    aliases: ['quote', 'blockquote', '>'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Code Block',
    description: 'Code with syntax highlighting',
    icon: '</>',
    shortcut: `${modKey}+⌥+C`,
    group: 'blocks',
    aliases: ['codeblock', 'pre', '```'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: 'Callout',
    description: 'Highlighted callout block',
    icon: '!',
    group: 'blocks',
    aliases: ['callout', 'admonition', 'alert'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertCallout({ color: 'blue' }).run()
    },
  },

  // === ALIGNMENT GROUP ===
  {
    title: 'Align Left',
    description: 'Align text to the left',
    icon: '⫿',
    shortcut: `${modKey}+⇧+L`,
    group: 'alignment',
    aliases: ['left', 'alignleft'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('left').run()
    },
  },
  {
    title: 'Align Center',
    description: 'Center align text',
    icon: '⫾',
    shortcut: `${modKey}+⇧+E`,
    group: 'alignment',
    aliases: ['center', 'aligncenter'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('center').run()
    },
  },
  {
    title: 'Align Right',
    description: 'Align text to the right',
    icon: '⫾',
    shortcut: `${modKey}+⇧+R`,
    group: 'alignment',
    aliases: ['right', 'alignright'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('right').run()
    },
  },
  {
    title: 'Justify',
    description: 'Justify text alignment',
    icon: '⫾',
    shortcut: `${modKey}+⇧+J`,
    group: 'alignment',
    aliases: ['justify', 'alignjustify'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('justify').run()
    },
  },

  // === INSERT GROUP ===
  {
    title: '2 Columns',
    description: 'Two-column layout',
    icon: '||',
    group: 'insert',
    aliases: ['2col', 'columns', 'twocol', 'col2', '2columns'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertColumns({ count: 2 }).run()
    },
  },
  {
    title: '3 Columns',
    description: 'Three-column layout',
    icon: '|||',
    group: 'insert',
    aliases: ['3col', 'threecol', 'col3', '3columns'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertColumns({ count: 3 }).run()
    },
  },
  {
    title: '4 Columns',
    description: 'Four-column layout',
    icon: '||||',
    group: 'insert',
    aliases: ['4col', 'fourcol', 'col4', '4columns'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertColumns({ count: 4 }).run()
    },
  },
  {
    title: 'Table',
    description: 'Insert a table',
    icon: '#',
    group: 'insert',
    aliases: ['table', 'grid'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
        .run()
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal line separator',
    icon: '—',
    group: 'insert',
    aliases: ['divider', 'hr', 'rule', 'line', '---'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: 'Image',
    description: 'Insert an image from file',
    icon: 'IMG',
    group: 'insert',
    aliases: ['image', 'img', 'picture', 'photo'],
    command: ({ editor, range }) => {
      // Create file input and trigger click
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'

      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file || !isImageFile(file)) return

        // Warn for large files
        if (isLargeImage(file)) {
          const proceed = window.confirm(
            `This image is ${formatFileSize(file.size)}. Large images may slow down the document. Continue?`
          )
          if (!proceed) return
        }

        try {
          const dataUrl = await fileToBase64(file)

          // Delete the slash command range and insert image
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setImage({ src: dataUrl })
            .run()
        } catch (error) {
          console.error('Failed to insert image:', error)
        }
      }

      input.click()
    },
  },
  {
    title: 'Link',
    description: 'Insert a hyperlink',
    icon: '↗',
    shortcut: `${modKey}+K`,
    group: 'insert',
    aliases: ['link', 'url', 'href'],
    command: ({ editor, range }) => {
      const url = window.prompt('Enter URL:')
      if (url) {
        editor.chain().focus().deleteRange(range).setLink({ href: url }).run()
      }
    },
  },
  {
    title: 'Insert Comment',
    description: 'Insert COMMENT marker with local note',
    icon: '/*',
    group: 'insert',
    aliases: ['comment', 'note', 'marker', 'todo'],
    command: ({ editor, range }) => {
      // Generate unique comment ID
      const commentId = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      // Calculate the position where COMMENT text will be inserted
      const insertPos = range.from

      // Delete the slash command range and insert:
      // 1. "COMMENT" with comment mark only (uses same styling as regular comments)
      // 2. Two spaces without any marks (so subsequent typing is plain)
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent([
          {
            type: 'text',
            text: 'COMMENT',
            marks: [
              { type: 'comment', attrs: { id: commentId } },
            ],
          },
          {
            type: 'text',
            text: '  ', // Two spaces without marks
          },
        ])
        .unsetMark('comment')
        .run()

      // Add comment to store
      useCommentStore.getState().addComment({
        id: commentId,
        text: '', // Empty - user can edit in panel
        createdAt: Date.now(),
        resolvedAt: null,
        from: insertPos,
        to: insertPos + 7, // "COMMENT" is 7 characters
      })

      // Open panel and set as active so user can add note
      useCommentStore.getState().setActiveComment(commentId)
      useCommentStore.getState().setPanelOpen(true)
    },
  },

  // === VIEW GROUP ===
  {
    title: 'Toggle Dark Mode',
    description: 'Switch between light and dark themes',
    icon: '◐',
    group: 'view',
    aliases: ['dark', 'theme', 'mode', 'light'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      const root = document.documentElement
      const currentTheme = root.dataset.theme
      root.dataset.theme = currentTheme === 'dark' ? 'light' : 'dark'
    },
  },
]

/**
 * Filter slash commands based on query string
 * Only searches title and aliases, not description
 */
export function filterSlashCommands(query: string): SlashCommandItem[] {
  const lowerQuery = query.toLowerCase()

  return slashCommands.filter((item) => {
    // Match title
    if (item.title.toLowerCase().includes(lowerQuery)) return true

    // Match aliases
    if (item.aliases.some((alias) => alias.includes(lowerQuery))) return true

    return false
  })
}

/**
 * Get slash commands grouped by category
 */
export function getGroupedSlashCommands(): Record<SlashCommandGroup, SlashCommandItem[]> {
  const grouped: Record<SlashCommandGroup, SlashCommandItem[]> = {
    format: [],
    headings: [],
    blocks: [],
    alignment: [],
    insert: [],
    view: [],
  }

  for (const cmd of slashCommands) {
    grouped[cmd.group].push(cmd)
  }

  return grouped
}
