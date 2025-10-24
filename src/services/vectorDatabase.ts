/**
 * Vector Database Service
 * In-browser vector database using LocalForage for persistence
 */

import localforage from 'localforage'
import { embeddingService } from './embeddingService'

export interface VectorDocument {
  id: string
  content: string
  embedding: number[]
  metadata: {
    source?: string
    title?: string
    author?: string
    timestamp?: number
    tags?: string[]
    [key: string]: any
  }
  createdAt: number
  updatedAt: number
}

export interface SearchResult {
  document: VectorDocument
  similarity: number
  score: number
}

export interface VectorCollection {
  id: string
  name: string
  description?: string
  documentCount: number
  dimensions: number
  createdAt: number
  updatedAt: number
}

export class VectorDatabase {
  private store: LocalForage
  private collections: Map<string, VectorCollection> = new Map()
  private documents: Map<string, Map<string, VectorDocument>> = new Map()

  constructor(dbName: string = 'vector-db') {
    this.store = localforage.createInstance({
      name: dbName,
      storeName: 'vectors'
    })
  }

  /**
   * Initialize database
   */
  async initialize(): Promise<void> {
    try {
      // Load collections
      const collectionsData = await this.store.getItem<VectorCollection[]>('collections')
      if (collectionsData) {
        collectionsData.forEach(col => this.collections.set(col.id, col))
      }

      // Load documents for each collection
      for (const collection of this.collections.values()) {
        const docs = await this.store.getItem<VectorDocument[]>(`docs:${collection.id}`)
        if (docs) {
          const docMap = new Map(docs.map(doc => [doc.id, doc]))
          this.documents.set(collection.id, docMap)
        }
      }
    } catch (error: any) {
      console.error('Database initialization error:', error)
      throw new Error(`Failed to initialize database: ${error.message}`)
    }
  }

  /**
   * Create a new collection
   */
  async createCollection(
    name: string,
    description?: string
  ): Promise<VectorCollection> {
    const id = `col-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const collection: VectorCollection = {
      id,
      name,
      description,
      documentCount: 0,
      dimensions: 384, // Default for all-MiniLM-L6-v2
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.collections.set(id, collection)
    this.documents.set(id, new Map())

    await this.saveCollections()

    return collection
  }

  /**
   * Get collection by ID
   */
  getCollection(collectionId: string): VectorCollection | undefined {
    return this.collections.get(collectionId)
  }

  /**
   * List all collections
   */
  listCollections(): VectorCollection[] {
    return Array.from(this.collections.values())
  }

  /**
   * Delete a collection
   */
  async deleteCollection(collectionId: string): Promise<boolean> {
    if (!this.collections.has(collectionId)) {
      return false
    }

    this.collections.delete(collectionId)
    this.documents.delete(collectionId)

    await this.store.removeItem(`docs:${collectionId}`)
    await this.saveCollections()

    return true
  }

  /**
   * Add document to collection
   */
  async addDocument(
    collectionId: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<VectorDocument> {
    const collection = this.collections.get(collectionId)
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`)
    }

    // Generate embedding
    const embeddingResult = await embeddingService.embed(content)

    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const document: VectorDocument = {
      id,
      content,
      embedding: embeddingResult.embedding,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Add to collection
    let docMap = this.documents.get(collectionId)
    if (!docMap) {
      docMap = new Map()
      this.documents.set(collectionId, docMap)
    }
    docMap.set(id, document)

    // Update collection
    collection.documentCount = docMap.size
    collection.dimensions = embeddingResult.dimensions
    collection.updatedAt = Date.now()

    await this.saveDocuments(collectionId)
    await this.saveCollections()

    return document
  }

  /**
   * Add multiple documents (batch)
   */
  async addDocuments(
    collectionId: string,
    documents: Array<{ content: string; metadata?: Record<string, any> }>
  ): Promise<VectorDocument[]> {
    const results: VectorDocument[] = []

    for (const doc of documents) {
      const result = await this.addDocument(collectionId, doc.content, doc.metadata)
      results.push(result)
    }

    return results
  }

  /**
   * Get document by ID
   */
  getDocument(collectionId: string, documentId: string): VectorDocument | undefined {
    return this.documents.get(collectionId)?.get(documentId)
  }

  /**
   * Delete document
   */
  async deleteDocument(collectionId: string, documentId: string): Promise<boolean> {
    const docMap = this.documents.get(collectionId)
    if (!docMap || !docMap.has(documentId)) {
      return false
    }

    docMap.delete(documentId)

    const collection = this.collections.get(collectionId)
    if (collection) {
      collection.documentCount = docMap.size
      collection.updatedAt = Date.now()
    }

    await this.saveDocuments(collectionId)
    await this.saveCollections()

    return true
  }

  /**
   * Search for similar documents
   */
  async search(
    collectionId: string,
    query: string,
    options: {
      topK?: number
      threshold?: number
      filter?: (doc: VectorDocument) => boolean
    } = {}
  ): Promise<SearchResult[]> {
    const { topK = 5, threshold = 0.0, filter } = options

    const collection = this.collections.get(collectionId)
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`)
    }

    const docMap = this.documents.get(collectionId)
    if (!docMap || docMap.size === 0) {
      return []
    }

    // Generate query embedding
    const queryEmbedding = await embeddingService.embed(query)

    // Get all documents
    let docs = Array.from(docMap.values())

    // Apply filter if provided
    if (filter) {
      docs = docs.filter(filter)
    }

    // Calculate similarities
    const results: SearchResult[] = docs.map(doc => {
      const similarity = embeddingService.cosineSimilarity(
        queryEmbedding.embedding,
        doc.embedding
      )

      return {
        document: doc,
        similarity,
        score: similarity
      }
    })

    // Filter by threshold and sort
    return results
      .filter(r => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
  }

  /**
   * Get all documents in a collection
   */
  getDocuments(collectionId: string): VectorDocument[] {
    const docMap = this.documents.get(collectionId)
    return docMap ? Array.from(docMap.values()) : []
  }

  /**
   * Clear all documents in a collection
   */
  async clearCollection(collectionId: string): Promise<void> {
    const docMap = this.documents.get(collectionId)
    if (docMap) {
      docMap.clear()
    }

    const collection = this.collections.get(collectionId)
    if (collection) {
      collection.documentCount = 0
      collection.updatedAt = Date.now()
    }

    await this.saveDocuments(collectionId)
    await this.saveCollections()
  }

  /**
   * Get database statistics
   */
  getStats() {
    const collections = this.listCollections()
    const totalDocuments = collections.reduce((sum, col) => sum + col.documentCount, 0)

    return {
      collectionCount: collections.length,
      totalDocuments,
      collections: collections.map(col => ({
        id: col.id,
        name: col.name,
        documentCount: col.documentCount,
        dimensions: col.dimensions
      }))
    }
  }

  /**
   * Save collections to storage
   */
  private async saveCollections(): Promise<void> {
    const collections = Array.from(this.collections.values())
    await this.store.setItem('collections', collections)
  }

  /**
   * Save documents for a collection
   */
  private async saveDocuments(collectionId: string): Promise<void> {
    const docMap = this.documents.get(collectionId)
    if (docMap) {
      const docs = Array.from(docMap.values())
      await this.store.setItem(`docs:${collectionId}`, docs)
    }
  }

  /**
   * Export collection
   */
  async exportCollection(collectionId: string): Promise<any> {
    const collection = this.collections.get(collectionId)
    const documents = this.getDocuments(collectionId)

    return {
      collection,
      documents
    }
  }

  /**
   * Import collection
   */
  async importCollection(data: any): Promise<VectorCollection> {
    const { collection, documents } = data

    // Create new collection with imported data
    const newCollection: VectorCollection = {
      ...collection,
      id: `col-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.collections.set(newCollection.id, newCollection)

    // Import documents
    const docMap = new Map<string, VectorDocument>()
    documents.forEach((doc: VectorDocument) => {
      const newDoc: VectorDocument = {
        ...doc,
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      docMap.set(newDoc.id, newDoc)
    })

    this.documents.set(newCollection.id, docMap)

    await this.saveCollections()
    await this.saveDocuments(newCollection.id)

    return newCollection
  }
}

/**
 * Global vector database instance
 */
export const vectorDB = new VectorDatabase()

/**
 * Initialize on module load
 */
vectorDB.initialize().catch(console.error)
