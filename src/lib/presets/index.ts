/**
 * SERQ Style Presets - Barrel Re-exports
 *
 * All symbols are re-exported for backward compatibility.
 * Consumers importing from '../../lib/presets' continue to work unchanged.
 */

export type {
  TypographyPreset,
  ColorPreset,
  CanvasPreset,
  LayoutPreset,
  MasterTheme,
} from './types';

export {
  TYPOGRAPHY_PRESETS,
  COLOR_PRESETS,
  CANVAS_PRESETS,
  LAYOUT_PRESETS,
  MASTER_THEMES,
} from './data';

export {
  applyTypographyPreset,
  applyColorPreset,
  applyCanvasPreset,
  applyLayoutPreset,
  applyMasterTheme,
  getPresetById,
  getMasterThemeById,
} from './apply';
