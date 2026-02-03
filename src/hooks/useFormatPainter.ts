/**
 * useFormatPainter - Hook for format painter functionality
 *
 * Provides format capture/apply with cursor state management.
 * - Applies format when new selection is made (after mouseup)
 * - Hold Option key for repeat mode (keeps painting until Option released)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useStyleStore } from '../stores/styleStore';

export function useFormatPainter(editor: Editor | null) {
  const {
    formatPainter,
    captureFormat,
    applyFormat,
    deactivateFormatPainter,
    setFormatPainterMode,
  } = useStyleStore();

  const optionKeyHeld = useRef(false);
  const [hasSelection, setHasSelection] = useState(false);
  const hasStoredFormat = formatPainter.storedFormat !== null;
  const isMouseDown = useRef(false);

  // Track selection state reactively
  useEffect(() => {
    if (!editor) {
      setHasSelection(false);
      return;
    }

    const updateSelection = () => {
      setHasSelection(!editor.state.selection.empty);
    };

    updateSelection();
    editor.on('selectionUpdate', updateSelection);
    editor.on('transaction', updateSelection);

    return () => {
      editor.off('selectionUpdate', updateSelection);
      editor.off('transaction', updateSelection);
    };
  }, [editor]);

  // Capture format from current selection
  const capture = useCallback(() => {
    if (!editor) return;
    const isEmpty = editor.state.selection.empty;
    console.log('[FormatPainter] capture() called, selection empty:', isEmpty);
    if (isEmpty) return;
    captureFormat(editor);
    // Verify state was set
    const newState = useStyleStore.getState();
    console.log('[FormatPainter] After capture - active:', newState.formatPainter.active, 'hasFormat:', !!newState.formatPainter.storedFormat);
  }, [editor, captureFormat]);

  // Track Option key state for repeat mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && formatPainter.active) {
        deactivateFormatPainter();
        return;
      }

      if (e.key === 'Alt' && formatPainter.active) {
        optionKeyHeld.current = true;
        setFormatPainterMode('hold');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        optionKeyHeld.current = false;
        if (formatPainter.active) {
          setFormatPainterMode('toggle');
          deactivateFormatPainter();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [formatPainter.active, deactivateFormatPainter, setFormatPainterMode]);

  // Track mouse state and apply format on mouseup when selection exists
  useEffect(() => {
    if (!editor?.view?.dom) return;

    const handleMouseDown = () => {
      isMouseDown.current = true;
      console.log('[FormatPainter] mousedown in editor');
    };

    const handleMouseUp = () => {
      // Only process if mousedown was in the editor
      if (!isMouseDown.current) {
        return;
      }
      isMouseDown.current = false;

      // Small delay to let selection finalize
      setTimeout(() => {
        const state = useStyleStore.getState();
        const { formatPainter: fp } = state;

        console.log('[FormatPainter] mouseup in editor - active:', fp.active, 'hasFormat:', !!fp.storedFormat, 'selectionEmpty:', editor.state.selection.empty);

        if (fp.active && fp.storedFormat && !editor.state.selection.empty) {
          console.log('[FormatPainter] Applying format!');
          state.applyFormat(editor);
        }
      }, 50);
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      editorElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editor]);

  return {
    isActive: formatPainter.active,
    hasStoredFormat,
    isRepeatMode: formatPainter.mode === 'hold',
    canCapture: hasSelection,
    canApply: hasSelection && hasStoredFormat,
    capture,
    apply: () => {
      if (editor && hasSelection && hasStoredFormat) {
        applyFormat(editor);
      }
    },
    toggle: () => {
      if (hasSelection) {
        capture();
      }
    },
    deactivate: deactivateFormatPainter,
  };
}
