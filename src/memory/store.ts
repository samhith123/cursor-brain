import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import { MemoryEntry, MemoryType } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sqliteVec = require("sqlite-vec");

const SCHEMA_SQL = `
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

-- FTS5 for lexical search
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  summary, raw, tags,
  content='memories',
  content_rowid='rowid'
);
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
`;

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getDbPath(storagePath: string): string {
  ensureDir(storagePath);
  return path.join(storagePath, "memory.db");
}

export function openStore(storagePath: string): Database.Database {
  const dbPath = getDbPath(storagePath);
  const db = new Database(dbPath);
  sqliteVec.load(db);
  db.exec(SCHEMA_SQL);
  return db;
}

function rowToEntry(row: {
  id: string;
  type: string;
  timestamp: number;
  file_refs: string;
  summary: string;
  raw: string;
  tags: string;
  embedding: Buffer | null;
}): MemoryEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    file_refs: JSON.parse(row.file_refs) as string[],
    summary: row.summary,
    raw: row.raw,
    tags: JSON.parse(row.tags) as string[],
    type: row.type as MemoryType,
    embedding: row.embedding ? new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.length / 4) : null,
  };
}

export function insertMemory(
  db: Database.Database,
  id: string,
  type: MemoryType,
  timestamp: number,
  fileRefs: string[],
  summary: string,
  raw: string,
  tags: string[],
  embedding: Float32Array | null
): void {
  const stmt = db.prepare(`
    INSERT INTO memories (id, type, timestamp, file_refs, summary, raw, tags, embedding)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const embeddingBlob = embedding ? Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength) : null;
  stmt.run(id, type, timestamp, JSON.stringify(fileRefs), summary, raw, JSON.stringify(tags), embeddingBlob);
}

type MemoryRow = Parameters<typeof rowToEntry>[0];

export function getById(db: Database.Database, id: string): MemoryEntry | null {
  const row = db.prepare("SELECT * FROM memories WHERE id = ?").get(id) as MemoryRow | undefined;
  return row ? rowToEntry(row) : null;
}

export function deleteByIds(db: Database.Database, ids: string[]): number {
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => "?").join(",");
  const result = db.prepare(`DELETE FROM memories WHERE id IN (${placeholders})`).run(...ids);
  return result.changes;
}

export function ftsSearch(db: Database.Database, query: string, limit: number, types: MemoryType[] | null): { id: string; rank: number }[] {
  const safeQuery = query.replace(/["']/g, "").trim();
  if (!safeQuery) return [];
  const typeFilter = types && types.length > 0
    ? ` AND type IN (${types.map(() => "?").join(",")})`
    : "";
  const args = types && types.length > 0 ? [...types, limit] : [limit];
  const sql = `
    SELECT m.id, bm25(memories_fts) AS rank
    FROM memories_fts
    JOIN memories m ON m.rowid = memories_fts.rowid
    WHERE memories_fts MATCH ? ${typeFilter}
    ORDER BY rank
    LIMIT ?
  `;
  const stmt = db.prepare(sql);
  const rows = stmt.all(safeQuery, ...args) as { id: string; rank: number }[];
  return rows;
}

export function vectorSearch(db: Database.Database, embedding: Float32Array, limit: number, types: MemoryType[] | null): { id: string; distance: number }[] {
  const blob = Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength);
  const typeFilter = types && types.length > 0
    ? ` AND type IN (${types.map(() => "?").join(",")})`
    : "";
  const args = types && types.length > 0 ? [...types, blob, limit] : [blob, limit];
  const sql = `
    SELECT id, vec_distance_cosine(embedding, ?) AS distance
    FROM memories
    WHERE embedding IS NOT NULL ${typeFilter}
    ORDER BY distance
    LIMIT ?
  `;
  const stmt = db.prepare(sql);
  const rows = stmt.all(...args) as { id: string; distance: number }[];
  return rows;
}

export function getAllByIds(db: Database.Database, ids: string[]): MemoryEntry[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const rows = db.prepare(`SELECT * FROM memories WHERE id IN (${placeholders})`).all(...ids) as MemoryRow[];
  return rows.map(rowToEntry);
}

export function getStats(db: Database.Database): { total: number; byType: Record<string, number> } {
  const total = (db.prepare("SELECT COUNT(*) AS c FROM memories").get() as { c: number }).c;
  const rows = db.prepare("SELECT type, COUNT(*) AS c FROM memories GROUP BY type").all() as { type: string; c: number }[];
  const byType: Record<string, number> = {};
  for (const r of rows) byType[r.type] = r.c;
  return { total, byType };
}
