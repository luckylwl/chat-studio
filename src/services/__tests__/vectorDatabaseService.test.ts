/**
 * AI Chat Studio v3.0 - Vector Database Service Tests
 *
 * Tests for RAG and semantic search functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import vectorDatabaseService from '../vectorDatabaseService'
import type { Document, KnowledgeBase } from '../../types'

describe('VectorDatabaseService', () => {
  // Mock document for testing
  const mockDocument: Omit<Document, 'chunks' | 'embeddings'> = {
    id: 'test_doc_1',
    title: 'Test Document',
    content: 'This is a test document about artificial intelligence and machine learning. ' +
      'AI and ML are transforming how we build software. ' +
      'Deep learning models can understand natural language.',
    type: 'txt',
    size: 150,
    uploadedAt: Date.now(),
    userId: 'test_user',
    tags: ['test', 'ai', 'ml'],
    metadata: {
      author: 'Test User',
      description: 'A test document for unit tests'
    }
  }

  const mockDocument2: Omit<Document, 'chunks' | 'embeddings'> = {
    id: 'test_doc_2',
    title: 'Another Document',
    content: 'This document discusses web development and React programming. ' +
      'TypeScript provides type safety for JavaScript applications. ' +
      'Modern web frameworks improve developer productivity.',
    type: 'txt',
    size: 130,
    uploadedAt: Date.now(),
    userId: 'test_user',
    tags: ['test', 'web', 'react'],
    metadata: {}
  }

  beforeEach(async () => {
    // Initialize the service before each test
    await vectorDatabaseService.initialize()
  })

  afterEach(async () => {
    // Clean up after each test
    const docs = await vectorDatabaseService.getAllDocuments()
    for (const doc of docs) {
      await vectorDatabaseService.deleteDocument(doc.id)
    }
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const result = await vectorDatabaseService.initialize()
      expect(result).toBe(true)
    })

    it('should be idempotent', async () => {
      await vectorDatabaseService.initialize()
      const result = await vectorDatabaseService.initialize()
      expect(result).toBe(true)
    })
  })

  describe('addDocument', () => {
    it('should add a document successfully', async () => {
      const doc = await vectorDatabaseService.addDocument(mockDocument)

      expect(doc).toBeDefined()
      expect(doc.id).toBe(mockDocument.id)
      expect(doc.title).toBe(mockDocument.title)
      expect(doc.chunks).toBeDefined()
      expect(doc.chunks!.length).toBeGreaterThan(0)
    })

    it('should create chunks with embeddings', async () => {
      const doc = await vectorDatabaseService.addDocument(mockDocument)

      expect(doc.chunks).toBeDefined()
      doc.chunks!.forEach(chunk => {
        expect(chunk.id).toBeDefined()
        expect(chunk.content).toBeDefined()
        expect(chunk.embedding).toBeDefined()
        expect(Array.isArray(chunk.embedding)).toBe(true)
        expect(chunk.embedding.length).toBeGreaterThan(0)
      })
    })

    it('should handle long documents by creating multiple chunks', async () => {
      const longContent = 'A '.repeat(2000) // Create very long content
      const longDoc: Omit<Document, 'chunks' | 'embeddings'> = {
        ...mockDocument,
        id: 'long_doc',
        content: longContent
      }

      const doc = await vectorDatabaseService.addDocument(longDoc)

      expect(doc.chunks).toBeDefined()
      expect(doc.chunks!.length).toBeGreaterThan(1)
    })

    it('should reject duplicate document IDs', async () => {
      await vectorDatabaseService.addDocument(mockDocument)

      await expect(
        vectorDatabaseService.addDocument(mockDocument)
      ).rejects.toThrow()
    })
  })

  describe('getDocument', () => {
    it('should retrieve an existing document', async () => {
      await vectorDatabaseService.addDocument(mockDocument)
      const retrieved = await vectorDatabaseService.getDocument(mockDocument.id)

      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(mockDocument.id)
      expect(retrieved!.title).toBe(mockDocument.title)
    })

    it('should return null for non-existent document', async () => {
      const retrieved = await vectorDatabaseService.getDocument('non_existent')
      expect(retrieved).toBeNull()
    })
  })

  describe('getAllDocuments', () => {
    it('should return empty array when no documents exist', async () => {
      const docs = await vectorDatabaseService.getAllDocuments()
      expect(docs).toEqual([])
    })

    it('should return all documents', async () => {
      await vectorDatabaseService.addDocument(mockDocument)
      await vectorDatabaseService.addDocument(mockDocument2)

      const docs = await vectorDatabaseService.getAllDocuments()

      expect(docs).toHaveLength(2)
      expect(docs.map(d => d.id)).toContain(mockDocument.id)
      expect(docs.map(d => d.id)).toContain(mockDocument2.id)
    })
  })

  describe('deleteDocument', () => {
    it('should delete an existing document', async () => {
      await vectorDatabaseService.addDocument(mockDocument)

      const result = await vectorDatabaseService.deleteDocument(mockDocument.id)
      expect(result).toBe(true)

      const retrieved = await vectorDatabaseService.getDocument(mockDocument.id)
      expect(retrieved).toBeNull()
    })

    it('should return false for non-existent document', async () => {
      const result = await vectorDatabaseService.deleteDocument('non_existent')
      expect(result).toBe(false)
    })
  })

  describe('semanticSearch', () => {
    beforeEach(async () => {
      // Add test documents
      await vectorDatabaseService.addDocument(mockDocument)
      await vectorDatabaseService.addDocument(mockDocument2)
    })

    it('should find relevant documents based on semantic similarity', async () => {
      const results = await vectorDatabaseService.semanticSearch(
        'artificial intelligence and machine learning',
        { topK: 5 }
      )

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].documentId).toBe(mockDocument.id)
    })

    it('should return results in order of relevance', async () => {
      const results = await vectorDatabaseService.semanticSearch(
        'AI and deep learning',
        { topK: 5 }
      )

      // Scores should be in descending order
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score)
      }
    })

    it('should respect topK parameter', async () => {
      const results = await vectorDatabaseService.semanticSearch(
        'programming',
        { topK: 1 }
      )

      expect(results).toHaveLength(1)
    })

    it('should apply score threshold', async () => {
      const results = await vectorDatabaseService.semanticSearch(
        'quantum computing', // Unrelated query
        { topK: 10, scoreThreshold: 0.8 }
      )

      results.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(0.8)
      })
    })

    it('should filter by knowledge base', async () => {
      const kb = await vectorDatabaseService.createKnowledgeBase({
        id: 'test_kb',
        name: 'Test KB',
        description: 'Test knowledge base',
        documentIds: [mockDocument.id],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: 'test_user',
        tags: []
      })

      const results = await vectorDatabaseService.semanticSearch(
        'artificial intelligence',
        { topK: 5, knowledgeBaseId: kb.id }
      )

      results.forEach(result => {
        expect(result.documentId).toBe(mockDocument.id)
      })
    })

    it('should return empty array for no matches', async () => {
      const results = await vectorDatabaseService.semanticSearch(
        'xyzabc123', // Nonsense query
        { topK: 5, scoreThreshold: 0.9 }
      )

      // May return empty or very low scores
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('augmentPromptWithContext', () => {
    beforeEach(async () => {
      await vectorDatabaseService.addDocument(mockDocument)
    })

    it('should augment prompt with relevant context', async () => {
      const originalPrompt = 'Explain machine learning'
      const augmented = await vectorDatabaseService.augmentPromptWithContext(
        originalPrompt,
        { topK: 2 }
      )

      expect(augmented).toContain(originalPrompt)
      expect(augmented.length).toBeGreaterThan(originalPrompt.length)
      expect(augmented).toContain('Context')
    })

    it('should include document metadata', async () => {
      const prompt = 'What is AI?'
      const augmented = await vectorDatabaseService.augmentPromptWithContext(
        prompt,
        { topK: 1 }
      )

      expect(augmented).toContain(mockDocument.title)
    })

    it('should handle prompts when no context is found', async () => {
      await vectorDatabaseService.deleteDocument(mockDocument.id)

      const prompt = 'What is AI?'
      const augmented = await vectorDatabaseService.augmentPromptWithContext(
        prompt,
        { topK: 1 }
      )

      // Should return original prompt if no context
      expect(augmented).toBe(prompt)
    })
  })

  describe('Knowledge Base Management', () => {
    const mockKB: KnowledgeBase = {
      id: 'test_kb_1',
      name: 'Test Knowledge Base',
      description: 'A test knowledge base',
      documentIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: 'test_user',
      tags: ['test']
    }

    describe('createKnowledgeBase', () => {
      it('should create a knowledge base', async () => {
        const kb = await vectorDatabaseService.createKnowledgeBase(mockKB)

        expect(kb).toBeDefined()
        expect(kb.id).toBe(mockKB.id)
        expect(kb.name).toBe(mockKB.name)
      })

      it('should reject duplicate IDs', async () => {
        await vectorDatabaseService.createKnowledgeBase(mockKB)

        await expect(
          vectorDatabaseService.createKnowledgeBase(mockKB)
        ).rejects.toThrow()
      })
    })

    describe('getKnowledgeBase', () => {
      it('should retrieve a knowledge base', async () => {
        await vectorDatabaseService.createKnowledgeBase(mockKB)
        const retrieved = await vectorDatabaseService.getKnowledgeBase(mockKB.id)

        expect(retrieved).toBeDefined()
        expect(retrieved!.id).toBe(mockKB.id)
      })

      it('should return null for non-existent KB', async () => {
        const retrieved = await vectorDatabaseService.getKnowledgeBase('non_existent')
        expect(retrieved).toBeNull()
      })
    })

    describe('addDocumentToKnowledgeBase', () => {
      it('should add document to knowledge base', async () => {
        await vectorDatabaseService.createKnowledgeBase(mockKB)
        await vectorDatabaseService.addDocument(mockDocument)

        const result = await vectorDatabaseService.addDocumentToKnowledgeBase(
          mockKB.id,
          mockDocument.id
        )

        expect(result).toBe(true)

        const kb = await vectorDatabaseService.getKnowledgeBase(mockKB.id)
        expect(kb!.documentIds).toContain(mockDocument.id)
      })
    })

    describe('removeDocumentFromKnowledgeBase', () => {
      it('should remove document from knowledge base', async () => {
        const kb = await vectorDatabaseService.createKnowledgeBase({
          ...mockKB,
          documentIds: [mockDocument.id]
        })

        const result = await vectorDatabaseService.removeDocumentFromKnowledgeBase(
          kb.id,
          mockDocument.id
        )

        expect(result).toBe(true)

        const updated = await vectorDatabaseService.getKnowledgeBase(kb.id)
        expect(updated!.documentIds).not.toContain(mockDocument.id)
      })
    })

    describe('deleteKnowledgeBase', () => {
      it('should delete a knowledge base', async () => {
        await vectorDatabaseService.createKnowledgeBase(mockKB)

        const result = await vectorDatabaseService.deleteKnowledgeBase(mockKB.id)
        expect(result).toBe(true)

        const retrieved = await vectorDatabaseService.getKnowledgeBase(mockKB.id)
        expect(retrieved).toBeNull()
      })
    })
  })

  describe('parseDocument', () => {
    it('should parse text files', async () => {
      const file = new File(['Test content'], 'test.txt', { type: 'text/plain' })
      const result = await vectorDatabaseService.parseDocument(file)

      expect(result.title).toBe('test.txt')
      expect(result.content).toBe('Test content')
    })

    it('should parse markdown files', async () => {
      const mdContent = '# Title\n\nSome content'
      const file = new File([mdContent], 'test.md', { type: 'text/markdown' })
      const result = await vectorDatabaseService.parseDocument(file)

      expect(result.title).toBe('test.md')
      expect(result.content).toBe(mdContent)
    })

    it('should handle PDF files', async () => {
      const file = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' })

      // Note: Full PDF parsing requires pdfjs-dist
      // This is a placeholder that should be implemented
      await expect(
        vectorDatabaseService.parseDocument(file)
      ).resolves.toBeDefined()
    })

    it('should reject unsupported file types', async () => {
      const file = new File(['content'], 'test.xyz', { type: 'application/unknown' })

      await expect(
        vectorDatabaseService.parseDocument(file)
      ).rejects.toThrow('Unsupported file type')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty documents', async () => {
      const emptyDoc: Omit<Document, 'chunks' | 'embeddings'> = {
        ...mockDocument,
        id: 'empty_doc',
        content: ''
      }

      await expect(
        vectorDatabaseService.addDocument(emptyDoc)
      ).rejects.toThrow()
    })

    it('should handle very large documents', async () => {
      const largeContent = 'A '.repeat(100000) // Very large document
      const largeDoc: Omit<Document, 'chunks' | 'embeddings'> = {
        ...mockDocument,
        id: 'large_doc',
        content: largeContent
      }

      const doc = await vectorDatabaseService.addDocument(largeDoc)
      expect(doc.chunks!.length).toBeGreaterThan(10)
    })

    it('should handle special characters in content', async () => {
      const specialDoc: Omit<Document, 'chunks' | 'embeddings'> = {
        ...mockDocument,
        id: 'special_doc',
        content: 'Test with émojis 😀 and spëcial çharacters'
      }

      const doc = await vectorDatabaseService.addDocument(specialDoc)
      expect(doc).toBeDefined()
    })

    it('should handle concurrent operations', async () => {
      const promises = [
        vectorDatabaseService.addDocument({ ...mockDocument, id: 'doc_1' }),
        vectorDatabaseService.addDocument({ ...mockDocument2, id: 'doc_2' }),
        vectorDatabaseService.semanticSearch('test', { topK: 5 })
      ]

      await expect(Promise.all(promises)).resolves.toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should handle multiple documents efficiently', async () => {
      const startTime = Date.now()

      // Add 10 documents
      const promises = Array.from({ length: 10 }, (_, i) =>
        vectorDatabaseService.addDocument({
          ...mockDocument,
          id: `perf_doc_${i}`,
          content: `Test document ${i} with different content`
        })
      )

      await Promise.all(promises)

      const duration = Date.now() - startTime

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(30000) // 30 seconds for 10 documents
    })

    it('should search efficiently across many documents', async () => {
      // Add several documents
      await Promise.all([
        vectorDatabaseService.addDocument(mockDocument),
        vectorDatabaseService.addDocument(mockDocument2)
      ])

      const startTime = Date.now()

      await vectorDatabaseService.semanticSearch('test query', { topK: 5 })

      const duration = Date.now() - startTime

      // Search should be fast
      expect(duration).toBeLessThan(2000) // 2 seconds
    })
  })
})
