/**
 * Preferences Store - Persistent user preferences via tauri-plugin-store
 *
 * Stores style defaults, recent presets, theme mode, and custom styles.
 * Uses a shared store instance with recentFiles and workingFolder.
 */

import { load } from '@tauri-apps/plugin-store';
import type { CustomStyle, ThemeMode } from '../stores/styleStore';

const STORE_FILE = 'preferences.json';

let storeInstance: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!storeInstance) {
    storeInstance = await load(STORE_FILE, { defaults: {}, autoSave: false });
  }
  return storeInstance;
}

// ===== STYLE DEFAULTS =====

export interface StyleDefaults {
  typography: string;
  colors: string;
  canvas: string;
  layout: string;
  masterTheme: string | null;
  themeMode: ThemeMode;
}

const DEFAULT_STYLE_DEFAULTS: StyleDefaults = {
  typography: 'default',
  colors: 'default',
  canvas: 'white',
  layout: 'default',
  masterTheme: null,
  themeMode: 'system',
};

/**
 * Get user's default style settings
 */
export async function getStyleDefaults(): Promise<StyleDefaults> {
  const store = await getStore();
  const defaults = await store.get<Partial<StyleDefaults>>('styleDefaults');
  return {
    ...DEFAULT_STYLE_DEFAULTS,
    ...defaults,
  };
}

/**
 * Set user's default style settings
 */
export async function setStyleDefaults(defaults: Partial<StyleDefaults>): Promise<void> {
  const store = await getStore();
  const current = await getStyleDefaults();
  await store.set('styleDefaults', { ...current, ...defaults });
  await store.save();
}

// ===== RECENT PRESETS =====

export interface RecentPresets {
  typography: string[];
  colors: string[];
  canvas: string[];
  layout: string[];
  masterThemes: string[];
}

const DEFAULT_RECENT_PRESETS: RecentPresets = {
  typography: [],
  colors: [],
  canvas: [],
  layout: [],
  masterThemes: [],
};

/**
 * Get recently used presets
 */
export async function getRecentPresets(): Promise<RecentPresets> {
  const store = await getStore();
  const recents = await store.get<Partial<RecentPresets>>('recentPresets');
  return {
    ...DEFAULT_RECENT_PRESETS,
    ...recents,
  };
}

/**
 * Save recently used presets
 */
export async function setRecentPresets(recents: RecentPresets): Promise<void> {
  const store = await getStore();
  await store.set('recentPresets', recents);
  await store.save();
}

// ===== CUSTOM STYLES =====

/**
 * Get user's custom saved styles
 */
export async function getCustomStyles(): Promise<CustomStyle[]> {
  const store = await getStore();
  const styles = await store.get<CustomStyle[]>('customStyles');
  return styles ?? [];
}

/**
 * Save custom styles
 */
export async function saveCustomStyles(styles: CustomStyle[]): Promise<void> {
  const store = await getStore();
  await store.set('customStyles', styles);
  await store.save();
}

// ===== THEME MODE =====

/**
 * Get theme mode preference
 */
export async function getThemeMode(): Promise<ThemeMode> {
  const store = await getStore();
  const mode = await store.get<ThemeMode>('themeMode');
  return mode ?? 'system';
}

/**
 * Set theme mode preference
 */
export async function setThemeMode(mode: ThemeMode): Promise<void> {
  const store = await getStore();
  await store.set('themeMode', mode);
  await store.save();
}
