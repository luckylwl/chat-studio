import { Document, DocumentChunk, VectorSearchResult, KnowledgeBase } from '../types'
import { pipeline } from '@xenova/transformers'
import localforage from 'localforage'

// Vector Database Service using Transformers.js for local embeddings
class VectorDatabaseService {
  private embedder: any = null
  private isInitialized = false
  private readonly EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
  private readonly CHUNK_SIZE = 500 // characters
  private readonly CHUNK_OVERLAP = 50

  // Storage keys
  private readonly DOCUMENTS_KEY = 'rag_documents'
  private readonly CHUNKS_KEY = 'rag_chunks'
  private readonly KNOWLEDGE_BASES_KEY = 'knowledge_bases'

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing vector database service...')
      this.embedder = await pipeline('feature-extraction', this.EMBEDDING_MODEL)
      this.isInitialized = true
      console.log('Vector database service initialized')
    } catch (error) {
      console.error('Failed to initialize vector database:', error)
      throw error
    }
  }

  // Document Management
  async addDocument(document: Omit<Document, 'chunks' | 'embeddings'>): Promise<Document> {
    await this.initialize()

    // Split document into chunks
    const chunks = this.splitIntoChunks(document.content, document.id)

    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk.content)
      chunk.embedding = Array.from(embedding)
    }

    const fullDocument: Document = {
      ...document,
      chunks
    }

    // Save document and chunks
    await this.saveDocument(fullDocument)
    await this.saveChunks(chunks)

    return fullDocument
  }

  async getDocument(documentId: string): Promise<Document | null> {
    const documents = await this.getAllDocuments()
    return documents.find(doc => doc.id === documentId) || null
  }

  async getAllDocuments(): Promise<Document[]> {
    return (await localforage.getItem<Document[]>(this.DOCUMENTS_KEY)) || []
  }

  async deleteDocument(documentId: string): Promise<void> {
    const documents = await this.getAllDocuments()
    const filtered = documents.filter(doc => doc.id !== documentId)
    await localforage.setItem(this.DOCUMENTS_KEY, filtered)

    // Delete associated chunks
    const chunks = await this.getAllChunks()
    const filteredChunks = chunks.filter(chunk => chunk.documentId !== documentId)
    await localforage.setItem(this.CHUNKS_KEY, filteredChunks)
  }

  // Semantic Search
  async semanticSearch(
    query: string,
    options: {
      topK?: number
      knowledgeBaseId?: string
      documentIds?: string[]
      minScore?: number
    } = {}
  ): Promise<VectorSearchResult[]> {
    await this.initialize()

    const {
      topK = 5,
      documentIds,
      minScore = 0.0
    } = options

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query)

    // Get all chunks (filtered by documentIds if provided)
    let chunks = await this.getAllChunks()

    if (documentIds && documentIds.length > 0) {
      chunks = chunks.filter(chunk => documentIds.includes(chunk.documentId))
    }

    // Calculate cosine similarity for each chunk
    const results: VectorSearchResult[] = chunks.map(chunk => {
      if (!chunk.embedding) {
        return {
          documentId: chunk.documentId,
          chunkId: chunk.id,
          content: chunk.content,
          score: 0,
          metadata: chunk.metadata
        }
      }

      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding)
      return {
        documentId: chunk.documentId,
        chunkId: chunk.id,
        content: chunk.content,
        score,
        metadata: chunk.metadata
      }
    })

    // Filter by minimum score and sort by score descending
    return results
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  // Knowledge Base Management
  async createKnowledgeBase(kb: Omit<KnowledgeBase, 'createdAt' | 'updatedAt'>): Promise<KnowledgeBase> {
    const knowledgeBase: KnowledgeBase = {
      ...kb,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const kbs = await this.getAllKnowledgeBases()
    kbs.push(knowledgeBase)
    await localforage.setItem(this.KNOWLEDGE_BASES_KEY, kbs)

    return knowledgeBase
  }

  async getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
    const kbs = await this.getAllKnowledgeBases()
    return kbs.find(kb => kb.id === id) || null
  }

  async getAllKnowledgeBases(): Promise<KnowledgeBase[]> {
    return (await localforage.getItem<KnowledgeBase[]>(this.KNOWLEDGE_BASES_KEY)) || []
  }

  async updateKnowledgeBase(id: string, updates: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
    const kbs = await this.getAllKnowledgeBases()
    const index = kbs.findIndex(kb => kb.id === id)

    if (index === -1) {
      throw new Error(`Knowledge base ${id} not found`)
    }

    kbs[index] = {
      ...kbs[index],
      ...updates,
      updatedAt: Date.now()
    }

    await localforage.setItem(this.KNOWLEDGE_BASES_KEY, kbs)
    return kbs[index]
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    const kbs = await this.getAllKnowledgeBases()
    const filtered = kbs.filter(kb => kb.id !== id)
    await localforage.setItem(this.KNOWLEDGE_BASES_KEY, filtered)
  }

  async addDocumentsToKnowledgeBase(kbId: string, documentIds: string[]): Promise<void> {
    const kb = await this.getKnowledgeBase(kbId)
    if (!kb) throw new Error(`Knowledge base ${kbId} not found`)

    const uniqueDocIds = Array.from(new Set([...kb.documentIds, ...documentIds]))
    await this.updateKnowledgeBase(kbId, { documentIds: uniqueDocIds })
  }

  // RAG: Retrieve and Augment
  async augmentPromptWithContext(
    prompt: string,
    options: {
      topK?: number
      knowledgeBaseId?: string
      documentIds?: string[]
      minScore?: number
    } = {}
  ): Promise<string> {
    const results = await this.semanticSearch(prompt, options)

    if (results.length === 0) {
      return prompt
    }

    const context = results
      .map((result, index) => `[Context ${index + 1}]\n${result.content}`)
      .join('\n\n')

    return `Based on the following context, please answer the question:\n\n${context}\n\nQuestion: ${prompt}`
  }

  // Private helper methods
  private splitIntoChunks(text: string, documentId: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let startIndex = 0
    let chunkIndex = 0

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + this.CHUNK_SIZE, text.length)
      const content = text.slice(startIndex, endIndex)

      chunks.push({
        id: `${documentId}_chunk_${chunkIndex}`,
        documentId,
        content,
        startIndex,
        endIndex,
        metadata: {
          chunkIndex,
          totalChunks: 0 // Will be updated after loop
        }
      })

      startIndex = endIndex - this.CHUNK_OVERLAP
      chunkIndex++
    }

    // Update total chunks count
    chunks.forEach(chunk => {
      if (chunk.metadata) {
        chunk.metadata.totalChunks = chunks.length
      }
    })

    return chunks
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('Embedder not initialized')
    }

    try {
      const output = await this.embedder(text, { pooling: 'mean', normalize: true })
      return Array.from(output.data)
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  private async saveDocument(document: Document): Promise<void> {
    const documents = await this.getAllDocuments()
    const index = documents.findIndex(doc => doc.id === document.id)

    if (index !== -1) {
      documents[index] = document
    } else {
      documents.push(document)
    }

    await localforage.setItem(this.DOCUMENTS_KEY, documents)
  }

  private async saveChunks(chunks: DocumentChunk[]): Promise<void> {
    const allChunks = await this.getAllChunks()

    // Remove existing chunks for this document
    const documentId = chunks[0]?.documentId
    const filtered = allChunks.filter(chunk => chunk.documentId !== documentId)

    // Add new chunks
    filtered.push(...chunks)
    await localforage.setItem(this.CHUNKS_KEY, filtered)
  }

  private async getAllChunks(): Promise<DocumentChunk[]> {
    return (await localforage.getItem<DocumentChunk[]>(this.CHUNKS_KEY)) || []
  }

  // Utility: Parse different document types
  async parseDocument(file: File): Promise<{ title: string; content: string }> {
    const fileType = file.type
    const fileName = file.name

    try {
      if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        const content = await file.text()
        return { title: fileName, content }
      } else if (fileType === 'text/markdown' || fileName.endsWith('.md')) {
        const content = await file.text()
        return { title: fileName, content }
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        // PDF parsing would require pdf.js
        const content = await this.parsePDF(file)
        return { title: fileName, content }
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        // DOCX parsing using mammoth
        const content = await this.parseDOCX(file)
        return { title: fileName, content }
      } else {
        throw new Error(`Unsupported file type: ${fileType}`)
      }
    } catch (error) {
      console.error('Error parsing document:', error)
      throw error
    }
  }

  private async parsePDF(file: File): Promise<string> {
    // This is a placeholder - actual implementation would use pdf.js
    const arrayBuffer = await file.arrayBuffer()
    // For now, return a simple message
    // In production, you'd use pdfjs-dist library
    console.warn('PDF parsing not fully implemented, using placeholder')
    return `PDF Document: ${file.name}\n\n[PDF content would be extracted here using pdf.js]`
  }

  private async parseDOCX(file: File): Promise<string> {
    try {
      const mammoth = (await import('mammoth')).default
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    } catch (error) {
      console.error('Error parsing DOCX:', error)
      throw error
    }
  }

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    await localforage.removeItem(this.DOCUMENTS_KEY)
    await localforage.removeItem(this.CHUNKS_KEY)
    await localforage.removeItem(this.KNOWLEDGE_BASES_KEY)
  }
}

export const vectorDatabaseService = new VectorDatabaseService()
export default vectorDatabaseService
