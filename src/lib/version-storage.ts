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

async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:serq.db');
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

  return result.lastInsertId ?? 0;
}

/**
 * Get versions for a document, newest first
 */
export async function getVersions(
  documentPath: string,
  limit: number = 100
): Promise<Version[]> {
  const db = await getDb();
  return await db.select<Version[]>(
    'SELECT * FROM versions WHERE document_path = $1 ORDER BY timestamp DESC LIMIT $2',
    [documentPath, limit]
  );
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
  return results[0] || null;
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
