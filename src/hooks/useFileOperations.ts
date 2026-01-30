import { useCallback } from 'react'
import type { RefObject } from 'react'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { useEditorStore } from '../stores/editorStore'
import {
  serializeSerqDocument,
  parseSerqDocument,
  type SerqMetadata,
} from '../lib/serqFormat'
import { addRecentFile } from '../lib/recentFiles'
import { getWorkingFolder, updateWorkingFolderFromFile } from '../lib/workingFolder'
import type { EditorCoreRef } from '../components/Editor/EditorCore'

/**
 * File filter for native dialogs - accepts .serq.html and regular .html files
 */
const FILE_FILTERS = [
  { name: 'SERQ Documents', extensions: ['serq.html'] },
  { name: 'HTML Files', extensions: ['html'] },
]

/**
 * Extract document name from file path
 */
function extractFileName(path: string): string {
  const fileName = path.split('/').pop() ?? ''
  // Remove .serq.html first (more specific), then .html
  return fileName.replace('.serq.html', '').replace('.html', '') || 'Untitled'
}

/**
 * Result type for openFile operation
 */
export interface OpenFileResult {
  html: string
  metadata: SerqMetadata
  path: string
  name: string
}

/**
 * Hook providing file operations for the SERQ document editor
 *
 * Handles:
 * - Opening .serq.html files via native macOS dialog
 * - Saving documents to disk (Cmd+S)
 * - Save As to new location (Cmd+Shift+S)
 * - Creating new empty documents (Cmd+N)
 */
export function useFileOperations(editorRef: RefObject<EditorCoreRef | null>) {
  const setDocument = useEditorStore((state) => state.setDocument)
  const markSaved = useEditorStore((state) => state.markSaved)
  const clearDocument = useEditorStore((state) => state.clearDocument)
  const document = useEditorStore((state) => state.document)

  /**
   * Open a .serq.html file via native file dialog
   * Returns the parsed content and metadata, or null if cancelled
   */
  const openFile = useCallback(async (): Promise<OpenFileResult | null> => {
    // Get default path from working folder preference
    const defaultPath = await getWorkingFolder()

    // Show native file picker
    const selected = await open({
      multiple: false,
      filters: FILE_FILTERS,
      defaultPath,
    })

    // User cancelled
    if (!selected) {
      return null
    }

    // Read file content
    const content = await readTextFile(selected)

    // Parse the .serq.html format
    const { html, metadata } = parseSerqDocument(content)

    // Update editor content
    editorRef.current?.setContent(html)

    // Update store with file info
    const name = extractFileName(selected)
    setDocument(selected, name)
    markSaved()

    // Add to recent files and update working folder
    await addRecentFile(selected, name)
    await updateWorkingFolderFromFile(selected)

    return {
      html,
      metadata,
      path: selected,
      name,
    }
  }, [editorRef, setDocument, markSaved])

  /**
   * Save current document to disk
   * If document has no path (new/untitled), delegates to saveFileAs
   */
  const saveFile = useCallback(async (): Promise<string | null> => {
    // New document without path - use Save As
    if (!document.path) {
      return saveFileAs()
    }

    // Get current HTML from editor
    const html = editorRef.current?.getHTML() ?? ''

    // Serialize to .serq.html format
    const fileContent = serializeSerqDocument(html, {
      name: document.name,
      path: document.path,
    })

    // Write to disk
    await writeTextFile(document.path, fileContent)

    // Update store
    markSaved()

    return document.path
  }, [document.path, document.name, editorRef, markSaved])

  /**
   * Save document to a new location via native file dialog
   * Returns the new file path, or null if cancelled
   */
  const saveFileAs = useCallback(async (): Promise<string | null> => {
    // Get default path from working folder preference
    const workingFolder = await getWorkingFolder()

    // Show native save dialog
    const filePath = await save({
      filters: FILE_FILTERS,
      defaultPath: `${workingFolder}/${document.name}.serq.html`,
    })

    // User cancelled
    if (!filePath) {
      return null
    }

    // Get current HTML from editor
    const html = editorRef.current?.getHTML() ?? ''

    // Extract name from chosen path
    const name = extractFileName(filePath)

    // Serialize to .serq.html format
    const fileContent = serializeSerqDocument(html, {
      name,
      path: filePath,
    })

    // Write to disk
    await writeTextFile(filePath, fileContent)

    // Update store with new path/name
    console.log('[FileOps] SaveAs complete, setting document path:', filePath)
    setDocument(filePath, name)
    markSaved()

    // Add to recent files and update working folder
    console.log('[FileOps] Adding to recent files...')
    await addRecentFile(filePath, name)
    console.log('[FileOps] Updating working folder...')
    await updateWorkingFolderFromFile(filePath)
    console.log('[FileOps] SaveAs finished successfully')

    return filePath
  }, [document.name, editorRef, setDocument, markSaved])

  /**
   * Create a new empty document
   * Clears editor content and resets document state to Untitled
   *
   * Note: v1 does not prompt about unsaved changes - user responsible for saving
   */
  const newFile = useCallback(async (): Promise<void> => {
    // Clear editor content
    editorRef.current?.setContent('')

    // Reset document state
    clearDocument()

    // Focus editor for immediate typing
    editorRef.current?.focus()
  }, [editorRef, clearDocument])

  return {
    openFile,
    saveFile,
    saveFileAs,
    newFile,
  }
}
