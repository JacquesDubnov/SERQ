/**
 * App Initialization
 *
 * Initializes core systems on app startup:
 * - Database (SQLite)
 * - Command Registry (context provider)
 * - Style System (named styles from DB)
 */

import { useState, useEffect } from 'react'
import { database } from '../database'
import { commandRegistry, type CommandContext } from '../command-registry'
import { registerCoreCommands } from './commands'
import { loadNamedStyles } from './styles'
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
// Main Initialization
// ============================================================================

/**
 * Initialize all app systems
 * Safe to call multiple times - will only run once
 */
export async function initializeApp(): Promise<void> {
  if (initialized) {
    return
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      // 1. Initialize database
      await database.initialize()

      // 2. Set up command registry context provider
      commandRegistry.setContextProvider(buildCommandContext)

      // 3. Register core commands
      registerCoreCommands()

      // 4. Load named styles from database
      await loadNamedStyles()

      initialized = true
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
