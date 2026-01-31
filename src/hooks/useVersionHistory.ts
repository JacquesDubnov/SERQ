/**
 * Version History Hook
 * Manages version history state and operations
 */
import { useState, useCallback, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import {
  getVersions,
  getVersionById,
  saveVersion,
  type Version,
} from '../lib/version-storage';
import { useEditorStore } from '../stores/editorStore';

interface UseVersionHistoryReturn {
  /** List of versions for current document */
  versions: Version[];
  /** Currently selected version for preview */
  selectedVersion: Version | null;
  /** Whether versions are loading */
  isLoading: boolean;
  /** Load versions for current document */
  loadVersions: () => Promise<void>;
  /** Select a version for preview */
  selectVersion: (versionId: number) => Promise<void>;
  /** Restore selected version to editor */
  restoreVersion: (editor: Editor) => Promise<boolean>;
  /** Create a named checkpoint from current content */
  createCheckpoint: (editor: Editor, name: string) => Promise<boolean>;
  /** Clear selection */
  clearSelection: () => void;
}

export function useVersionHistory(): UseVersionHistoryReturn {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const documentPath = useEditorStore((state) => state.document.path);
  const markDirty = useEditorStore((state) => state.markDirty);

  // Load versions when document path changes
  const loadVersions = useCallback(async () => {
    if (!documentPath) {
      setVersions([]);
      return;
    }

    setIsLoading(true);
    try {
      const versionList = await getVersions(documentPath, 100);
      setVersions(versionList);
    } catch (err) {
      console.error('[VersionHistory] Failed to load versions:', err);
      setVersions([]);
    } finally {
      setIsLoading(false);
    }
  }, [documentPath]);

  // Auto-load versions when document path changes
  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Select a version for preview
  const selectVersion = useCallback(async (versionId: number) => {
    setIsLoading(true);
    try {
      const version = await getVersionById(versionId);
      setSelectedVersion(version);
    } catch (err) {
      console.error('[VersionHistory] Failed to load version:', err);
      setSelectedVersion(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore selected version to editor
  const restoreVersion = useCallback(
    async (editor: Editor): Promise<boolean> => {
      if (!selectedVersion || !documentPath) {
        return false;
      }

      try {
        // Parse version content
        const content = JSON.parse(selectedVersion.content);

        // Save current state as backup checkpoint before restore
        const currentJSON = editor.getJSON();
        const wordCount = editor.storage.characterCount?.words?.() ?? 0;
        const charCount = editor.storage.characterCount?.characters?.() ?? 0;

        await saveVersion(
          documentPath,
          currentJSON,
          wordCount,
          charCount,
          true, // Named checkpoint
          `Before restore to version from ${new Date(selectedVersion.timestamp).toLocaleString()}`
        );

        // Restore content
        editor.commands.setContent(content);

        // Mark document as dirty (needs save)
        markDirty();

        // Reload versions list to show the backup checkpoint
        await loadVersions();

        console.debug('[VersionHistory] Restored version:', selectedVersion.id);
        return true;
      } catch (err) {
        console.error('[VersionHistory] Failed to restore version:', err);
        return false;
      }
    },
    [selectedVersion, documentPath, markDirty, loadVersions]
  );

  // Create a named checkpoint
  const createCheckpoint = useCallback(
    async (editor: Editor, name: string): Promise<boolean> => {
      if (!documentPath) {
        return false;
      }

      try {
        const editorJSON = editor.getJSON();
        const wordCount = editor.storage.characterCount?.words?.() ?? 0;
        const charCount = editor.storage.characterCount?.characters?.() ?? 0;

        await saveVersion(
          documentPath,
          editorJSON,
          wordCount,
          charCount,
          true, // Named checkpoint
          name
        );

        // Reload versions list
        await loadVersions();

        console.debug('[VersionHistory] Created checkpoint:', name);
        return true;
      } catch (err) {
        console.error('[VersionHistory] Failed to create checkpoint:', err);
        return false;
      }
    },
    [documentPath, loadVersions]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedVersion(null);
  }, []);

  return {
    versions,
    selectedVersion,
    isLoading,
    loadVersions,
    selectVersion,
    restoreVersion,
    createCheckpoint,
    clearSelection,
  };
}
