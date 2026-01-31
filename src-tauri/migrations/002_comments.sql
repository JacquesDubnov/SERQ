-- Comments table - stores comment text separately from document
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  document_path TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  position_from INTEGER NOT NULL,
  position_to INTEGER NOT NULL
);

CREATE INDEX idx_comments_document_path ON comments(document_path);
CREATE INDEX idx_comments_resolved ON comments(resolved_at);
