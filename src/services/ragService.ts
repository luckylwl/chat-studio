/**
 * RAG (Retrieval-Augmented Generation) Service
 * Combines vector search with AI generation for knowledge-based Q&A
 */

import { vectorDB, type VectorDocument, type SearchResult } from './vectorDatabase'
import { parseDocument, chunkDocument } from './documentParser'

export interface RAGConfig {
  collectionId: string
  topK?: number
  similarityThreshold?: number
  contextWindow?: number
  includeMetadata?: boolean
}

export interface RAGResult {
  answer: string
  sources: Array<{
    content: string
    similarity: number
    metadata: any
  }>
  context: string
  query: string
}

export interface DocumentChunk {
  content: string
  chunkIndex: number
  totalChunks: number
  source: string
  metadata: Record<string, any>
}

export class RAGService {
  /**
   * Add document to knowledge base (with chunking)
   */
  async addDocument(
    collectionId: string,
    file: File,
    options: {
      chunkSize?: number
      overlap?: number
      metadata?: Record<string, any>
    } = {}
  ): Promise<{ documentId: string; chunksAdded: number }> {
    const { chunkSize = 500, overlap = 50, metadata = {} } = options

    try {
      // Parse document
      const parsed = await parseDocument(file)

      // Chunk the document
      const chunks = this.chunkText(parsed.text, chunkSize, overlap)

      // Add metadata
      const baseMetadata = {
        source: file.name,
        type: parsed.type,
        ...parsed.metadata,
        ...metadata
      }

      // Add each chunk to vector database
      const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`
      let chunksAdded = 0

      for (let i = 0; i < chunks.length; i++) {
        await vectorDB.addDocument(collectionId, chunks[i], {
          ...baseMetadata,
          documentId,
          chunkIndex: i,
          totalChunks: chunks.length,
          chunkSize
        })
        chunksAdded++
      }

      return { documentId, chunksAdded }
    } catch (error: any) {
      console.error('Failed to add document to RAG:', error)
      throw new Error(`Failed to add document: ${error.message}`)
    }
  }

  /**
   * Add text directly to knowledge base
   */
  async addText(
    collectionId: string,
    text: string,
    metadata: Record<string, any> = {}
  ): Promise<VectorDocument> {
    return await vectorDB.addDocument(collectionId, text, metadata)
  }

  /**
   * Query the knowledge base
   */
  async query(
    collectionId: string,
    query: string,
    options: {
      topK?: number
      threshold?: number
      includeContext?: boolean
    } = {}
  ): Promise<SearchResult[]> {
    const { topK = 5, threshold = 0.3, includeContext = true } = options

    try {
      const results = await vectorDB.search(collectionId, query, {
        topK,
        threshold
      })

      return results
    } catch (error: any) {
      console.error('RAG query error:', error)
      throw new Error(`Query failed: ${error.message}`)
    }
  }

  /**
   * Format context for AI prompt
   */
  formatContext(results: SearchResult[], maxLength: number = 2000): string {
    const contextParts: string[] = []
    let currentLength = 0

    for (const result of results) {
      const content = result.document.content
      const metadata = result.document.metadata

      // Format source info
      const source = metadata.source || 'Unknown'
      const chunkInfo = metadata.chunkIndex !== undefined
        ? ` [Chunk ${metadata.chunkIndex + 1}/${metadata.totalChunks}]`
        : ''

      const entry = `[${source}${chunkInfo}] (Similarity: ${(result.similarity * 100).toFixed(1)}%)\n${content}\n`

      if (currentLength + entry.length > maxLength) {
        break
      }

      contextParts.push(entry)
      currentLength += entry.length
    }

    return contextParts.join('\n---\n\n')
  }

  /**
   * Generate RAG prompt
   */
  generatePrompt(query: string, context: string): string {
    return `Based on the following context, please answer the question. If the context doesn't contain enough information to answer the question, say so.

Context:
${context}

Question: ${query}

Answer:`
  }

  /**
   * Chunk text into smaller pieces with overlap
   */
  private chunkText(
    text: string,
    chunkSize: number = 500,
    overlap: number = 50
  ): string[] {
    const words = text.split(/\s+/)
    const chunks: string[] = []

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ')
      if (chunk.trim().length > 0) {
        chunks.push(chunk)
      }
    }

    return chunks
  }

  /**
   * Semantic chunking (split by paragraphs/sentences)
   */
  semanticChunk(text: string, maxChunkSize: number = 500): string[] {
    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/)
    const chunks: string[] = []
    let currentChunk = ''

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim()
      if (!trimmed) continue

      if ((currentChunk + trimmed).length <= maxChunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmed
      } else {
        if (currentChunk) {
          chunks.push(currentChunk)
        }

        // If paragraph is too long, split by sentences
        if (trimmed.length > maxChunkSize) {
          const sentences = trimmed.split(/[.!?]+/)
          let sentenceChunk = ''

          for (const sentence of sentences) {
            const sent = sentence.trim()
            if (!sent) continue

            if ((sentenceChunk + sent).length <= maxChunkSize) {
              sentenceChunk += (sentenceChunk ? '. ' : '') + sent
            } else {
              if (sentenceChunk) {
                chunks.push(sentenceChunk + '.')
              }
              sentenceChunk = sent
            }
          }

          if (sentenceChunk) {
            chunks.push(sentenceChunk + '.')
          }
          currentChunk = ''
        } else {
          currentChunk = trimmed
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk)
    }

    return chunks
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionId: string): Promise<{
    documentCount: number
    totalChunks: number
    averageChunkSize: number
    sources: string[]
  }> {
    const documents = vectorDB.getDocuments(collectionId)

    const documentIds = new Set<string>()
    const sources = new Set<string>()
    let totalLength = 0

    documents.forEach(doc => {
      if (doc.metadata.documentId) {
        documentIds.add(doc.metadata.documentId)
      }
      if (doc.metadata.source) {
        sources.add(doc.metadata.source)
      }
      totalLength += doc.content.length
    })

    return {
      documentCount: documentIds.size,
      totalChunks: documents.length,
      averageChunkSize: documents.length > 0 ? Math.round(totalLength / documents.length) : 0,
      sources: Array.from(sources)
    }
  }

  /**
   * Delete document and all its chunks
   */
  async deleteDocument(collectionId: string, documentId: string): Promise<number> {
    const documents = vectorDB.getDocuments(collectionId)
    const chunksToDelete = documents.filter(
      doc => doc.metadata.documentId === documentId
    )

    let deleted = 0
    for (const chunk of chunksToDelete) {
      const success = await vectorDB.deleteDocument(collectionId, chunk.id)
      if (success) deleted++
    }

    return deleted
  }

  /**
   * Search with hybrid approach (keyword + semantic)
   */
  async hybridSearch(
    collectionId: string,
    query: string,
    options: {
      topK?: number
      keywordWeight?: number
      semanticWeight?: number
    } = {}
  ): Promise<SearchResult[]> {
    const { topK = 5, keywordWeight = 0.3, semanticWeight = 0.7 } = options

    // Get semantic search results
    const semanticResults = await vectorDB.search(collectionId, query, { topK: topK * 2 })

    // Calculate keyword scores
    const queryTerms = query.toLowerCase().split(/\s+/)
    const hybridResults = semanticResults.map(result => {
      const content = result.document.content.toLowerCase()

      // Simple keyword matching
      let keywordScore = 0
      queryTerms.forEach(term => {
        const count = (content.match(new RegExp(term, 'g')) || []).length
        keywordScore += count
      })

      // Normalize keyword score
      keywordScore = Math.min(keywordScore / queryTerms.length, 1.0)

      // Combined score
      const hybridScore =
        semanticWeight * result.similarity +
        keywordWeight * keywordScore

      return {
        ...result,
        score: hybridScore,
        keywordScore,
        semanticScore: result.similarity
      }
    })

    // Sort by hybrid score and return top K
    return hybridResults
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }
}

/**
 * Global RAG service instance
 */
export const ragService = new RAGService()

/**
 * Helper: Quick RAG query
 */
export async function quickRAG(
  collectionId: string,
  query: string,
  topK: number = 5
): Promise<SearchResult[]> {
  return ragService.query(collectionId, query, { topK })
}
