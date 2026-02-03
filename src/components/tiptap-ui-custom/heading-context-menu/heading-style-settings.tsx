/**
 * HeadingStyleSettings - Inline typography customization panel
 *
 * Shown when "Customize Style" is clicked in the heading context menu.
 * Allows direct configuration of heading typography.
 *
 * Shows current assigned values when a style already exists.
 *
 * IMPORTANT: All font/weight options come from styleStore (dynamic, user-configurable).
 * Never hardcode lists here - read from store.
 */

import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useStyleStore, type HeadingCustomStyle, type FontOption, type FontWeightOption } from '@/stores/styleStore';
import { resolveCssVariable } from '@/lib/editor-utils';

/**
 * Try to match a font family string to available fonts.
 * Handles cases like "Merriweather" matching "Merriweather, serif"
 */
function matchFontFamily(family: string | null | undefined, availableFonts: FontOption[]): string {
  if (!family || availableFonts.length === 0) {
    return availableFonts[0]?.value || 'Inter, sans-serif';
  }

  // Direct match
  const directMatch = availableFonts.find(f => f.value === family);
  if (directMatch) return directMatch.value;

  // Partial match - check if the family name matches any available font
  const cleanFamily = family.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
  const partialMatch = availableFonts.find(f => {
    const fontName = f.value.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
    return fontName === cleanFamily || cleanFamily.includes(fontName) || fontName.includes(cleanFamily);
  });
  if (partialMatch) return partialMatch.value;

  // No match - return the original value (custom font not in list)
  return family;
}

/**
 * Find the closest font weight option
 */
function matchFontWeight(weight: number | null | undefined, defaultWeight: number, availableFontWeights: FontWeightOption[]): number {
  if (weight === null || weight === undefined) return defaultWeight;
  if (availableFontWeights.length === 0) return defaultWeight;

  // Direct match
  const directMatch = availableFontWeights.find(w => w.value === weight);
  if (directMatch) return directMatch.value;

  // Find closest weight
  let closest = availableFontWeights[0].value;
  let minDiff = Math.abs(weight - closest);
  for (const w of availableFontWeights) {
    const diff = Math.abs(weight - w.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w.value;
    }
  }
  return closest;
}

interface HeadingStyleSettingsProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  currentStyle: HeadingCustomStyle | null;
  onChange: (style: HeadingCustomStyle) => void;
}

// Default font sizes per heading level
function getDefaultFontSize(level: number): number {
  const sizes: Record<number, number> = {
    1: 36,
    2: 28,
    3: 22,
    4: 18,
    5: 16,
    6: 16,
  };
  return sizes[level] ?? 16;
}

// Default font weights per heading level
function getDefaultFontWeight(level: number): number {
  return level === 1 ? 700 : 600;
}

export function HeadingStyleSettings({ level, currentStyle, onChange }: HeadingStyleSettingsProps) {
  // Get dynamic font/weight options from store
  const { availableFonts, availableFontWeights } = useStyleStore();

  // Memoize defaults based on level and available options
  const defaults = useMemo(() => ({
    fontFamily: availableFonts[0]?.value || 'Inter, sans-serif',
    fontSize: getDefaultFontSize(level),
    fontWeight: getDefaultFontWeight(level),
    letterSpacing: 0,
    lineHeight: 1.2,
    textColor: '#000000',
    backgroundColor: '',
  }), [level, availableFonts]);

  // Track if this is the initial mount (used to prevent emitting on first render)
  const isInitialMount = useRef(true);

  // Local state for form values - initialized from currentStyle or defaults
  // Use matching functions to handle font family and weight variations
  // IMPORTANT: Resolve CSS variables for colors so they display in color picker
  const [fontFamily, setFontFamily] = useState(() =>
    matchFontFamily(currentStyle?.fontFamily, availableFonts) || defaults.fontFamily
  );
  const [fontSize, setFontSize] = useState(currentStyle?.fontSize ?? defaults.fontSize);
  const [fontWeight, setFontWeight] = useState(() =>
    matchFontWeight(currentStyle?.fontWeight, defaults.fontWeight, availableFontWeights)
  );
  const [letterSpacing, setLetterSpacing] = useState(currentStyle?.letterSpacing ?? defaults.letterSpacing);
  const [lineHeight, setLineHeight] = useState(currentStyle?.lineHeight ?? defaults.lineHeight);
  const [textColor, setTextColor] = useState(() =>
    resolveCssVariable(currentStyle?.textColor) || defaults.textColor
  );
  const [backgroundColor, setBackgroundColor] = useState(() =>
    resolveCssVariable(currentStyle?.backgroundColor) || defaults.backgroundColor
  );
  const [bold, setBold] = useState(currentStyle?.bold ?? false);
  const [italic, setItalic] = useState(currentStyle?.italic ?? false);
  const [underline, setUnderline] = useState(currentStyle?.underline ?? false);
  const [strikethrough, setStrikethrough] = useState(currentStyle?.strikethrough ?? false);

  // Sync local state when currentStyle changes externally
  // IMPORTANT: Resolve CSS variables for colors so they display in color picker
  useEffect(() => {
    setFontFamily(matchFontFamily(currentStyle?.fontFamily, availableFonts) || defaults.fontFamily);
    setFontSize(currentStyle?.fontSize ?? defaults.fontSize);
    setFontWeight(matchFontWeight(currentStyle?.fontWeight, defaults.fontWeight, availableFontWeights));
    setLetterSpacing(currentStyle?.letterSpacing ?? defaults.letterSpacing);
    setLineHeight(currentStyle?.lineHeight ?? defaults.lineHeight);
    setTextColor(resolveCssVariable(currentStyle?.textColor) || defaults.textColor);
    setBackgroundColor(resolveCssVariable(currentStyle?.backgroundColor) || defaults.backgroundColor);
    setBold(currentStyle?.bold ?? false);
    setItalic(currentStyle?.italic ?? false);
    setUnderline(currentStyle?.underline ?? false);
    setStrikethrough(currentStyle?.strikethrough ?? false);
  }, [currentStyle, defaults, availableFonts, availableFontWeights]);

  // Emit changes whenever any value changes
  const emitChange = useCallback(() => {
    const style: HeadingCustomStyle = {
      fontFamily: fontFamily || null,
      fontSize: fontSize || null,
      fontWeight: fontWeight || null,
      letterSpacing: letterSpacing !== 0 ? letterSpacing : null,
      lineHeight: lineHeight !== 1.2 ? lineHeight : null,
      textColor: textColor || null,
      backgroundColor: backgroundColor || null,
      bold,
      italic,
      underline,
      strikethrough,
      divider: currentStyle?.divider ?? null, // Preserve existing divider
    };
    onChange(style);
  }, [fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, textColor, backgroundColor, bold, italic, underline, strikethrough, currentStyle?.divider, onChange]);

  // Emit changes when values change (skip initial mount to prevent double-emit)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    emitChange();
  }, [fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, textColor, backgroundColor, bold, italic, underline, strikethrough, emitChange]);

  return (
    <div className="heading-style-settings" onClick={(e) => e.stopPropagation()}>
      {/* Font Family */}
      <div className="style-setting-row">
        <label className="setting-label">Font</label>
        <select
          className="setting-select"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          {/* Show custom font option if current font isn't in available list */}
          {!availableFonts.some(f => f.value === fontFamily) && fontFamily && (
            <option key="custom" value={fontFamily}>
              {fontFamily.split(',')[0].replace(/['"]/g, '').trim()}
            </option>
          )}
          {availableFonts.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div className="style-setting-row">
        <label className="setting-label">Size</label>
        <div className="setting-input-group">
          <input
            type="number"
            className="setting-input"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value ? parseFloat(e.target.value) : defaults.fontSize)}
            min={8}
            max={200}
            step={1}
          />
          <span className="setting-unit">px</span>
        </div>
      </div>

      {/* Font Weight */}
      <div className="style-setting-row">
        <label className="setting-label">Weight</label>
        <select
          className="setting-select"
          value={fontWeight}
          onChange={(e) => setFontWeight(parseInt(e.target.value, 10))}
        >
          {availableFontWeights.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      </div>

      {/* Letter Spacing */}
      <div className="style-setting-row">
        <label className="setting-label">Char Spacing</label>
        <div className="setting-input-group">
          <input
            type="number"
            className="setting-input"
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(parseFloat(e.target.value) || 0)}
            min={-5}
            max={20}
            step={0.1}
          />
          <span className="setting-unit">px</span>
        </div>
      </div>

      {/* Line Height */}
      <div className="style-setting-row">
        <label className="setting-label">Line Height</label>
        <div className="setting-input-group">
          <input
            type="number"
            className="setting-input"
            value={lineHeight}
            onChange={(e) => setLineHeight(parseFloat(e.target.value) || 1.2)}
            min={0.5}
            max={3}
            step={0.1}
          />
          <span className="setting-unit">×</span>
        </div>
      </div>

      {/* Text Color */}
      <div className="style-setting-row">
        <label className="setting-label">Text Color</label>
        <div className="setting-input-group">
          <input
            type="color"
            className="color-picker"
            value={textColor || '#000000'}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </div>
      </div>

      {/* Background Color */}
      <div className="style-setting-row">
        <label className="setting-label">Background</label>
        <div className="setting-input-group">
          <input
            type="color"
            className="color-picker"
            value={backgroundColor || '#ffffff'}
            onChange={(e) => setBackgroundColor(e.target.value)}
          />
          {backgroundColor && (
            <button
              type="button"
              className="clear-color-button"
              onClick={() => setBackgroundColor('')}
              title="Clear background"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Text decoration toggles: Bold, Italic, Underline, Strikethrough */}
      <div className="style-setting-row">
        <label className="setting-label">Style</label>
        <div className="setting-options">
          <button
            type="button"
            className={`option-button ${bold ? 'active' : ''}`}
            onClick={() => setBold(!bold)}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`option-button ${italic ? 'active' : ''}`}
            onClick={() => setItalic(!italic)}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`option-button ${underline ? 'active' : ''}`}
            onClick={() => setUnderline(!underline)}
            title="Underline"
          >
            <span style={{ textDecoration: 'underline' }}>U</span>
          </button>
          <button
            type="button"
            className={`option-button ${strikethrough ? 'active' : ''}`}
            onClick={() => setStrikethrough(!strikethrough)}
            title="Strikethrough"
          >
            <span style={{ textDecoration: 'line-through' }}>S</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default HeadingStyleSettings;
