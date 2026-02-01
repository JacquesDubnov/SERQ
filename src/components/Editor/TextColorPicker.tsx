/**
 * TextColorPicker Component
 * Color picker with 8 presets, custom color picker, and saved custom colors
 */
import { useState, useCallback, useEffect } from 'react';
import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';

interface InterfaceColors {
  bg: string;
  bgSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
}

interface TextColorPickerProps {
  editor: Editor;
  interfaceColors: InterfaceColors;
}

// 8 preset colors
const PRESET_COLORS = [
  { color: '#000000', name: 'Black' },
  { color: '#DC2626', name: 'Red' },
  { color: '#EA580C', name: 'Orange' },
  { color: '#CA8A04', name: 'Yellow' },
  { color: '#16A34A', name: 'Green' },
  { color: '#2563EB', name: 'Blue' },
  { color: '#7C3AED', name: 'Purple' },
  { color: '#DB2777', name: 'Pink' },
];

const STORAGE_KEY = 'serq-custom-colors';
const MAX_CUSTOM_COLORS = 8;

export function TextColorPicker({ editor, interfaceColors }: TextColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);

  // Load custom colors from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomColors(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Get current text color
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      const attrs = ctx.editor.getAttributes('textStyle');
      return {
        currentColor: attrs.color || null,
      };
    },
  });

  const handleColorSelect = useCallback((color: string) => {
    editor.chain().focus().setColor(color).run();
    setIsOpen(false);
  }, [editor]);

  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    editor.chain().focus().setColor(color).run();
  }, [editor]);

  const handleSaveCustomColor = useCallback(() => {
    if (state.currentColor && !PRESET_COLORS.some(p => p.color === state.currentColor)) {
      setCustomColors(prev => {
        const newColors = [state.currentColor!, ...prev.filter(c => c !== state.currentColor)].slice(0, MAX_CUSTOM_COLORS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newColors));
        return newColors;
      });
    }
  }, [state.currentColor]);

  const handleRemoveColor = useCallback(() => {
    editor.chain().focus().unsetColor().run();
    setIsOpen(false);
  }, [editor]);

  const swatchStyle = (color: string, isActive: boolean): React.CSSProperties => ({
    width: '24px',
    height: '24px',
    backgroundColor: color,
    borderRadius: '4px',
    border: isActive ? '2px solid #3b82f6' : `1px solid ${interfaceColors.border}`,
    cursor: 'pointer',
    boxSizing: 'border-box',
  });

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: `1px solid ${interfaceColors.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
    color: interfaceColors.textSecondary,
    fontSize: '13px',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyle}
        title="Text Color"
      >
        <span
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: state.currentColor || '#000',
            borderRadius: '2px',
            border: `1px solid ${interfaceColors.border}`,
          }}
        />
        <span>A</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Picker panel */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              padding: '12px',
              backgroundColor: interfaceColors.bg,
              border: `1px solid ${interfaceColors.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              zIndex: 1000,
              minWidth: '200px',
            }}
          >
            {/* Preset colors */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: interfaceColors.textSecondary, marginBottom: '6px' }}>
                Presets
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map(({ color, name }) => (
                  <div
                    key={color}
                    style={swatchStyle(color, state.currentColor === color)}
                    onClick={() => handleColorSelect(color)}
                    title={name}
                  />
                ))}
              </div>
            </div>

            {/* Custom colors */}
            {customColors.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: interfaceColors.textSecondary, marginBottom: '6px' }}>
                  Saved
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {customColors.map((color) => (
                    <div
                      key={color}
                      style={swatchStyle(color, state.currentColor === color)}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Color picker */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: interfaceColors.textSecondary, marginBottom: '6px' }}>
                Custom
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={state.currentColor || '#000000'}
                  onChange={handleCustomColorChange}
                  style={{
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                />
                <button
                  onClick={handleSaveCustomColor}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: interfaceColors.bgSurface,
                    border: `1px solid ${interfaceColors.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: interfaceColors.textSecondary,
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Remove color */}
            <button
              onClick={handleRemoveColor}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '12px',
                backgroundColor: 'transparent',
                border: `1px solid ${interfaceColors.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                color: interfaceColors.textSecondary,
              }}
            >
              Remove Color
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TextColorPicker;
