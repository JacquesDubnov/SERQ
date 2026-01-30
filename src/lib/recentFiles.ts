import { load } from '@tauri-apps/plugin-store'

/**
 * Maximum number of recent files to track
 * FIFO: oldest entries are removed when limit is exceeded
 */
const MAX_RECENT_FILES = 10

/**
 * Store file name for preferences persistence
 */
const STORE_FILE = 'preferences.json'

/**
 * Recent file entry with metadata
 */
export interface RecentFile {
  /** Full file path */
  path: string
  /** Display name (extracted from path) */
  name: string
  /** ISO timestamp of last access */
  lastOpened: string
}

/**
 * Singleton store instance to avoid repeated file loads
 */
let storeInstance: Awaited<ReturnType<typeof load>> | null = null

/**
 * Get or create the preferences store instance
 * Uses singleton pattern for performance
 */
async function getStore() {
  if (!storeInstance) {
    storeInstance = await load(STORE_FILE, {
      defaults: {},
      autoSave: false,
    })
  }
  return storeInstance
}

/**
 * Get the list of recently opened files
 *
 * @returns Array of recent files, most recently opened first
 */
export async function getRecentFiles(): Promise<RecentFile[]> {
  const store = await getStore()
  const files = await store.get<RecentFile[]>('recentFiles')
  return files ?? []
}

/**
 * Add a file to the recent files list
 *
 * Behavior:
 * - If file already exists, moves it to the top (updates lastOpened)
 * - New files are added at the top
 * - List is trimmed to MAX_RECENT_FILES (oldest removed)
 *
 * @param path - Full file path
 * @param name - Display name for the file
 */
export async function addRecentFile(path: string, name: string): Promise<void> {
  const store = await getStore()
  let files = await getRecentFiles()

  // Remove if already exists (will re-add at top)
  files = files.filter((f) => f.path !== path)

  // Add to front of list
  files.unshift({
    path,
    name,
    lastOpened: new Date().toISOString(),
  })

  // Trim to max (FIFO - oldest falls off)
  files = files.slice(0, MAX_RECENT_FILES)

  await store.set('recentFiles', files)
  await store.save()
}

/**
 * Clear all recent files
 * Used for privacy or when resetting app state
 */
export async function clearRecentFiles(): Promise<void> {
  const store = await getStore()
  await store.set('recentFiles', [])
  await store.save()
}

/**
 * Remove a specific file from the recent files list
 * Useful when a file is deleted or no longer accessible
 *
 * @param path - Full file path to remove
 */
export async function removeRecentFile(path: string): Promise<void> {
  const store = await getStore()
  let files = await getRecentFiles()
  files = files.filter((f) => f.path !== path)
  await store.set('recentFiles', files)
  await store.save()
}
