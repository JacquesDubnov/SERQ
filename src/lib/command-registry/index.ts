/**
 * Command Registry - Central command pattern for all UI interactions
 *
 * All user actions (toolbar, shortcuts, context menu, command palette, gestures)
 * route through this registry. Benefits:
 * - Consistent undo/redo
 * - Keyboard shortcut management
 * - Command palette search
 * - Analytics/telemetry
 * - Extensibility (plugins can add commands)
 */

import type { Editor } from '@tiptap/core'

// ============================================================================
// Types
// ============================================================================

export type CommandCategory =
  | 'formatting'
  | 'block'
  | 'navigation'
  | 'file'
  | 'view'
  | 'style'
  | 'edit'
  | 'selection'
  | 'insert'

export interface CommandContext {
  editor: Editor | null
  selection: {
    from: number
    to: number
    empty: boolean
  } | null
  activeBlockType: string | null
  activeBlockId: string | null
  documentId: string | null
  params?: Record<string, unknown>
}

export interface CommandParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select'
  label: string
  required: boolean
  default?: unknown
  options?: Array<{ value: unknown; label: string }>
}

export interface CommandDefinition {
  /** Unique identifier, e.g., 'formatting.bold' */
  id: string

  /** Display name, e.g., 'Bold' */
  name: string

  /** Description for command palette */
  description: string

  /** Category for grouping */
  category: CommandCategory

  /** Execute the command */
  execute: (context: CommandContext) => void | Promise<void>

  /** Check if command is currently active (for toggle states) */
  isActive?: (context: CommandContext) => boolean

  /** Check if command can be executed */
  canExecute?: (context: CommandContext) => boolean

  /** Command parameters (for complex commands) */
  parameters?: CommandParameter[]

  /** Icon identifier */
  icon?: string

  /** Search keywords */
  keywords?: string[]

  /** Default keyboard shortcut */
  shortcut?: string

  /** Whether command is undoable */
  undoable?: boolean
}

export interface KeyboardShortcut {
  key: string
  modifiers: {
    meta?: boolean    // Command on Mac, Ctrl on Windows
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
  }
  commandId: string
}

// ============================================================================
// Command Registry
// ============================================================================

class CommandRegistryImpl {
  private commands = new Map<string, CommandDefinition>()
  private shortcuts = new Map<string, string>() // shortcut string -> command id
  private categories = new Map<CommandCategory, Set<string>>()

  // Context provider
  private contextProvider: (() => CommandContext) | null = null

  // ============================================================================
  // Registration
  // ============================================================================

  /**
   * Register a command
   */
  register(command: CommandDefinition): void {
    if (this.commands.has(command.id)) {
      console.warn(`[CommandRegistry] Overwriting command: ${command.id}`)
    }

    this.commands.set(command.id, command)

    // Track by category
    if (!this.categories.has(command.category)) {
      this.categories.set(command.category, new Set())
    }
    this.categories.get(command.category)!.add(command.id)

    // Register default shortcut
    if (command.shortcut) {
      this.registerShortcut(command.shortcut, command.id)
    }
  }

  /**
   * Register multiple commands
   */
  registerMany(commands: CommandDefinition[]): void {
    for (const command of commands) {
      this.register(command)
    }
  }

  /**
   * Unregister a command
   */
  unregister(commandId: string): void {
    const command = this.commands.get(commandId)
    if (!command) return

    this.commands.delete(commandId)
    this.categories.get(command.category)?.delete(commandId)

    // Remove shortcut
    if (command.shortcut) {
      this.shortcuts.delete(this.normalizeShortcut(command.shortcut))
    }
  }

  // ============================================================================
  // Execution
  // ============================================================================

  /**
   * Execute a command by ID
   */
  execute(commandId: string, params?: Record<string, unknown>): boolean {
    const command = this.commands.get(commandId)
    if (!command) {
      console.warn(`[CommandRegistry] Command not found: ${commandId}`)
      return false
    }

    const context = this.buildContext(params)

    // Check if command can execute
    if (command.canExecute && !command.canExecute(context)) {
      return false
    }

    // Execute
    try {
      const result = command.execute(context)
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error(`[CommandRegistry] Async command failed: ${commandId}`, err)
        })
      }
      return true
    } catch (err) {
      console.error(`[CommandRegistry] Command failed: ${commandId}`, err)
      return false
    }
  }

  /**
   * Execute command from keyboard shortcut
   */
  executeShortcut(shortcut: string): boolean {
    const normalized = this.normalizeShortcut(shortcut)
    const commandId = this.shortcuts.get(normalized)
    if (!commandId) return false
    return this.execute(commandId)
  }

  // ============================================================================
  // Query
  // ============================================================================

  /**
   * Get command by ID
   */
  get(commandId: string): CommandDefinition | undefined {
    return this.commands.get(commandId)
  }

  /**
   * Get all commands
   */
  getAll(): CommandDefinition[] {
    return Array.from(this.commands.values())
  }

  /**
   * Get commands by category
   */
  getByCategory(category: CommandCategory): CommandDefinition[] {
    const ids = this.categories.get(category)
    if (!ids) return []
    return Array.from(ids)
      .map((id) => this.commands.get(id)!)
      .filter(Boolean)
  }

  /**
   * Search commands by query
   */
  search(query: string): CommandDefinition[] {
    const lower = query.toLowerCase()
    return this.getAll().filter((cmd) => {
      if (cmd.name.toLowerCase().includes(lower)) return true
      if (cmd.description.toLowerCase().includes(lower)) return true
      if (cmd.keywords?.some((k) => k.toLowerCase().includes(lower))) return true
      return false
    })
  }

  /**
   * Check if command is active
   */
  isActive(commandId: string): boolean {
    const command = this.commands.get(commandId)
    if (!command?.isActive) return false

    const context = this.buildContext()
    return command.isActive(context)
  }

  /**
   * Check if command can execute
   */
  canExecute(commandId: string): boolean {
    const command = this.commands.get(commandId)
    if (!command) return false
    if (!command.canExecute) return true

    const context = this.buildContext()
    return command.canExecute(context)
  }

  // ============================================================================
  // Shortcuts
  // ============================================================================

  /**
   * Register a keyboard shortcut
   */
  registerShortcut(shortcut: string, commandId: string): void {
    const normalized = this.normalizeShortcut(shortcut)
    this.shortcuts.set(normalized, commandId)
  }

  /**
   * Get shortcut for command
   */
  getShortcut(commandId: string): string | undefined {
    const command = this.commands.get(commandId)
    return command?.shortcut
  }

  /**
   * Parse keyboard event to shortcut string
   */
  parseKeyboardEvent(event: KeyboardEvent): string {
    const parts: string[] = []

    if (event.metaKey) parts.push('Cmd')
    if (event.ctrlKey) parts.push('Ctrl')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')

    // Get key name
    let key = event.key
    if (key === ' ') key = 'Space'
    if (key.length === 1) key = key.toUpperCase()

    parts.push(key)
    return parts.join('+')
  }

  /**
   * Normalize shortcut string for comparison
   */
  private normalizeShortcut(shortcut: string): string {
    return shortcut
      .split('+')
      .map((part) => part.trim().toLowerCase())
      .sort()
      .join('+')
  }

  // ============================================================================
  // Context
  // ============================================================================

  /**
   * Set the context provider function
   */
  setContextProvider(provider: () => CommandContext): void {
    this.contextProvider = provider
  }

  /**
   * Build command context
   */
  private buildContext(params?: Record<string, unknown>): CommandContext {
    if (this.contextProvider) {
      const ctx = this.contextProvider()
      return { ...ctx, params }
    }

    // Default empty context
    return {
      editor: null,
      selection: null,
      activeBlockType: null,
      activeBlockId: null,
      documentId: null,
      params,
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const commandRegistry = new CommandRegistryImpl()

// ============================================================================
// React Hook
// ============================================================================

import { useCallback, useEffect, useState } from 'react'

export function useCommand(commandId: string) {
  const [isActive, setIsActive] = useState(false)
  const [canExecute, setCanExecute] = useState(true)

  // Update state periodically or on relevant events
  useEffect(() => {
    const update = () => {
      setIsActive(commandRegistry.isActive(commandId))
      setCanExecute(commandRegistry.canExecute(commandId))
    }

    update()

    // Could subscribe to editor state changes here
    const interval = setInterval(update, 100)
    return () => clearInterval(interval)
  }, [commandId])

  const execute = useCallback(
    (params?: Record<string, unknown>) => {
      return commandRegistry.execute(commandId, params)
    },
    [commandId]
  )

  return {
    execute,
    isActive,
    canExecute,
    command: commandRegistry.get(commandId),
    shortcut: commandRegistry.getShortcut(commandId),
  }
}
