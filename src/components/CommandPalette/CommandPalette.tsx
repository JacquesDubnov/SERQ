import { useCallback, useEffect, useRef } from 'react'
import { Command } from 'cmdk'
import type { Editor } from '@tiptap/core'
import { commands, getGroupedCommands, groupLabels, type CommandGroup } from './commands'
import '../../styles/command-palette.css'

interface CommandPaletteProps {
  editor: Editor | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onShowOutline?: () => void
}

/**
 * Custom filter for stricter matching
 * Requires search term to match beginning of words in value
 */
function commandFilter(value: string, search: string): number {
  const searchLower = search.toLowerCase().trim()
  const valueLower = value.toLowerCase()

  // Exact match at start
  if (valueLower.startsWith(searchLower)) return 1

  // Match at start of any word
  const words = valueLower.split(/\s+/)
  for (const word of words) {
    if (word.startsWith(searchLower)) return 0.8
  }

  // Contains as substring (lower priority)
  if (valueLower.includes(searchLower)) return 0.3

  return 0
}

/**
 * Command palette component using cmdk
 * Opens with Cmd+K or Cmd+P, filters commands as you type
 * Closes on Escape or clicking outside
 */
export function CommandPalette({ editor, isOpen, onOpenChange, onShowOutline }: CommandPaletteProps) {
  const groupedCommands = getGroupedCommands()
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleSelect = (commandId: string) => {
    if (!editor) return

    // Handle show-outline specially
    if (commandId === 'show-outline') {
      onShowOutline?.()
      onOpenChange(false)
      return
    }

    // Find and execute the command
    const command = commands.find((c) => c.id === commandId)
    if (command) {
      command.action(editor)
      onOpenChange(false)
    }
  }

  // Close and refocus editor
  const handleClose = useCallback(() => {
    onOpenChange(false)
    if (editor) {
      setTimeout(() => editor.commands.focus(), 0)
    }
  }, [onOpenChange, editor])

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click is on the backdrop (the [cmdk-dialog] element itself, not its children)
      if (target.hasAttribute('cmdk-dialog') || target.classList.contains('command-palette-backdrop')) {
        handleClose()
      }
    }

    // Slight delay to prevent immediate close on open
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, handleClose])

  // Order of groups to display
  const groupOrder: CommandGroup[] = [
    'format',
    'headings',
    'blocks',
    'alignment',
    'insert',
    'file',
    'view',
  ]

  if (!isOpen) return null

  return (
    <div
      className="command-palette-backdrop"
      onClick={(e) => {
        // Close if clicking the backdrop directly
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <Command
        ref={dialogRef}
        label="Command palette"
        className="command-palette"
        filter={commandFilter}
      >
        <Command.Input placeholder="Type a command or search..." className="command-input" autoFocus />
        <Command.List className="command-list">
          <Command.Empty className="command-empty">No results found.</Command.Empty>

          {groupOrder.map((group) => {
            const items = groupedCommands[group]
            if (items.length === 0) return null

            return (
              <Command.Group key={group} heading={groupLabels[group]} className="command-group">
                {items.map((command) => (
                  <Command.Item
                    key={command.id}
                    value={command.title}
                    onSelect={() => handleSelect(command.id)}
                    className="command-item"
                  >
                    <span className="command-title">{command.title}</span>
                    {command.shortcut && <kbd className="command-shortcut">{command.shortcut}</kbd>}
                  </Command.Item>
                ))}
              </Command.Group>
            )
          })}
        </Command.List>
      </Command>
    </div>
  )
}
