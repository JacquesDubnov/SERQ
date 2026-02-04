/**
 * App Initialization
 *
 * Initializes core systems on app startup:
 * - Database (SQLite)
 * - Command Registry (context provider)
 * - Style System (named styles from DB)
 */

import { database } from './database'
import { commandRegistry, type CommandContext } from './command-registry'
import { styleResolver } from './style-system'
import type { Editor } from '@tiptap/core'

// ============================================================================
// Initialization State
// ============================================================================

let initialized = false
let initPromise: Promise<void> | null = null

// Editor reference for command context
let currentEditor: Editor | null = null

/**
 * Set the current editor instance for command context
 */
export function setCurrentEditor(editor: Editor | null): void {
  currentEditor = editor
}

/**
 * Get current editor instance
 */
export function getCurrentEditor(): Editor | null {
  return currentEditor
}

// ============================================================================
// Command Context Provider
// ============================================================================

function buildCommandContext(): CommandContext {
  const editor = currentEditor

  let selection = null
  let activeBlockType = null
  let activeBlockId = null

  if (editor) {
    const { from, to, empty } = editor.state.selection
    selection = { from, to, empty }

    // Get block type at cursor
    const $from = editor.state.selection.$from
    for (let d = $from.depth; d >= 0; d--) {
      const node = $from.node(d)
      if (node.isBlock && node.type.name !== 'doc') {
        activeBlockType = node.type.name
        activeBlockId = node.attrs.id || null
        break
      }
    }
  }

  return {
    editor,
    selection,
    activeBlockType,
    activeBlockId,
    documentId: null, // TODO: Get from document store
  }
}

// ============================================================================
// Core Formatting Commands
// ============================================================================

function registerCoreCommands(): void {
  // Formatting commands
  commandRegistry.registerMany([
    {
      id: 'formatting.bold',
      name: 'Bold',
      description: 'Make text bold',
      category: 'formatting',
      shortcut: 'Cmd+B',
      icon: 'bold',
      keywords: ['strong', 'weight'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleBold().run()
      },
      isActive: (ctx) => ctx.editor?.isActive('bold') ?? false,
      canExecute: (ctx) => ctx.editor?.can().toggleBold() ?? false,
    },
    {
      id: 'formatting.italic',
      name: 'Italic',
      description: 'Make text italic',
      category: 'formatting',
      shortcut: 'Cmd+I',
      icon: 'italic',
      keywords: ['emphasis', 'slant'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleItalic().run()
      },
      isActive: (ctx) => ctx.editor?.isActive('italic') ?? false,
      canExecute: (ctx) => ctx.editor?.can().toggleItalic() ?? false,
    },
    {
      id: 'formatting.underline',
      name: 'Underline',
      description: 'Underline text',
      category: 'formatting',
      shortcut: 'Cmd+U',
      icon: 'underline',
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleUnderline().run()
      },
      isActive: (ctx) => ctx.editor?.isActive('underline') ?? false,
      canExecute: (ctx) => ctx.editor?.can().toggleUnderline() ?? false,
    },
    {
      id: 'formatting.strikethrough',
      name: 'Strikethrough',
      description: 'Strike through text',
      category: 'formatting',
      shortcut: 'Cmd+Shift+X',
      icon: 'strikethrough',
      keywords: ['strike', 'cross out'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleStrike().run()
      },
      isActive: (ctx) => ctx.editor?.isActive('strike') ?? false,
      canExecute: (ctx) => ctx.editor?.can().toggleStrike() ?? false,
    },
    {
      id: 'formatting.code',
      name: 'Inline Code',
      description: 'Format as inline code',
      category: 'formatting',
      shortcut: 'Cmd+E',
      icon: 'code',
      keywords: ['monospace', 'technical'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleCode().run()
      },
      isActive: (ctx) => ctx.editor?.isActive('code') ?? false,
      canExecute: (ctx) => ctx.editor?.can().toggleCode() ?? false,
    },

    // Block commands
    {
      id: 'block.paragraph',
      name: 'Paragraph',
      description: 'Convert to paragraph',
      category: 'block',
      shortcut: 'Cmd+Alt+0',
      icon: 'paragraph',
      execute: (ctx) => {
        ctx.editor?.chain().focus().setParagraph().run()
      },
      isActive: (ctx) => ctx.editor?.isActive('paragraph') ?? false,
    },
    {
      id: 'block.heading1',
      name: 'Heading 1',
      description: 'Convert to heading 1',
      category: 'block',
      shortcut: 'Cmd+Alt+1',
      icon: 'heading1',
      keywords: ['h1', 'title'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleHeading({ level: 1 }).run()
      },
      isActive: (ctx) => ctx.editor?.isActive('heading', { level: 1 }) ?? false,
    },
    {
      id: 'block.heading2',
      name: 'Heading 2',
      description: 'Convert to heading 2',
      category: 'block',
      shortcut: 'Cmd+Alt+2',
      icon: 'heading2',
      keywords: ['h2', 'section'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleHeading({ level: 2 }).run()
      },
      isActive: (ctx) => ctx.editor?.isActive('heading', { level: 2 }) ?? false,
    },
    {
      id: 'block.heading3',
      name: 'Heading 3',
      description: 'Convert to heading 3',
      category: 'block',
      shortcut: 'Cmd+Alt+3',
      icon: 'heading3',
      keywords: ['h3', 'subsection'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleHeading({ level: 3 }).run()
      },
      isActive: (ctx) => ctx.editor?.isActive('heading', { level: 3 }) ?? false,
    },
    {
      id: 'block.bulletList',
      name: 'Bullet List',
      description: 'Create bullet list',
      category: 'block',
      shortcut: 'Cmd+Shift+8',
      icon: 'list',
      keywords: ['ul', 'unordered'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleBulletList().run()
      },
      isActive: (ctx) => ctx.editor?.isActive('bulletList') ?? false,
    },
    {
      id: 'block.orderedList',
      name: 'Numbered List',
      description: 'Create numbered list',
      category: 'block',
      shortcut: 'Cmd+Shift+7',
      icon: 'listOrdered',
      keywords: ['ol', 'ordered', 'numbers'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleOrderedList().run()
      },
      isActive: (ctx) => ctx.editor?.isActive('orderedList') ?? false,
    },
    {
      id: 'block.blockquote',
      name: 'Quote',
      description: 'Create blockquote',
      category: 'block',
      shortcut: 'Cmd+Shift+B',
      icon: 'quote',
      keywords: ['citation', 'pullquote'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleBlockquote().run()
      },
      isActive: (ctx) => ctx.editor?.isActive('blockquote') ?? false,
    },
    {
      id: 'block.codeBlock',
      name: 'Code Block',
      description: 'Create code block',
      category: 'block',
      shortcut: 'Cmd+Alt+C',
      icon: 'codeBlock',
      keywords: ['pre', 'technical'],
      execute: (ctx) => {
        ctx.editor?.chain().focus().toggleCodeBlock().run()
      },
      isActive: (ctx) => ctx.editor?.isActive('codeBlock') ?? false,
    },

    // Edit commands
    {
      id: 'edit.undo',
      name: 'Undo',
      description: 'Undo last action',
      category: 'edit',
      shortcut: 'Cmd+Z',
      icon: 'undo',
      execute: (ctx) => {
        ctx.editor?.chain().focus().undo().run()
      },
      canExecute: (ctx) => ctx.editor?.can().undo() ?? false,
    },
    {
      id: 'edit.redo',
      name: 'Redo',
      description: 'Redo last undone action',
      category: 'edit',
      shortcut: 'Cmd+Shift+Z',
      icon: 'redo',
      execute: (ctx) => {
        ctx.editor?.chain().focus().redo().run()
      },
      canExecute: (ctx) => ctx.editor?.can().redo() ?? false,
    },

    // Alignment commands
    {
      id: 'formatting.alignLeft',
      name: 'Align Left',
      description: 'Align text to the left',
      category: 'formatting',
      shortcut: 'Cmd+Shift+L',
      icon: 'alignLeft',
      execute: (ctx) => {
        ctx.editor?.chain().focus().setTextAlign('left').run()
      },
      isActive: (ctx) => ctx.editor?.isActive({ textAlign: 'left' }) ?? false,
    },
    {
      id: 'formatting.alignCenter',
      name: 'Align Center',
      description: 'Center text',
      category: 'formatting',
      shortcut: 'Cmd+Shift+E',
      icon: 'alignCenter',
      execute: (ctx) => {
        ctx.editor?.chain().focus().setTextAlign('center').run()
      },
      isActive: (ctx) => ctx.editor?.isActive({ textAlign: 'center' }) ?? false,
    },
    {
      id: 'formatting.alignRight',
      name: 'Align Right',
      description: 'Align text to the right',
      category: 'formatting',
      shortcut: 'Cmd+Shift+R',
      icon: 'alignRight',
      execute: (ctx) => {
        ctx.editor?.chain().focus().setTextAlign('right').run()
      },
      isActive: (ctx) => ctx.editor?.isActive({ textAlign: 'right' }) ?? false,
    },
    {
      id: 'formatting.alignJustify',
      name: 'Justify',
      description: 'Justify text',
      category: 'formatting',
      shortcut: 'Cmd+Shift+J',
      icon: 'alignJustify',
      execute: (ctx) => {
        ctx.editor?.chain().focus().setTextAlign('justify').run()
      },
      isActive: (ctx) => ctx.editor?.isActive({ textAlign: 'justify' }) ?? false,
    },
  ])
}

// ============================================================================
// Load Named Styles from Database
// ============================================================================

async function loadNamedStyles(): Promise<void> {
  try {
    const styles = await database.select<{
      id: string
      name: string
      scope: string
      scope_id: string | null
      based_on: string | null
      applies_to: string
      definition: string
      category: string | null
      sort_order: number
      is_builtin: number
    }>('SELECT * FROM styles ORDER BY sort_order')

    for (const row of styles) {
      styleResolver.registerStyle({
        id: row.id,
        name: row.name,
        scope: row.scope as 'project' | 'document',
        basedOn: row.based_on,
        appliesTo: JSON.parse(row.applies_to || '["*"]'),
        properties: JSON.parse(row.definition || '{}'),
        category: row.category || 'Custom',
        sortOrder: row.sort_order,
        isBuiltIn: row.is_builtin === 1,
      })
    }

    console.log(`[AppInit] Loaded ${styles.length} named styles`)
  } catch (error) {
    console.warn('[AppInit] Failed to load named styles:', error)
  }
}

// ============================================================================
// Main Initialization
// ============================================================================

/**
 * Initialize all app systems
 * Safe to call multiple times - will only run once
 */
export async function initializeApp(): Promise<void> {
  if (initialized) {
    console.log('[AppInit] Already initialized')
    return
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    console.log('[AppInit] Starting initialization...')

    try {
      // 1. Initialize database
      console.log('[AppInit] Initializing database...')
      await database.initialize()

      // 2. Set up command registry context provider
      console.log('[AppInit] Setting up command registry...')
      commandRegistry.setContextProvider(buildCommandContext)

      // 3. Register core commands
      console.log('[AppInit] Registering core commands...')
      registerCoreCommands()

      // 4. Load named styles from database
      console.log('[AppInit] Loading named styles...')
      await loadNamedStyles()

      initialized = true
      console.log('[AppInit] Initialization complete')
    } catch (error) {
      console.error('[AppInit] Initialization failed:', error)
      throw error
    }
  })()

  return initPromise
}

/**
 * Check if app is initialized
 */
export function isAppInitialized(): boolean {
  return initialized
}

// ============================================================================
// React Hook
// ============================================================================

import { useState, useEffect } from 'react'

/**
 * React hook for app initialization
 * Returns loading state and any error
 */
export function useAppInit(): { loading: boolean; error: Error | null } {
  const [loading, setLoading] = useState(!initialized)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (initialized) {
      setLoading(false)
      return
    }

    initializeApp()
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }, [])

  return { loading, error }
}
