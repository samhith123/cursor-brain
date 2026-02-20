import type { MemoryEntry } from "../memory/types.js";

const APPROX_CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_TOKENS = 2000;

export function compressForContext(
  entries: MemoryEntry[],
  maxTokens: number = DEFAULT_MAX_TOKENS
): string {
  let total = 0;
  const parts: string[] = [];
  for (const e of entries) {
    const text = `[${e.id}] (${e.type}) ${e.summary || e.raw.slice(0, 200)}`;
    const tokens = Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
    if (total + tokens > maxTokens && parts.length > 0) break;
    parts.push(text);
    total += tokens;
  }
  return parts.join("\n\n");
}
