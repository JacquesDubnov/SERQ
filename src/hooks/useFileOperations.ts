/**
 * useFileOperations - File operation hooks for SERQ
 *
 * Provides openFile, saveFile, saveFileAs, newFile operations
 * using Tauri plugins and .serq.html format.
 */

import { useCallback } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { useEditorStore } from '../stores/editorStore';
import { useStyleStore } from '../stores/styleStore';
import {
  serializeSerqDocument,
  parseSerqDocument,
  type SerqMetadata,
} from '../lib/serqFormat';
import { addRecentFile } from '../lib/recentFiles';
import { getWorkingFolder, updateWorkingFolderFromFile } from '../lib/workingFolder';
import type { EditorCoreRef } from '../components/Editor/EditorCore';

/**
 * Extract file name from path (without extension)
 */
function extractFileName(path: string): string {
  const fileName = path.split('/').pop() ?? 'Untitled';
  return fileName.replace(/\.serq\.html$/i, '').replace(/\.html$/i, '');
}

interface UseFileOperationsResult {
  openFile: () => Promise<{ html: string; metadata: SerqMetadata } | null>;
  saveFile: () => Promise<boolean>;
  saveFileAs: () => Promise<string | null>;
  newFile: () => void;
}

export function useFileOperations(
  editorRef: React.RefObject<EditorCoreRef | null>
): UseFileOperationsResult {
  const { document: docMeta, setDocument, markSaved, clearDocument } = useEditorStore();

  /**
   * Open a .serq.html or .html file
   */
  const openFile = useCallback(async () => {
    try {
      // Get default path from working folder preference
      const defaultPath = await getWorkingFolder();

      const selected = await open({
        multiple: false,
        defaultPath,
        filters: [
          { name: 'SERQ Documents', extensions: ['serq.html', 'html'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (!selected) {
        return null; // User cancelled
      }

      const filePath = selected;
      const content = await readTextFile(filePath);
      const { html, metadata } = parseSerqDocument(content);

      // Set editor content
      editorRef.current?.setContent(html);

      // Update store with file info
      const name = extractFileName(filePath);
      setDocument(filePath, name);

      // Load style metadata from document presets
      if (metadata.presets) {
        useStyleStore.getState().loadFromMetadata({
          typography: metadata.presets.typography ?? 'default',
          colors: metadata.presets.colors ?? 'default',
          canvas: metadata.presets.canvas ?? 'white',
          layout: metadata.presets.layout ?? 'default',
          masterTheme: metadata.presets.masterTheme ?? null,
          themeMode: metadata.presets.themeMode ?? 'system',
          paragraphSpacingBefore: metadata.presets.paragraphSpacingBefore ?? 0,
          paragraphSpacingAfter: metadata.presets.paragraphSpacingAfter ?? 0.5,
          headingSpacing: metadata.presets.headingSpacing,
          headingCustomStyles: metadata.presets.headingCustomStyles,
        });
      }

      // Add to recent files and update working folder
      await addRecentFile(filePath, name);
      await updateWorkingFolderFromFile(filePath);

      return { html, metadata };
    } catch (error) {
      console.error('[useFileOperations] Error opening file:', error);
      throw error;
    }
  }, [editorRef, setDocument]);

  /**
   * Save current document (or trigger Save As if no path)
   */
  const saveFile = useCallback(async () => {
    try {
      // If no path, delegate to Save As
      if (!docMeta.path) {
        const result = await saveFileAs();
        return result !== null;
      }

      // Get current HTML from editor
      const html = editorRef.current?.getHTML() ?? '';

      // Get style metadata from store
      const styleMetadata = useStyleStore.getState().getStyleMetadata();

      // Serialize to .serq.html format with style metadata
      const content = serializeSerqDocument(
        html,
        { name: docMeta.name, path: docMeta.path },
        undefined, // no existing metadata on regular save
        styleMetadata
      );

      // Write to disk
      await writeTextFile(docMeta.path, content);

      // Update store
      markSaved();

      console.log('[useFileOperations] Saved to:', docMeta.path);
      return true;
    } catch (error) {
      console.error('[useFileOperations] Error saving file:', error);
      throw error;
    }
  }, [docMeta.path, docMeta.name, editorRef, markSaved]);

  /**
   * Save As - always prompts for new location
   */
  const saveFileAs = useCallback(async () => {
    try {
      // Get default path from working folder preference
      const workingFolder = await getWorkingFolder();

      const filePath = await save({
        defaultPath: `${workingFolder}/${docMeta.name}.serq.html`,
        filters: [
          { name: 'SERQ Documents', extensions: ['serq.html'] },
          { name: 'HTML Files', extensions: ['html'] },
        ],
      });

      if (!filePath) {
        return null; // User cancelled
      }

      // Get current HTML from editor
      const html = editorRef.current?.getHTML() ?? '';
      const name = extractFileName(filePath);

      // Get style metadata from store
      const styleMetadata = useStyleStore.getState().getStyleMetadata();

      // Serialize to .serq.html format with style metadata
      const content = serializeSerqDocument(
        html,
        { name, path: filePath },
        undefined,
        styleMetadata
      );

      // Write to disk
      await writeTextFile(filePath, content);

      // Update store with new path/name
      setDocument(filePath, name);
      markSaved();

      // Add to recent files and update working folder
      await addRecentFile(filePath, name);
      await updateWorkingFolderFromFile(filePath);

      console.log('[useFileOperations] Saved as:', filePath);
      return filePath;
    } catch (error) {
      console.error('[useFileOperations] Error in Save As:', error);
      throw error;
    }
  }, [docMeta.name, editorRef, setDocument, markSaved]);

  /**
   * Create new empty document
   */
  const newFile = useCallback(() => {
    // For v1, just clear without confirmation
    // TODO: Add dirty confirmation dialog in later phase
    editorRef.current?.setContent('<p></p>');
    clearDocument();
    editorRef.current?.focus();
    console.log('[useFileOperations] New document created');
  }, [editorRef, clearDocument]);

  return {
    openFile,
    saveFile,
    saveFileAs,
    newFile,
  };
}
