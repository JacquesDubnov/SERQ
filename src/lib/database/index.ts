/**
 * Database Manager - SQLite initialization and operations
 *
 * Uses tauri-plugin-sql for native SQLite performance.
 * Handles initialization, migrations, and basic CRUD operations.
 */

import Database from '@tauri-apps/plugin-sql'
import {
  SCHEMA_VERSION,
  CREATE_TABLES,
  CREATE_INDEXES,
  CREATE_FTS,
  INSERT_BUILTIN_STYLES,
} from './schema'

// ============================================================================
// Types
// ============================================================================

export interface DatabaseConfig {
  path: string
  inMemory?: boolean
}

// ============================================================================
// Database Manager
// ============================================================================

class DatabaseManager {
  private db: Database | null = null
  private initialized = false

  /**
   * Initialize the database connection
   */
  async initialize(config?: Partial<DatabaseConfig>): Promise<void> {
    if (this.initialized && this.db) {
      console.log('[Database] Already initialized')
      return
    }

    try {
      const dbPath = config?.inMemory ? ':memory:' : (config?.path || 'serq.db')
      console.log('[Database] Initializing:', dbPath)

      // Connect to SQLite
      this.db = await Database.load(`sqlite:${dbPath}`)

      // Run schema creation
      await this.runSchema()

      this.initialized = true
      console.log('[Database] Initialized successfully')
    } catch (error) {
      console.error('[Database] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Run schema creation and migrations
   */
  private async runSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not connected')

    // Check current schema version
    const currentVersion = await this.getSchemaVersion()
    console.log('[Database] Current schema version:', currentVersion)

    if (currentVersion === 0) {
      // Fresh database - create all tables
      console.log('[Database] Creating schema v' + SCHEMA_VERSION)

      // Create tables
      await this.db.execute(CREATE_TABLES)

      // Create indexes
      await this.db.execute(CREATE_INDEXES)

      // Create FTS tables
      try {
        await this.db.execute(CREATE_FTS)
      } catch (err) {
        console.warn('[Database] FTS creation failed (may already exist):', err)
      }

      // Insert built-in styles
      await this.db.execute(INSERT_BUILTIN_STYLES)

      console.log('[Database] Schema created successfully')
    } else if (currentVersion < SCHEMA_VERSION) {
      // Run migrations
      await this.runMigrations(currentVersion, SCHEMA_VERSION)
    }
  }

  /**
   * Get current schema version from database
   */
  private async getSchemaVersion(): Promise<number> {
    if (!this.db) return 0

    try {
      const result = await this.db.select<{ value: string }[]>(
        "SELECT value FROM schema_meta WHERE key = 'version'"
      )
      return result.length > 0 ? parseInt(result[0].value, 10) : 0
    } catch {
      // Table doesn't exist yet
      return 0
    }
  }

  /**
   * Run migrations between versions
   */
  private async runMigrations(from: number, to: number): Promise<void> {
    console.log(`[Database] Running migrations from v${from} to v${to}`)

    // Future: Add migration logic here
    // For now, just update the version
    if (this.db) {
      await this.db.execute(
        "UPDATE schema_meta SET value = ? WHERE key = 'version'",
        [to.toString()]
      )
    }
  }

  /**
   * Get the database instance
   */
  getDb(): Database | null {
    return this.db
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
      this.initialized = false
    }
  }

  // ============================================================================
  // Generic Query Methods
  // ============================================================================

  /**
   * Execute a query (INSERT, UPDATE, DELETE)
   */
  async execute(query: string, params?: unknown[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.execute(query, params)
  }

  /**
   * Select rows
   */
  async select<T>(query: string, params?: unknown[]): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.select<T[]>(query, params)
  }

  /**
   * Select single row
   */
  async selectOne<T>(query: string, params?: unknown[]): Promise<T | null> {
    const results = await this.select<T>(query, params)
    return results.length > 0 ? results[0] : null
  }

  // ============================================================================
  // Document Operations
  // ============================================================================

  /**
   * Create a new document
   */
  async createDocument(doc: {
    id: string
    title: string
    projectId?: string
    meta?: Record<string, unknown>
    prosemirrorDoc?: unknown
  }): Promise<void> {
    const now = Date.now()
    await this.execute(
      `INSERT INTO documents (id, project_id, title, meta, prosemirror_doc, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        doc.projectId || null,
        doc.title,
        JSON.stringify(doc.meta || {}),
        JSON.stringify(doc.prosemirrorDoc || null),
        now,
        now,
      ]
    )
  }

  /**
   * Update document
   */
  async updateDocument(
    id: string,
    updates: {
      title?: string
      meta?: Record<string, unknown>
      prosemirrorDoc?: unknown
    }
  ): Promise<void> {
    const sets: string[] = ['updated_at = ?']
    const params: unknown[] = [Date.now()]

    if (updates.title !== undefined) {
      sets.push('title = ?')
      params.push(updates.title)
    }
    if (updates.meta !== undefined) {
      sets.push('meta = ?')
      params.push(JSON.stringify(updates.meta))
    }
    if (updates.prosemirrorDoc !== undefined) {
      sets.push('prosemirror_doc = ?')
      params.push(JSON.stringify(updates.prosemirrorDoc))
    }

    params.push(id)

    await this.execute(
      `UPDATE documents SET ${sets.join(', ')} WHERE id = ?`,
      params
    )
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<{
    id: string
    title: string
    projectId: string | null
    meta: Record<string, unknown>
    prosemirrorDoc: unknown
    createdAt: number
    updatedAt: number
  } | null> {
    const row = await this.selectOne<{
      id: string
      title: string
      project_id: string | null
      meta: string
      prosemirror_doc: string
      created_at: number
      updated_at: number
    }>(
      'SELECT * FROM documents WHERE id = ?',
      [id]
    )

    if (!row) return null

    return {
      id: row.id,
      title: row.title,
      projectId: row.project_id,
      meta: JSON.parse(row.meta || '{}'),
      prosemirrorDoc: JSON.parse(row.prosemirror_doc || 'null'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  // ============================================================================
  // Block Operations
  // ============================================================================

  /**
   * Create a block
   */
  async createBlock(block: {
    id: string
    documentId: string
    pageId?: string
    position: string
    type: string
    content: unknown
    styleRef?: string
    inlineStyles?: unknown
    linking?: unknown
  }): Promise<void> {
    const now = Date.now()
    await this.execute(
      `INSERT INTO blocks (id, document_id, page_id, position, type, content, style_ref, inline_styles, linking, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        block.id,
        block.documentId,
        block.pageId || null,
        block.position,
        block.type,
        JSON.stringify(block.content),
        block.styleRef || null,
        JSON.stringify(block.inlineStyles || null),
        JSON.stringify(block.linking || null),
        now,
        now,
      ]
    )
  }

  /**
   * Update block
   */
  async updateBlock(
    id: string,
    updates: {
      position?: string
      content?: unknown
      styleRef?: string | null
      inlineStyles?: unknown
      linking?: unknown
      isLocked?: boolean
      isHidden?: boolean
    }
  ): Promise<void> {
    const sets: string[] = ['updated_at = ?']
    const params: unknown[] = [Date.now()]

    if (updates.position !== undefined) {
      sets.push('position = ?')
      params.push(updates.position)
    }
    if (updates.content !== undefined) {
      sets.push('content = ?')
      params.push(JSON.stringify(updates.content))
    }
    if (updates.styleRef !== undefined) {
      sets.push('style_ref = ?')
      params.push(updates.styleRef)
    }
    if (updates.inlineStyles !== undefined) {
      sets.push('inline_styles = ?')
      params.push(JSON.stringify(updates.inlineStyles))
    }
    if (updates.linking !== undefined) {
      sets.push('linking = ?')
      params.push(JSON.stringify(updates.linking))
    }
    if (updates.isLocked !== undefined) {
      sets.push('is_locked = ?')
      params.push(updates.isLocked ? 1 : 0)
    }
    if (updates.isHidden !== undefined) {
      sets.push('is_hidden = ?')
      params.push(updates.isHidden ? 1 : 0)
    }

    params.push(id)

    await this.execute(
      `UPDATE blocks SET ${sets.join(', ')} WHERE id = ?`,
      params
    )
  }

  /**
   * Delete block
   */
  async deleteBlock(id: string): Promise<void> {
    await this.execute('DELETE FROM blocks WHERE id = ?', [id])
  }

  /**
   * Get blocks for document
   */
  async getDocumentBlocks(documentId: string): Promise<Array<{
    id: string
    documentId: string
    pageId: string | null
    position: string
    type: string
    content: unknown
    styleRef: string | null
    inlineStyles: unknown
    linking: unknown
  }>> {
    const rows = await this.select<{
      id: string
      document_id: string
      page_id: string | null
      position: string
      type: string
      content: string
      style_ref: string | null
      inline_styles: string
      linking: string
    }>(
      'SELECT * FROM blocks WHERE document_id = ? ORDER BY position',
      [documentId]
    )

    return rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      pageId: row.page_id,
      position: row.position,
      type: row.type,
      content: JSON.parse(row.content),
      styleRef: row.style_ref,
      inlineStyles: JSON.parse(row.inline_styles || 'null'),
      linking: JSON.parse(row.linking || 'null'),
    }))
  }

  // ============================================================================
  // Search
  // ============================================================================

  /**
   * Full-text search across blocks
   */
  async searchBlocks(query: string, options?: {
    documentId?: string
    limit?: number
  }): Promise<Array<{ blockId: string; documentId: string; snippet: string }>> {
    let sql = `
      SELECT block_id, document_id, snippet(blocks_fts, 2, '<mark>', '</mark>', '...', 32) as snippet
      FROM blocks_fts
      WHERE blocks_fts MATCH ?
    `
    const params: unknown[] = [query]

    if (options?.documentId) {
      sql += ' AND document_id = ?'
      params.push(options.documentId)
    }

    sql += ' ORDER BY rank'

    if (options?.limit) {
      sql += ' LIMIT ?'
      params.push(options.limit)
    }

    const rows = await this.select<{
      block_id: string
      document_id: string
      snippet: string
    }>(sql, params)

    return rows.map((row) => ({
      blockId: row.block_id,
      documentId: row.document_id,
      snippet: row.snippet,
    }))
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const database = new DatabaseManager()

// ============================================================================
// Re-export schema
// ============================================================================

export { SCHEMA_VERSION } from './schema'
