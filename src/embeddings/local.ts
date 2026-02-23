import type { IEmbeddingProvider } from "./provider.js";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
const DIMENSIONS = 384;

type FeatureExtractionPipeline = {
  (text: string, options?: { pooling?: string; normalize?: boolean }): Promise<{
    tolist(): number[][];
  }>;
};

let pipelineInstance: FeatureExtractionPipeline | null = null;
let pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;

async function getPipeline(): Promise<FeatureExtractionPipeline> {
  if (pipelineInstance) return pipelineInstance;
  if (pipelinePromise) return pipelinePromise;

  pipelinePromise = (async () => {
    const { pipeline } = await import("@huggingface/transformers");
    const extractor = await pipeline("feature-extraction", MODEL_NAME, {
      dtype: "q8",
    });
    pipelineInstance = extractor as FeatureExtractionPipeline;
    return pipelineInstance;
  })();

  return pipelinePromise;
}

export function createLocalEmbeddingProvider(): IEmbeddingProvider {
  return {
    async embed(text: string): Promise<Float32Array> {
      const extractor = await getPipeline();
      const output = await extractor(text.slice(0, 512), {
        pooling: "mean",
        normalize: true,
      });
      const data = output.tolist()[0];
      return new Float32Array(data);
    },
    dimensions: () => DIMENSIONS,
  };
}
