-- Version History Table
-- Stores document snapshots for Time Machine-style recovery

CREATE TABLE IF NOT EXISTS versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_path TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  is_checkpoint BOOLEAN NOT NULL DEFAULT 0,
  checkpoint_name TEXT,
  word_count INTEGER DEFAULT 0,
  char_count INTEGER DEFAULT 0
);

CREATE INDEX idx_versions_document_path ON versions(document_path);
CREATE INDEX idx_versions_timestamp ON versions(timestamp DESC);
