import { Command } from 'cmdk'
import type { Editor } from '@tiptap/core'
import { commands, getGroupedCommands, groupLabels, type CommandGroup } from './commands'
import '../../styles/command-palette.css'

interface CommandPaletteProps {
  editor: Editor | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Command palette component using cmdk
 * Opens with Cmd+K or Cmd+P, filters commands as you type
 */
export function CommandPalette({ editor, isOpen, onOpenChange }: CommandPaletteProps) {
  const groupedCommands = getGroupedCommands()

  const handleSelect = (commandId: string) => {
    if (!editor) return

    const command = commands.find((c) => c.id === commandId)
    if (command) {
      command.action(editor)
      onOpenChange(false)
    }
  }

  // Close and refocus editor
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open && editor) {
      // Return focus to editor when closing
      setTimeout(() => editor.commands.focus(), 0)
    }
  }

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

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      label="Command palette"
      className="command-palette"
    >
      <Command.Input placeholder="Type a command or search..." className="command-input" />
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
                  value={`${command.title} ${command.id}`}
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
    </Command.Dialog>
  )
}
