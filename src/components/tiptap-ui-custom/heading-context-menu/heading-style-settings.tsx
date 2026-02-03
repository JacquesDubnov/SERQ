/**
 * HeadingStyleSettings - Inline typography customization panel
 *
 * Shown when "Customize Style" is clicked in the heading context menu.
 * Allows direct configuration of heading typography.
 *
 * Shows current assigned values when a style already exists.
 */

import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import type { HeadingCustomStyle } from '@/stores/styleStore';

// Common font families
const FONT_FAMILIES = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Merriweather, serif', label: 'Merriweather' },
  { value: 'Playfair Display, serif', label: 'Playfair' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Source Sans Pro, sans-serif', label: 'Source Sans' },
  { value: 'ui-monospace, monospace', label: 'Monospace' },
];

const FONT_WEIGHTS = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extralight' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extrabold' },
  { value: 900, label: 'Black' },
];

/**
 * Try to match a font family string to a FONT_FAMILIES value.
 * Handles cases like "Merriweather" matching "Merriweather, serif"
 */
function matchFontFamily(family: string | null | undefined): string {
  if (!family) return FONT_FAMILIES[0].value;

  // Direct match
  const directMatch = FONT_FAMILIES.find(f => f.value === family);
  if (directMatch) return directMatch.value;

  // Partial match - check if the family name starts with any of our font names
  const cleanFamily = family.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
  const partialMatch = FONT_FAMILIES.find(f => {
    const fontName = f.value.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
    return fontName === cleanFamily || cleanFamily.includes(fontName) || fontName.includes(cleanFamily);
  });
  if (partialMatch) return partialMatch.value;

  // No match - return the original value (custom font)
  return family;
}

/**
 * Find the closest font weight option
 */
function matchFontWeight(weight: number | null | undefined, defaultWeight: number): number {
  if (weight === null || weight === undefined) return defaultWeight;

  // Direct match
  const directMatch = FONT_WEIGHTS.find(w => w.value === weight);
  if (directMatch) return directMatch.value;

  // Find closest weight
  let closest = FONT_WEIGHTS[0].value;
  let minDiff = Math.abs(weight - closest);
  for (const w of FONT_WEIGHTS) {
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
  // Memoize defaults based on level
  const defaults = useMemo(() => ({
    fontFamily: 'Inter, sans-serif',
    fontSize: getDefaultFontSize(level),
    fontWeight: getDefaultFontWeight(level),
    letterSpacing: 0,
    lineHeight: 1.2,
    textColor: '#000000',
    backgroundColor: '',
  }), [level]);

  // Track if this is the initial mount (used to prevent emitting on first render)
  const isInitialMount = useRef(true);

  // Local state for form values - initialized from currentStyle or defaults
  // Use matching functions to handle font family and weight variations
  const [fontFamily, setFontFamily] = useState(() =>
    matchFontFamily(currentStyle?.fontFamily) || defaults.fontFamily
  );
  const [fontSize, setFontSize] = useState(currentStyle?.fontSize ?? defaults.fontSize);
  const [fontWeight, setFontWeight] = useState(() =>
    matchFontWeight(currentStyle?.fontWeight, defaults.fontWeight)
  );
  const [letterSpacing, setLetterSpacing] = useState(currentStyle?.letterSpacing ?? defaults.letterSpacing);
  const [lineHeight, setLineHeight] = useState(currentStyle?.lineHeight ?? defaults.lineHeight);
  const [textColor, setTextColor] = useState(currentStyle?.textColor || defaults.textColor);
  const [backgroundColor, setBackgroundColor] = useState(currentStyle?.backgroundColor || defaults.backgroundColor);
  const [bold, setBold] = useState(currentStyle?.bold ?? false);
  const [italic, setItalic] = useState(currentStyle?.italic ?? false);
  const [underline, setUnderline] = useState(currentStyle?.underline ?? false);
  const [strikethrough, setStrikethrough] = useState(currentStyle?.strikethrough ?? false);

  // Sync local state when currentStyle changes externally
  useEffect(() => {
    setFontFamily(matchFontFamily(currentStyle?.fontFamily) || defaults.fontFamily);
    setFontSize(currentStyle?.fontSize ?? defaults.fontSize);
    setFontWeight(matchFontWeight(currentStyle?.fontWeight, defaults.fontWeight));
    setLetterSpacing(currentStyle?.letterSpacing ?? defaults.letterSpacing);
    setLineHeight(currentStyle?.lineHeight ?? defaults.lineHeight);
    setTextColor(currentStyle?.textColor || defaults.textColor);
    setBackgroundColor(currentStyle?.backgroundColor || defaults.backgroundColor);
    setBold(currentStyle?.bold ?? false);
    setItalic(currentStyle?.italic ?? false);
    setUnderline(currentStyle?.underline ?? false);
    setStrikethrough(currentStyle?.strikethrough ?? false);
  }, [currentStyle, defaults]);

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
          {FONT_FAMILIES.map((f) => (
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
          {FONT_WEIGHTS.map((w) => (
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
