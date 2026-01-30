import { getPreferencesStore } from './preferencesStore'

/**
 * Maximum number of recent files to track
 * FIFO: oldest entries are removed when limit is exceeded
 */
const MAX_RECENT_FILES = 10

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
 * Get the list of recently opened files
 *
 * @returns Array of recent files, most recently opened first
 */
export async function getRecentFiles(): Promise<RecentFile[]> {
  const store = await getPreferencesStore()
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
  try {
    const store = await getPreferencesStore()
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
    console.log('[RecentFiles] Added:', name)
  } catch (error) {
    console.error('[RecentFiles] Failed to add:', error)
    // Don't re-throw - recent files is non-critical
  }
}

/**
 * Clear all recent files
 * Used for privacy or when resetting app state
 */
export async function clearRecentFiles(): Promise<void> {
  const store = await getPreferencesStore()
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
  const store = await getPreferencesStore()
  let files = await getRecentFiles()
  files = files.filter((f) => f.path !== path)
  await store.set('recentFiles', files)
  await store.save()
}
