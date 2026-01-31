/**
 * Status Bar Component
 * Bottom bar showing word count, character count, and cursor position
 */
import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';

interface InterfaceColors {
  bg: string;
  bgSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

interface StatusBarProps {
  editor: Editor | null;
  interfaceColors: InterfaceColors;
  /** Whether typewriter mode is enabled */
  typewriterEnabled?: boolean;
  /** Callback to toggle typewriter mode */
  onToggleTypewriter?: () => void;
}

interface DocumentStats {
  words: number;
  characters: number;
  line: number;
  column: number;
}

export function StatusBar({
  editor,
  interfaceColors,
  typewriterEnabled = false,
  onToggleTypewriter,
}: StatusBarProps) {
  const [stats, setStats] = useState<DocumentStats>({
    words: 0,
    characters: 0,
    line: 1,
    column: 1,
  });

  // Update stats on editor changes
  useEffect(() => {
    if (!editor) return;

    const updateStats = () => {
      // Get word/character count from CharacterCount extension
      const wordCount = editor.storage.characterCount?.words?.() ?? 0;
      const charCount = editor.storage.characterCount?.characters?.() ?? 0;

      // Calculate line and column from selection
      const { from } = editor.state.selection;
      const $pos = editor.state.doc.resolve(from);

      // Find which paragraph/block we're in for line number
      let line = 1;
      let charsBefore = 0;

      editor.state.doc.descendants((node, pos) => {
        if (pos >= from) return false; // Stop when we reach cursor
        if (node.isBlock) {
          line++;
          charsBefore = 0;
        } else if (node.isText) {
          charsBefore += node.text?.length ?? 0;
        }
        return true;
      });

      // Column is offset within current block
      const parentOffset = from - $pos.start($pos.depth);
      const column = parentOffset + 1;

      setStats({
        words: wordCount,
        characters: charCount,
        line: Math.max(1, line),
        column: Math.max(1, column),
      });
    };

    // Initial update
    updateStats();

    // Subscribe to changes
    editor.on('update', updateStats);
    editor.on('selectionUpdate', updateStats);

    return () => {
      editor.off('update', updateStats);
      editor.off('selectionUpdate', updateStats);
    };
  }, [editor]);

  // Format number with comma separators
  const formatNumber = (n: number): string => {
    return n.toLocaleString();
  };

  return (
    <div
      className="status-bar flex items-center justify-between px-4 py-1.5 text-xs select-none shrink-0"
      style={{
        backgroundColor: interfaceColors.bgSurface,
        borderTop: `1px solid ${interfaceColors.border}`,
        color: interfaceColors.textMuted,
      }}
    >
      {/* Left side: document stats */}
      <div className="flex items-center gap-4">
        <span title="Word count">
          {formatNumber(stats.words)} word{stats.words !== 1 ? 's' : ''}
        </span>
        <span
          className="opacity-50"
          style={{ color: interfaceColors.border }}
        >
          |
        </span>
        <span title="Character count">
          {formatNumber(stats.characters)} char{stats.characters !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Center: optional typewriter toggle */}
      {onToggleTypewriter && (
        <button
          onClick={onToggleTypewriter}
          className="px-2 py-0.5 rounded text-xs transition-colors"
          style={{
            backgroundColor: typewriterEnabled
              ? interfaceColors.border
              : 'transparent',
            color: typewriterEnabled
              ? interfaceColors.textPrimary
              : interfaceColors.textMuted,
          }}
          title={
            typewriterEnabled
              ? 'Disable typewriter mode'
              : 'Enable typewriter mode (keeps cursor centered)'
          }
        >
          Typewriter {typewriterEnabled ? 'ON' : 'OFF'}
        </button>
      )}

      {/* Right side: cursor position */}
      <div className="flex items-center gap-2">
        <span title="Cursor position">
          Ln {stats.line}, Col {stats.column}
        </span>
      </div>
    </div>
  );
}

export default StatusBar;
