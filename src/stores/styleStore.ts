/**
 * Style Store - Zustand store for style state management
 *
 * Manages current presets, format painter state, recent presets, and custom styles.
 * Actions update both CSS variables (via presets.ts) and store state.
 */

import { create } from 'zustand';
import type { Editor } from '@tiptap/core';
import {
  applyTypographyPreset,
  applyColorPreset,
  applyCanvasPreset,
  applyLayoutPreset,
  applyMasterTheme,
  getMasterThemeById,
} from '../lib/presets';
import { useEditorStore } from './editorStore';

// ===== TYPES =====

export type ThemeMode = 'light' | 'dark' | 'system';

// ===== CONFIGURABLE OPTIONS (User can add/remove/reorder these) =====

export interface FontOption {
  value: string;    // CSS value, e.g., '"Source Sans 3", sans-serif'
  label: string;    // Display label, e.g., 'Source Sans 3'
}

export interface FontWeightOption {
  value: number;    // CSS font-weight value (100-900)
  label: string;    // Display label, e.g., 'Bold'
}

export interface ColorOption {
  value: string;    // Hex, HSL, or CSS variable
  label: string;    // Display label
}

// Categorized fonts for dropdowns with groupings
export interface FontCategories {
  sansSerif: FontOption[];
  serif: FontOption[];
  display: FontOption[];
  monospace: FontOption[];
}

export interface StoredFormat {
  marks: Array<{ type: string; attrs: Record<string, unknown> }>;
  textAlign: string | null;
}

export interface CustomStyle {
  id: string;
  name: string;
  typography: string;
  colors: string;
  canvas: string;
  layout: string;
  createdAt: string;
}

export interface HeadingSpacingConfig {
  before: number | null;
  after: number | null;
}

export interface HeadingDividerConfig {
  enabled: boolean;
  position: 'below' | 'above' | 'both';
  distance: number;              // line units (gap between text and line)
  color: string | null;          // null = use theme default (currentColor)
  thickness: number;             // 0.25-10px
  double: boolean;
  style: 'solid' | 'dashed' | 'dotted' | 'wavy' | 'zigzag' | 'gradient';
}

export interface HeadingCustomStyle {
  // Typography
  fontFamily: string | null;
  fontSize: number | null;        // in px
  fontWeight: number | null;      // 100-900
  letterSpacing: number | null;   // in px
  lineHeight: number | null;      // unitless ratio (e.g., 1.5)

  // Marks
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  textColor: string | null;
  backgroundColor: string | null; // Block background color

  // Divider
  divider: HeadingDividerConfig | null;
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface StyleMetadata {
  typography: string;
  colors: string;
  canvas: string;
  layout: string;
  masterTheme: string | null;
  themeMode: ThemeMode;
  paragraphSpacingBefore: number;
  paragraphSpacingAfter: number;
  headingSpacing?: {
    h1?: HeadingSpacingConfig;
    h2?: HeadingSpacingConfig;
    h3?: HeadingSpacingConfig;
    h4?: HeadingSpacingConfig;
    h5?: HeadingSpacingConfig;
    h6?: HeadingSpacingConfig;
  };
  headingCustomStyles?: {
    h1?: HeadingCustomStyle | null;
    h2?: HeadingCustomStyle | null;
    h3?: HeadingCustomStyle | null;
    h4?: HeadingCustomStyle | null;
    h5?: HeadingCustomStyle | null;
    h6?: HeadingCustomStyle | null;
  };
}

interface FormatPainterState {
  active: boolean;
  mode: 'toggle' | 'hold';
  storedFormat: StoredFormat | null;
}

interface StyleState {
  // Current active presets
  currentTypography: string;
  currentColor: string;
  currentCanvas: string;
  currentLayout: string;
  currentMasterTheme: string | null;
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';

  // Global paragraph spacing (in line units)
  paragraphSpacingBefore: number;
  paragraphSpacingAfter: number;

  // Per-heading type spacing overrides (null = use global)
  headingSpacing: {
    h1: { before: number | null; after: number | null };
    h2: { before: number | null; after: number | null };
    h3: { before: number | null; after: number | null };
    h4: { before: number | null; after: number | null };
    h5: { before: number | null; after: number | null };
    h6: { before: number | null; after: number | null };
  };

  // Per-heading custom styles (typography, marks, dividers)
  headingCustomStyles: {
    h1: HeadingCustomStyle | null;
    h2: HeadingCustomStyle | null;
    h3: HeadingCustomStyle | null;
    h4: HeadingCustomStyle | null;
    h5: HeadingCustomStyle | null;
    h6: HeadingCustomStyle | null;
  };

  // Recently used (max 5 each)
  recentTypography: string[];
  recentColors: string[];
  recentCanvas: string[];
  recentLayout: string[];
  recentMasterThemes: string[];

  // Format painter
  formatPainter: FormatPainterState;

  // Custom saved styles
  customStyles: CustomStyle[];

  // ===== CONFIGURABLE OPTIONS (Dynamic - user can modify) =====
  // Fonts organized by category for grouped dropdowns
  fontCategories: FontCategories;
  // Flat list of all fonts (computed from categories)
  availableFonts: FontOption[];
  availableFontWeights: FontWeightOption[];
  availableTextColors: ColorOption[];
  availableHighlightColors: ColorOption[];

  // Actions
  setTypography: (presetId: string) => void;
  setColor: (presetId: string) => void;
  setCanvas: (presetId: string) => void;
  setLayout: (presetId: string) => void;
  setMasterTheme: (themeId: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setEffectiveTheme: (theme: 'light' | 'dark') => void;
  setParagraphSpacingBefore: (spacing: number) => void;
  setParagraphSpacingAfter: (spacing: number) => void;
  setHeadingSpacingBefore: (level: 1 | 2 | 3 | 4 | 5 | 6, spacing: number) => void;
  setHeadingSpacingAfter: (level: 1 | 2 | 3 | 4 | 5 | 6, spacing: number) => void;
  clearAllSpacing: () => void;

  // Heading custom style actions
  assignStyleToHeading: (level: HeadingLevel, style: HeadingCustomStyle) => void;
  resetHeadingStyle: (level: HeadingLevel) => void;
  setHeadingDivider: (level: HeadingLevel, config: HeadingDividerConfig) => void;
  clearHeadingDivider: (level: HeadingLevel) => void;
  getHeadingCustomStyle: (level: HeadingLevel) => HeadingCustomStyle | null;

  // Format painter actions
  captureFormat: (editor: Editor) => void;
  applyFormat: (editor: Editor) => void;
  toggleFormatPainter: () => void;
  deactivateFormatPainter: () => void;
  setFormatPainterMode: (mode: 'toggle' | 'hold') => void;

  // Custom style actions
  saveCustomStyle: (name: string) => void;
  deleteCustomStyle: (id: string) => void;
  renameCustomStyle: (id: string, newName: string) => void;
  applyCustomStyle: (id: string) => void;

  // Bulk operations
  applyAllPresets: () => void;
  resetToDefaults: () => void;
  loadFromMetadata: (metadata: Partial<StyleMetadata>) => void;
  getStyleMetadata: () => StyleMetadata;

  // Configurable options actions
  addFont: (font: FontOption) => void;
  removeFont: (value: string) => void;
  reorderFonts: (fonts: FontOption[]) => void;
  addFontWeight: (weight: FontWeightOption) => void;
  removeFontWeight: (value: number) => void;
  addTextColor: (color: ColorOption) => void;
  removeTextColor: (value: string) => void;
  addHighlightColor: (color: ColorOption) => void;
  removeHighlightColor: (value: string) => void;
}

// ===== HELPERS =====

function addToRecent(arr: string[], id: string, max: number = 5): string[] {
  const filtered = arr.filter((item) => item !== id);
  return [id, ...filtered].slice(0, max);
}

function markDocumentDirty() {
  useEditorStore.getState().markDirty();
}

function getEffectiveTheme(mode: ThemeMode, systemTheme: 'light' | 'dark'): 'light' | 'dark' {
  if (mode === 'system') {
    return systemTheme;
  }
  return mode;
}

/**
 * Apply CSS variables for a heading custom style
 */
function applyHeadingCustomStyleCSS(level: HeadingLevel, style: HeadingCustomStyle) {
  const root = document.documentElement;
  const prefix = `--h${level}`;

  // Typography
  if (style.fontFamily !== null) {
    root.style.setProperty(`${prefix}-font-family`, style.fontFamily);
  } else {
    root.style.removeProperty(`${prefix}-font-family`);
  }

  if (style.fontSize !== null) {
    root.style.setProperty(`${prefix}-font-size`, `${style.fontSize}px`);
  } else {
    root.style.removeProperty(`${prefix}-font-size`);
  }

  // Font weight - use explicit value, or 700 if bold is set without explicit weight
  if (style.fontWeight !== null) {
    root.style.setProperty(`${prefix}-font-weight`, String(style.fontWeight));
  } else if (style.bold) {
    // Only use 700 for bold if no explicit weight was set
    root.style.setProperty(`${prefix}-font-weight`, '700');
  } else {
    root.style.removeProperty(`${prefix}-font-weight`);
  }

  if (style.letterSpacing !== null) {
    root.style.setProperty(`${prefix}-letter-spacing`, `${style.letterSpacing}px`);
  } else {
    root.style.removeProperty(`${prefix}-letter-spacing`);
  }

  if (style.lineHeight !== null) {
    root.style.setProperty(`${prefix}-line-height`, String(style.lineHeight));
  } else {
    root.style.removeProperty(`${prefix}-line-height`);
  }

  // Text color
  if (style.textColor !== null) {
    root.style.setProperty(`${prefix}-color`, style.textColor);
  } else {
    root.style.removeProperty(`${prefix}-color`);
  }

  // Italic
  if (style.italic) {
    root.style.setProperty(`${prefix}-font-style`, 'italic');
  } else {
    root.style.removeProperty(`${prefix}-font-style`);
  }

  // Text decoration (underline, strikethrough)
  const decorations: string[] = [];
  if (style.underline) decorations.push('underline');
  if (style.strikethrough) decorations.push('line-through');
  if (decorations.length > 0) {
    root.style.setProperty(`${prefix}-text-decoration`, decorations.join(' '));
  } else {
    root.style.removeProperty(`${prefix}-text-decoration`);
  }

  // Background color
  if (style.backgroundColor !== null) {
    root.style.setProperty(`${prefix}-background-color`, style.backgroundColor);
  } else {
    root.style.removeProperty(`${prefix}-background-color`);
  }

  // Divider
  if (style.divider?.enabled) {
    const div = style.divider;
    root.style.setProperty(`${prefix}-divider-enabled`, '1');
    root.style.setProperty(`${prefix}-divider-position`, div.position);
    root.style.setProperty(`${prefix}-divider-distance`, `${div.distance}em`);
    root.style.setProperty(`${prefix}-divider-color`, div.color || 'currentColor');
    root.style.setProperty(`${prefix}-divider-thickness`, `${div.thickness}px`);
    root.style.setProperty(`${prefix}-divider-double`, div.double ? '1' : '0');
    root.style.setProperty(`${prefix}-divider-style`, div.double ? 'double' : div.style);

    // Set display properties for ::before and ::after based on position
    const showBefore = div.position === 'above' || div.position === 'both';
    const showAfter = div.position === 'below' || div.position === 'both';
    root.style.setProperty(`${prefix}-divider-show-before`, showBefore ? 'block' : 'none');
    root.style.setProperty(`${prefix}-divider-show-after`, showAfter ? 'block' : 'none');
  } else {
    clearHeadingDividerCSS(level);
  }
}

/**
 * Clear all CSS variables for a heading custom style
 */
function clearHeadingCustomStyleCSS(level: HeadingLevel) {
  const root = document.documentElement;
  const prefix = `--h${level}`;

  // Typography
  root.style.removeProperty(`${prefix}-font-family`);
  root.style.removeProperty(`${prefix}-font-size`);
  root.style.removeProperty(`${prefix}-font-weight`);
  root.style.removeProperty(`${prefix}-letter-spacing`);
  root.style.removeProperty(`${prefix}-line-height`);
  root.style.removeProperty(`${prefix}-color`);
  root.style.removeProperty(`${prefix}-font-style`);
  root.style.removeProperty(`${prefix}-text-decoration`);
  root.style.removeProperty(`${prefix}-background-color`);

  // Divider
  clearHeadingDividerCSS(level);
}

/**
 * Clear divider CSS variables for a heading level
 */
function clearHeadingDividerCSS(level: HeadingLevel) {
  const root = document.documentElement;
  const prefix = `--h${level}`;

  root.style.removeProperty(`${prefix}-divider-enabled`);
  root.style.removeProperty(`${prefix}-divider-position`);
  root.style.removeProperty(`${prefix}-divider-distance`);
  root.style.removeProperty(`${prefix}-divider-color`);
  root.style.removeProperty(`${prefix}-divider-thickness`);
  root.style.removeProperty(`${prefix}-divider-double`);
  root.style.removeProperty(`${prefix}-divider-style`);
  root.style.removeProperty(`${prefix}-divider-show-before`);
  root.style.removeProperty(`${prefix}-divider-show-after`);
}

// ===== DEFAULT CONFIGURABLE OPTIONS =====
// These are the default values - users can modify via settings

const DEFAULT_FONT_CATEGORIES: FontCategories = {
  sansSerif: [
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: '"Open Sans", sans-serif', label: 'Open Sans' },
    { value: 'Lato, sans-serif', label: 'Lato' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat' },
    { value: 'Poppins, sans-serif', label: 'Poppins' },
    { value: '"Source Sans 3", sans-serif', label: 'Source Sans 3' },
    { value: 'Nunito, sans-serif', label: 'Nunito' },
    { value: 'Raleway, sans-serif', label: 'Raleway' },
    { value: '"Work Sans", sans-serif', label: 'Work Sans' },
  ],
  serif: [
    { value: '"Playfair Display", serif', label: 'Playfair Display' },
    { value: 'Merriweather, serif', label: 'Merriweather' },
    { value: 'Lora, serif', label: 'Lora' },
    { value: '"PT Serif", serif', label: 'PT Serif' },
    { value: '"Libre Baskerville", serif', label: 'Libre Baskerville' },
    { value: '"Crimson Text", serif', label: 'Crimson Text' },
    { value: 'Bitter, serif', label: 'Bitter' },
    { value: '"Source Serif 4", serif', label: 'Source Serif 4' },
    { value: '"Noto Serif", serif', label: 'Noto Serif' },
    { value: '"EB Garamond", serif', label: 'EB Garamond' },
  ],
  display: [
    { value: 'Oswald, sans-serif', label: 'Oswald' },
    { value: '"Bebas Neue", sans-serif', label: 'Bebas Neue' },
    { value: 'Anton, sans-serif', label: 'Anton' },
    { value: '"Abril Fatface", serif', label: 'Abril Fatface' },
    { value: 'Righteous, sans-serif', label: 'Righteous' },
  ],
  monospace: [
    { value: '"Fira Code", monospace', label: 'Fira Code' },
    { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
    { value: '"Source Code Pro", monospace', label: 'Source Code Pro' },
    { value: '"IBM Plex Mono", monospace', label: 'IBM Plex Mono' },
    { value: '"Roboto Mono", monospace', label: 'Roboto Mono' },
  ],
};

const DEFAULT_FONT_WEIGHTS: FontWeightOption[] = [
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

const DEFAULT_TEXT_COLORS: ColorOption[] = [
  { value: 'var(--tt-color-text-red)', label: 'Red' },
  { value: 'var(--tt-color-text-orange)', label: 'Orange' },
  { value: 'var(--tt-color-text-yellow)', label: 'Yellow' },
  { value: 'var(--tt-color-text-green)', label: 'Green' },
  { value: 'var(--tt-color-text-blue)', label: 'Blue' },
  { value: 'var(--tt-color-text-purple)', label: 'Purple' },
  { value: 'var(--tt-color-text-pink)', label: 'Pink' },
  { value: 'var(--tt-color-text-gray)', label: 'Gray' },
];

const DEFAULT_HIGHLIGHT_COLORS: ColorOption[] = [
  { value: 'var(--tt-color-highlight-red)', label: 'Red' },
  { value: 'var(--tt-color-highlight-orange)', label: 'Orange' },
  { value: 'var(--tt-color-highlight-yellow)', label: 'Yellow' },
  { value: 'var(--tt-color-highlight-green)', label: 'Green' },
  { value: 'var(--tt-color-highlight-blue)', label: 'Blue' },
  { value: 'var(--tt-color-highlight-purple)', label: 'Purple' },
  { value: 'var(--tt-color-highlight-pink)', label: 'Pink' },
  { value: 'var(--tt-color-highlight-gray)', label: 'Gray' },
];

// Helper to flatten font categories
function flattenFontCategories(cats: FontCategories): FontOption[] {
  return [...cats.sansSerif, ...cats.serif, ...cats.display, ...cats.monospace];
}

// ===== STORE =====

export const useStyleStore = create<StyleState>((set, get) => ({
  // Initial state - defaults
  currentTypography: 'default',
  currentColor: 'default',
  currentCanvas: 'white',
  currentLayout: 'default',
  currentMasterTheme: null,
  themeMode: 'system',
  effectiveTheme: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',

  // Global paragraph spacing defaults (in line units)
  paragraphSpacingBefore: 0,
  paragraphSpacingAfter: 0.5,

  // Per-heading spacing (null = use global)
  headingSpacing: {
    h1: { before: null, after: null },
    h2: { before: null, after: null },
    h3: { before: null, after: null },
    h4: { before: null, after: null },
    h5: { before: null, after: null },
    h6: { before: null, after: null },
  },

  // Per-heading custom styles (null = use defaults)
  headingCustomStyles: {
    h1: null,
    h2: null,
    h3: null,
    h4: null,
    h5: null,
    h6: null,
  },

  recentTypography: [],
  recentColors: [],
  recentCanvas: [],
  recentLayout: [],
  recentMasterThemes: [],

  formatPainter: {
    active: false,
    mode: 'toggle',
    storedFormat: null,
  },

  customStyles: [],

  // ===== CONFIGURABLE OPTIONS - Default values (user can modify) =====
  fontCategories: DEFAULT_FONT_CATEGORIES,
  availableFonts: flattenFontCategories(DEFAULT_FONT_CATEGORIES),
  availableFontWeights: DEFAULT_FONT_WEIGHTS,
  availableTextColors: DEFAULT_TEXT_COLORS,
  availableHighlightColors: DEFAULT_HIGHLIGHT_COLORS,

  // ===== PRESET SETTERS =====

  setTypography: (presetId) => {
    applyTypographyPreset(presetId);
    set((state) => ({
      currentTypography: presetId,
      currentMasterTheme: null, // Now custom
      recentTypography: addToRecent(state.recentTypography, presetId),
    }));
    markDocumentDirty();
  },

  setColor: (presetId) => {
    const { effectiveTheme } = get();
    applyColorPreset(presetId, effectiveTheme);
    set((state) => ({
      currentColor: presetId,
      currentMasterTheme: null,
      recentColors: addToRecent(state.recentColors, presetId),
    }));
    markDocumentDirty();
  },

  setCanvas: (presetId) => {
    const { effectiveTheme } = get();
    applyCanvasPreset(presetId, effectiveTheme);
    set((state) => ({
      currentCanvas: presetId,
      currentMasterTheme: null,
      recentCanvas: addToRecent(state.recentCanvas, presetId),
    }));
    markDocumentDirty();
  },

  setLayout: (presetId) => {
    applyLayoutPreset(presetId);
    set((state) => ({
      currentLayout: presetId,
      currentMasterTheme: null,
      recentLayout: addToRecent(state.recentLayout, presetId),
    }));
    markDocumentDirty();
  },

  setMasterTheme: (themeId) => {
    const { effectiveTheme } = get();
    const theme = getMasterThemeById(themeId);
    if (!theme) {
      console.warn(`[StyleStore] Master theme not found: ${themeId}`);
      return;
    }

    applyMasterTheme(themeId, effectiveTheme);
    set((state) => ({
      currentTypography: theme.typography,
      currentColor: theme.colors,
      currentCanvas: theme.canvas,
      currentLayout: theme.layout,
      currentMasterTheme: themeId,
      recentMasterThemes: addToRecent(state.recentMasterThemes, themeId),
    }));
    markDocumentDirty();
  },

  setThemeMode: (mode) => {
    const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const effective = getEffectiveTheme(mode, systemTheme);

    // Update document attribute
    document.documentElement.dataset.theme = effective;

    // Re-apply color and canvas presets for new mode
    const { currentColor, currentCanvas } = get();
    applyColorPreset(currentColor, effective);
    applyCanvasPreset(currentCanvas, effective);

    set({
      themeMode: mode,
      effectiveTheme: effective,
    });
    markDocumentDirty();
  },

  setEffectiveTheme: (theme) => {
    document.documentElement.dataset.theme = theme;

    // Re-apply color and canvas presets for new mode
    const { currentColor, currentCanvas } = get();
    applyColorPreset(currentColor, theme);
    applyCanvasPreset(currentCanvas, theme);

    set({ effectiveTheme: theme });
  },

  setParagraphSpacingBefore: (spacing) => {
    const BASE_LINE_HEIGHT = 24; // pixels per line unit
    const px = spacing * BASE_LINE_HEIGHT;
    document.documentElement.style.setProperty('--paragraph-spacing-before', `${px}px`);
    set({ paragraphSpacingBefore: spacing });
    markDocumentDirty();
  },

  setParagraphSpacingAfter: (spacing) => {
    const BASE_LINE_HEIGHT = 24; // pixels per line unit
    const px = spacing * BASE_LINE_HEIGHT;
    document.documentElement.style.setProperty('--paragraph-spacing-after', `${px}px`);
    set({ paragraphSpacingAfter: spacing });
    markDocumentDirty();
  },

  setHeadingSpacingBefore: (level, spacing) => {
    const BASE_LINE_HEIGHT = 24;
    const px = spacing * BASE_LINE_HEIGHT;
    const key = `h${level}` as keyof StyleState['headingSpacing'];
    document.documentElement.style.setProperty(`--h${level}-spacing-before`, `${px}px`);
    set((state) => ({
      headingSpacing: {
        ...state.headingSpacing,
        [key]: { ...state.headingSpacing[key], before: spacing },
      },
    }));
    markDocumentDirty();
  },

  setHeadingSpacingAfter: (level, spacing) => {
    const BASE_LINE_HEIGHT = 24;
    const px = spacing * BASE_LINE_HEIGHT;
    const key = `h${level}` as keyof StyleState['headingSpacing'];
    document.documentElement.style.setProperty(`--h${level}-spacing-after`, `${px}px`);
    set((state) => ({
      headingSpacing: {
        ...state.headingSpacing,
        [key]: { ...state.headingSpacing[key], after: spacing },
      },
    }));
    markDocumentDirty();
  },

  clearAllSpacing: () => {
    const BASE_LINE_HEIGHT = 24;
    // Reset global to defaults
    document.documentElement.style.setProperty('--paragraph-spacing-before', '0px');
    document.documentElement.style.setProperty('--paragraph-spacing-after', `${0.5 * BASE_LINE_HEIGHT}px`);
    // Clear all per-heading overrides
    for (let i = 1; i <= 6; i++) {
      document.documentElement.style.removeProperty(`--h${i}-spacing-before`);
      document.documentElement.style.removeProperty(`--h${i}-spacing-after`);
    }
    set({
      paragraphSpacingBefore: 0,
      paragraphSpacingAfter: 0.5,
      headingSpacing: {
        h1: { before: null, after: null },
        h2: { before: null, after: null },
        h3: { before: null, after: null },
        h4: { before: null, after: null },
        h5: { before: null, after: null },
        h6: { before: null, after: null },
      },
    });
    markDocumentDirty();
  },

  // ===== HEADING CUSTOM STYLES =====

  assignStyleToHeading: (level, style) => {
    const key = `h${level}` as keyof StyleState['headingCustomStyles'];

    console.log('[styleStore.assignStyleToHeading] level:', level, 'key:', key);
    console.log('[styleStore.assignStyleToHeading] style being saved:', JSON.stringify(style, null, 2));

    // Apply CSS variables for this heading level
    applyHeadingCustomStyleCSS(level, style);

    set((state) => {
      const newState = {
        headingCustomStyles: {
          ...state.headingCustomStyles,
          [key]: style,
        },
      };
      console.log('[styleStore.assignStyleToHeading] new headingCustomStyles:', JSON.stringify(newState.headingCustomStyles, null, 2));
      return newState;
    });
    markDocumentDirty();
  },

  resetHeadingStyle: (level) => {
    const key = `h${level}` as keyof StyleState['headingCustomStyles'];

    // Clear CSS variables for this heading level
    clearHeadingCustomStyleCSS(level);

    set((state) => ({
      headingCustomStyles: {
        ...state.headingCustomStyles,
        [key]: null,
      },
    }));
    markDocumentDirty();
  },

  setHeadingDivider: (level, config) => {
    const key = `h${level}` as keyof StyleState['headingCustomStyles'];
    const currentStyle = get().headingCustomStyles[key];

    const newStyle: HeadingCustomStyle = currentStyle
      ? { ...currentStyle, divider: config }
      : {
          fontFamily: null,
          fontSize: null,
          fontWeight: null,
          letterSpacing: null,
          lineHeight: null,
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          textColor: null,
          backgroundColor: null,
          divider: config,
        };

    applyHeadingCustomStyleCSS(level, newStyle);

    set((state) => ({
      headingCustomStyles: {
        ...state.headingCustomStyles,
        [key]: newStyle,
      },
    }));
    markDocumentDirty();
  },

  clearHeadingDivider: (level) => {
    const key = `h${level}` as keyof StyleState['headingCustomStyles'];
    const currentStyle = get().headingCustomStyles[key];

    if (!currentStyle) return;

    // If divider is the only thing set, clear the entire style
    const hasOtherStyles =
      currentStyle.fontFamily !== null ||
      currentStyle.fontSize !== null ||
      currentStyle.fontWeight !== null ||
      currentStyle.letterSpacing !== null ||
      currentStyle.lineHeight !== null ||
      currentStyle.bold ||
      currentStyle.italic ||
      currentStyle.textColor !== null;

    if (hasOtherStyles) {
      const newStyle = { ...currentStyle, divider: null };
      applyHeadingCustomStyleCSS(level, newStyle);
      set((state) => ({
        headingCustomStyles: {
          ...state.headingCustomStyles,
          [key]: newStyle,
        },
      }));
    } else {
      clearHeadingCustomStyleCSS(level);
      set((state) => ({
        headingCustomStyles: {
          ...state.headingCustomStyles,
          [key]: null,
        },
      }));
    }
    markDocumentDirty();
  },

  getHeadingCustomStyle: (level) => {
    const key = `h${level}` as keyof StyleState['headingCustomStyles'];
    const style = get().headingCustomStyles[key];
    console.log('[styleStore.getHeadingCustomStyle] level:', level, 'key:', key, 'style:', style);
    return style;
  },

  // ===== FORMAT PAINTER =====

  captureFormat: (editor) => {
    const { state } = editor;
    const { from, to } = state.selection;

    if (from === to) {
      return;
    }

    // Get marks from selection - deduplicate by type+attrs
    const markMap = new Map<string, { type: string; attrs: Record<string, unknown> }>();
    state.doc.nodesBetween(from, to, (node) => {
      node.marks.forEach((mark) => {
        const key = `${mark.type.name}:${JSON.stringify(mark.attrs)}`;
        if (!markMap.has(key)) {
          markMap.set(key, {
            type: mark.type.name,
            attrs: { ...mark.attrs },
          });
        }
      });
    });
    const marks = Array.from(markMap.values());

    // Get text align from first paragraph
    let textAlign: string | null = null;
    state.doc.nodesBetween(from, to, (node) => {
      if (node.type.name === 'paragraph' && node.attrs.textAlign && !textAlign) {
        textAlign = node.attrs.textAlign;
      }
    });

    console.log('[FormatPainter] Captured marks:', marks, 'textAlign:', textAlign);

    set({
      formatPainter: {
        active: true,
        mode: 'toggle',
        storedFormat: { marks, textAlign },
      },
    });
  },

  applyFormat: (editor) => {
    const { formatPainter } = get();
    if (!formatPainter.active || !formatPainter.storedFormat) {
      return;
    }

    const { marks, textAlign } = formatPainter.storedFormat;
    const { from, to } = editor.state.selection;

    if (from === to) {
      return; // No selection to apply to
    }

    console.log('[FormatPainter] Applying marks:', marks, 'textAlign:', textAlign);

    // Build a single chain for all operations
    let chain = editor.chain().focus();

    // Remove all marks first
    chain = chain.unsetAllMarks();

    // Apply stored marks using specific commands where available
    marks.forEach(({ type, attrs }) => {
      console.log('[FormatPainter] Applying mark:', type, attrs);

      // Handle specific mark types with their dedicated commands
      if (type === 'bold') {
        chain = chain.setBold();
      } else if (type === 'italic') {
        chain = chain.setItalic();
      } else if (type === 'underline') {
        chain = chain.setUnderline();
      } else if (type === 'strike') {
        chain = chain.setStrike();
      } else if (type === 'code') {
        chain = chain.setCode();
      } else if (type === 'textStyle') {
        // Handle textStyle attributes individually
        if (attrs.color) {
          chain = chain.setColor(attrs.color as string);
        }
        if (attrs.fontFamily) {
          chain = chain.setFontFamily(attrs.fontFamily as string);
        }
        if (attrs.fontSize) {
          chain = chain.setFontSize(attrs.fontSize as string);
        }
        if (attrs.fontWeight) {
          chain = chain.setFontWeight(attrs.fontWeight as string);
        }
        if (attrs.lineHeight) {
          chain = chain.setLineHeight(attrs.lineHeight as string);
        }
        if (attrs.letterSpacing) {
          chain = chain.setLetterSpacing(attrs.letterSpacing as string);
        }
      } else if (type === 'highlight') {
        if (attrs.color) {
          chain = chain.setHighlight({ color: attrs.color as string });
        }
      } else if (type === 'link') {
        if (attrs.href) {
          chain = chain.setLink({ href: attrs.href as string, target: attrs.target as string });
        }
      } else {
        // Fallback to generic setMark for other types
        const markType = editor.schema.marks[type];
        if (markType) {
          chain = chain.setMark(type, attrs);
        }
      }
    });

    // Run the chain
    chain.run();

    // Apply text align separately (it's a node attribute, not a mark)
    if (textAlign) {
      editor.chain().focus().setTextAlign(textAlign).run();
    }

    // If toggle mode, deactivate after one use
    if (formatPainter.mode === 'toggle') {
      set({
        formatPainter: {
          ...formatPainter,
          active: false,
        },
      });
    }
  },

  toggleFormatPainter: () => {
    set((state) => ({
      formatPainter: {
        ...state.formatPainter,
        active: !state.formatPainter.active,
      },
    }));
  },

  deactivateFormatPainter: () => {
    set((state) => ({
      formatPainter: {
        ...state.formatPainter,
        active: false,
        storedFormat: null,
      },
    }));
  },

  setFormatPainterMode: (mode) => {
    set((state) => ({
      formatPainter: {
        ...state.formatPainter,
        mode,
      },
    }));
  },

  // ===== CUSTOM STYLES =====

  saveCustomStyle: (name) => {
    const { currentTypography, currentColor, currentCanvas, currentLayout } = get();

    const newStyle: CustomStyle = {
      id: `custom-${Date.now()}`,
      name,
      typography: currentTypography,
      colors: currentColor,
      canvas: currentCanvas,
      layout: currentLayout,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      customStyles: [...state.customStyles, newStyle],
    }));
  },

  deleteCustomStyle: (id) => {
    set((state) => ({
      customStyles: state.customStyles.filter((s) => s.id !== id),
    }));
  },

  renameCustomStyle: (id, newName) => {
    set((state) => ({
      customStyles: state.customStyles.map((s) =>
        s.id === id ? { ...s, name: newName } : s
      ),
    }));
  },

  applyCustomStyle: (id) => {
    const { customStyles, effectiveTheme } = get();
    const style = customStyles.find((s) => s.id === id);
    if (!style) return;

    applyTypographyPreset(style.typography);
    applyColorPreset(style.colors, effectiveTheme);
    applyCanvasPreset(style.canvas, effectiveTheme);
    applyLayoutPreset(style.layout);

    set({
      currentTypography: style.typography,
      currentColor: style.colors,
      currentCanvas: style.canvas,
      currentLayout: style.layout,
      currentMasterTheme: null,
    });
    markDocumentDirty();
  },

  // ===== BULK OPERATIONS =====

  applyAllPresets: () => {
    const { currentTypography, currentColor, currentCanvas, currentLayout, effectiveTheme, paragraphSpacingBefore, paragraphSpacingAfter, headingSpacing } = get();
    applyTypographyPreset(currentTypography);
    applyColorPreset(currentColor, effectiveTheme);
    applyCanvasPreset(currentCanvas, effectiveTheme);
    applyLayoutPreset(currentLayout);

    // Apply paragraph spacing CSS variables
    const BASE_LINE_HEIGHT = 24;
    document.documentElement.style.setProperty('--paragraph-spacing-before', `${paragraphSpacingBefore * BASE_LINE_HEIGHT}px`);
    document.documentElement.style.setProperty('--paragraph-spacing-after', `${paragraphSpacingAfter * BASE_LINE_HEIGHT}px`);

    // Apply per-heading spacing overrides
    const levels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
    levels.forEach((key) => {
      const spacing = headingSpacing[key];
      if (spacing.before !== null) {
        document.documentElement.style.setProperty(`--${key}-spacing-before`, `${spacing.before * BASE_LINE_HEIGHT}px`);
      }
      if (spacing.after !== null) {
        document.documentElement.style.setProperty(`--${key}-spacing-after`, `${spacing.after * BASE_LINE_HEIGHT}px`);
      }
    });
  },

  resetToDefaults: () => {
    const effectiveTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    applyTypographyPreset('default');
    applyColorPreset('default', effectiveTheme);
    applyCanvasPreset('white', effectiveTheme);
    applyLayoutPreset('default');

    // Reset paragraph spacing CSS variables
    const BASE_LINE_HEIGHT = 24;
    document.documentElement.style.setProperty('--paragraph-spacing-before', '0px');
    document.documentElement.style.setProperty('--paragraph-spacing-after', `${0.5 * BASE_LINE_HEIGHT}px`);

    // Clear all per-heading overrides
    for (let i = 1; i <= 6; i++) {
      document.documentElement.style.removeProperty(`--h${i}-spacing-before`);
      document.documentElement.style.removeProperty(`--h${i}-spacing-after`);
    }

    set({
      currentTypography: 'default',
      currentColor: 'default',
      currentCanvas: 'white',
      currentLayout: 'default',
      currentMasterTheme: null,
      themeMode: 'system',
      effectiveTheme,
      paragraphSpacingBefore: 0,
      paragraphSpacingAfter: 0.5,
      headingSpacing: {
        h1: { before: null, after: null },
        h2: { before: null, after: null },
        h3: { before: null, after: null },
        h4: { before: null, after: null },
        h5: { before: null, after: null },
        h6: { before: null, after: null },
      },
    });
  },

  loadFromMetadata: (metadata) => {
    const { effectiveTheme, setParagraphSpacingBefore, setParagraphSpacingAfter, setHeadingSpacingBefore, setHeadingSpacingAfter } = get();

    // Apply presets from metadata, falling back to defaults
    const typography = metadata.typography ?? 'default';
    const colors = metadata.colors ?? 'default';
    const canvas = metadata.canvas ?? 'white';
    const layout = metadata.layout ?? 'default';
    const masterTheme = metadata.masterTheme ?? null;
    const themeMode = metadata.themeMode ?? 'system';
    const spacingBefore = metadata.paragraphSpacingBefore ?? 0;
    const spacingAfter = metadata.paragraphSpacingAfter ?? 0.5;

    applyTypographyPreset(typography);
    applyColorPreset(colors, effectiveTheme);
    applyCanvasPreset(canvas, effectiveTheme);
    applyLayoutPreset(layout);

    // Apply paragraph spacing (this sets CSS variables)
    setParagraphSpacingBefore(spacingBefore);
    setParagraphSpacingAfter(spacingAfter);

    // Apply per-heading spacing if present
    if (metadata.headingSpacing) {
      const levels = [1, 2, 3, 4, 5, 6] as const;
      levels.forEach((level) => {
        const key = `h${level}` as keyof NonNullable<typeof metadata.headingSpacing>;
        const spacing = metadata.headingSpacing?.[key];
        if (spacing?.before !== null && spacing?.before !== undefined) {
          setHeadingSpacingBefore(level, spacing.before);
        }
        if (spacing?.after !== null && spacing?.after !== undefined) {
          setHeadingSpacingAfter(level, spacing.after);
        }
      });
    }

    // Apply per-heading custom styles if present
    const headingCustomStylesData: StyleState['headingCustomStyles'] = {
      h1: metadata.headingCustomStyles?.h1 ?? null,
      h2: metadata.headingCustomStyles?.h2 ?? null,
      h3: metadata.headingCustomStyles?.h3 ?? null,
      h4: metadata.headingCustomStyles?.h4 ?? null,
      h5: metadata.headingCustomStyles?.h5 ?? null,
      h6: metadata.headingCustomStyles?.h6 ?? null,
    };

    // Apply CSS for any custom styles present
    const levels = [1, 2, 3, 4, 5, 6] as const;
    levels.forEach((level) => {
      const key = `h${level}` as keyof typeof headingCustomStylesData;
      const style = headingCustomStylesData[key];
      if (style) {
        applyHeadingCustomStyleCSS(level, style);
      }
    });

    set({
      currentTypography: typography,
      currentColor: colors,
      currentCanvas: canvas,
      currentLayout: layout,
      currentMasterTheme: masterTheme,
      themeMode,
      headingCustomStyles: headingCustomStylesData,
    });
  },

  getStyleMetadata: () => {
    const {
      currentTypography,
      currentColor,
      currentCanvas,
      currentLayout,
      currentMasterTheme,
      themeMode,
      paragraphSpacingBefore,
      paragraphSpacingAfter,
      headingSpacing,
      headingCustomStyles,
    } = get();

    return {
      typography: currentTypography,
      colors: currentColor,
      canvas: currentCanvas,
      layout: currentLayout,
      masterTheme: currentMasterTheme,
      themeMode,
      paragraphSpacingBefore,
      paragraphSpacingAfter,
      headingSpacing,
      headingCustomStyles,
    };
  },

  // ===== CONFIGURABLE OPTIONS ACTIONS =====

  addFont: (font) => {
    set((state) => ({
      availableFonts: [...state.availableFonts, font],
    }));
  },

  removeFont: (value) => {
    set((state) => ({
      availableFonts: state.availableFonts.filter((f) => f.value !== value),
    }));
  },

  reorderFonts: (fonts) => {
    set({ availableFonts: fonts });
  },

  addFontWeight: (weight) => {
    set((state) => ({
      availableFontWeights: [...state.availableFontWeights, weight].sort((a, b) => a.value - b.value),
    }));
  },

  removeFontWeight: (value) => {
    set((state) => ({
      availableFontWeights: state.availableFontWeights.filter((w) => w.value !== value),
    }));
  },

  addTextColor: (color) => {
    set((state) => ({
      availableTextColors: [...state.availableTextColors, color],
    }));
  },

  removeTextColor: (value) => {
    set((state) => ({
      availableTextColors: state.availableTextColors.filter((c) => c.value !== value),
    }));
  },

  addHighlightColor: (color) => {
    set((state) => ({
      availableHighlightColors: [...state.availableHighlightColors, color],
    }));
  },

  removeHighlightColor: (value) => {
    set((state) => ({
      availableHighlightColors: state.availableHighlightColors.filter((c) => c.value !== value),
    }));
  },
}));
