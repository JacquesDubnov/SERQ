import { useRef, useEffect } from 'react'
import type { RefObject } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { useEditorStore } from '../stores/editorStore'
import { serializeSerqDocument } from '../lib/serqFormat'
import type { EditorCoreRef } from '../components/Editor/EditorCore'

/**
 * Auto-save interval in milliseconds (30 seconds)
 * Matches typical auto-save behavior in document editors
 */
const AUTO_SAVE_INTERVAL = 30000

/**
 * Maximum wait time before forcing a save (60 seconds)
 * Ensures save happens even during continuous typing
 */
const MAX_WAIT = AUTO_SAVE_INTERVAL * 2

export interface AutoSaveResult {
  /** Timestamp of last successful auto-save, null if never saved */
  lastSave: Date | null
  /** Force flush any pending auto-save immediately */
  flushAutoSave: () => void
}

/**
 * Hook providing automatic document saving with debounce
 *
 * Behavior:
 * - Only auto-saves documents that have a file path (existing files)
 * - Only saves when document has unsaved changes (isDirty)
 * - Debounces saves by 30 seconds to avoid constant disk writes
 * - Forces save after 60 seconds of continuous typing (maxWait)
 * - Flushes pending saves on component unmount (app close)
 *
 * @param editorRef - Reference to the EditorCore component for content access
 * @param enabled - Whether auto-save is enabled (default: true)
 * @returns Object containing lastSave timestamp and flushAutoSave function
 */
export function useAutoSave(
  editorRef: RefObject<EditorCoreRef | null>,
  enabled: boolean = true
): AutoSaveResult {
  const document = useEditorStore((state) => state.document)
  const markSaved = useEditorStore((state) => state.markSaved)
  const lastSaveRef = useRef<Date | null>(null)

  const performAutoSave = useDebouncedCallback(
    async () => {
      // Guard conditions - don't auto-save if:
      // 1. No file path (new document, use Save As instead)
      // 2. Document isn't dirty (nothing to save)
      // 3. Editor ref isn't available
      if (!document.path || !document.isDirty) {
        return
      }
      if (!editorRef.current) {
        return
      }

      try {
        const html = editorRef.current.getHTML()
        const content = serializeSerqDocument(html, {
          name: document.name,
          path: document.path,
        })
        await writeTextFile(document.path, content)

        markSaved()
        lastSaveRef.current = new Date()
        console.log('[AutoSave] Document saved at', lastSaveRef.current.toISOString())
      } catch (error) {
        console.error('[AutoSave] Failed:', error)
        // Don't mark as saved on error - user will see dirty indicator
      }
    },
    AUTO_SAVE_INTERVAL,
    { maxWait: MAX_WAIT }
  )

  // Trigger auto-save when document becomes dirty
  useEffect(() => {
    if (enabled && document.isDirty && document.path) {
      performAutoSave()
    }
  }, [document.isDirty, document.path, enabled, performAutoSave])

  // Flush pending auto-save on unmount (app close)
  useEffect(() => {
    return () => {
      performAutoSave.flush()
    }
  }, [performAutoSave])

  return {
    lastSave: lastSaveRef.current,
    flushAutoSave: performAutoSave.flush,
  }
}
