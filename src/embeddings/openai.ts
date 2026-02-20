import OpenAI from "openai";
import type { IEmbeddingProvider } from "./provider.js";

const MODEL = "text-embedding-3-small";
const DIMENSIONS = 1536;

export function createOpenAIEmbeddingProvider(apiKey: string): IEmbeddingProvider {
  const client = new OpenAI({ apiKey });
  return {
    async embed(text: string): Promise<Float32Array> {
      const res = await client.embeddings.create({
        model: MODEL,
        input: text.slice(0, 8191),
      });
      const arr = res.data[0]?.embedding;
      if (!arr || !Array.isArray(arr)) throw new Error("OpenAI embedding missing");
      return new Float32Array(arr);
    },
    dimensions: () => DIMENSIONS,
  };
}
