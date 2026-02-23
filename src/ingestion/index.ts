import type Database from "better-sqlite3";
import type { IEmbeddingProvider } from "../embeddings/provider.js";
import * as store from "../memory/store.js";
import type { AddMemoryParams, MemoryType } from "../memory/types.js";

const SUMMARY_MAX_CHARS = 500;

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function summaryFromRaw(raw: string, explicitSummary?: string): string {
  if (explicitSummary?.trim()) return explicitSummary.trim().slice(0, SUMMARY_MAX_CHARS);
  return raw.trim().slice(0, SUMMARY_MAX_CHARS);
}

export async function addMemory(
  db: Database.Database,
  embeddingProvider: IEmbeddingProvider,
  params: AddMemoryParams
): Promise<string> {
  const id = generateId();
  const timestamp = Date.now();
  const fileRefs = params.fileRefs ?? [];
  const tags = params.tags ?? [];
  const summary = summaryFromRaw(params.content, params.summary);
  const raw = params.content;
  const type = params.type as MemoryType;

  const textToEmbed = summary.length >= raw.length ? raw : `${summary}\n${raw}`.slice(0, 8191);
  let embedding: Float32Array | null = null;
  let embeddingDim: number | null = null;
  try {
    embedding = await embeddingProvider.embed(textToEmbed);
    embeddingDim = embeddingProvider.dimensions();
  } catch {
    // Store without embedding; can still be found via FTS
  }

  store.insertMemory(db, id, type, timestamp, fileRefs, summary, raw, tags, embedding, embeddingDim);
  return id;
}
