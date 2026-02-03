/**
 * Working Folder - Persistent folder preference for file dialogs
 *
 * Uses tauri-plugin-store for persistence.
 * Open/Save dialogs will default to this folder.
 */

import { load } from '@tauri-apps/plugin-store';
import { homeDir } from '@tauri-apps/api/path';

const STORE_FILE = 'preferences.json';

let storeInstance: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!storeInstance) {
    // Note: tauri-plugin-store v2 requires defaults property
    storeInstance = await load(STORE_FILE, { defaults: {}, autoSave: false });
  }
  return storeInstance;
}

/**
 * Get the configured working folder for file dialogs.
 * Returns the stored preference, or falls back to user's home directory.
 */
export async function getWorkingFolder(): Promise<string> {
  const store = await getStore();
  const folder = await store.get<string>('workingFolder');

  if (folder) {
    return folder;
  }

  // Default to home directory if not configured
  return await homeDir();
}

/**
 * Set the working folder preference.
 * This will be used as defaultPath in open/save dialogs.
 */
export async function setWorkingFolder(path: string): Promise<void> {
  const store = await getStore();
  await store.set('workingFolder', path);
  await store.save();
}

/**
 * Update working folder based on a file path.
 * Extracts the directory from the file path and stores it.
 */
export async function updateWorkingFolderFromFile(filePath: string): Promise<void> {
  // Extract directory from file path
  const lastSlash = filePath.lastIndexOf('/');
  if (lastSlash > 0) {
    const directory = filePath.substring(0, lastSlash);
    await setWorkingFolder(directory);
  }
}
