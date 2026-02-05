/**
 * SERQ Style Preset Interfaces
 *
 * Variable names MUST match CSS custom properties in themes.css exactly.
 */

export interface TypographyPreset {
  id: string;
  name: string;
  variables: Record<string, string>;
}

export interface ColorPreset {
  id: string;
  name: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

export interface CanvasPreset {
  id: string;
  name: string;
  type: 'solid' | 'gradient' | 'pattern';
  variables: Record<string, string>;
  darkVariables?: Record<string, string>;
}

export interface LayoutPreset {
  id: string;
  name: string;
  variables: Record<string, string>;
}

export interface MasterTheme {
  id: string;
  name: string;
  typography: string;
  colors: string;
  canvas: string;
  layout: string;
}
