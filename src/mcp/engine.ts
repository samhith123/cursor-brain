import * as os from "os";
import * as path from "path";
import type Database from "better-sqlite3";
import type { IEmbeddingProvider } from "../embeddings/provider.js";
import { createOpenAIEmbeddingProvider } from "../embeddings/openai.js";
import { createLocalEmbeddingProvider } from "../embeddings/local.js";
import { openStore } from "../memory/store.js";

export interface EngineContext {
  db: Database.Database;
  embeddingProvider: IEmbeddingProvider;
}

const MAX_CONTENT_LENGTH = 100_000;
const MAX_TAGS = 50;

export function getStoragePath(): string {
  const fromEnv = process.env.CURSOR_BRAIN_STORAGE_PATH?.trim();
  if (fromEnv) return fromEnv;
  return path.join(os.homedir(), ".cursor-brain", "storage");
}

export function createEngine(apiKey?: string): EngineContext {
  const storagePath = getStoragePath();
  const db = openStore(storagePath);
  const key = apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const embeddingProvider = key
    ? createOpenAIEmbeddingProvider(key)
    : createLocalEmbeddingProvider();
  return { db, embeddingProvider };
}

export function validateAddMemory(content: string, tags?: string[]): void {
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content too long (max ${MAX_CONTENT_LENGTH} chars)`);
  }
  if (tags && tags.length > MAX_TAGS) {
    throw new Error(`Too many tags (max ${MAX_TAGS})`);
  }
}
