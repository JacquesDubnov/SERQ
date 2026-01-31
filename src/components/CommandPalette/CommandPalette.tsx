import { useMemo } from 'react'
import { Command } from 'cmdk'
import type { Editor } from '@tiptap/core'
import { useEditorStore } from '../../stores/editorStore'
import { commands, getGroupedCommands, groupLabels, type CommandGroup, type CommandItem } from './commands'
import '../../styles/command-palette.css'

interface CommandPaletteProps {
  editor: Editor | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onShowOutline?: () => void
}

/**
 * Command palette component using cmdk
 * Opens with Cmd+K or Cmd+P, filters commands as you type
 * Includes dynamic "Jump to" commands from document headings
 */
export function CommandPalette({ editor, isOpen, onOpenChange, onShowOutline }: CommandPaletteProps) {
  const groupedCommands = getGroupedCommands()
  const outlineAnchors = useEditorStore((state) => state.outlineAnchors)

  // Generate dynamic "Jump to" commands from document headings
  const jumpToCommands: CommandItem[] = useMemo(() => {
    return outlineAnchors.map((anchor) => ({
      id: `jump-to-${anchor.id}`,
      title: `H${anchor.level}: ${anchor.textContent || 'Untitled'}`,
      group: 'jump-to' as CommandGroup,
      action: (ed: Editor) => {
        ed.chain().focus().setTextSelection(anchor.pos).run()
        const headingNode = ed.view.nodeDOM(anchor.pos)
        if (headingNode instanceof HTMLElement) {
          headingNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      },
    }))
  }, [outlineAnchors])

  // Merge jump-to commands into grouped commands
  const allGroupedCommands = useMemo(() => {
    return {
      ...groupedCommands,
      'jump-to': jumpToCommands,
    }
  }, [groupedCommands, jumpToCommands])

  const handleSelect = (commandId: string) => {
    if (!editor) return

    // Handle show-outline specially
    if (commandId === 'show-outline') {
      onShowOutline?.()
      onOpenChange(false)
      return
    }

    // Check static commands first
    const command = commands.find((c) => c.id === commandId)
    if (command) {
      command.action(editor)
      onOpenChange(false)
      return
    }

    // Check dynamic jump-to commands
    const jumpCommand = jumpToCommands.find((c) => c.id === commandId)
    if (jumpCommand) {
      jumpCommand.action(editor)
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

  // Order of groups to display - jump-to at the top when headings exist
  const groupOrder: CommandGroup[] = useMemo(() => {
    const base: CommandGroup[] = [
      'format',
      'headings',
      'blocks',
      'alignment',
      'insert',
      'file',
      'view',
    ]
    // Add jump-to at the beginning if there are headings
    if (jumpToCommands.length > 0) {
      return ['jump-to', ...base]
    }
    return base
  }, [jumpToCommands.length])

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
          const items = allGroupedCommands[group]
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
