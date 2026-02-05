/**
 * Style Store - Type Definitions
 */

import type { Editor } from '@tiptap/core';

export type ThemeMode = 'light' | 'dark' | 'system';

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

export interface FormatPainterState {
  active: boolean;
  mode: 'toggle' | 'hold';
  storedFormat: StoredFormat | null;
}

export interface StyleState {
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

  // Configurable options (dynamic - user can modify)
  fontCategories: FontCategories;
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
