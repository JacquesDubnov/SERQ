import { load } from '@tauri-apps/plugin-store'

/**
 * Store file name for preferences persistence
 */
const STORE_FILE = 'preferences.json'

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
        defaults: {
          recentFiles: [],
          workingFolder: null,
        },
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
