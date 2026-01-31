/**
 * Auto-Snapshot Hook
 * Saves document version to SQLite every 30 seconds when document has unsaved changes
 */
import { useEffect, useRef, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { Editor } from '@tiptap/core';
import { saveVersion, deleteOldVersions } from '../lib/version-storage';

interface UseAutoSnapshotOptions {
  /** Debounce interval in ms (default: 30000 = 30 seconds) */
  debounceMs?: number;
  /** Whether auto-snapshot is enabled */
  enabled?: boolean;
}

interface UseAutoSnapshotReturn {
  /** Manually trigger a snapshot (useful for checkpoints) */
  triggerSnapshot: () => void;
}

export function useAutoSnapshot(
  editor: Editor | null,
  documentPath: string | null,
  options: UseAutoSnapshotOptions = {}
): UseAutoSnapshotReturn {
  const { debounceMs = 30000, enabled = true } = options;
  const lastSnapshotRef = useRef<string | null>(null);

  // Debounced save function
  const performSnapshot = useDebouncedCallback(
    async () => {
      if (!enabled || !editor || !documentPath) {
        return;
      }

      const editorJSON = editor.getJSON();
      const contentString = JSON.stringify(editorJSON);

      // Skip if content hasn't changed since last snapshot
      if (contentString === lastSnapshotRef.current) {
        return;
      }

      // Get word/char count from CharacterCount extension storage
      const wordCount = editor.storage.characterCount?.words?.() ?? 0;
      const charCount = editor.storage.characterCount?.characters?.() ?? 0;

      try {
        await saveVersion(
          documentPath,
          editorJSON,
          wordCount,
          charCount,
          false, // Not a checkpoint (auto-save)
          undefined
        );

        lastSnapshotRef.current = contentString;
        console.debug('[AutoSnapshot] Saved version for:', documentPath);

        // Cleanup old versions periodically (keep last 50 auto-saves)
        await deleteOldVersions(documentPath, 50);
      } catch (err) {
        console.error('[AutoSnapshot] Failed to save version:', err);
      }
    },
    debounceMs,
    { maxWait: 60000 } // Force save at least every 60 seconds
  );

  // Subscribe to editor changes
  useEffect(() => {
    if (!enabled || !editor || !documentPath) return;

    const handleUpdate = () => {
      performSnapshot();
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, documentPath, enabled, performSnapshot]);

  // Reset last snapshot when document changes
  useEffect(() => {
    lastSnapshotRef.current = null;
  }, [documentPath]);

  // Wrap for stable return reference
  const triggerSnapshot = useCallback(() => {
    performSnapshot();
  }, [performSnapshot]);

  return {
    triggerSnapshot,
  };
}
