/**
 * Core Command Registration
 *
 * Registers all built-in commands (formatting, block, edit, alignment)
 * with the command registry on app startup.
 */

import { commandRegistry } from '../command-registry'

// ============================================================================
// Core Formatting Commands
// ============================================================================

export function registerCoreCommands(): void {
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
