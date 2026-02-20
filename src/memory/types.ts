export type MemoryType = "session_memory" | "long_term_memory" | "project_memory";

export interface MemoryEntry {
  id: string;
  timestamp: number;
  file_refs: string[];
  summary: string;
  raw: string;
  tags: string[];
  type: MemoryType;
  embedding: Float32Array | null;
}

export interface AddMemoryParams {
  type: MemoryType;
  content: string;
  tags?: string[];
  fileRefs?: string[];
  summary?: string;
}
