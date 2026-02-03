/**
 * Recent Files - Persistent list of recently opened files
 *
 * Uses tauri-plugin-store for persistence across app restarts.
 * Max 10 entries with FIFO eviction (oldest removed when exceeding limit).
 */

import { load } from '@tauri-apps/plugin-store';

const MAX_RECENT_FILES = 10;
const STORE_FILE = 'preferences.json';

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: string; // ISO timestamp
}

let storeInstance: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!storeInstance) {
    // Note: tauri-plugin-store v2 requires defaults property
    storeInstance = await load(STORE_FILE, { defaults: {}, autoSave: false });
  }
  return storeInstance;
}

/**
 * Get the list of recently opened files
 */
export async function getRecentFiles(): Promise<RecentFile[]> {
  const store = await getStore();
  const files = await store.get<RecentFile[]>('recentFiles');
  return files ?? [];
}

/**
 * Add a file to the recent files list.
 * If the file already exists, it's moved to the top.
 */
export async function addRecentFile(path: string, name: string): Promise<void> {
  const store = await getStore();
  let files = await getRecentFiles();

  // Remove if already exists (will re-add at top)
  files = files.filter((f) => f.path !== path);

  // Add to front of list
  files.unshift({
    path,
    name,
    lastOpened: new Date().toISOString(),
  });

  // Trim to max (FIFO - oldest falls off)
  files = files.slice(0, MAX_RECENT_FILES);

  await store.set('recentFiles', files);
  await store.save();
}

/**
 * Clear all recent files
 */
export async function clearRecentFiles(): Promise<void> {
  const store = await getStore();
  await store.set('recentFiles', []);
  await store.save();
}

/**
 * Remove a specific file from the recent files list
 */
export async function removeRecentFile(path: string): Promise<void> {
  const store = await getStore();
  let files = await getRecentFiles();
  files = files.filter((f) => f.path !== path);
  await store.set('recentFiles', files);
  await store.save();
}
