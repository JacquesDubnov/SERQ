import type { Editor, Range } from '@tiptap/core'

/**
 * Slash command item interface
 */
export interface SlashCommandItem {
  title: string
  description: string
  icon?: string
  aliases: string[]
  command: (props: { editor: Editor; range: Range }) => void
}

/**
 * All available slash commands for block insertion
 */
export const slashCommands: SlashCommandItem[] = [
  // Headings
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    aliases: ['h1', 'heading1', '#'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    aliases: ['h2', 'heading2', '##'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    aliases: ['h3', 'heading3', '###'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
    },
  },

  // Text
  {
    title: 'Paragraph',
    description: 'Plain text paragraph',
    icon: 'P',
    aliases: ['paragraph', 'text', 'p'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('paragraph').run()
    },
  },

  // Lists
  {
    title: 'Bullet List',
    description: 'Unordered list with bullets',
    icon: '•',
    aliases: ['bullet', 'ul', 'unordered', 'list'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list with numbers',
    icon: '1.',
    aliases: ['numbered', 'ol', 'ordered', 'number'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },

  // Blocks
  {
    title: 'Blockquote',
    description: 'Quote or callout block',
    icon: '"',
    aliases: ['quote', 'blockquote', '>'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Code Block',
    description: 'Code with syntax highlighting',
    icon: '</>',
    aliases: ['code', 'codeblock', '```'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },

  // Media/Insert
  {
    title: 'Table',
    description: 'Insert a table',
    icon: '⊞',
    aliases: ['table', 'grid'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal line separator',
    icon: '—',
    aliases: ['divider', 'hr', 'rule', 'line', '---'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: 'Callout',
    description: 'Highlighted callout block',
    icon: '!',
    aliases: ['callout', 'admonition', 'note', 'alert'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertCallout({ color: 'blue' }).run()
    },
  },
]

/**
 * Filter slash commands based on query string
 */
export function filterSlashCommands(query: string): SlashCommandItem[] {
  const lowerQuery = query.toLowerCase()

  return slashCommands.filter((item) => {
    // Match title
    if (item.title.toLowerCase().includes(lowerQuery)) return true

    // Match description
    if (item.description.toLowerCase().includes(lowerQuery)) return true

    // Match aliases
    if (item.aliases.some((alias) => alias.includes(lowerQuery))) return true

    return false
  })
}
