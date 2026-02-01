/**
 * CanvasContextMenu Component
 * Right-click context menu for canvas (empty space) operations
 * Provides line number controls, paragraph numbering, and other canvas-level settings
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditorStore, type LineNumberSettings } from '../../stores/editorStore';
import { ParagraphNumberPicker } from './ParagraphNumberPicker';
import { getPresetById } from '../../extensions/ParagraphNumbers';

interface CanvasContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
}

// Position options
const POSITION_OPTIONS: Array<{ id: LineNumberSettings['position']; label: string }> = [
  { id: 'gutter', label: 'Gutter' },
  { id: 'margin', label: 'Margin' },
];

// Style options
const STYLE_OPTIONS: Array<{ id: LineNumberSettings['style']; label: string }> = [
  { id: 'code', label: 'Code (1, 2, 3...)' },
  { id: 'legal', label: 'Legal (5, 10, 15...)' },
];

export function CanvasContextMenu({ position, onClose }: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { lineNumbers, setLineNumbers, toggleLineNumbers, paragraphNumbers, setParagraphNumbers } = useEditorStore();
  const [showNumberPicker, setShowNumberPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Delay to prevent immediate close from the right-click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > viewportWidth - 20) {
        adjustedX = viewportWidth - rect.width - 20;
      }
      if (position.y + rect.height > viewportHeight - 20) {
        adjustedY = viewportHeight - rect.height - 20;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [position]);

  // Toggle line numbers
  const handleToggleLineNumbers = useCallback(() => {
    toggleLineNumbers();
  }, [toggleLineNumbers]);

  // Change position
  const handlePositionChange = useCallback(
    (pos: LineNumberSettings['position']) => {
      setLineNumbers({ position: pos });
    },
    [setLineNumbers]
  );

  // Change style
  const handleStyleChange = useCallback(
    (style: LineNumberSettings['style']) => {
      setLineNumbers({ style });
    },
    [setLineNumbers]
  );

  // Open paragraph number picker
  const handleOpenNumberPicker = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPickerPosition({ x: rect.right + 8, y: rect.top });
    setShowNumberPicker(true);
  }, []);

  // Toggle paragraph numbers off
  const handleToggleParagraphNumbers = useCallback(() => {
    if (paragraphNumbers.enabled) {
      setParagraphNumbers({ enabled: false, presetId: null });
    } else {
      setParagraphNumbers({ enabled: true, presetId: 'seq-numeric' });
    }
  }, [paragraphNumbers.enabled, setParagraphNumbers]);

  // Get current preset name
  const currentPreset = paragraphNumbers.presetId ? getPresetById(paragraphNumbers.presetId) : null;

  return (
    <div
      ref={menuRef}
      className="canvas-context-menu"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        minWidth: 200,
        backgroundColor: 'var(--color-bg-surface, #ffffff)',
        border: '1px solid var(--color-border, #e5e7eb)',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '8px 0',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
        fontSize: 14,
      }}
    >
      {/* Line Numbers Section */}
      <div style={{ padding: '4px 12px 8px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted, #9ca3af)',
            marginBottom: 8,
          }}
        >
          Line Numbers
        </div>

        {/* Enable Toggle */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--color-text-primary, #1f2937)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover, #f3f4f6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={handleToggleLineNumbers}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span
            style={{
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-border, #d1d5db)',
              borderRadius: 3,
              backgroundColor: lineNumbers.enabled
                ? 'var(--color-accent, #2563eb)'
                : 'transparent',
              color: lineNumbers.enabled ? 'white' : 'transparent',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {lineNumbers.enabled ? '✓' : ''}
          </span>
          <span>Show Line Numbers</span>
        </button>

        {/* Position Options - Only show when enabled */}
        {lineNumbers.enabled && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--color-text-muted, #9ca3af)',
                marginTop: 12,
                marginBottom: 4,
                paddingLeft: 12,
              }}
            >
              Position
            </div>
            <div style={{ display: 'flex', gap: 4, paddingLeft: 12, paddingRight: 12 }}>
              {POSITION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    backgroundColor:
                      lineNumbers.position === opt.id
                        ? 'var(--color-accent, #2563eb)'
                        : 'var(--color-bg-surface, #f3f4f6)',
                    color:
                      lineNumbers.position === opt.id
                        ? 'white'
                        : 'var(--color-text-primary, #1f2937)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                  onClick={() => handlePositionChange(opt.id)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Style Options */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--color-text-muted, #9ca3af)',
                marginTop: 12,
                marginBottom: 4,
                paddingLeft: 12,
              }}
            >
              Style
            </div>
            <div style={{ paddingLeft: 12, paddingRight: 12 }}>
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 12px',
                    backgroundColor:
                      lineNumbers.style === opt.id
                        ? 'var(--color-accent, #2563eb)'
                        : 'transparent',
                    color:
                      lineNumbers.style === opt.id
                        ? 'white'
                        : 'var(--color-text-primary, #1f2937)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => {
                    if (lineNumbers.style !== opt.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover, #f3f4f6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (lineNumbers.style !== opt.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={() => handleStyleChange(opt.id)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Separator */}
      <div
        style={{
          height: 1,
          backgroundColor: 'var(--color-border, #e5e7eb)',
          margin: '4px 12px',
        }}
      />

      {/* Paragraph Numbers Section */}
      <div style={{ padding: '4px 12px 8px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted, #9ca3af)',
            marginBottom: 8,
          }}
        >
          Paragraph Numbering
        </div>

        {/* Enable Toggle */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--color-text-primary, #1f2937)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover, #f3f4f6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={handleToggleParagraphNumbers}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span
            style={{
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-border, #d1d5db)',
              borderRadius: 3,
              backgroundColor: paragraphNumbers.enabled
                ? 'var(--color-accent, #2563eb)'
                : 'transparent',
              color: paragraphNumbers.enabled ? 'white' : 'transparent',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {paragraphNumbers.enabled ? '✓' : ''}
          </span>
          <span>Show Paragraph Numbers</span>
        </button>

        {/* Style selector button */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--color-text-primary, #1f2937)',
            marginTop: 4,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover, #f3f4f6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={handleOpenNumberPicker}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span>
            {currentPreset ? currentPreset.name : 'Choose Style...'}
          </span>
          <span style={{ color: 'var(--color-text-muted, #9ca3af)' }}>
            {'\u203A'}
          </span>
        </button>
      </div>

      {/* Paragraph Number Picker */}
      {showNumberPicker && (
        <ParagraphNumberPicker
          position={pickerPosition}
          onClose={() => {
            setShowNumberPicker(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}

export default CanvasContextMenu;
