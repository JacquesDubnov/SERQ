import { load } from '@tauri-apps/plugin-store'
import { homeDir } from '@tauri-apps/api/path'

/**
 * Store file name for preferences persistence
 */
const STORE_FILE = 'preferences.json'

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
 * Get the configured working folder for file dialogs
 *
 * Returns the stored preference, or falls back to user's home directory.
 * Used as defaultPath in open/save dialogs so they open to the user's
 * preferred location.
 *
 * @returns Path to the working folder
 */
export async function getWorkingFolder(): Promise<string> {
  const store = await getStore()
  const folder = await store.get<string>('workingFolder')

  if (folder) {
    return folder
  }

  // Default to home directory if not configured
  return await homeDir()
}

/**
 * Set the working folder preference
 *
 * This will be used as defaultPath in open/save dialogs.
 * Typically called when user explicitly chooses a folder or
 * automatically after opening/saving a file.
 *
 * @param path - Directory path to set as working folder
 */
export async function setWorkingFolder(path: string): Promise<void> {
  const store = await getStore()
  await store.set('workingFolder', path)
  await store.save()
}

/**
 * Update working folder based on a file path
 *
 * Extracts the directory from the file path and stores it.
 * Called automatically when opening or saving files so the
 * next dialog opens to the same location.
 *
 * @param filePath - Full file path (directory will be extracted)
 */
export async function updateWorkingFolderFromFile(filePath: string): Promise<void> {
  // Extract directory from file path
  const lastSlash = filePath.lastIndexOf('/')
  if (lastSlash > 0) {
    const directory = filePath.substring(0, lastSlash)
    await setWorkingFolder(directory)
  }
}
