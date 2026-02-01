/**
 * Version Storage
 * SQLite operations for document version history
 */
import Database from '@tauri-apps/plugin-sql';

export interface Version {
  id: number;
  document_path: string;
  content: string; // JSON.stringify(editor.getJSON())
  timestamp: number;
  is_checkpoint: boolean;
  checkpoint_name: string | null;
  word_count: number;
  char_count: number;
}

// Singleton database instance
let dbInstance: Awaited<ReturnType<typeof Database.load>> | null = null;
let dbInitialized = false;

async function getDb() {
  if (!dbInstance) {
    console.log('[VersionStorage] Loading database...');
    try {
      dbInstance = await Database.load('sqlite:serq.db');
      console.log('[VersionStorage] Database loaded successfully');

      // Verify tables exist (migrations should have run)
      if (!dbInitialized) {
        try {
          const tables = await dbInstance.select<{ name: string }[]>(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='versions'"
          );
          if (tables.length > 0) {
            console.log('[VersionStorage] versions table confirmed');
            dbInitialized = true;
          } else {
            console.error('[VersionStorage] WARNING: versions table not found! Migrations may not have run.');
            // Try to create the table manually as fallback
            console.log('[VersionStorage] Attempting to create versions table manually...');
            await dbInstance.execute(`
              CREATE TABLE IF NOT EXISTS versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_path TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                is_checkpoint BOOLEAN NOT NULL DEFAULT 0,
                checkpoint_name TEXT,
                word_count INTEGER DEFAULT 0,
                char_count INTEGER DEFAULT 0
              )
            `);
            await dbInstance.execute(`CREATE INDEX IF NOT EXISTS idx_versions_document_path ON versions(document_path)`);
            await dbInstance.execute(`CREATE INDEX IF NOT EXISTS idx_versions_timestamp ON versions(timestamp DESC)`);
            console.log('[VersionStorage] versions table created manually');
            dbInitialized = true;
          }
        } catch (checkErr) {
          console.error('[VersionStorage] Failed to check/create tables:', checkErr);
        }
      }
    } catch (loadErr) {
      console.error('[VersionStorage] Failed to load database:', loadErr);
      throw loadErr;
    }
  }
  return dbInstance;
}

/**
 * Save a version snapshot
 */
export async function saveVersion(
  documentPath: string,
  editorJSON: object,
  wordCount: number,
  charCount: number,
  isCheckpoint: boolean = false,
  checkpointName?: string
): Promise<number> {
  console.log('[VersionStorage] saveVersion called:', { documentPath, isCheckpoint, wordCount, charCount });

  try {
    const db = await getDb();

    const result = await db.execute(
      `INSERT INTO versions
       (document_path, content, timestamp, is_checkpoint, checkpoint_name, word_count, char_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        documentPath,
        JSON.stringify(editorJSON),
        Date.now(),
        isCheckpoint ? 1 : 0,
        checkpointName || null,
        wordCount,
        charCount,
      ]
    );

    console.log('[VersionStorage] Version saved with ID:', result.lastInsertId);
    return result.lastInsertId ?? 0;
  } catch (err) {
    console.error('[VersionStorage] Failed to save version:', err);
    throw err;
  }
}

/**
 * Get versions for a document, newest first
 */
export async function getVersions(
  documentPath: string,
  limit: number = 100
): Promise<Version[]> {
  console.log('[VersionStorage] getVersions for path:', documentPath);
  const db = await getDb();
  const results = await db.select<Version[]>(
    'SELECT * FROM versions WHERE document_path = $1 ORDER BY timestamp DESC LIMIT $2',
    [documentPath, limit]
  );
  console.log('[VersionStorage] Found versions:', results.length);
  // SQLite stores booleans as 0/1, convert to proper JS booleans
  return results.map(v => ({
    ...v,
    is_checkpoint: Boolean(v.is_checkpoint),
  }));
}

/**
 * Get a single version by ID
 */
export async function getVersionById(
  versionId: number
): Promise<Version | null> {
  const db = await getDb();
  const results = await db.select<Version[]>(
    'SELECT * FROM versions WHERE id = $1',
    [versionId]
  );
  if (!results[0]) return null;
  // SQLite stores booleans as 0/1, convert to proper JS booleans
  return {
    ...results[0],
    is_checkpoint: Boolean(results[0].is_checkpoint),
  };
}

/**
 * Delete old auto-save versions, keep last N per document
 * Always keeps all checkpoints
 */
export async function deleteOldVersions(
  documentPath: string,
  keepCount: number = 50
): Promise<number> {
  const db = await getDb();

  const result = await db.execute(
    `DELETE FROM versions
     WHERE document_path = $1
       AND is_checkpoint = 0
       AND id NOT IN (
         SELECT id FROM versions
         WHERE document_path = $1 AND is_checkpoint = 0
         ORDER BY timestamp DESC
         LIMIT $2
       )`,
    [documentPath, keepCount]
  );

  return result.rowsAffected;
}

/**
 * Get checkpoint count for a document
 */
export async function getCheckpointCount(
  documentPath: string
): Promise<number> {
  const db = await getDb();
  const result = await db.select<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM versions WHERE document_path = $1 AND is_checkpoint = 1',
    [documentPath]
  );
  return result[0]?.count ?? 0;
}
