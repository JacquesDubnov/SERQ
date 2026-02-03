/**
 * useAutoSave - Auto-save with 30-second debounce
 *
 * Only triggers for documents that have a file path AND are dirty.
 * New unsaved documents must use Save As first.
 */

import { useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useEditorStore } from '../stores/editorStore';
import { useStyleStore } from '../stores/styleStore';
import { serializeSerqDocument } from '../lib/serqFormat';
import type { EditorCoreRef } from '../components/Editor/EditorCore';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function useAutoSave(
  editorRef: React.RefObject<EditorCoreRef | null>,
  enabled: boolean = true
) {
  const { document: docMeta, markSaved } = useEditorStore();
  const lastSaveRef = useRef<Date | null>(null);

  // Use a ref to always have current document state in the debounced callback
  const documentRef = useRef(docMeta);
  documentRef.current = docMeta;

  const performAutoSave = useDebouncedCallback(
    async () => {
      const doc = documentRef.current;

      // Guard conditions - don't auto-save if:
      // 1. No file path (new document, use Save As instead)
      // 2. Document isn't dirty (nothing to save)
      // 3. Editor ref isn't available
      if (!doc.path || !doc.isDirty) return;
      if (!editorRef.current) return;

      try {
        const html = editorRef.current.getHTML();
        const styleMetadata = useStyleStore.getState().getStyleMetadata();
        const content = serializeSerqDocument(
          html,
          { name: doc.name, path: doc.path },
          undefined,
          styleMetadata
        );
        await writeTextFile(doc.path, content);

        markSaved();
        lastSaveRef.current = new Date();
        console.log('[AutoSave] Document saved at', lastSaveRef.current.toISOString());
      } catch (error) {
        console.error('[AutoSave] Failed:', error);
        // Don't mark as saved on error - user will see dirty indicator
      }
    },
    AUTO_SAVE_INTERVAL,
    { maxWait: AUTO_SAVE_INTERVAL * 2 } // Force save after 60s even if still typing
  );

  // Trigger auto-save when document becomes dirty
  useEffect(() => {
    if (enabled && docMeta.isDirty && docMeta.path) {
      performAutoSave();
    }
  }, [docMeta.isDirty, docMeta.path, enabled, performAutoSave]);

  // Flush pending auto-save on unmount (app close)
  useEffect(() => {
    return () => {
      performAutoSave.flush();
    };
  }, [performAutoSave]);

  return {
    lastSave: lastSaveRef.current,
    flushAutoSave: performAutoSave.flush,
  };
}
