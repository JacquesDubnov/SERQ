/**
 * FormatPainterButton - Toolbar button for format painter
 *
 * Click to capture format from selection, then click on other text to apply.
 */

import type { Editor } from '@tiptap/core';
import { useFormatPainter } from '../../hooks/useFormatPainter';

interface FormatPainterButtonProps {
  editor: Editor | null;
  isDark: boolean;
}

export function FormatPainterButton({ editor, isDark }: FormatPainterButtonProps) {
  const { isActive, hasStoredFormat, isRepeatMode, canCapture, capture, deactivate } = useFormatPainter(editor);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent the button from stealing focus from the editor
    e.preventDefault();

    if (isActive) {
      deactivate();
    } else if (canCapture) {
      capture();
    }
  };

  // Colors
  const bgActive = isDark ? '#3f3f46' : '#e5e7eb';
  const bgHover = isDark ? '#3f3f46' : '#f3f4f6';
  const textPrimary = isDark ? '#f5f5f5' : '#1a1a1a';
  const textMuted = isDark ? '#71717a' : '#9ca3af';
  const borderActive = isDark ? '#a78bfa' : '#8b5cf6';

  const isDisabled = !isActive && !canCapture;

  return (
    <button
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()} // Prevent focus stealing
      disabled={isDisabled}
      title={
        isActive
          ? isRepeatMode
            ? 'Repeat painting (release Option to stop)'
            : 'Click to deactivate (or press Escape). Hold Option for repeat.'
          : canCapture
          ? 'Copy formatting from selection'
          : 'Select text to copy formatting'
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        fontSize: '13px',
        border: isActive ? `2px solid ${borderActive}` : '1px solid transparent',
        borderRadius: '6px',
        backgroundColor: isActive ? bgActive : 'transparent',
        color: isDisabled ? textMuted : textPrimary,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all 100ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled && !isActive) {
          e.currentTarget.style.backgroundColor = bgHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {/* Paintbrush icon (SVG) */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
        <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
        <path d="M14.5 17.5 4.5 15" />
      </svg>
      <span>{isActive ? (isRepeatMode ? 'Repeat...' : 'Painting...') : 'Format'}</span>
      {hasStoredFormat && !isActive && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: borderActive,
          }}
        />
      )}
    </button>
  );
}
