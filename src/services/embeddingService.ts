/**
 * Embedding Service
 * Generates text embeddings using Transformers.js (runs in browser)
 */

import { pipeline, Pipeline } from '@xenova/transformers'

export interface EmbeddingResult {
  embedding: number[]
  model: string
  dimensions: number
  duration: number
}

export interface EmbeddingBatch {
  embeddings: number[][]
  model: string
  dimensions: number
  duration: number
}

export class EmbeddingService {
  private pipeline: Pipeline | null = null
  private model: string = 'Xenova/all-MiniLM-L6-v2'
  private isLoading: boolean = false

  constructor(model?: string) {
    if (model) {
      this.model = model
    }
  }

  /**
   * Initialize the embedding pipeline
   */
  async initialize(): Promise<void> {
    if (this.pipeline) return

    if (this.isLoading) {
      // Wait for loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return
    }

    this.isLoading = true

    try {
      this.pipeline = await pipeline('feature-extraction', this.model)
    } catch (error: any) {
      console.error('Failed to initialize embedding pipeline:', error)
      throw new Error(`Embedding initialization failed: ${error.message}`)
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<EmbeddingResult> {
    const startTime = Date.now()

    await this.initialize()

    if (!this.pipeline) {
      throw new Error('Embedding pipeline not initialized')
    }

    try {
      const output = await this.pipeline(text, {
        pooling: 'mean',
        normalize: true
      })

      const embedding = Array.from(output.data)
      const duration = Date.now() - startTime

      return {
        embedding,
        model: this.model,
        dimensions: embedding.length,
        duration
      }
    } catch (error: any) {
      console.error('Embedding generation error:', error)
      throw new Error(`Failed to generate embedding: ${error.message}`)
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[]): Promise<EmbeddingBatch> {
    const startTime = Date.now()

    await this.initialize()

    if (!this.pipeline) {
      throw new Error('Embedding pipeline not initialized')
    }

    try {
      const embeddings: number[][] = []

      for (const text of texts) {
        const output = await this.pipeline(text, {
          pooling: 'mean',
          normalize: true
        })
        embeddings.push(Array.from(output.data))
      }

      const duration = Date.now() - startTime

      return {
        embeddings,
        model: this.model,
        dimensions: embeddings[0].length,
        duration
      }
    } catch (error: any) {
      console.error('Batch embedding error:', error)
      throw new Error(`Failed to generate batch embeddings: ${error.message}`)
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimensions')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
    return similarity
  }

  /**
   * Find most similar embeddings
   */
  findSimilar(
    queryEmbedding: number[],
    embeddings: Array<{ embedding: number[]; metadata: any }>,
    topK: number = 5,
    threshold: number = 0.0
  ): Array<{ similarity: number; metadata: any }> {
    const similarities = embeddings.map((item) => ({
      similarity: this.cosineSimilarity(queryEmbedding, item.embedding),
      metadata: item.metadata
    }))

    // Filter by threshold and sort by similarity
    return similarities
      .filter((item) => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
  }

  /**
   * Check if pipeline is ready
   */
  isReady(): boolean {
    return this.pipeline !== null
  }

  /**
   * Get model info
   */
  getModelInfo(): { model: string; isLoaded: boolean } {
    return {
      model: this.model,
      isLoaded: this.pipeline !== null
    }
  }
}

/**
 * Global embedding service instance
 */
export const embeddingService = new EmbeddingService()

/**
 * Quick embedding helper
 */
export async function quickEmbed(text: string): Promise<number[]> {
  const result = await embeddingService.embed(text)
  return result.embedding
}

/**
 * Quick similarity helper
 */
export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  return embeddingService.cosineSimilarity(embedding1, embedding2)
}
