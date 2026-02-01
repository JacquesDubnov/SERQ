/**
 * FontControls Component
 * Provides font family, size, and weight controls for the editor toolbar
 */
import { useCallback, useMemo } from 'react';
import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { ALL_FONTS, FONT_SIZES, getFontByName } from '../../lib/fonts';

interface InterfaceColors {
  bg: string;
  bgSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
}

interface FontControlsProps {
  editor: Editor;
  interfaceColors: InterfaceColors;
}

// Dropdown styles
const dropdownStyle = (colors: InterfaceColors): React.CSSProperties => ({
  backgroundColor: colors.bg,
  border: `1px solid ${colors.border}`,
  color: colors.textPrimary,
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '13px',
  cursor: 'pointer',
  outline: 'none',
});

// Button styles for increase/decrease
const buttonStyle = (colors: InterfaceColors): React.CSSProperties => ({
  backgroundColor: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '28px',
  height: '28px',
});

export function FontControls({ editor, interfaceColors }: FontControlsProps) {
  // Get current font states from editor
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      const attrs = ctx.editor.getAttributes('textStyle');
      return {
        fontFamily: attrs.fontFamily || null,
        fontSize: attrs.fontSize || null,
        fontWeight: attrs.fontWeight || null,
      };
    },
  });

  // Parse current font size as number
  const currentSizeNum = useMemo(() => {
    if (!state.fontSize) return 16;
    const match = state.fontSize.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 16;
  }, [state.fontSize]);

  // Find current font config
  const currentFont = useMemo(() => {
    if (!state.fontFamily) return null;
    // Try to find by exact family match or by name
    return ALL_FONTS.find(f =>
      state.fontFamily?.includes(f.name) ||
      f.family === state.fontFamily
    );
  }, [state.fontFamily]);

  // Handle font family change
  const handleFontChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const fontName = e.target.value;
    if (fontName === '') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      const font = getFontByName(fontName);
      if (font) {
        editor.chain().focus().setFontFamily(font.family).run();
      }
    }
  }, [editor]);

  // Handle font size change
  const handleSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    if (size === '') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(`${size}px`).run();
    }
  }, [editor]);

  // Handle font weight change
  const handleWeightChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const weight = e.target.value;
    if (weight === '') {
      editor.chain().focus().unsetFontWeight().run();
    } else {
      editor.chain().focus().setFontWeight(weight).run();
    }
  }, [editor]);

  // Increase font size
  const handleIncreaseSize = useCallback(() => {
    const currentIndex = FONT_SIZES.findIndex(s => s >= currentSizeNum);
    const nextIndex = Math.min(currentIndex + 1, FONT_SIZES.length - 1);
    const nextSize = FONT_SIZES[nextIndex >= 0 ? nextIndex : 0];
    editor.chain().focus().setFontSize(`${nextSize}px`).run();
  }, [editor, currentSizeNum]);

  // Decrease font size
  const handleDecreaseSize = useCallback(() => {
    const currentIndex = FONT_SIZES.findIndex(s => s >= currentSizeNum);
    const prevIndex = Math.max((currentIndex > 0 ? currentIndex : 1) - 1, 0);
    const prevSize = FONT_SIZES[prevIndex];
    editor.chain().focus().setFontSize(`${prevSize}px`).run();
  }, [editor, currentSizeNum]);

  // Get available weights for current font
  const availableWeights = useMemo(() => {
    if (!currentFont) {
      // Default weights if no font selected
      return [
        { value: 400, label: 'Regular' },
        { value: 700, label: 'Bold' },
      ];
    }
    return currentFont.weights;
  }, [currentFont]);

  // Get current font name for display
  const currentFontName = useMemo(() => {
    if (!state.fontFamily) return '';
    if (currentFont) return currentFont.name;
    // Try to extract font name from family string
    const match = state.fontFamily.match(/'([^']+)'/);
    return match ? match[1] : state.fontFamily;
  }, [state.fontFamily, currentFont]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {/* Font Family Dropdown */}
      <select
        value={currentFontName}
        onChange={handleFontChange}
        title="Font Family"
        style={{
          ...dropdownStyle(interfaceColors),
          width: '140px',
          fontFamily: currentFont?.family || 'inherit',
        }}
      >
        <option value="">Default</option>
        <optgroup label="System Fonts">
          {ALL_FONTS.filter(f => f.family.includes('system-ui') || f.name === 'Arial' || f.name === 'Times New Roman' || f.name === 'Georgia' || f.name === 'Courier New').map(font => (
            <option
              key={font.name}
              value={font.name}
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Sans-Serif">
          {ALL_FONTS.filter(f => f.category === 'sans-serif' && !f.family.includes('system-ui') && f.name !== 'Arial').map(font => (
            <option
              key={font.name}
              value={font.name}
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Serif">
          {ALL_FONTS.filter(f => f.category === 'serif' && f.name !== 'Times New Roman' && f.name !== 'Georgia').map(font => (
            <option
              key={font.name}
              value={font.name}
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Display">
          {ALL_FONTS.filter(f => f.category === 'display').map(font => (
            <option
              key={font.name}
              value={font.name}
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Monospace">
          {ALL_FONTS.filter(f => f.category === 'monospace' && f.name !== 'Courier New').map(font => (
            <option
              key={font.name}
              value={font.name}
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </option>
          ))}
        </optgroup>
      </select>

      {/* Font Size Controls */}
      <button
        onClick={handleDecreaseSize}
        title="Decrease Font Size"
        style={buttonStyle(interfaceColors)}
      >
        −
      </button>

      <select
        value={currentSizeNum}
        onChange={handleSizeChange}
        title="Font Size"
        style={{
          ...dropdownStyle(interfaceColors),
          width: '60px',
          textAlign: 'center',
        }}
      >
        {FONT_SIZES.map(size => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <button
        onClick={handleIncreaseSize}
        title="Increase Font Size"
        style={buttonStyle(interfaceColors)}
      >
        +
      </button>

      {/* Font Weight Dropdown */}
      <select
        value={state.fontWeight || ''}
        onChange={handleWeightChange}
        title="Font Weight"
        style={{
          ...dropdownStyle(interfaceColors),
          width: '100px',
          fontWeight: state.fontWeight || 'normal',
        }}
      >
        <option value="">Default</option>
        {availableWeights.map(weight => (
          <option
            key={weight.value}
            value={weight.value}
            style={{ fontWeight: weight.value }}
          >
            {weight.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FontControls;
