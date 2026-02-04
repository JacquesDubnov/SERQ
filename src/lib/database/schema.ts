/**
 * SQLite Schema for SERQ
 *
 * Uses tauri-plugin-sql for native SQLite performance.
 * Flat block storage with ID references (not nested trees).
 * Event sourcing for version control (snapshots + operations).
 */

// ============================================================================
// Schema Version
// ============================================================================

export const SCHEMA_VERSION = 1

// ============================================================================
// SQL Statements
// ============================================================================

export const CREATE_TABLES = `
-- ============================================================================
-- Core Tables
-- ============================================================================

-- Projects (optional, for multi-doc organization)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    settings JSON,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    meta JSON,
    prosemirror_doc JSON,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Pages (for paginated documents)
CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    position TEXT NOT NULL,
    meta JSON,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Blocks (flat storage with ID references)
CREATE TABLE IF NOT EXISTS blocks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_id TEXT REFERENCES pages(id) ON DELETE SET NULL,
    position TEXT NOT NULL,
    type TEXT NOT NULL,
    content JSON NOT NULL,
    style_ref TEXT REFERENCES styles(id) ON DELETE SET NULL,
    inline_styles JSON,
    origin_id TEXT,
    linking JSON,
    is_locked INTEGER DEFAULT 0,
    is_hidden INTEGER DEFAULT 0,
    custom_data JSON,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- ============================================================================
-- Named Styles
-- ============================================================================

CREATE TABLE IF NOT EXISTS styles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    scope TEXT NOT NULL CHECK(scope IN ('project', 'document', 'builtin')),
    scope_id TEXT,
    based_on TEXT REFERENCES styles(id) ON DELETE SET NULL,
    applies_to JSON,
    definition JSON NOT NULL,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    is_builtin INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- ============================================================================
-- Block Linking (Macro Blocks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS block_links (
    id TEXT PRIMARY KEY,
    source_block_id TEXT NOT NULL,
    source_document_id TEXT NOT NULL,
    target_block_id TEXT NOT NULL,
    target_document_id TEXT NOT NULL,
    sync_mode TEXT CHECK(sync_mode IN ('one_way', 'bidirectional', 'mirror', 'reference')),
    sync_content INTEGER DEFAULT 1,
    sync_style INTEGER DEFAULT 0,
    last_synced_at INTEGER,
    created_at INTEGER NOT NULL,
    UNIQUE(source_block_id, target_block_id)
);

-- ============================================================================
-- Version Control
-- ============================================================================

-- Full document snapshots (compressed)
CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    full_state BLOB,
    label TEXT,
    auto_save INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);

-- Individual operations (for delta reconstruction)
CREATE TABLE IF NOT EXISTS operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    block_id TEXT,
    op_type TEXT NOT NULL,
    op_data JSON,
    session_id TEXT,
    created_at INTEGER NOT NULL
);

-- ============================================================================
-- Style Cache (Pre-computed for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS computed_styles (
    block_id TEXT PRIMARY KEY REFERENCES blocks(id) ON DELETE CASCADE,
    resolved_style JSON NOT NULL,
    computed_at INTEGER NOT NULL,
    is_dirty INTEGER DEFAULT 1
);

-- ============================================================================
-- Colors and Fonts
-- ============================================================================

CREATE TABLE IF NOT EXISTS colors (
    id TEXT PRIMARY KEY,
    scope TEXT NOT NULL CHECK(scope IN ('project', 'document', 'builtin')),
    scope_id TEXT,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS fonts (
    id TEXT PRIMARY KEY,
    scope TEXT NOT NULL CHECK(scope IN ('project', 'document', 'user', 'builtin')),
    scope_id TEXT,
    name TEXT NOT NULL,
    family TEXT NOT NULL,
    weights JSON,
    source TEXT CHECK(source IN ('system', 'google', 'custom')),
    url TEXT,
    created_at INTEGER NOT NULL
);

-- ============================================================================
-- User Settings (device-local)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value JSON NOT NULL,
    updated_at INTEGER NOT NULL
);

-- ============================================================================
-- Recent Files
-- ============================================================================

CREATE TABLE IF NOT EXISTS recent_files (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    title TEXT,
    last_opened_at INTEGER NOT NULL,
    document_id TEXT
);

-- ============================================================================
-- Schema Metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '${SCHEMA_VERSION}');
INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('created_at', strftime('%s', 'now'));
`

// ============================================================================
// Indexes
// ============================================================================

export const CREATE_INDEXES = `
-- Hierarchical navigation
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_document ON pages(document_id);
CREATE INDEX IF NOT EXISTS idx_blocks_document ON blocks(document_id);
CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id);

-- Ordering
CREATE INDEX IF NOT EXISTS idx_pages_order ON pages(document_id, position);
CREATE INDEX IF NOT EXISTS idx_blocks_order ON blocks(page_id, position);
CREATE INDEX IF NOT EXISTS idx_blocks_doc_order ON blocks(document_id, position);

-- Block operations
CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(type);
CREATE INDEX IF NOT EXISTS idx_blocks_style_ref ON blocks(style_ref);
CREATE INDEX IF NOT EXISTS idx_blocks_origin ON blocks(origin_id);

-- History
CREATE INDEX IF NOT EXISTS idx_operations_doc_time ON operations(document_id, created_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_doc_time ON snapshots(document_id, created_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_doc_version ON snapshots(document_id, version_number);

-- Links
CREATE INDEX IF NOT EXISTS idx_links_source ON block_links(source_block_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON block_links(target_block_id);
CREATE INDEX IF NOT EXISTS idx_links_source_doc ON block_links(source_document_id);
CREATE INDEX IF NOT EXISTS idx_links_target_doc ON block_links(target_document_id);

-- Styles
CREATE INDEX IF NOT EXISTS idx_styles_scope ON styles(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_colors_scope ON colors(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_fonts_scope ON fonts(scope, scope_id);

-- Recent files
CREATE INDEX IF NOT EXISTS idx_recent_files_time ON recent_files(last_opened_at DESC);
`

// ============================================================================
// Full-Text Search (FTS5)
// ============================================================================

export const CREATE_FTS = `
-- Full-text search for block content
CREATE VIRTUAL TABLE IF NOT EXISTS blocks_fts USING fts5(
    block_id,
    document_id,
    content,
    content='blocks',
    content_rowid='rowid',
    tokenize='porter unicode61'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS blocks_fts_insert AFTER INSERT ON blocks BEGIN
    INSERT INTO blocks_fts(block_id, document_id, content)
    VALUES (new.id, new.document_id, json_extract(new.content, '$.text'));
END;

CREATE TRIGGER IF NOT EXISTS blocks_fts_delete AFTER DELETE ON blocks BEGIN
    INSERT INTO blocks_fts(blocks_fts, block_id, document_id, content)
    VALUES ('delete', old.id, old.document_id, json_extract(old.content, '$.text'));
END;

CREATE TRIGGER IF NOT EXISTS blocks_fts_update AFTER UPDATE ON blocks BEGIN
    INSERT INTO blocks_fts(blocks_fts, block_id, document_id, content)
    VALUES ('delete', old.id, old.document_id, json_extract(old.content, '$.text'));
    INSERT INTO blocks_fts(block_id, document_id, content)
    VALUES (new.id, new.document_id, json_extract(new.content, '$.text'));
END;
`

// ============================================================================
// Built-in Data
// ============================================================================

export const INSERT_BUILTIN_STYLES = `
-- Built-in named styles
INSERT OR IGNORE INTO styles (id, name, scope, applies_to, definition, category, sort_order, is_builtin, created_at, updated_at)
VALUES
    ('builtin-heading-1', 'Heading 1', 'builtin', '["heading"]',
     '{"fontSize":"32px","fontWeight":"700","lineHeight":"1.2","spacingBefore":"1.5em","spacingAfter":"0.5em"}',
     'Headings', 1, 1, strftime('%s','now'), strftime('%s','now')),

    ('builtin-heading-2', 'Heading 2', 'builtin', '["heading"]',
     '{"fontSize":"24px","fontWeight":"700","lineHeight":"1.3","spacingBefore":"1.25em","spacingAfter":"0.5em"}',
     'Headings', 2, 1, strftime('%s','now'), strftime('%s','now')),

    ('builtin-heading-3', 'Heading 3', 'builtin', '["heading"]',
     '{"fontSize":"20px","fontWeight":"600","lineHeight":"1.4","spacingBefore":"1em","spacingAfter":"0.5em"}',
     'Headings', 3, 1, strftime('%s','now'), strftime('%s','now')),

    ('builtin-body', 'Body', 'builtin', '["paragraph"]',
     '{"fontSize":"16px","fontWeight":"400","lineHeight":"1.6","spacingAfter":"0.5em"}',
     'Body', 1, 1, strftime('%s','now'), strftime('%s','now')),

    ('builtin-quote', 'Block Quote', 'builtin', '["blockquote"]',
     '{"fontStyle":"italic","borderLeft":"3px solid var(--color-border)","paddingLeft":"1em","color":"var(--color-text-secondary)"}',
     'Body', 2, 1, strftime('%s','now'), strftime('%s','now')),

    ('builtin-code', 'Code Block', 'builtin', '["codeBlock"]',
     '{"fontFamily":"monospace","fontSize":"14px","backgroundColor":"var(--color-code-bg)","padding":"1em","borderRadius":"4px"}',
     'Body', 3, 1, strftime('%s','now'), strftime('%s','now'));
`
