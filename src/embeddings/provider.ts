export interface IEmbeddingProvider {
  embed(text: string): Promise<Float32Array>;
  dimensions(): number;
}
