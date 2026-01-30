import { load } from '@tauri-apps/plugin-store'
import type { CustomStyle } from '../stores/styleStore'

/**
 * Store file name for preferences persistence
 */
const STORE_FILE = 'preferences.json'

/**
 * Recent file entry
 */
export interface RecentFile {
  path: string
  name: string
  lastOpened: string
}

/**
 * Style defaults that persist across app restarts
 */
export interface StyleDefaults {
  defaultTypography: string
  defaultColor: string
  defaultCanvas: string
  defaultLayout: string
  defaultMasterTheme: string | null
  themeMode: 'light' | 'dark' | 'system'
}

/**
 * Persisted recent presets and custom styles
 */
export interface StylePersistence {
  recentTypography: string[]
  recentColors: string[]
  recentCanvas: string[]
  recentLayout: string[]
  recentMasterThemes: string[]
  customStyles: CustomStyle[]
}

/**
 * Full preferences structure
 */
export interface Preferences {
  // File management
  workingFolder: string | null
  recentFiles: RecentFile[]

  // Style defaults
  defaultTypography: string
  defaultColor: string
  defaultCanvas: string
  defaultLayout: string
  defaultMasterTheme: string | null
  themeMode: 'light' | 'dark' | 'system'

  // Recent presets (persisted across sessions)
  recentTypography: string[]
  recentColors: string[]
  recentCanvas: string[]
  recentLayout: string[]
  recentMasterThemes: string[]

  // Custom user styles
  customStyles: CustomStyle[]
}

/**
 * Default preferences values
 */
const DEFAULT_PREFERENCES: Preferences & { [key: string]: unknown } = {
  workingFolder: null,
  recentFiles: [],
  defaultTypography: 'serq-default',
  defaultColor: 'default',
  defaultCanvas: 'white',
  defaultLayout: 'default',
  defaultMasterTheme: null,
  themeMode: 'system',
  recentTypography: [],
  recentColors: [],
  recentCanvas: [],
  recentLayout: [],
  recentMasterThemes: [],
  customStyles: [],
}

/**
 * Singleton store instance to avoid repeated file loads
 * CRITICAL: This must be a single shared instance across all modules
 * that read/write preferences to avoid data loss from overwriting
 */
let storeInstance: Awaited<ReturnType<typeof load>> | null = null

/**
 * Get or create the preferences store instance
 * Uses singleton pattern for performance and data consistency
 *
 * All modules that need preferences must use this function
 * to ensure they share the same store instance.
 */
export async function getPreferencesStore() {
  if (!storeInstance) {
    console.log('[PreferencesStore] Creating new store instance...')
    try {
      storeInstance = await load(STORE_FILE, {
        defaults: DEFAULT_PREFERENCES,
        autoSave: false,
      })
      console.log('[PreferencesStore] Store instance created successfully')
    } catch (error) {
      console.error('[PreferencesStore] Failed to load:', error)
      throw error
    }
  } else {
    console.log('[PreferencesStore] Returning existing store instance')
  }
  return storeInstance
}

// ============================================
// File Management Functions
// ============================================

/**
 * Get the current working folder
 */
export async function getWorkingFolder(): Promise<string | null> {
  const store = await getPreferencesStore()
  return (await store.get<string | null>('workingFolder')) ?? null
}

/**
 * Set the working folder
 */
export async function setWorkingFolder(path: string | null): Promise<void> {
  const store = await getPreferencesStore()
  await store.set('workingFolder', path)
  await store.save()
}

/**
 * Get recent files list
 */
export async function getRecentFiles(): Promise<RecentFile[]> {
  const store = await getPreferencesStore()
  return (await store.get<RecentFile[]>('recentFiles')) ?? []
}

/**
 * Add a file to recent files list
 */
export async function addRecentFile(
  path: string,
  name: string
): Promise<void> {
  const store = await getPreferencesStore()
  const recentFiles = (await store.get<RecentFile[]>('recentFiles')) ?? []

  // Remove if already exists
  const filtered = recentFiles.filter((f) => f.path !== path)

  // Add to front
  const updated: RecentFile[] = [
    { path, name, lastOpened: new Date().toISOString() },
    ...filtered,
  ].slice(0, 10) // Keep max 10

  await store.set('recentFiles', updated)
  await store.save()
}

// ============================================
// Style Defaults Functions
// ============================================

/**
 * Get style defaults for new documents
 */
export async function getStyleDefaults(): Promise<StyleDefaults> {
  const store = await getPreferencesStore()

  return {
    defaultTypography:
      (await store.get<string>('defaultTypography')) ??
      DEFAULT_PREFERENCES.defaultTypography,
    defaultColor:
      (await store.get<string>('defaultColor')) ??
      DEFAULT_PREFERENCES.defaultColor,
    defaultCanvas:
      (await store.get<string>('defaultCanvas')) ??
      DEFAULT_PREFERENCES.defaultCanvas,
    defaultLayout:
      (await store.get<string>('defaultLayout')) ??
      DEFAULT_PREFERENCES.defaultLayout,
    defaultMasterTheme:
      (await store.get<string | null>('defaultMasterTheme')) ??
      DEFAULT_PREFERENCES.defaultMasterTheme,
    themeMode:
      (await store.get<'light' | 'dark' | 'system'>('themeMode')) ??
      DEFAULT_PREFERENCES.themeMode,
  }
}

/**
 * Set style defaults (user clicks "Set as Default")
 */
export async function setStyleDefaults(
  defaults: Partial<StyleDefaults>
): Promise<void> {
  const store = await getPreferencesStore()

  if (defaults.defaultTypography !== undefined) {
    await store.set('defaultTypography', defaults.defaultTypography)
  }
  if (defaults.defaultColor !== undefined) {
    await store.set('defaultColor', defaults.defaultColor)
  }
  if (defaults.defaultCanvas !== undefined) {
    await store.set('defaultCanvas', defaults.defaultCanvas)
  }
  if (defaults.defaultLayout !== undefined) {
    await store.set('defaultLayout', defaults.defaultLayout)
  }
  if (defaults.defaultMasterTheme !== undefined) {
    await store.set('defaultMasterTheme', defaults.defaultMasterTheme)
  }
  if (defaults.themeMode !== undefined) {
    await store.set('themeMode', defaults.themeMode)
  }

  await store.save()
}

// ============================================
// Style Persistence Functions (recents, customs)
// ============================================

/**
 * Get persisted style state (recents and custom styles)
 */
export async function getStylePersistence(): Promise<StylePersistence> {
  const store = await getPreferencesStore()

  return {
    recentTypography:
      (await store.get<string[]>('recentTypography')) ??
      DEFAULT_PREFERENCES.recentTypography,
    recentColors:
      (await store.get<string[]>('recentColors')) ??
      DEFAULT_PREFERENCES.recentColors,
    recentCanvas:
      (await store.get<string[]>('recentCanvas')) ??
      DEFAULT_PREFERENCES.recentCanvas,
    recentLayout:
      (await store.get<string[]>('recentLayout')) ??
      DEFAULT_PREFERENCES.recentLayout,
    recentMasterThemes:
      (await store.get<string[]>('recentMasterThemes')) ??
      DEFAULT_PREFERENCES.recentMasterThemes,
    customStyles:
      (await store.get<CustomStyle[]>('customStyles')) ??
      DEFAULT_PREFERENCES.customStyles,
  }
}

/**
 * Save recent presets to preferences
 */
export async function saveRecentPresets(recents: {
  recentTypography?: string[]
  recentColors?: string[]
  recentCanvas?: string[]
  recentLayout?: string[]
  recentMasterThemes?: string[]
}): Promise<void> {
  const store = await getPreferencesStore()

  if (recents.recentTypography !== undefined) {
    await store.set('recentTypography', recents.recentTypography)
  }
  if (recents.recentColors !== undefined) {
    await store.set('recentColors', recents.recentColors)
  }
  if (recents.recentCanvas !== undefined) {
    await store.set('recentCanvas', recents.recentCanvas)
  }
  if (recents.recentLayout !== undefined) {
    await store.set('recentLayout', recents.recentLayout)
  }
  if (recents.recentMasterThemes !== undefined) {
    await store.set('recentMasterThemes', recents.recentMasterThemes)
  }

  await store.save()
}

/**
 * Get custom styles
 */
export async function getCustomStyles(): Promise<CustomStyle[]> {
  const store = await getPreferencesStore()
  return (
    (await store.get<CustomStyle[]>('customStyles')) ??
    DEFAULT_PREFERENCES.customStyles
  )
}

/**
 * Save custom styles
 */
export async function saveCustomStyles(
  styles: CustomStyle[]
): Promise<void> {
  const store = await getPreferencesStore()
  await store.set('customStyles', styles)
  await store.save()
}
