/**
 * SERQ Style Preset Data
 *
 * Trimmed to 4 presets per category. More will be added via preset management system.
 * Variable names MUST match CSS custom properties in themes.css exactly.
 */

import type {
  TypographyPreset,
  ColorPreset,
  CanvasPreset,
  LayoutPreset,
  MasterTheme,
} from './types';

// ===== TYPOGRAPHY PRESETS (4) =====

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: 'default',
    name: 'Default',
    variables: {
      '--font-body': 'Georgia, "Times New Roman", serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-size-base': '16px',
      '--line-height-body': '1.6',
      '--letter-spacing-body': '0',
    },
  },
  {
    id: 'classic-serif',
    name: 'Classic Serif',
    variables: {
      '--font-body': 'Georgia, "Times New Roman", serif',
      '--font-heading': 'Georgia, "Times New Roman", serif',
      '--font-size-base': '17px',
      '--line-height-body': '1.7',
      '--letter-spacing-body': '0.01em',
    },
  },
  {
    id: 'modern-sans',
    name: 'Modern Sans',
    variables: {
      '--font-body': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-size-base': '16px',
      '--line-height-body': '1.5',
      '--letter-spacing-body': '0',
    },
  },
  {
    id: 'monospace',
    name: 'Monospace',
    variables: {
      '--font-body': 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      '--font-heading': 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      '--font-size-base': '14px',
      '--line-height-body': '1.5',
      '--letter-spacing-body': '0',
    },
  },
];

// ===== COLOR PRESETS (4) =====

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'default',
    name: 'Default',
    light: {
      '--color-text-primary': '#1a1a1a',
      '--color-text-secondary': '#4b5563',
      '--color-text-muted': '#9ca3af',
      '--color-accent': '#2563eb',
      '--color-border': '#e5e7eb',
      '--color-link': '#2563eb',
      '--color-code-bg': '#f3f4f6',
      '--color-code-text': '#1a1a1a',
      '--color-blockquote-border': '#d1d5db',
      '--color-blockquote-text': '#4b5563',
      '--color-highlight': '#fef08a',
    },
    dark: {
      '--color-text-primary': '#f5f5f5',
      '--color-text-secondary': '#a1a1aa',
      '--color-text-muted': '#71717a',
      '--color-accent': '#3b82f6',
      '--color-border': '#3f3f46',
      '--color-link': '#60a5fa',
      '--color-code-bg': '#27272a',
      '--color-code-text': '#f5f5f5',
      '--color-blockquote-border': '#52525b',
      '--color-blockquote-text': '#a1a1aa',
      '--color-highlight': '#854d0e',
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    light: {
      '--color-text-primary': '#5c4033',
      '--color-text-secondary': '#8b7355',
      '--color-text-muted': '#a89070',
      '--color-accent': '#b8860b',
      '--color-border': '#d4c4a8',
      '--color-link': '#b8860b',
      '--color-code-bg': '#f0e8d8',
      '--color-code-text': '#5c4033',
      '--color-blockquote-border': '#c4b498',
      '--color-blockquote-text': '#8b7355',
      '--color-highlight': '#f5deb3',
    },
    dark: {
      '--color-text-primary': '#e8dcc8',
      '--color-text-secondary': '#bfaa8c',
      '--color-text-muted': '#8a7a60',
      '--color-accent': '#daa520',
      '--color-border': '#4a3f2f',
      '--color-link': '#daa520',
      '--color-code-bg': '#3a3020',
      '--color-code-text': '#e8dcc8',
      '--color-blockquote-border': '#5a4f3f',
      '--color-blockquote-text': '#bfaa8c',
      '--color-highlight': '#6b5a30',
    },
  },
  {
    id: 'night',
    name: 'Night',
    light: {
      '--color-text-primary': '#1e293b',
      '--color-text-secondary': '#475569',
      '--color-text-muted': '#64748b',
      '--color-accent': '#6366f1',
      '--color-border': '#cbd5e1',
      '--color-link': '#6366f1',
      '--color-code-bg': '#e2e8f0',
      '--color-code-text': '#1e293b',
      '--color-blockquote-border': '#94a3b8',
      '--color-blockquote-text': '#475569',
      '--color-highlight': '#c7d2fe',
    },
    dark: {
      '--color-text-primary': '#e2e8f0',
      '--color-text-secondary': '#94a3b8',
      '--color-text-muted': '#64748b',
      '--color-accent': '#818cf8',
      '--color-border': '#334155',
      '--color-link': '#818cf8',
      '--color-code-bg': '#1e293b',
      '--color-code-text': '#e2e8f0',
      '--color-blockquote-border': '#475569',
      '--color-blockquote-text': '#94a3b8',
      '--color-highlight': '#3730a3',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    light: {
      '--color-text-primary': '#164e63',
      '--color-text-secondary': '#0e7490',
      '--color-text-muted': '#06b6d4',
      '--color-accent': '#0891b2',
      '--color-border': '#bae6fd',
      '--color-link': '#0891b2',
      '--color-code-bg': '#e0f2fe',
      '--color-code-text': '#164e63',
      '--color-blockquote-border': '#67e8f9',
      '--color-blockquote-text': '#0e7490',
      '--color-highlight': '#a5f3fc',
    },
    dark: {
      '--color-text-primary': '#e0f2fe',
      '--color-text-secondary': '#67e8f9',
      '--color-text-muted': '#22d3ee',
      '--color-accent': '#22d3ee',
      '--color-border': '#155e75',
      '--color-link': '#22d3ee',
      '--color-code-bg': '#0c4a6e',
      '--color-code-text': '#e0f2fe',
      '--color-blockquote-border': '#0e7490',
      '--color-blockquote-text': '#67e8f9',
      '--color-highlight': '#164e63',
    },
  },
];

// ===== CANVAS PRESETS (4) =====

export const CANVAS_PRESETS: CanvasPreset[] = [
  {
    id: 'white',
    name: 'White',
    type: 'solid',
    variables: { '--canvas-bg-color': '#ffffff' },
    darkVariables: { '--canvas-bg-color': '#1f1f23' },
  },
  {
    id: 'cream',
    name: 'Cream',
    type: 'solid',
    variables: { '--canvas-bg-color': '#faf6eb' },
    darkVariables: { '--canvas-bg-color': '#2a2520' },
  },
  {
    id: 'light-gray',
    name: 'Light Gray',
    type: 'solid',
    variables: { '--canvas-bg-color': '#f5f5f5' },
    darkVariables: { '--canvas-bg-color': '#27272a' },
  },
  {
    id: 'warm-white',
    name: 'Warm White',
    type: 'solid',
    variables: { '--canvas-bg-color': '#fffbf5' },
    darkVariables: { '--canvas-bg-color': '#262220' },
  },
];

// ===== LAYOUT PRESETS (4) =====

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'default',
    name: 'Default',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.6',
    },
  },
  {
    id: 'compact',
    name: 'Compact',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '0.75rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.4',
    },
  },
  {
    id: 'spacious',
    name: 'Spacious',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1.5rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.8',
    },
  },
  {
    id: 'novel',
    name: 'Novel',
    variables: {
      '--layout-text-align': 'justify',
      '--layout-paragraph-spacing': '0',
      '--layout-paragraph-indent': '1.5em',
      '--layout-line-spacing': '1.8',
    },
  },
];

// ===== MASTER THEMES (4) =====

export const MASTER_THEMES: readonly MasterTheme[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    typography: 'modern-sans',
    colors: 'default',
    canvas: 'white',
    layout: 'default',
  },
  {
    id: 'novelist',
    name: 'Novelist',
    typography: 'classic-serif',
    colors: 'sepia',
    canvas: 'cream',
    layout: 'novel',
  },
  {
    id: 'coder',
    name: 'Coder',
    typography: 'monospace',
    colors: 'night',
    canvas: 'light-gray',
    layout: 'compact',
  },
  {
    id: 'relaxed',
    name: 'Relaxed',
    typography: 'default',
    colors: 'ocean',
    canvas: 'warm-white',
    layout: 'spacious',
  },
];
