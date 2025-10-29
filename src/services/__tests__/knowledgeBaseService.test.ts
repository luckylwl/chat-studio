import { describe, it, expect, beforeEach } from 'vitest'
import { knowledgeBaseService } from '../knowledgeBaseService'

describe('KnowledgeBaseService', () => {
  beforeEach(() => {
    // Reset service state before each test
  })

  describe('Document Management', () => {
    it('should create a new knowledge base', async () => {
      const kb = await knowledgeBaseService.createKnowledgeBase({
        name: 'Test KB',
        description: 'Test knowledge base'
      })

      expect(kb).toBeDefined()
      expect(kb.name).toBe('Test KB')
      expect(kb.id).toBeDefined()
    })

    it('should add a document to knowledge base', async () => {
      const kb = await knowledgeBaseService.createKnowledgeBase({
        name: 'Test KB'
      })

      const doc = await knowledgeBaseService.addDocument(kb.id, {
        title: 'Test Doc',
        content: 'Test content',
        type: 'text'
      })

      expect(doc).toBeDefined()
      expect(doc.title).toBe('Test Doc')
    })

    it('should search documents by query', async () => {
      const kb = await knowledgeBaseService.createKnowledgeBase({
        name: 'Test KB'
      })

      await knowledgeBaseService.addDocument(kb.id, {
        title: 'AI Document',
        content: 'Artificial Intelligence is fascinating',
        type: 'text'
      })

      const results = await knowledgeBaseService.search(kb.id, 'AI', {
        topK: 5
      })

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('Vector Operations', () => {
    it('should generate embeddings for text', async () => {
      const text = 'Test text for embedding'
      const embedding = await knowledgeBaseService.generateEmbedding(text)

      expect(embedding).toBeDefined()
      expect(Array.isArray(embedding)).toBe(true)
      expect(embedding.length).toBeGreaterThan(0)
    })

    it('should calculate similarity between documents', async () => {
      const doc1 = 'Machine learning is a subset of AI'
      const doc2 = 'Artificial intelligence includes machine learning'

      const similarity = await knowledgeBaseService.calculateSimilarity(doc1, doc2)

      expect(similarity).toBeGreaterThanOrEqual(0)
      expect(similarity).toBeLessThanOrEqual(1)
    })
  })
})
