/**
 * SERQ Style System - Preset Definitions
 * Phase 3: Style System Foundation
 *
 * All style presets are defined as TypeScript objects that map to CSS custom properties.
 * Apply functions update document.documentElement.style to switch presets instantly.
 */

// ============================================
// Type Definitions
// ============================================

export interface TypographyPreset {
  id: string
  name: string
  variables: Record<string, string>
}

export interface ColorPreset {
  id: string
  name: string
  light: Record<string, string>
  dark: Record<string, string>
}

export interface CanvasPreset {
  id: string
  name: string
  type: 'solid' | 'gradient' | 'pattern'
  variables: Record<string, string>
}

export interface LayoutPreset {
  id: string
  name: string
  variables: Record<string, string>
}

export interface MasterTheme {
  id: string
  name: string
  typography: string
  colors: string
  canvas: string
  layout: string
}

// ============================================
// Typography Presets (23 total)
// ============================================

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: 'serq-default',
    name: 'SERQ Default',
    variables: {
      '--font-body': 'Georgia, "Times New Roman", serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      '--font-size-base': '16px',
      '--font-size-h1': '2rem',
      '--font-size-h2': '1.5rem',
      '--font-size-h3': '1.25rem',
      '--line-height-body': '1.6',
      '--line-height-heading': '1.2',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '-0.02em',
    },
  },
  {
    id: 'classic-serif',
    name: 'Classic Serif',
    variables: {
      '--font-body': 'Georgia, "Times New Roman", serif',
      '--font-heading': 'Georgia, serif',
      '--font-mono': 'ui-monospace, SFMono-Regular, monospace',
      '--font-size-base': '18px',
      '--font-size-h1': '2.25rem',
      '--font-size-h2': '1.75rem',
      '--font-size-h3': '1.375rem',
      '--line-height-body': '1.75',
      '--line-height-heading': '1.2',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '-0.01em',
    },
  },
  {
    id: 'modern-sans',
    name: 'Modern Sans',
    variables: {
      '--font-body': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-mono': 'ui-monospace, SFMono-Regular, monospace',
      '--font-size-base': '16px',
      '--font-size-h1': '2rem',
      '--font-size-h2': '1.5rem',
      '--font-size-h3': '1.25rem',
      '--line-height-body': '1.6',
      '--line-height-heading': '1.15',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '-0.03em',
    },
  },
  {
    id: 'monospace',
    name: 'Monospace',
    variables: {
      '--font-body': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      '--font-heading': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      '--font-size-base': '14px',
      '--font-size-h1': '1.75rem',
      '--font-size-h2': '1.375rem',
      '--font-size-h3': '1.125rem',
      '--line-height-body': '1.5',
      '--line-height-heading': '1.3',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '0',
    },
  },
  {
    id: 'newspaper',
    name: 'Newspaper',
    variables: {
      '--font-body': '"Times New Roman", Times, serif',
      '--font-heading': 'Georgia, serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '15px',
      '--font-size-h1': '2.5rem',
      '--font-size-h2': '1.75rem',
      '--font-size-h3': '1.25rem',
      '--line-height-body': '1.5',
      '--line-height-heading': '1.1',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '-0.02em',
    },
  },
  {
    id: 'book',
    name: 'Book',
    variables: {
      '--font-body': 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
      '--font-heading': 'Palatino, "Palatino Linotype", serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '17px',
      '--font-size-h1': '2rem',
      '--font-size-h2': '1.5rem',
      '--font-size-h3': '1.25rem',
      '--line-height-body': '1.8',
      '--line-height-heading': '1.25',
      '--letter-spacing-body': '0.01em',
      '--letter-spacing-heading': '0',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    variables: {
      '--font-body': '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '15px',
      '--font-size-h1': '1.75rem',
      '--font-size-h2': '1.375rem',
      '--font-size-h3': '1.125rem',
      '--line-height-body': '1.65',
      '--line-height-heading': '1.2',
      '--letter-spacing-body': '0.01em',
      '--letter-spacing-heading': '-0.01em',
    },
  },
  {
    id: 'academic',
    name: 'Academic',
    variables: {
      '--font-body': '"Times New Roman", Times, serif',
      '--font-heading': '"Times New Roman", Times, serif',
      '--font-mono': '"Courier New", Courier, monospace',
      '--font-size-base': '12pt',
      '--font-size-h1': '14pt',
      '--font-size-h2': '12pt',
      '--font-size-h3': '12pt',
      '--line-height-body': '2',
      '--line-height-heading': '2',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '0',
    },
  },
  {
    id: 'magazine',
    name: 'Magazine',
    variables: {
      '--font-body': 'Cambria, Georgia, serif',
      '--font-heading': '"Helvetica Neue", Arial, sans-serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '16px',
      '--font-size-h1': '2.5rem',
      '--font-size-h2': '1.75rem',
      '--font-size-h3': '1.25rem',
      '--line-height-body': '1.6',
      '--line-height-heading': '1.1',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '-0.03em',
    },
  },
  {
    id: 'screenplay',
    name: 'Screenplay',
    variables: {
      '--font-body': '"Courier New", Courier, monospace',
      '--font-heading': '"Courier New", Courier, monospace',
      '--font-mono': '"Courier New", Courier, monospace',
      '--font-size-base': '12pt',
      '--font-size-h1': '12pt',
      '--font-size-h2': '12pt',
      '--font-size-h3': '12pt',
      '--line-height-body': '1',
      '--line-height-heading': '1',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '0',
    },
  },
  {
    id: 'novel',
    name: 'Novel',
    variables: {
      '--font-body': 'Georgia, "Times New Roman", serif',
      '--font-heading': 'Georgia, serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '17px',
      '--font-size-h1': '1.75rem',
      '--font-size-h2': '1.375rem',
      '--font-size-h3': '1.125rem',
      '--line-height-body': '1.8',
      '--line-height-heading': '1.3',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '0',
    },
  },
  {
    id: 'technical',
    name: 'Technical',
    variables: {
      '--font-body': 'Arial, Helvetica, sans-serif',
      '--font-heading': 'Arial, Helvetica, sans-serif',
      '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-size-base': '14px',
      '--font-size-h1': '1.75rem',
      '--font-size-h2': '1.375rem',
      '--font-size-h3': '1.125rem',
      '--line-height-body': '1.5',
      '--line-height-heading': '1.2',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '0',
    },
  },
  {
    id: 'legal',
    name: 'Legal',
    variables: {
      '--font-body': '"Times New Roman", Times, serif',
      '--font-heading': '"Times New Roman", Times, serif',
      '--font-mono': '"Courier New", monospace',
      '--font-size-base': '12pt',
      '--font-size-h1': '14pt',
      '--font-size-h2': '12pt',
      '--font-size-h3': '12pt',
      '--line-height-body': '1.5',
      '--line-height-heading': '1.5',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '0',
    },
  },
  {
    id: 'casual',
    name: 'Casual',
    variables: {
      '--font-body': 'Verdana, Geneva, sans-serif',
      '--font-heading': 'Verdana, Geneva, sans-serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '15px',
      '--font-size-h1': '1.875rem',
      '--font-size-h2': '1.5rem',
      '--font-size-h3': '1.25rem',
      '--line-height-body': '1.7',
      '--line-height-heading': '1.25',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '0',
    },
  },
  {
    id: 'elegant',
    name: 'Elegant',
    variables: {
      '--font-body': 'Garamond, "Times New Roman", serif',
      '--font-heading': 'Garamond, serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '18px',
      '--font-size-h1': '2.25rem',
      '--font-size-h2': '1.75rem',
      '--font-size-h3': '1.375rem',
      '--line-height-body': '1.75',
      '--line-height-heading': '1.2',
      '--letter-spacing-body': '0.02em',
      '--letter-spacing-heading': '0.01em',
    },
  },
  {
    id: 'compact',
    name: 'Compact',
    variables: {
      '--font-body': '-apple-system, BlinkMacSystemFont, sans-serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, sans-serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '14px',
      '--font-size-h1': '1.5rem',
      '--font-size-h2': '1.25rem',
      '--font-size-h3': '1.125rem',
      '--line-height-body': '1.4',
      '--line-height-heading': '1.15',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '-0.02em',
    },
  },
  {
    id: 'spacious',
    name: 'Spacious',
    variables: {
      '--font-body': 'Georgia, serif',
      '--font-heading': '-apple-system, BlinkMacSystemFont, sans-serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '18px',
      '--font-size-h1': '2.5rem',
      '--font-size-h2': '1.875rem',
      '--font-size-h3': '1.5rem',
      '--line-height-body': '2',
      '--line-height-heading': '1.3',
      '--letter-spacing-body': '0.01em',
      '--letter-spacing-heading': '-0.02em',
    },
  },
  {
    id: 'traditional',
    name: 'Traditional',
    variables: {
      '--font-body': '"Book Antiqua", Palatino, serif',
      '--font-heading': '"Book Antiqua", Palatino, serif',
      '--font-mono': '"Courier New", monospace',
      '--font-size-base': '16px',
      '--font-size-h1': '2rem',
      '--font-size-h2': '1.5rem',
      '--font-size-h3': '1.25rem',
      '--line-height-body': '1.7',
      '--line-height-heading': '1.25',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '0',
    },
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    variables: {
      '--font-body': '"Segoe UI", Roboto, sans-serif',
      '--font-heading': '"Segoe UI", Roboto, sans-serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '16px',
      '--font-size-h1': '2rem',
      '--font-size-h2': '1.5rem',
      '--font-size-h3': '1.25rem',
      '--line-height-body': '1.6',
      '--line-height-heading': '1.15',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '-0.03em',
    },
  },
  {
    id: 'handwritten',
    name: 'Handwritten',
    variables: {
      '--font-body': '"Comic Sans MS", "Segoe Print", cursive',
      '--font-heading': '"Comic Sans MS", "Segoe Print", cursive',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '16px',
      '--font-size-h1': '2rem',
      '--font-size-h2': '1.5rem',
      '--font-size-h3': '1.25rem',
      '--line-height-body': '1.8',
      '--line-height-heading': '1.3',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '0',
    },
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    variables: {
      '--font-body': '"Courier New", Courier, monospace',
      '--font-heading': '"Courier New", Courier, monospace',
      '--font-mono': '"Courier New", Courier, monospace',
      '--font-size-base': '15px',
      '--font-size-h1': '1.5rem',
      '--font-size-h2': '1.25rem',
      '--font-size-h3': '1.125rem',
      '--line-height-body': '1.6',
      '--line-height-heading': '1.3',
      '--letter-spacing-body': '0.05em',
      '--letter-spacing-heading': '0.05em',
    },
  },
  {
    id: 'clean',
    name: 'Clean',
    variables: {
      '--font-body': '"Helvetica Neue", Helvetica, Arial, sans-serif',
      '--font-heading': '"Helvetica Neue", Helvetica, Arial, sans-serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '16px',
      '--font-size-h1': '2rem',
      '--font-size-h2': '1.5rem',
      '--font-size-h3': '1.25rem',
      '--line-height-body': '1.6',
      '--line-height-heading': '1.2',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '-0.02em',
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    variables: {
      '--font-body': 'Impact, Haettenschweiler, sans-serif',
      '--font-heading': 'Impact, Haettenschweiler, sans-serif',
      '--font-mono': 'ui-monospace, monospace',
      '--font-size-base': '16px',
      '--font-size-h1': '2.5rem',
      '--font-size-h2': '1.875rem',
      '--font-size-h3': '1.5rem',
      '--line-height-body': '1.5',
      '--line-height-heading': '1.1',
      '--letter-spacing-body': '0',
      '--letter-spacing-heading': '0.01em',
    },
  },
]

// ============================================
// Color Presets (25 total, each with light + dark variants)
// ============================================

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'default',
    name: 'Default',
    light: {
      '--color-text-primary': '#1a1a1a',
      '--color-text-secondary': '#4b5563',
      '--color-text-muted': '#9ca3af',
      '--color-bg-page': '#fafafa',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#f3f4f6',
      '--color-accent': '#2563eb',
      '--color-accent-hover': '#1d4ed8',
      '--color-border': '#e5e7eb',
      '--color-border-strong': '#d1d5db',
      '--color-highlight': '#fef08a',
      '--color-link': '#2563eb',
      '--color-blockquote-border': '#d1d5db',
      '--color-blockquote-text': '#4b5563',
    },
    dark: {
      '--color-text-primary': '#f5f5f5',
      '--color-text-secondary': '#a1a1aa',
      '--color-text-muted': '#71717a',
      '--color-bg-page': '#0a0a0a',
      '--color-bg-canvas': '#171717',
      '--color-bg-surface': '#262626',
      '--color-accent': '#3b82f6',
      '--color-accent-hover': '#60a5fa',
      '--color-border': '#3f3f46',
      '--color-border-strong': '#52525b',
      '--color-highlight': '#854d0e',
      '--color-link': '#60a5fa',
      '--color-blockquote-border': '#52525b',
      '--color-blockquote-text': '#a1a1aa',
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    light: {
      '--color-text-primary': '#3d3022',
      '--color-text-secondary': '#5c4a36',
      '--color-text-muted': '#8b7355',
      '--color-bg-page': '#f5f0e6',
      '--color-bg-canvas': '#fdf8ef',
      '--color-bg-surface': '#ebe3d5',
      '--color-accent': '#8b4513',
      '--color-accent-hover': '#723a10',
      '--color-border': '#d4c4a8',
      '--color-border-strong': '#bfaa88',
      '--color-highlight': '#e6d5a8',
      '--color-link': '#8b4513',
      '--color-blockquote-border': '#bfaa88',
      '--color-blockquote-text': '#5c4a36',
    },
    dark: {
      '--color-text-primary': '#e8dcc8',
      '--color-text-secondary': '#c4b59a',
      '--color-text-muted': '#8b7355',
      '--color-bg-page': '#1a1612',
      '--color-bg-canvas': '#262015',
      '--color-bg-surface': '#3d3022',
      '--color-accent': '#cd853f',
      '--color-accent-hover': '#daa06d',
      '--color-border': '#4a3f2f',
      '--color-border-strong': '#5c4a36',
      '--color-highlight': '#5c4a2a',
      '--color-link': '#cd853f',
      '--color-blockquote-border': '#5c4a36',
      '--color-blockquote-text': '#c4b59a',
    },
  },
  {
    id: 'night',
    name: 'Night',
    light: {
      '--color-text-primary': '#1e293b',
      '--color-text-secondary': '#475569',
      '--color-text-muted': '#94a3b8',
      '--color-bg-page': '#f8fafc',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#f1f5f9',
      '--color-accent': '#6366f1',
      '--color-accent-hover': '#4f46e5',
      '--color-border': '#e2e8f0',
      '--color-border-strong': '#cbd5e1',
      '--color-highlight': '#fde68a',
      '--color-link': '#6366f1',
      '--color-blockquote-border': '#cbd5e1',
      '--color-blockquote-text': '#475569',
    },
    dark: {
      '--color-text-primary': '#e2e8f0',
      '--color-text-secondary': '#94a3b8',
      '--color-text-muted': '#64748b',
      '--color-bg-page': '#020617',
      '--color-bg-canvas': '#0f172a',
      '--color-bg-surface': '#1e293b',
      '--color-accent': '#818cf8',
      '--color-accent-hover': '#a5b4fc',
      '--color-border': '#334155',
      '--color-border-strong': '#475569',
      '--color-highlight': '#713f12',
      '--color-link': '#818cf8',
      '--color-blockquote-border': '#475569',
      '--color-blockquote-text': '#94a3b8',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    light: {
      '--color-text-primary': '#0c4a6e',
      '--color-text-secondary': '#0369a1',
      '--color-text-muted': '#7dd3fc',
      '--color-bg-page': '#f0f9ff',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#e0f2fe',
      '--color-accent': '#0284c7',
      '--color-accent-hover': '#0369a1',
      '--color-border': '#bae6fd',
      '--color-border-strong': '#7dd3fc',
      '--color-highlight': '#fde68a',
      '--color-link': '#0284c7',
      '--color-blockquote-border': '#7dd3fc',
      '--color-blockquote-text': '#0369a1',
    },
    dark: {
      '--color-text-primary': '#e0f2fe',
      '--color-text-secondary': '#7dd3fc',
      '--color-text-muted': '#38bdf8',
      '--color-bg-page': '#082f49',
      '--color-bg-canvas': '#0c4a6e',
      '--color-bg-surface': '#075985',
      '--color-accent': '#38bdf8',
      '--color-accent-hover': '#7dd3fc',
      '--color-border': '#0369a1',
      '--color-border-strong': '#0284c7',
      '--color-highlight': '#713f12',
      '--color-link': '#38bdf8',
      '--color-blockquote-border': '#0284c7',
      '--color-blockquote-text': '#7dd3fc',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    light: {
      '--color-text-primary': '#14532d',
      '--color-text-secondary': '#166534',
      '--color-text-muted': '#86efac',
      '--color-bg-page': '#f0fdf4',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#dcfce7',
      '--color-accent': '#16a34a',
      '--color-accent-hover': '#15803d',
      '--color-border': '#bbf7d0',
      '--color-border-strong': '#86efac',
      '--color-highlight': '#fef08a',
      '--color-link': '#16a34a',
      '--color-blockquote-border': '#86efac',
      '--color-blockquote-text': '#166534',
    },
    dark: {
      '--color-text-primary': '#dcfce7',
      '--color-text-secondary': '#86efac',
      '--color-text-muted': '#4ade80',
      '--color-bg-page': '#052e16',
      '--color-bg-canvas': '#14532d',
      '--color-bg-surface': '#166534',
      '--color-accent': '#4ade80',
      '--color-accent-hover': '#86efac',
      '--color-border': '#15803d',
      '--color-border-strong': '#16a34a',
      '--color-highlight': '#713f12',
      '--color-link': '#4ade80',
      '--color-blockquote-border': '#16a34a',
      '--color-blockquote-text': '#86efac',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    light: {
      '--color-text-primary': '#7c2d12',
      '--color-text-secondary': '#9a3412',
      '--color-text-muted': '#fdba74',
      '--color-bg-page': '#fff7ed',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#ffedd5',
      '--color-accent': '#ea580c',
      '--color-accent-hover': '#c2410c',
      '--color-border': '#fed7aa',
      '--color-border-strong': '#fdba74',
      '--color-highlight': '#fef08a',
      '--color-link': '#ea580c',
      '--color-blockquote-border': '#fdba74',
      '--color-blockquote-text': '#9a3412',
    },
    dark: {
      '--color-text-primary': '#ffedd5',
      '--color-text-secondary': '#fdba74',
      '--color-text-muted': '#fb923c',
      '--color-bg-page': '#431407',
      '--color-bg-canvas': '#7c2d12',
      '--color-bg-surface': '#9a3412',
      '--color-accent': '#fb923c',
      '--color-accent-hover': '#fdba74',
      '--color-border': '#c2410c',
      '--color-border-strong': '#ea580c',
      '--color-highlight': '#713f12',
      '--color-link': '#fb923c',
      '--color-blockquote-border': '#ea580c',
      '--color-blockquote-text': '#fdba74',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    light: {
      '--color-text-primary': '#1e1b4b',
      '--color-text-secondary': '#3730a3',
      '--color-text-muted': '#a5b4fc',
      '--color-bg-page': '#eef2ff',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#e0e7ff',
      '--color-accent': '#4f46e5',
      '--color-accent-hover': '#4338ca',
      '--color-border': '#c7d2fe',
      '--color-border-strong': '#a5b4fc',
      '--color-highlight': '#fde68a',
      '--color-link': '#4f46e5',
      '--color-blockquote-border': '#a5b4fc',
      '--color-blockquote-text': '#3730a3',
    },
    dark: {
      '--color-text-primary': '#e0e7ff',
      '--color-text-secondary': '#a5b4fc',
      '--color-text-muted': '#818cf8',
      '--color-bg-page': '#0c0a1f',
      '--color-bg-canvas': '#1e1b4b',
      '--color-bg-surface': '#312e81',
      '--color-accent': '#818cf8',
      '--color-accent-hover': '#a5b4fc',
      '--color-border': '#3730a3',
      '--color-border-strong': '#4338ca',
      '--color-highlight': '#713f12',
      '--color-link': '#818cf8',
      '--color-blockquote-border': '#4338ca',
      '--color-blockquote-text': '#a5b4fc',
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    light: {
      '--color-text-primary': '#292524',
      '--color-text-secondary': '#57534e',
      '--color-text-muted': '#a8a29e',
      '--color-bg-page': '#fafaf9',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#f5f5f4',
      '--color-accent': '#78716c',
      '--color-accent-hover': '#57534e',
      '--color-border': '#e7e5e4',
      '--color-border-strong': '#d6d3d1',
      '--color-highlight': '#fef08a',
      '--color-link': '#78716c',
      '--color-blockquote-border': '#d6d3d1',
      '--color-blockquote-text': '#57534e',
    },
    dark: {
      '--color-text-primary': '#f5f5f4',
      '--color-text-secondary': '#a8a29e',
      '--color-text-muted': '#78716c',
      '--color-bg-page': '#0c0a09',
      '--color-bg-canvas': '#1c1917',
      '--color-bg-surface': '#292524',
      '--color-accent': '#a8a29e',
      '--color-accent-hover': '#d6d3d1',
      '--color-border': '#44403c',
      '--color-border-strong': '#57534e',
      '--color-highlight': '#713f12',
      '--color-link': '#a8a29e',
      '--color-blockquote-border': '#57534e',
      '--color-blockquote-text': '#a8a29e',
    },
  },
  {
    id: 'ink',
    name: 'Ink',
    light: {
      '--color-text-primary': '#18181b',
      '--color-text-secondary': '#3f3f46',
      '--color-text-muted': '#a1a1aa',
      '--color-bg-page': '#fafafa',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#f4f4f5',
      '--color-accent': '#18181b',
      '--color-accent-hover': '#27272a',
      '--color-border': '#e4e4e7',
      '--color-border-strong': '#d4d4d8',
      '--color-highlight': '#fef08a',
      '--color-link': '#18181b',
      '--color-blockquote-border': '#d4d4d8',
      '--color-blockquote-text': '#3f3f46',
    },
    dark: {
      '--color-text-primary': '#fafafa',
      '--color-text-secondary': '#a1a1aa',
      '--color-text-muted': '#71717a',
      '--color-bg-page': '#09090b',
      '--color-bg-canvas': '#18181b',
      '--color-bg-surface': '#27272a',
      '--color-accent': '#e4e4e7',
      '--color-accent-hover': '#fafafa',
      '--color-border': '#3f3f46',
      '--color-border-strong': '#52525b',
      '--color-highlight': '#713f12',
      '--color-link': '#e4e4e7',
      '--color-blockquote-border': '#52525b',
      '--color-blockquote-text': '#a1a1aa',
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    light: {
      '--color-text-primary': '#44403c',
      '--color-text-secondary': '#78716c',
      '--color-text-muted': '#a8a29e',
      '--color-bg-page': '#fffbeb',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#fef3c7',
      '--color-accent': '#d97706',
      '--color-accent-hover': '#b45309',
      '--color-border': '#fde68a',
      '--color-border-strong': '#fcd34d',
      '--color-highlight': '#fde68a',
      '--color-link': '#d97706',
      '--color-blockquote-border': '#fcd34d',
      '--color-blockquote-text': '#78716c',
    },
    dark: {
      '--color-text-primary': '#fef3c7',
      '--color-text-secondary': '#fcd34d',
      '--color-text-muted': '#fbbf24',
      '--color-bg-page': '#1c1917',
      '--color-bg-canvas': '#292524',
      '--color-bg-surface': '#44403c',
      '--color-accent': '#fbbf24',
      '--color-accent-hover': '#fcd34d',
      '--color-border': '#57534e',
      '--color-border-strong': '#78716c',
      '--color-highlight': '#713f12',
      '--color-link': '#fbbf24',
      '--color-blockquote-border': '#78716c',
      '--color-blockquote-text': '#fcd34d',
    },
  },
  {
    id: 'cool',
    name: 'Cool',
    light: {
      '--color-text-primary': '#334155',
      '--color-text-secondary': '#64748b',
      '--color-text-muted': '#94a3b8',
      '--color-bg-page': '#f8fafc',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#f1f5f9',
      '--color-accent': '#0ea5e9',
      '--color-accent-hover': '#0284c7',
      '--color-border': '#e2e8f0',
      '--color-border-strong': '#cbd5e1',
      '--color-highlight': '#fef08a',
      '--color-link': '#0ea5e9',
      '--color-blockquote-border': '#cbd5e1',
      '--color-blockquote-text': '#64748b',
    },
    dark: {
      '--color-text-primary': '#f1f5f9',
      '--color-text-secondary': '#94a3b8',
      '--color-text-muted': '#64748b',
      '--color-bg-page': '#0f172a',
      '--color-bg-canvas': '#1e293b',
      '--color-bg-surface': '#334155',
      '--color-accent': '#38bdf8',
      '--color-accent-hover': '#7dd3fc',
      '--color-border': '#475569',
      '--color-border-strong': '#64748b',
      '--color-highlight': '#713f12',
      '--color-link': '#38bdf8',
      '--color-blockquote-border': '#64748b',
      '--color-blockquote-text': '#94a3b8',
    },
  },
  {
    id: 'muted',
    name: 'Muted',
    light: {
      '--color-text-primary': '#525252',
      '--color-text-secondary': '#737373',
      '--color-text-muted': '#a3a3a3',
      '--color-bg-page': '#fafafa',
      '--color-bg-canvas': '#f5f5f5',
      '--color-bg-surface': '#e5e5e5',
      '--color-accent': '#737373',
      '--color-accent-hover': '#525252',
      '--color-border': '#d4d4d4',
      '--color-border-strong': '#a3a3a3',
      '--color-highlight': '#fef08a',
      '--color-link': '#525252',
      '--color-blockquote-border': '#a3a3a3',
      '--color-blockquote-text': '#737373',
    },
    dark: {
      '--color-text-primary': '#e5e5e5',
      '--color-text-secondary': '#a3a3a3',
      '--color-text-muted': '#737373',
      '--color-bg-page': '#171717',
      '--color-bg-canvas': '#262626',
      '--color-bg-surface': '#404040',
      '--color-accent': '#a3a3a3',
      '--color-accent-hover': '#d4d4d4',
      '--color-border': '#525252',
      '--color-border-strong': '#737373',
      '--color-highlight': '#713f12',
      '--color-link': '#a3a3a3',
      '--color-blockquote-border': '#737373',
      '--color-blockquote-text': '#a3a3a3',
    },
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    light: {
      '--color-text-primary': '#1a1a1a',
      '--color-text-secondary': '#4b5563',
      '--color-text-muted': '#9ca3af',
      '--color-bg-page': '#fafafa',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#f3f4f6',
      '--color-accent': '#ec4899',
      '--color-accent-hover': '#db2777',
      '--color-border': '#e5e7eb',
      '--color-border-strong': '#d1d5db',
      '--color-highlight': '#fef08a',
      '--color-link': '#ec4899',
      '--color-blockquote-border': '#d1d5db',
      '--color-blockquote-text': '#4b5563',
    },
    dark: {
      '--color-text-primary': '#f5f5f5',
      '--color-text-secondary': '#a1a1aa',
      '--color-text-muted': '#71717a',
      '--color-bg-page': '#0a0a0a',
      '--color-bg-canvas': '#171717',
      '--color-bg-surface': '#262626',
      '--color-accent': '#f472b6',
      '--color-accent-hover': '#f9a8d4',
      '--color-border': '#3f3f46',
      '--color-border-strong': '#52525b',
      '--color-highlight': '#831843',
      '--color-link': '#f472b6',
      '--color-blockquote-border': '#52525b',
      '--color-blockquote-text': '#a1a1aa',
    },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    light: {
      '--color-text-primary': '#374151',
      '--color-text-secondary': '#6b7280',
      '--color-text-muted': '#9ca3af',
      '--color-bg-page': '#fdf2f8',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#fce7f3',
      '--color-accent': '#f9a8d4',
      '--color-accent-hover': '#f472b6',
      '--color-border': '#fbcfe8',
      '--color-border-strong': '#f9a8d4',
      '--color-highlight': '#fef08a',
      '--color-link': '#ec4899',
      '--color-blockquote-border': '#f9a8d4',
      '--color-blockquote-text': '#6b7280',
    },
    dark: {
      '--color-text-primary': '#fce7f3',
      '--color-text-secondary': '#f9a8d4',
      '--color-text-muted': '#f472b6',
      '--color-bg-page': '#1f1f1f',
      '--color-bg-canvas': '#2d2d2d',
      '--color-bg-surface': '#3d3d3d',
      '--color-accent': '#f472b6',
      '--color-accent-hover': '#f9a8d4',
      '--color-border': '#4a4a4a',
      '--color-border-strong': '#5a5a5a',
      '--color-highlight': '#831843',
      '--color-link': '#f472b6',
      '--color-blockquote-border': '#5a5a5a',
      '--color-blockquote-text': '#f9a8d4',
    },
  },
  {
    id: 'earth',
    name: 'Earth',
    light: {
      '--color-text-primary': '#422006',
      '--color-text-secondary': '#78350f',
      '--color-text-muted': '#a16207',
      '--color-bg-page': '#fffbeb',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#fef3c7',
      '--color-accent': '#92400e',
      '--color-accent-hover': '#78350f',
      '--color-border': '#fde68a',
      '--color-border-strong': '#fcd34d',
      '--color-highlight': '#fde68a',
      '--color-link': '#92400e',
      '--color-blockquote-border': '#fcd34d',
      '--color-blockquote-text': '#78350f',
    },
    dark: {
      '--color-text-primary': '#fef3c7',
      '--color-text-secondary': '#fcd34d',
      '--color-text-muted': '#fbbf24',
      '--color-bg-page': '#1c1612',
      '--color-bg-canvas': '#292018',
      '--color-bg-surface': '#422006',
      '--color-accent': '#fbbf24',
      '--color-accent-hover': '#fcd34d',
      '--color-border': '#78350f',
      '--color-border-strong': '#92400e',
      '--color-highlight': '#713f12',
      '--color-link': '#fbbf24',
      '--color-blockquote-border': '#92400e',
      '--color-blockquote-text': '#fcd34d',
    },
  },
  {
    id: 'sky',
    name: 'Sky',
    light: {
      '--color-text-primary': '#0c4a6e',
      '--color-text-secondary': '#075985',
      '--color-text-muted': '#0284c7',
      '--color-bg-page': '#f0f9ff',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#e0f2fe',
      '--color-accent': '#0ea5e9',
      '--color-accent-hover': '#0284c7',
      '--color-border': '#bae6fd',
      '--color-border-strong': '#7dd3fc',
      '--color-highlight': '#fef08a',
      '--color-link': '#0ea5e9',
      '--color-blockquote-border': '#7dd3fc',
      '--color-blockquote-text': '#075985',
    },
    dark: {
      '--color-text-primary': '#e0f2fe',
      '--color-text-secondary': '#7dd3fc',
      '--color-text-muted': '#38bdf8',
      '--color-bg-page': '#082f49',
      '--color-bg-canvas': '#0c4a6e',
      '--color-bg-surface': '#075985',
      '--color-accent': '#38bdf8',
      '--color-accent-hover': '#7dd3fc',
      '--color-border': '#0369a1',
      '--color-border-strong': '#0284c7',
      '--color-highlight': '#713f12',
      '--color-link': '#38bdf8',
      '--color-blockquote-border': '#0284c7',
      '--color-blockquote-text': '#7dd3fc',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    light: {
      '--color-text-primary': '#4c1d95',
      '--color-text-secondary': '#6d28d9',
      '--color-text-muted': '#8b5cf6',
      '--color-bg-page': '#f5f3ff',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#ede9fe',
      '--color-accent': '#7c3aed',
      '--color-accent-hover': '#6d28d9',
      '--color-border': '#ddd6fe',
      '--color-border-strong': '#c4b5fd',
      '--color-highlight': '#fef08a',
      '--color-link': '#7c3aed',
      '--color-blockquote-border': '#c4b5fd',
      '--color-blockquote-text': '#6d28d9',
    },
    dark: {
      '--color-text-primary': '#ede9fe',
      '--color-text-secondary': '#c4b5fd',
      '--color-text-muted': '#a78bfa',
      '--color-bg-page': '#1e1033',
      '--color-bg-canvas': '#2e1065',
      '--color-bg-surface': '#4c1d95',
      '--color-accent': '#a78bfa',
      '--color-accent-hover': '#c4b5fd',
      '--color-border': '#5b21b6',
      '--color-border-strong': '#6d28d9',
      '--color-highlight': '#713f12',
      '--color-link': '#a78bfa',
      '--color-blockquote-border': '#6d28d9',
      '--color-blockquote-text': '#c4b5fd',
    },
  },
  {
    id: 'mint',
    name: 'Mint',
    light: {
      '--color-text-primary': '#064e3b',
      '--color-text-secondary': '#047857',
      '--color-text-muted': '#10b981',
      '--color-bg-page': '#ecfdf5',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#d1fae5',
      '--color-accent': '#10b981',
      '--color-accent-hover': '#059669',
      '--color-border': '#a7f3d0',
      '--color-border-strong': '#6ee7b7',
      '--color-highlight': '#fef08a',
      '--color-link': '#10b981',
      '--color-blockquote-border': '#6ee7b7',
      '--color-blockquote-text': '#047857',
    },
    dark: {
      '--color-text-primary': '#d1fae5',
      '--color-text-secondary': '#6ee7b7',
      '--color-text-muted': '#34d399',
      '--color-bg-page': '#022c22',
      '--color-bg-canvas': '#064e3b',
      '--color-bg-surface': '#065f46',
      '--color-accent': '#34d399',
      '--color-accent-hover': '#6ee7b7',
      '--color-border': '#047857',
      '--color-border-strong': '#059669',
      '--color-highlight': '#713f12',
      '--color-link': '#34d399',
      '--color-blockquote-border': '#059669',
      '--color-blockquote-text': '#6ee7b7',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    light: {
      '--color-text-primary': '#881337',
      '--color-text-secondary': '#be123c',
      '--color-text-muted': '#f43f5e',
      '--color-bg-page': '#fff1f2',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#ffe4e6',
      '--color-accent': '#e11d48',
      '--color-accent-hover': '#be123c',
      '--color-border': '#fecdd3',
      '--color-border-strong': '#fda4af',
      '--color-highlight': '#fef08a',
      '--color-link': '#e11d48',
      '--color-blockquote-border': '#fda4af',
      '--color-blockquote-text': '#be123c',
    },
    dark: {
      '--color-text-primary': '#ffe4e6',
      '--color-text-secondary': '#fda4af',
      '--color-text-muted': '#fb7185',
      '--color-bg-page': '#1f0a10',
      '--color-bg-canvas': '#4c0519',
      '--color-bg-surface': '#881337',
      '--color-accent': '#fb7185',
      '--color-accent-hover': '#fda4af',
      '--color-border': '#9f1239',
      '--color-border-strong': '#be123c',
      '--color-highlight': '#713f12',
      '--color-link': '#fb7185',
      '--color-blockquote-border': '#be123c',
      '--color-blockquote-text': '#fda4af',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    light: {
      '--color-text-primary': '#1e293b',
      '--color-text-secondary': '#475569',
      '--color-text-muted': '#94a3b8',
      '--color-bg-page': '#f8fafc',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#f1f5f9',
      '--color-accent': '#475569',
      '--color-accent-hover': '#334155',
      '--color-border': '#e2e8f0',
      '--color-border-strong': '#cbd5e1',
      '--color-highlight': '#fef08a',
      '--color-link': '#475569',
      '--color-blockquote-border': '#cbd5e1',
      '--color-blockquote-text': '#475569',
    },
    dark: {
      '--color-text-primary': '#f1f5f9',
      '--color-text-secondary': '#94a3b8',
      '--color-text-muted': '#64748b',
      '--color-bg-page': '#020617',
      '--color-bg-canvas': '#0f172a',
      '--color-bg-surface': '#1e293b',
      '--color-accent': '#94a3b8',
      '--color-accent-hover': '#cbd5e1',
      '--color-border': '#334155',
      '--color-border-strong': '#475569',
      '--color-highlight': '#713f12',
      '--color-link': '#94a3b8',
      '--color-blockquote-border': '#475569',
      '--color-blockquote-text': '#94a3b8',
    },
  },
  {
    id: 'sand',
    name: 'Sand',
    light: {
      '--color-text-primary': '#44403c',
      '--color-text-secondary': '#78716c',
      '--color-text-muted': '#a8a29e',
      '--color-bg-page': '#fafaf9',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#f5f5f4',
      '--color-accent': '#a8a29e',
      '--color-accent-hover': '#78716c',
      '--color-border': '#e7e5e4',
      '--color-border-strong': '#d6d3d1',
      '--color-highlight': '#fef08a',
      '--color-link': '#78716c',
      '--color-blockquote-border': '#d6d3d1',
      '--color-blockquote-text': '#78716c',
    },
    dark: {
      '--color-text-primary': '#f5f5f4',
      '--color-text-secondary': '#a8a29e',
      '--color-text-muted': '#78716c',
      '--color-bg-page': '#0c0a09',
      '--color-bg-canvas': '#1c1917',
      '--color-bg-surface': '#292524',
      '--color-accent': '#d6d3d1',
      '--color-accent-hover': '#e7e5e4',
      '--color-border': '#44403c',
      '--color-border-strong': '#57534e',
      '--color-highlight': '#713f12',
      '--color-link': '#d6d3d1',
      '--color-blockquote-border': '#57534e',
      '--color-blockquote-text': '#a8a29e',
    },
  },
  {
    id: 'storm',
    name: 'Storm',
    light: {
      '--color-text-primary': '#1f2937',
      '--color-text-secondary': '#4b5563',
      '--color-text-muted': '#9ca3af',
      '--color-bg-page': '#f3f4f6',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#e5e7eb',
      '--color-accent': '#4b5563',
      '--color-accent-hover': '#374151',
      '--color-border': '#d1d5db',
      '--color-border-strong': '#9ca3af',
      '--color-highlight': '#fef08a',
      '--color-link': '#4b5563',
      '--color-blockquote-border': '#9ca3af',
      '--color-blockquote-text': '#4b5563',
    },
    dark: {
      '--color-text-primary': '#e5e7eb',
      '--color-text-secondary': '#9ca3af',
      '--color-text-muted': '#6b7280',
      '--color-bg-page': '#111827',
      '--color-bg-canvas': '#1f2937',
      '--color-bg-surface': '#374151',
      '--color-accent': '#9ca3af',
      '--color-accent-hover': '#d1d5db',
      '--color-border': '#4b5563',
      '--color-border-strong': '#6b7280',
      '--color-highlight': '#713f12',
      '--color-link': '#9ca3af',
      '--color-blockquote-border': '#6b7280',
      '--color-blockquote-text': '#9ca3af',
    },
  },
  {
    id: 'autumn',
    name: 'Autumn',
    light: {
      '--color-text-primary': '#78350f',
      '--color-text-secondary': '#92400e',
      '--color-text-muted': '#b45309',
      '--color-bg-page': '#fffbeb',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#fef3c7',
      '--color-accent': '#d97706',
      '--color-accent-hover': '#b45309',
      '--color-border': '#fde68a',
      '--color-border-strong': '#fcd34d',
      '--color-highlight': '#fde68a',
      '--color-link': '#d97706',
      '--color-blockquote-border': '#fcd34d',
      '--color-blockquote-text': '#92400e',
    },
    dark: {
      '--color-text-primary': '#fef3c7',
      '--color-text-secondary': '#fcd34d',
      '--color-text-muted': '#fbbf24',
      '--color-bg-page': '#1c1612',
      '--color-bg-canvas': '#292018',
      '--color-bg-surface': '#422006',
      '--color-accent': '#fbbf24',
      '--color-accent-hover': '#fcd34d',
      '--color-border': '#78350f',
      '--color-border-strong': '#92400e',
      '--color-highlight': '#713f12',
      '--color-link': '#fbbf24',
      '--color-blockquote-border': '#92400e',
      '--color-blockquote-text': '#fcd34d',
    },
  },
  {
    id: 'spring',
    name: 'Spring',
    light: {
      '--color-text-primary': '#166534',
      '--color-text-secondary': '#15803d',
      '--color-text-muted': '#22c55e',
      '--color-bg-page': '#f0fdf4',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#dcfce7',
      '--color-accent': '#22c55e',
      '--color-accent-hover': '#16a34a',
      '--color-border': '#bbf7d0',
      '--color-border-strong': '#86efac',
      '--color-highlight': '#fef08a',
      '--color-link': '#22c55e',
      '--color-blockquote-border': '#86efac',
      '--color-blockquote-text': '#15803d',
    },
    dark: {
      '--color-text-primary': '#dcfce7',
      '--color-text-secondary': '#86efac',
      '--color-text-muted': '#4ade80',
      '--color-bg-page': '#052e16',
      '--color-bg-canvas': '#14532d',
      '--color-bg-surface': '#166534',
      '--color-accent': '#4ade80',
      '--color-accent-hover': '#86efac',
      '--color-border': '#15803d',
      '--color-border-strong': '#16a34a',
      '--color-highlight': '#713f12',
      '--color-link': '#4ade80',
      '--color-blockquote-border': '#16a34a',
      '--color-blockquote-text': '#86efac',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    light: {
      '--color-text-primary': '#000000',
      '--color-text-secondary': '#404040',
      '--color-text-muted': '#808080',
      '--color-bg-page': '#f5f5f5',
      '--color-bg-canvas': '#ffffff',
      '--color-bg-surface': '#e5e5e5',
      '--color-accent': '#404040',
      '--color-accent-hover': '#000000',
      '--color-border': '#d4d4d4',
      '--color-border-strong': '#a3a3a3',
      '--color-highlight': '#e5e5e5',
      '--color-link': '#000000',
      '--color-blockquote-border': '#a3a3a3',
      '--color-blockquote-text': '#404040',
    },
    dark: {
      '--color-text-primary': '#ffffff',
      '--color-text-secondary': '#c0c0c0',
      '--color-text-muted': '#808080',
      '--color-bg-page': '#000000',
      '--color-bg-canvas': '#0a0a0a',
      '--color-bg-surface': '#1a1a1a',
      '--color-accent': '#c0c0c0',
      '--color-accent-hover': '#ffffff',
      '--color-border': '#333333',
      '--color-border-strong': '#4d4d4d',
      '--color-highlight': '#333333',
      '--color-link': '#ffffff',
      '--color-blockquote-border': '#4d4d4d',
      '--color-blockquote-text': '#c0c0c0',
    },
  },
]

// ============================================
// Canvas Presets (25 total)
// ============================================

export const CANVAS_PRESETS: CanvasPreset[] = [
  // Solid Colors (1-5)
  {
    id: 'white',
    name: 'White',
    type: 'solid',
    variables: {
      '--canvas-bg-color': '#ffffff',
      '--canvas-bg-image': 'none',
    },
  },
  {
    id: 'cream',
    name: 'Cream',
    type: 'solid',
    variables: {
      '--canvas-bg-color': '#fdf8ef',
      '--canvas-bg-image': 'none',
    },
  },
  {
    id: 'light-gray',
    name: 'Light Gray',
    type: 'solid',
    variables: {
      '--canvas-bg-color': '#f5f5f5',
      '--canvas-bg-image': 'none',
    },
  },
  {
    id: 'warm-white',
    name: 'Warm White',
    type: 'solid',
    variables: {
      '--canvas-bg-color': '#fffbf5',
      '--canvas-bg-image': 'none',
    },
  },
  {
    id: 'cool-white',
    name: 'Cool White',
    type: 'solid',
    variables: {
      '--canvas-bg-color': '#f8fafc',
      '--canvas-bg-image': 'none',
    },
  },
  // Gradients (6-10)
  {
    id: 'gradient-soft',
    name: 'Soft Gradient',
    type: 'gradient',
    variables: {
      '--canvas-bg-color': '#ffffff',
      '--canvas-bg-image': 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
      '--canvas-bg-size': '100% 100%',
    },
  },
  {
    id: 'gradient-sunrise',
    name: 'Sunrise',
    type: 'gradient',
    variables: {
      '--canvas-bg-color': '#fff7ed',
      '--canvas-bg-image': 'linear-gradient(180deg, #fff7ed 0%, #fef3c7 100%)',
      '--canvas-bg-size': '100% 100%',
    },
  },
  {
    id: 'gradient-ocean',
    name: 'Ocean Mist',
    type: 'gradient',
    variables: {
      '--canvas-bg-color': '#f0f9ff',
      '--canvas-bg-image': 'linear-gradient(180deg, #ffffff 0%, #e0f2fe 100%)',
      '--canvas-bg-size': '100% 100%',
    },
  },
  {
    id: 'gradient-forest',
    name: 'Forest Dawn',
    type: 'gradient',
    variables: {
      '--canvas-bg-color': '#f0fdf4',
      '--canvas-bg-image': 'linear-gradient(180deg, #ffffff 0%, #dcfce7 100%)',
      '--canvas-bg-size': '100% 100%',
    },
  },
  {
    id: 'gradient-sunset',
    name: 'Dusk',
    type: 'gradient',
    variables: {
      '--canvas-bg-color': '#fdf4ff',
      '--canvas-bg-image': 'linear-gradient(180deg, #fdf4ff 0%, #fce7f3 100%)',
      '--canvas-bg-size': '100% 100%',
    },
  },
  // Paper Textures (11-15)
  {
    id: 'paper-texture',
    name: 'Paper',
    type: 'pattern',
    variables: {
      '--canvas-bg-color': '#fefefe',
      '--canvas-bg-image': 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
      '--canvas-bg-size': '100px 100px',
      '--canvas-bg-repeat': 'repeat',
    },
  },
  {
    id: 'parchment',
    name: 'Parchment',
    type: 'pattern',
    variables: {
      '--canvas-bg-color': '#fdf8ef',
      '--canvas-bg-image': 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.6\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
      '--canvas-bg-size': '100px 100px',
      '--canvas-bg-repeat': 'repeat',
    },
  },
  {
    id: 'linen',
    name: 'Linen',
    type: 'pattern',
    variables: {
      '--canvas-bg-color': '#faf9f7',
      '--canvas-bg-image': 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)',
      '--canvas-bg-size': '4px 4px',
      '--canvas-bg-repeat': 'repeat',
    },
  },
  {
    id: 'canvas-texture',
    name: 'Canvas',
    type: 'pattern',
    variables: {
      '--canvas-bg-color': '#f5f5f0',
      '--canvas-bg-image': 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
      '--canvas-bg-size': '8px 8px',
      '--canvas-bg-repeat': 'repeat',
    },
  },
  {
    id: 'cork',
    name: 'Cork',
    type: 'pattern',
    variables: {
      '--canvas-bg-color': '#d4a574',
      '--canvas-bg-image': 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'turbulence\' baseFrequency=\'0.9\' numOctaves=\'5\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.15\'/%3E%3C/svg%3E")',
      '--canvas-bg-size': '100px 100px',
      '--canvas-bg-repeat': 'repeat',
    },
  },
  // Geometric Patterns (16-20)
  {
    id: 'dots',
    name: 'Dots',
    type: 'pattern',
    variables: {
      '--canvas-bg-color': '#ffffff',
      '--canvas-bg-image': 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
      '--canvas-bg-size': '20px 20px',
      '--canvas-bg-repeat': 'repeat',
    },
  },
  {
    id: 'grid',
    name: 'Grid',
    type: 'pattern',
    variables: {
      '--canvas-bg-color': '#ffffff',
      '--canvas-bg-image': 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)',
      '--canvas-bg-size': '20px 20px',
      '--canvas-bg-repeat': 'repeat',
    },
  },
  {
    id: 'lines',
    name: 'Lines',
    type: 'pattern',
    variables: {
      '--canvas-bg-color': '#ffffff',
      '--canvas-bg-image': 'repeating-linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 24px)',
      '--canvas-bg-size': '100% 24px',
      '--canvas-bg-repeat': 'repeat',
    },
  },
  {
    id: 'crosshatch',
    name: 'Crosshatch',
    type: 'pattern',
    variables: {
      '--canvas-bg-color': '#ffffff',
      '--canvas-bg-image': 'repeating-linear-gradient(45deg, transparent, transparent 10px, #f5f5f5 10px, #f5f5f5 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, #f5f5f5 10px, #f5f5f5 11px)',
      '--canvas-bg-size': '20px 20px',
      '--canvas-bg-repeat': 'repeat',
    },
  },
  {
    id: 'waves',
    name: 'Waves',
    type: 'pattern',
    variables: {
      '--canvas-bg-color': '#f8fafc',
      '--canvas-bg-image': 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'20\' viewBox=\'0 0 100 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 10 Q25 0 50 10 T100 10\' fill=\'none\' stroke=\'%23e2e8f0\' stroke-width=\'1\'/%3E%3C/svg%3E")',
      '--canvas-bg-size': '100px 20px',
      '--canvas-bg-repeat': 'repeat',
    },
  },
  // Dark Variants (21-25)
  {
    id: 'dark-gray',
    name: 'Dark Gray',
    type: 'solid',
    variables: {
      '--canvas-bg-color': '#1f1f1f',
      '--canvas-bg-image': 'none',
    },
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    type: 'solid',
    variables: {
      '--canvas-bg-color': '#171717',
      '--canvas-bg-image': 'none',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    type: 'solid',
    variables: {
      '--canvas-bg-color': '#0f172a',
      '--canvas-bg-image': 'none',
    },
  },
  {
    id: 'deep-purple',
    name: 'Deep Purple',
    type: 'solid',
    variables: {
      '--canvas-bg-color': '#1e1033',
      '--canvas-bg-image': 'none',
    },
  },
  {
    id: 'black',
    name: 'Black',
    type: 'solid',
    variables: {
      '--canvas-bg-color': '#0a0a0a',
      '--canvas-bg-image': 'none',
    },
  },
]

// ============================================
// Layout Presets (25 total)
// ============================================

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'default',
    name: 'Default',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.6',
      '--layout-margin-top': '2rem',
      '--layout-margin-bottom': '2rem',
      '--layout-margin-left': '2rem',
      '--layout-margin-right': '2rem',
      '--layout-page-max-width': '720px',
      '--layout-page-padding': '1.5rem',
    },
  },
  {
    id: 'narrow',
    name: 'Narrow',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.6',
      '--layout-margin-top': '2rem',
      '--layout-margin-bottom': '2rem',
      '--layout-margin-left': '3rem',
      '--layout-margin-right': '3rem',
      '--layout-page-max-width': '560px',
      '--layout-page-padding': '1.5rem',
    },
  },
  {
    id: 'wide',
    name: 'Wide',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.6',
      '--layout-margin-top': '2rem',
      '--layout-margin-bottom': '2rem',
      '--layout-margin-left': '1.5rem',
      '--layout-margin-right': '1.5rem',
      '--layout-page-max-width': '900px',
      '--layout-page-padding': '2rem',
    },
  },
  {
    id: 'full-width',
    name: 'Full Width',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.6',
      '--layout-margin-top': '2rem',
      '--layout-margin-bottom': '2rem',
      '--layout-margin-left': '1rem',
      '--layout-margin-right': '1rem',
      '--layout-page-max-width': '100%',
      '--layout-page-padding': '2rem',
    },
  },
  {
    id: 'centered',
    name: 'Centered',
    variables: {
      '--layout-text-align': 'center',
      '--layout-paragraph-spacing': '1.25rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.7',
      '--layout-margin-top': '3rem',
      '--layout-margin-bottom': '3rem',
      '--layout-margin-left': '2rem',
      '--layout-margin-right': '2rem',
      '--layout-page-max-width': '680px',
      '--layout-page-padding': '1.5rem',
    },
  },
  {
    id: 'left-aligned',
    name: 'Left Aligned',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.6',
      '--layout-margin-top': '2rem',
      '--layout-margin-bottom': '2rem',
      '--layout-margin-left': '2rem',
      '--layout-margin-right': '2rem',
      '--layout-page-max-width': '720px',
      '--layout-page-padding': '1.5rem',
    },
  },
  {
    id: 'right-aligned',
    name: 'Right Aligned',
    variables: {
      '--layout-text-align': 'right',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.6',
      '--layout-margin-top': '2rem',
      '--layout-margin-bottom': '2rem',
      '--layout-margin-left': '2rem',
      '--layout-margin-right': '2rem',
      '--layout-page-max-width': '720px',
      '--layout-page-padding': '1.5rem',
    },
  },
  {
    id: 'justified',
    name: 'Justified',
    variables: {
      '--layout-text-align': 'justify',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '1.5em',
      '--layout-line-spacing': '1.6',
      '--layout-margin-top': '2rem',
      '--layout-margin-bottom': '2rem',
      '--layout-margin-left': '2rem',
      '--layout-margin-right': '2rem',
      '--layout-page-max-width': '720px',
      '--layout-page-padding': '1.5rem',
    },
  },
  {
    id: 'compact',
    name: 'Compact',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '0.5rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.4',
      '--layout-margin-top': '1rem',
      '--layout-margin-bottom': '1rem',
      '--layout-margin-left': '1rem',
      '--layout-margin-right': '1rem',
      '--layout-page-max-width': '680px',
      '--layout-page-padding': '1rem',
    },
  },
  {
    id: 'spacious',
    name: 'Spacious',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1.5rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '2',
      '--layout-margin-top': '3rem',
      '--layout-margin-bottom': '3rem',
      '--layout-margin-left': '3rem',
      '--layout-margin-right': '3rem',
      '--layout-page-max-width': '760px',
      '--layout-page-padding': '2rem',
    },
  },
  {
    id: 'academic',
    name: 'Academic',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '0',
      '--layout-paragraph-indent': '2em',
      '--layout-line-spacing': '2',
      '--layout-margin-top': '1in',
      '--layout-margin-bottom': '1in',
      '--layout-margin-left': '1in',
      '--layout-margin-right': '1in',
      '--layout-page-max-width': '6.5in',
      '--layout-page-padding': '0',
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
      '--layout-margin-top': '2.5rem',
      '--layout-margin-bottom': '2.5rem',
      '--layout-margin-left': '2.5rem',
      '--layout-margin-right': '2.5rem',
      '--layout-page-max-width': '480px',
      '--layout-page-padding': '1rem',
    },
  },
  {
    id: 'screenplay',
    name: 'Screenplay',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '0',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1',
      '--layout-margin-top': '1in',
      '--layout-margin-bottom': '1in',
      '--layout-margin-left': '1.5in',
      '--layout-margin-right': '1in',
      '--layout-page-max-width': '6in',
      '--layout-page-padding': '0',
    },
  },
  {
    id: 'legal',
    name: 'Legal',
    variables: {
      '--layout-text-align': 'justify',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.5',
      '--layout-margin-top': '1in',
      '--layout-margin-bottom': '1in',
      '--layout-margin-left': '1.25in',
      '--layout-margin-right': '1in',
      '--layout-page-max-width': '6.5in',
      '--layout-page-padding': '0',
    },
  },
  {
    id: 'letter',
    name: 'Letter',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.5',
      '--layout-margin-top': '1in',
      '--layout-margin-bottom': '1in',
      '--layout-margin-left': '1in',
      '--layout-margin-right': '1in',
      '--layout-page-max-width': '6.5in',
      '--layout-page-padding': '0',
    },
  },
  {
    id: 'a4',
    name: 'A4',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.5',
      '--layout-margin-top': '2.5cm',
      '--layout-margin-bottom': '2.5cm',
      '--layout-margin-left': '2.5cm',
      '--layout-margin-right': '2.5cm',
      '--layout-page-max-width': '16cm',
      '--layout-page-padding': '0',
    },
  },
  {
    id: 'manuscript',
    name: 'Manuscript',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '0',
      '--layout-paragraph-indent': '0.5in',
      '--layout-line-spacing': '2',
      '--layout-margin-top': '1in',
      '--layout-margin-bottom': '1in',
      '--layout-margin-left': '1in',
      '--layout-margin-right': '1in',
      '--layout-page-max-width': '6.5in',
      '--layout-page-padding': '0',
    },
  },
  {
    id: 'blog',
    name: 'Blog',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1.25rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.7',
      '--layout-margin-top': '2rem',
      '--layout-margin-bottom': '2rem',
      '--layout-margin-left': '1.5rem',
      '--layout-margin-right': '1.5rem',
      '--layout-page-max-width': '680px',
      '--layout-page-padding': '1rem',
    },
  },
  {
    id: 'report',
    name: 'Report',
    variables: {
      '--layout-text-align': 'justify',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.5',
      '--layout-margin-top': '1.5in',
      '--layout-margin-bottom': '1in',
      '--layout-margin-left': '1.25in',
      '--layout-margin-right': '1.25in',
      '--layout-page-max-width': '6in',
      '--layout-page-padding': '0',
    },
  },
  {
    id: 'presentation',
    name: 'Presentation',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '2rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.5',
      '--layout-margin-top': '3rem',
      '--layout-margin-bottom': '3rem',
      '--layout-margin-left': '4rem',
      '--layout-margin-right': '4rem',
      '--layout-page-max-width': '900px',
      '--layout-page-padding': '2rem',
    },
  },
  {
    id: 'dense',
    name: 'Dense',
    variables: {
      '--layout-text-align': 'justify',
      '--layout-paragraph-spacing': '0.5rem',
      '--layout-paragraph-indent': '1em',
      '--layout-line-spacing': '1.3',
      '--layout-margin-top': '1rem',
      '--layout-margin-bottom': '1rem',
      '--layout-margin-left': '1rem',
      '--layout-margin-right': '1rem',
      '--layout-page-max-width': '800px',
      '--layout-page-padding': '1rem',
    },
  },
  {
    id: 'airy',
    name: 'Airy',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '2rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '2.2',
      '--layout-margin-top': '4rem',
      '--layout-margin-bottom': '4rem',
      '--layout-margin-left': '4rem',
      '--layout-margin-right': '4rem',
      '--layout-page-max-width': '640px',
      '--layout-page-padding': '2rem',
    },
  },
  {
    id: 'classic',
    name: 'Classic',
    variables: {
      '--layout-text-align': 'justify',
      '--layout-paragraph-spacing': '0',
      '--layout-paragraph-indent': '1.5em',
      '--layout-line-spacing': '1.6',
      '--layout-margin-top': '2rem',
      '--layout-margin-bottom': '2rem',
      '--layout-margin-left': '2.5rem',
      '--layout-margin-right': '2.5rem',
      '--layout-page-max-width': '640px',
      '--layout-page-padding': '1.5rem',
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1.5rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.7',
      '--layout-margin-top': '2.5rem',
      '--layout-margin-bottom': '2.5rem',
      '--layout-margin-left': '2rem',
      '--layout-margin-right': '2rem',
      '--layout-page-max-width': '720px',
      '--layout-page-padding': '1.5rem',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    variables: {
      '--layout-text-align': 'left',
      '--layout-paragraph-spacing': '1rem',
      '--layout-paragraph-indent': '0',
      '--layout-line-spacing': '1.5',
      '--layout-margin-top': '1.5rem',
      '--layout-margin-bottom': '1.5rem',
      '--layout-margin-left': '1.5rem',
      '--layout-margin-right': '1.5rem',
      '--layout-page-max-width': '600px',
      '--layout-page-padding': '1rem',
    },
  },
]

// ============================================
// Master Themes (33 predefined combinations)
// ============================================

export const MASTER_THEMES: MasterTheme[] = [
  // Writing Modes (1-10)
  {
    id: 'novelist',
    name: 'Novelist',
    typography: 'book',
    colors: 'sepia',
    canvas: 'cream',
    layout: 'novel',
  },
  {
    id: 'journalist',
    name: 'Journalist',
    typography: 'newspaper',
    colors: 'paper',
    canvas: 'white',
    layout: 'narrow',
  },
  {
    id: 'academic',
    name: 'Academic',
    typography: 'academic',
    colors: 'default',
    canvas: 'white',
    layout: 'academic',
  },
  {
    id: 'screenwriter',
    name: 'Screenwriter',
    typography: 'screenplay',
    colors: 'paper',
    canvas: 'white',
    layout: 'screenplay',
  },
  {
    id: 'blogger',
    name: 'Blogger',
    typography: 'modern-sans',
    colors: 'default',
    canvas: 'white',
    layout: 'blog',
  },
  {
    id: 'legal-professional',
    name: 'Legal Professional',
    typography: 'legal',
    colors: 'ink',
    canvas: 'white',
    layout: 'legal',
  },
  {
    id: 'technical-writer',
    name: 'Technical Writer',
    typography: 'technical',
    colors: 'cool',
    canvas: 'white',
    layout: 'report',
  },
  {
    id: 'creative-writer',
    name: 'Creative Writer',
    typography: 'elegant',
    colors: 'warm',
    canvas: 'cream',
    layout: 'centered',
  },
  {
    id: 'essayist',
    name: 'Essayist',
    typography: 'classic-serif',
    colors: 'sepia',
    canvas: 'parchment',
    layout: 'classic',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    typography: 'minimal',
    colors: 'monochrome',
    canvas: 'white',
    layout: 'minimal',
  },
  // Dark Modes (11-18)
  {
    id: 'night-owl',
    name: 'Night Owl',
    typography: 'modern-sans',
    colors: 'midnight',
    canvas: 'charcoal',
    layout: 'spacious',
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    typography: 'minimal',
    colors: 'night',
    canvas: 'dark-gray',
    layout: 'centered',
  },
  {
    id: 'dark-novelist',
    name: 'Dark Novelist',
    typography: 'book',
    colors: 'sepia',
    canvas: 'charcoal',
    layout: 'novel',
  },
  {
    id: 'midnight-coder',
    name: 'Midnight Coder',
    typography: 'monospace',
    colors: 'night',
    canvas: 'midnight-blue',
    layout: 'wide',
  },
  {
    id: 'noir',
    name: 'Noir',
    typography: 'typewriter',
    colors: 'monochrome',
    canvas: 'black',
    layout: 'narrow',
  },
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    typography: 'contemporary',
    colors: 'lavender',
    canvas: 'deep-purple',
    layout: 'modern',
  },
  {
    id: 'ocean-night',
    name: 'Ocean Night',
    typography: 'clean',
    colors: 'ocean',
    canvas: 'midnight-blue',
    layout: 'spacious',
  },
  {
    id: 'forest-night',
    name: 'Forest Night',
    typography: 'book',
    colors: 'forest',
    canvas: 'charcoal',
    layout: 'classic',
  },
  // Nature Inspired (19-24)
  {
    id: 'sunrise',
    name: 'Sunrise',
    typography: 'elegant',
    colors: 'warm',
    canvas: 'gradient-sunrise',
    layout: 'spacious',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    typography: 'clean',
    colors: 'ocean',
    canvas: 'gradient-ocean',
    layout: 'wide',
  },
  {
    id: 'forest-morning',
    name: 'Forest Morning',
    typography: 'traditional',
    colors: 'forest',
    canvas: 'gradient-forest',
    layout: 'modern',
  },
  {
    id: 'autumn-leaves',
    name: 'Autumn Leaves',
    typography: 'classic-serif',
    colors: 'autumn',
    canvas: 'warm-white',
    layout: 'classic',
  },
  {
    id: 'spring-bloom',
    name: 'Spring Bloom',
    typography: 'casual',
    colors: 'spring',
    canvas: 'gradient-forest',
    layout: 'airy',
  },
  {
    id: 'desert-sand',
    name: 'Desert Sand',
    typography: 'traditional',
    colors: 'sand',
    canvas: 'cream',
    layout: 'spacious',
  },
  // Professional (25-28)
  {
    id: 'corporate',
    name: 'Corporate',
    typography: 'clean',
    colors: 'slate',
    canvas: 'cool-white',
    layout: 'report',
  },
  {
    id: 'presentation',
    name: 'Presentation',
    typography: 'contemporary',
    colors: 'default',
    canvas: 'white',
    layout: 'presentation',
  },
  {
    id: 'manuscript',
    name: 'Manuscript',
    typography: 'typewriter',
    colors: 'paper',
    canvas: 'white',
    layout: 'manuscript',
  },
  {
    id: 'letter',
    name: 'Letter',
    typography: 'classic-serif',
    colors: 'ink',
    canvas: 'white',
    layout: 'letter',
  },
  // Creative (29-33)
  {
    id: 'vintage',
    name: 'Vintage',
    typography: 'typewriter',
    colors: 'sepia',
    canvas: 'parchment',
    layout: 'narrow',
  },
  {
    id: 'romantic',
    name: 'Romantic',
    typography: 'elegant',
    colors: 'rose',
    canvas: 'gradient-sunset',
    layout: 'centered',
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    typography: 'handwritten',
    colors: 'lavender',
    canvas: 'gradient-soft',
    layout: 'airy',
  },
  {
    id: 'bold-statement',
    name: 'Bold Statement',
    typography: 'bold',
    colors: 'vibrant',
    canvas: 'white',
    layout: 'wide',
  },
  {
    id: 'serq-default',
    name: 'SERQ Default',
    typography: 'serq-default',
    colors: 'default',
    canvas: 'white',
    layout: 'default',
  },
]

// ============================================
// Utility Functions
// ============================================

/**
 * Apply a typography preset to the document
 */
export function applyTypographyPreset(presetId: string): void {
  const preset = TYPOGRAPHY_PRESETS.find((p) => p.id === presetId)
  if (!preset) {
    console.warn(`Typography preset not found: ${presetId}`)
    return
  }

  const root = document.documentElement
  Object.entries(preset.variables).forEach(([prop, value]) => {
    root.style.setProperty(prop, value)
  })
}

/**
 * Apply a color preset to the document
 */
export function applyColorPreset(
  presetId: string,
  mode: 'light' | 'dark'
): void {
  const preset = COLOR_PRESETS.find((p) => p.id === presetId)
  if (!preset) {
    console.warn(`Color preset not found: ${presetId}`)
    return
  }

  const root = document.documentElement
  const variables = mode === 'dark' ? preset.dark : preset.light
  Object.entries(variables).forEach(([prop, value]) => {
    root.style.setProperty(prop, value)
  })
}

/**
 * Apply a canvas preset to the document
 */
export function applyCanvasPreset(presetId: string): void {
  const preset = CANVAS_PRESETS.find((p) => p.id === presetId)
  if (!preset) {
    console.warn(`Canvas preset not found: ${presetId}`)
    return
  }

  const root = document.documentElement
  // Reset canvas variables to defaults first
  root.style.setProperty('--canvas-bg-color', '')
  root.style.setProperty('--canvas-bg-image', 'none')
  root.style.setProperty('--canvas-bg-size', 'auto')
  root.style.setProperty('--canvas-bg-position', 'center')
  root.style.setProperty('--canvas-bg-repeat', 'no-repeat')

  // Apply preset variables
  Object.entries(preset.variables).forEach(([prop, value]) => {
    root.style.setProperty(prop, value)
  })
}

/**
 * Apply a layout preset to the document
 */
export function applyLayoutPreset(presetId: string): void {
  const preset = LAYOUT_PRESETS.find((p) => p.id === presetId)
  if (!preset) {
    console.warn(`Layout preset not found: ${presetId}`)
    return
  }

  const root = document.documentElement
  Object.entries(preset.variables).forEach(([prop, value]) => {
    root.style.setProperty(prop, value)
  })
}

/**
 * Apply a complete master theme
 */
export function applyMasterTheme(
  themeId: string,
  mode: 'light' | 'dark'
): void {
  const theme = MASTER_THEMES.find((t) => t.id === themeId)
  if (!theme) {
    console.warn(`Master theme not found: ${themeId}`)
    return
  }

  applyTypographyPreset(theme.typography)
  applyColorPreset(theme.colors, mode)
  applyCanvasPreset(theme.canvas)
  applyLayoutPreset(theme.layout)
}

/**
 * Get a preset by type and ID
 */
export function getPresetById<
  T extends 'typography' | 'color' | 'canvas' | 'layout',
>(
  type: T,
  id: string
): T extends 'typography'
  ? TypographyPreset | undefined
  : T extends 'color'
    ? ColorPreset | undefined
    : T extends 'canvas'
      ? CanvasPreset | undefined
      : LayoutPreset | undefined {
  switch (type) {
    case 'typography':
      return TYPOGRAPHY_PRESETS.find((p) => p.id === id) as ReturnType<
        typeof getPresetById<T>
      >
    case 'color':
      return COLOR_PRESETS.find((p) => p.id === id) as ReturnType<
        typeof getPresetById<T>
      >
    case 'canvas':
      return CANVAS_PRESETS.find((p) => p.id === id) as ReturnType<
        typeof getPresetById<T>
      >
    case 'layout':
      return LAYOUT_PRESETS.find((p) => p.id === id) as ReturnType<
        typeof getPresetById<T>
      >
    default:
      return undefined as ReturnType<typeof getPresetById<T>>
  }
}

/**
 * Get a master theme by ID
 */
export function getMasterThemeById(id: string): MasterTheme | undefined {
  return MASTER_THEMES.find((t) => t.id === id)
}

/**
 * Reset all style variables to CSS defaults (remove inline styles)
 */
export function resetToDefaults(): void {
  const root = document.documentElement

  // Get all custom property names from a sample preset
  const allVariables = new Set<string>()

  TYPOGRAPHY_PRESETS[0]?.variables &&
    Object.keys(TYPOGRAPHY_PRESETS[0].variables).forEach((v) =>
      allVariables.add(v)
    )
  COLOR_PRESETS[0]?.light &&
    Object.keys(COLOR_PRESETS[0].light).forEach((v) => allVariables.add(v))
  CANVAS_PRESETS[0]?.variables &&
    Object.keys(CANVAS_PRESETS[0].variables).forEach((v) =>
      allVariables.add(v)
    )
  LAYOUT_PRESETS[0]?.variables &&
    Object.keys(LAYOUT_PRESETS[0].variables).forEach((v) =>
      allVariables.add(v)
    )

  // Remove all inline style properties
  allVariables.forEach((prop) => {
    root.style.removeProperty(prop)
  })
}
