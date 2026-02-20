import type Database from "better-sqlite3";
import type { IEmbeddingProvider } from "../embeddings/provider.js";
import * as store from "../memory/store.js";
import type { MemoryEntry, MemoryType } from "../memory/types.js";

export interface RetrieveOptions {
  limit?: number;
  types?: MemoryType[];
  projectScope?: string;
}

function minMaxNorm(scores: number[], reverse: boolean): number[] {
  if (scores.length === 0) return [];
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  return scores.map((s) => (reverse ? 1 - (s - min) / range : (s - min) / range));
}

export async function retrieveRelevantMemory(
  db: Database.Database,
  embeddingProvider: IEmbeddingProvider,
  query: string,
  options: RetrieveOptions = {}
): Promise<MemoryEntry[]> {
  const limit = Math.min(options.limit ?? 10, 50);
  const types = options.types ?? null;

  const ftsResults = store.ftsSearch(db, query, limit * 2, types);
  let vectorResults: { id: string; distance: number }[] = [];
  try {
    const queryEmbedding = await embeddingProvider.embed(query);
    vectorResults = store.vectorSearch(db, queryEmbedding, limit * 2, types);
  } catch {
    // No embedding; use FTS only
  }

  const idToFtsRank = new Map<string, number>();
  ftsResults.forEach((r, i) => idToFtsRank.set(r.id, r.rank));
  const idToVecDist = new Map<string, number>();
  vectorResults.forEach((r) => idToVecDist.set(r.id, r.distance));

  const allIds = new Set([...idToFtsRank.keys(), ...idToVecDist.keys()]);
  const ftsScores = [...idToFtsRank.values()];
  const vecScores = [...idToVecDist.values()];

  const ftsNorm = minMaxNorm(ftsScores, true);
  const vecNorm = minMaxNorm(vecScores, true);
  const ftsByIndex = [...idToFtsRank.entries()];
  const vecByIndex = [...idToVecDist.entries()];
  const ftsNormMap = new Map(ftsByIndex.map(([id], i) => [id, ftsNorm[i]]));
  const vecNormMap = new Map(vecByIndex.map(([id], i) => [id, vecNorm[i]]));

  const combined: { id: string; score: number }[] = [];
  for (const id of allIds) {
    const f = ftsNormMap.get(id) ?? 0;
    const v = vecNormMap.get(id) ?? 0;
    const score = (f + v) / 2;
    combined.push({ id, score });
  }
  combined.sort((a, b) => b.score - a.score);
  const topIds = combined.slice(0, limit).map((c) => c.id);
  if (topIds.length === 0) return [];

  return store.getAllByIds(db, topIds);
}
