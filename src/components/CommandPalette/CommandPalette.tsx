/**
 * Command Palette - Quick command access via Cmd+P
 *
 * Features:
 * - Fuzzy search across all commands
 * - Keyboard navigation (arrows, enter, escape)
 * - Shows keyboard shortcuts
 * - Grouped by category
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { commandRegistry, type CommandDefinition } from '@/lib/command-registry'
import './CommandPalette.css'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get filtered commands
  const commands = useMemo(() => {
    if (!query.trim()) {
      // Show all commands grouped by category when no query
      return commandRegistry.getAll().sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category)
        }
        return a.name.localeCompare(b.name)
      })
    }
    return commandRegistry.search(query)
  }, [query])

  // Reset selection when commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [commands])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && commands.length > 0) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, commands.length])

  const executeCommand = useCallback((command: CommandDefinition) => {
    onClose()
    // Small delay to let palette close before executing
    setTimeout(() => {
      commandRegistry.execute(command.id)
    }, 50)
  }, [onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, commands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (commands[selectedIndex]) {
          executeCommand(commands[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [commands, selectedIndex, executeCommand, onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  // Group commands by category for display
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, CommandDefinition[]>()
    commands.forEach((cmd) => {
      const group = groups.get(cmd.category) || []
      group.push(cmd)
      groups.set(cmd.category, group)
    })
    return groups
  }, [commands])

  // Flatten for index tracking
  let flatIndex = 0

  return (
    <div className="command-palette-backdrop" onClick={handleBackdropClick}>
      <div className="command-palette">
        <div className="command-palette-input-container">
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="command-palette-shortcut-hint">esc</kbd>
        </div>

        <div className="command-palette-list" ref={listRef}>
          {commands.length === 0 ? (
            <div className="command-palette-empty">No commands found</div>
          ) : (
            Array.from(groupedCommands.entries()).map(([category, cmds]) => (
              <div key={category} className="command-palette-group">
                <div className="command-palette-category">{category}</div>
                {cmds.map((cmd) => {
                  const index = flatIndex++
                  const isSelected = index === selectedIndex
                  const canExecute = !cmd.canExecute || commandRegistry.canExecute(cmd.id)

                  return (
                    <div
                      key={cmd.id}
                      data-index={index}
                      className={`command-palette-item ${isSelected ? 'selected' : ''} ${!canExecute ? 'disabled' : ''}`}
                      onClick={() => canExecute && executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="command-palette-item-content">
                        <span className="command-palette-item-name">{cmd.name}</span>
                        <span className="command-palette-item-description">{cmd.description}</span>
                      </div>
                      {cmd.shortcut && (
                        <kbd className="command-palette-item-shortcut">
                          {formatShortcut(cmd.shortcut)}
                        </kbd>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Format shortcut for display (Cmd+B -> ⌘B)
 */
function formatShortcut(shortcut: string): string {
  return shortcut
    .replace(/Cmd\+/g, '⌘')
    .replace(/Ctrl\+/g, '⌃')
    .replace(/Alt\+/g, '⌥')
    .replace(/Shift\+/g, '⇧')
    .replace(/\+/g, '')
}

export default CommandPalette
