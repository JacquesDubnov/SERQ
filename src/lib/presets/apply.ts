/**
 * SERQ Style Preset Apply/Lookup Functions
 *
 * Functions for applying presets to the DOM via CSS variables
 * and looking up presets by type and ID.
 */

import type { TypographyPreset, ColorPreset, CanvasPreset, LayoutPreset } from './types';
import {
  TYPOGRAPHY_PRESETS,
  COLOR_PRESETS,
  CANVAS_PRESETS,
  LAYOUT_PRESETS,
  MASTER_THEMES,
} from './data';

/**
 * Apply a typography preset by setting CSS variables
 */
export function applyTypographyPreset(presetId: string): void {
  const preset = TYPOGRAPHY_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    console.warn(`[Presets] Typography preset not found: ${presetId}`);
    return;
  }

  const root = document.documentElement;
  for (const [varName, value] of Object.entries(preset.variables)) {
    root.style.setProperty(varName, value);
  }
}

/**
 * Apply a color preset by setting CSS variables
 */
export function applyColorPreset(presetId: string, mode: 'light' | 'dark'): void {
  const preset = COLOR_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    console.warn(`[Presets] Color preset not found: ${presetId}`);
    return;
  }

  const root = document.documentElement;
  const variables = mode === 'dark' ? preset.dark : preset.light;
  for (const [varName, value] of Object.entries(variables)) {
    root.style.setProperty(varName, value);
  }
}

/**
 * Apply a canvas preset by setting CSS variables
 */
export function applyCanvasPreset(presetId: string, mode: 'light' | 'dark' = 'light'): void {
  const preset = CANVAS_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    console.warn(`[Presets] Canvas preset not found: ${presetId}`);
    return;
  }

  const root = document.documentElement;
  const variables = mode === 'dark' && preset.darkVariables ? preset.darkVariables : preset.variables;

  // Reset canvas variables first
  root.style.setProperty('--canvas-bg-image', 'none');
  root.style.setProperty('--canvas-bg-size', 'auto');
  root.style.setProperty('--canvas-bg-position', 'center');
  root.style.setProperty('--canvas-bg-repeat', 'no-repeat');

  for (const [varName, value] of Object.entries(variables)) {
    root.style.setProperty(varName, value);
  }
}

/**
 * Apply a layout preset by setting CSS variables
 */
export function applyLayoutPreset(presetId: string): void {
  const preset = LAYOUT_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    console.warn(`[Presets] Layout preset not found: ${presetId}`);
    return;
  }

  const root = document.documentElement;
  for (const [varName, value] of Object.entries(preset.variables)) {
    root.style.setProperty(varName, value);
  }
}

/**
 * Apply a master theme (combines typography, colors, canvas, layout)
 */
export function applyMasterTheme(themeId: string, mode: 'light' | 'dark'): void {
  const theme = MASTER_THEMES.find((t) => t.id === themeId);
  if (!theme) {
    console.warn(`[Presets] Master theme not found: ${themeId}`);
    return;
  }

  applyTypographyPreset(theme.typography);
  applyColorPreset(theme.colors, mode);
  applyCanvasPreset(theme.canvas, mode);
  applyLayoutPreset(theme.layout);
}

/**
 * Get a preset by type and ID
 */
export function getPresetById(
  type: 'typography' | 'color' | 'canvas' | 'layout',
  id: string
): TypographyPreset | ColorPreset | CanvasPreset | LayoutPreset | undefined {
  switch (type) {
    case 'typography':
      return TYPOGRAPHY_PRESETS.find((p) => p.id === id);
    case 'color':
      return COLOR_PRESETS.find((p) => p.id === id);
    case 'canvas':
      return CANVAS_PRESETS.find((p) => p.id === id);
    case 'layout':
      return LAYOUT_PRESETS.find((p) => p.id === id);
  }
}

/**
 * Get a master theme by ID
 */
export function getMasterThemeById(id: string) {
  return MASTER_THEMES.find((t) => t.id === id);
}
