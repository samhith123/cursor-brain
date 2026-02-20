import type { IEmbeddingProvider } from "./provider.js";

/**
 * Stub for a local embedding model (e.g. Transformers.js).
 * Phase 2: implement to avoid OpenAI dependency.
 */
export function createLocalEmbeddingProvider(): IEmbeddingProvider {
  return {
    async embed(_text: string): Promise<Float32Array> {
      throw new Error("Local embeddings not implemented. Set OpenAI API key or OPENAI_API_KEY.");
    },
    dimensions: () => 1536,
  };
}
