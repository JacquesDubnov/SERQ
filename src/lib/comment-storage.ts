/**
 * Comment Storage
 * SQLite operations for document comments
 */
import Database from '@tauri-apps/plugin-sql';

export interface CommentRecord {
  id: string;
  document_path: string;
  text: string;
  created_at: number;
  resolved_at: number | null;
  position_from: number;
  position_to: number;
}

// Reuse database singleton from version-storage
let dbInstance: Awaited<ReturnType<typeof Database.load>> | null = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:serq.db');
  }
  return dbInstance;
}

/**
 * Save a new comment
 */
export async function saveComment(
  documentPath: string,
  commentId: string,
  text: string,
  positionFrom: number,
  positionTo: number
): Promise<void> {
  const db = await getDb();

  await db.execute(
    `INSERT INTO comments (id, document_path, text, created_at, resolved_at, position_from, position_to)
     VALUES ($1, $2, $3, $4, NULL, $5, $6)`,
    [commentId, documentPath, text, Date.now(), positionFrom, positionTo]
  );
}

/**
 * Get all comments for a document
 */
export async function getComments(documentPath: string): Promise<CommentRecord[]> {
  const db = await getDb();
  return await db.select<CommentRecord[]>(
    'SELECT * FROM comments WHERE document_path = $1 ORDER BY position_from ASC',
    [documentPath]
  );
}

/**
 * Get a single comment by ID
 */
export async function getCommentById(commentId: string): Promise<CommentRecord | null> {
  const db = await getDb();
  const results = await db.select<CommentRecord[]>(
    'SELECT * FROM comments WHERE id = $1',
    [commentId]
  );
  return results[0] || null;
}

/**
 * Update comment text
 */
export async function updateCommentText(
  commentId: string,
  newText: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    'UPDATE comments SET text = $1 WHERE id = $2',
    [newText, commentId]
  );
}

/**
 * Mark comment as resolved
 */
export async function resolveComment(commentId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    'UPDATE comments SET resolved_at = $1 WHERE id = $2',
    [Date.now(), commentId]
  );
}

/**
 * Unresolve a comment
 */
export async function unresolveComment(commentId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    'UPDATE comments SET resolved_at = NULL WHERE id = $1',
    [commentId]
  );
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM comments WHERE id = $1', [commentId]);
}

/**
 * Update comment positions (after document edits)
 */
export async function updateCommentPosition(
  commentId: string,
  newFrom: number,
  newTo: number
): Promise<void> {
  const db = await getDb();
  await db.execute(
    'UPDATE comments SET position_from = $1, position_to = $2 WHERE id = $3',
    [newFrom, newTo, commentId]
  );
}

/**
 * Delete all comments for a document
 */
export async function deleteAllCommentsForDocument(documentPath: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM comments WHERE document_path = $1', [documentPath]);
}
