/**
 * useKeyboardShortcuts - Global keyboard shortcuts for SERQ
 *
 * Binds Cmd+S, Cmd+Shift+S, Cmd+O, Cmd+N to file operations.
 * Uses react-hotkeys-hook for cross-platform support.
 */

import { useHotkeys } from 'react-hotkeys-hook';
import { useFileOperations } from './useFileOperations';
import type { EditorCoreRef } from '../components/Editor/EditorCore';

const HOTKEY_OPTIONS = {
  enableOnContentEditable: true, // Work when cursor is in TipTap
  enableOnFormTags: true, // Work in any input context
  preventDefault: true, // Block browser default behavior
};

export function useKeyboardShortcuts(
  editorRef: React.RefObject<EditorCoreRef | null>
): void {
  const { openFile, saveFile, saveFileAs, newFile } = useFileOperations(editorRef);

  // Cmd+S / Ctrl+S - Save
  useHotkeys(
    'meta+s, ctrl+s',
    (e) => {
      e.preventDefault();
      saveFile().catch(console.error);
    },
    HOTKEY_OPTIONS
  );

  // Cmd+Shift+S / Ctrl+Shift+S - Save As
  useHotkeys(
    'meta+shift+s, ctrl+shift+s',
    (e) => {
      e.preventDefault();
      saveFileAs().catch(console.error);
    },
    HOTKEY_OPTIONS
  );

  // Cmd+O / Ctrl+O - Open
  useHotkeys(
    'meta+o, ctrl+o',
    (e) => {
      e.preventDefault();
      openFile().catch(console.error);
    },
    HOTKEY_OPTIONS
  );

  // Cmd+N / Ctrl+N - New
  useHotkeys(
    'meta+n, ctrl+n',
    (e) => {
      e.preventDefault();
      newFile();
    },
    HOTKEY_OPTIONS
  );
}
