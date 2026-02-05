/**
 * Style Store - Zustand store for style state management
 *
 * Manages current presets, format painter state, recent presets, and custom styles.
 * Actions update both CSS variables (via presets.ts) and store state.
 */

import { create } from 'zustand';
import {
  applyTypographyPreset,
  applyColorPreset,
  applyCanvasPreset,
  applyLayoutPreset,
  applyMasterTheme,
  getMasterThemeById,
} from '../../lib/presets';
import { useEditorStore } from '../editorStore';

import type { StyleState, HeadingCustomStyle, ThemeMode, CustomStyle } from './types';
import { DEFAULT_FONT_CATEGORIES, DEFAULT_FONT_WEIGHTS, DEFAULT_TEXT_COLORS, DEFAULT_HIGHLIGHT_COLORS, flattenFontCategories } from './defaults';
import { applyHeadingCustomStyleCSS, clearHeadingCustomStyleCSS } from './heading-css';

// Re-export all types for consumers
export type {
  ThemeMode,
  FontOption,
  FontWeightOption,
  ColorOption,
  FontCategories,
  StoredFormat,
  CustomStyle,
  HeadingSpacingConfig,
  HeadingDividerConfig,
  HeadingCustomStyle,
  HeadingLevel,
  StyleMetadata,
  FormatPainterState,
  StyleState,
} from './types';

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

  // Configurable options - default values (user can modify)
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

    // Apply CSS variables for this heading level
    applyHeadingCustomStyleCSS(level, style);

    set((state) => {
      const newState = {
        headingCustomStyles: {
          ...state.headingCustomStyles,
          [key]: style,
        },
      };
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

    // Build a single chain for all operations
    let chain = editor.chain().focus();

    // Remove all marks first
    chain = chain.unsetAllMarks();

    // Apply stored marks using specific commands where available
    marks.forEach(({ type, attrs }) => {
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
