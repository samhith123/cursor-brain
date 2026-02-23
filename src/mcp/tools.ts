import { z } from "zod";
import type { EngineContext } from "./engine.js";
import { validateAddMemory } from "./engine.js";
import * as store from "../memory/store.js";
import * as ingestion from "../ingestion/index.js";
import * as retrieval from "../retrieval/hybrid.js";
import * as compress from "../retrieval/compress.js";
import type { MemoryType } from "../memory/types.js";

const MEMORY_TYPES = [
  "session_memory",
  "long_term_memory",
  "project_memory",
] as const;
const MAX_SEARCH_LIMIT = 50;

function log(tool: string, message: string): void {
  const ts = new Date().toISOString();
  console.error(`[${ts}] cursor-brain.${tool} ${message}`);
}

export function listTools(): {
  name: string;
  description: string;
  inputSchema: object;
}[] {
  return [
    {
      name: "memory_search",
      description:
        "Hybrid search over stored memories. Returns top N relevant entries (optionally compressed).",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: { type: "string", description: "Search query" },
          limit: {
            type: "number",
            description: "Max results (default 10, max 50)",
          },
          types: {
            type: "array",
            items: { type: "string", enum: [...MEMORY_TYPES] },
            description: "Filter by memory types",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "memory_add",
      description: "Insert a memory (long_term, session, or project).",
      inputSchema: {
        type: "object" as const,
        properties: {
          type: {
            type: "string",
            enum: [...MEMORY_TYPES],
            description: "Memory type",
          },
          content: { type: "string", description: "Raw content to store" },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Optional tags",
          },
          file_refs: {
            type: "array",
            items: { type: "string" },
            description: "Optional file paths",
          },
        },
        required: ["type", "content"],
      },
    },
    {
      name: "memory_delete",
      description: "Delete one or more memories by id.",
      inputSchema: {
        type: "object" as const,
        properties: {
          id: { type: "string", description: "Single memory id" },
          ids: {
            type: "array",
            items: { type: "string" },
            description: "Multiple memory ids",
          },
        },
      },
    },
    {
      name: "memory_stats",
      description: "Return counts by type and total size (read-only).",
      inputSchema: { type: "object" as const, properties: {} },
    },
  ];
}

export async function callTool(
  name: string,
  args: Record<string, unknown>,
  ctx: EngineContext,
): Promise<{ content: { type: "text"; text: string }[]; isError: boolean }> {
  const text = (s: string) => [{ type: "text" as const, text: s }];
  const { db, embeddingProvider } = ctx;

  try {
    if (name === "memory_search") {
      const parsed = z
        .object({
          query: z.string(),
          limit: z.number().min(1).max(MAX_SEARCH_LIMIT).optional(),
          types: z.array(z.enum(MEMORY_TYPES)).optional(),
        })
        .parse(args);
      const limit = parsed.limit ?? 10;
      log(
        "memory_search",
        `query="${parsed.query.slice(0, 50)}..." limit=${limit}`,
      );
      const entries = await retrieval.retrieveRelevantMemory(
        db,
        embeddingProvider,
        parsed.query,
        {
          limit,
          types: parsed.types ?? undefined,
        },
      );
      const compressed = compress.compressForContext(entries);
      return {
        content: text(compressed || "No relevant memories found."),
        isError: false,
      };
    }

    if (name === "memory_add") {
      const parsed = z
        .object({
          type: z.enum(MEMORY_TYPES),
          content: z.string(),
          tags: z.array(z.string()).optional(),
          file_refs: z.array(z.string()).optional(),
        })
        .parse(args);
      validateAddMemory(parsed.content, parsed.tags);
      log("memory_add", `type=${parsed.type} len=${parsed.content.length}`);
      const id = await ingestion.addMemory(db, embeddingProvider, {
        type: parsed.type,
        content: parsed.content,
        tags: parsed.tags,
        fileRefs: parsed.file_refs,
      });
      return {
        content: text(JSON.stringify({ id, ok: true })),
        isError: false,
      };
    }

    if (name === "memory_delete") {
      const parsed = z
        .object({
          id: z.string().optional(),
          ids: z.array(z.string()).optional(),
        })
        .parse(args);
      const ids = parsed.id ? [parsed.id] : (parsed.ids ?? []);
      if (ids.length === 0) {
        return { content: text("Either id or ids required"), isError: true };
      }
      log("memory_delete", `count=${ids.length}`);
      const deleted = store.deleteByIds(db, ids);
      return {
        content: text(JSON.stringify({ deleted, ok: true })),
        isError: false,
      };
    }

    if (name === "memory_stats") {
      log("memory_stats", "");
      const stats = store.getStats(db);
      return { content: text(JSON.stringify(stats)), isError: false };
    }

    return { content: text(`Unknown tool: ${name}`), isError: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    log(name, `error: ${err}`);
    return { content: text(err), isError: true };
  }
}
