-- Main memories table
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('session_memory', 'long_term_memory', 'project_memory')),
  timestamp INTEGER NOT NULL,
  file_refs TEXT NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL DEFAULT '',
  raw TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  embedding BLOB
);

CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);

-- FTS5 for lexical search over summary, raw, tags
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  summary,
  raw,
  tags,
  content='memories',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync with memories
CREATE TRIGGER IF NOT EXISTS memories_fts_insert AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, summary, raw, tags) VALUES (new.rowid, new.summary, new.raw, new.tags);
END;
CREATE TRIGGER IF NOT EXISTS memories_fts_delete AFTER DELETE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, summary, raw, tags) VALUES ('delete', old.rowid, old.summary, old.raw, old.tags);
END;
CREATE TRIGGER IF NOT EXISTS memories_fts_update AFTER UPDATE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, summary, raw, tags) VALUES ('delete', old.rowid, old.summary, old.raw, old.tags);
  INSERT INTO memories_fts(rowid, summary, raw, tags) VALUES (new.rowid, new.summary, new.raw, new.tags);
END;
