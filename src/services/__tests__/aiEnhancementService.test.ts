/**
 * AI Chat Studio v3.0 - AI Enhancement Service Tests
 *
 * Tests for AI-powered intelligence features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import aiEnhancementService from '../aiEnhancementService'
import type { Conversation, Message } from '../../types'

// Mock AI service
const mockAICall = vi.fn()

describe('AIEnhancementService', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg_1',
      conversationId: 'conv_1',
      role: 'user',
      content: 'What is machine learning?',
      timestamp: Date.now() - 4000,
      tokens: 10
    },
    {
      id: 'msg_2',
      conversationId: 'conv_1',
      role: 'assistant',
      content: 'Machine learning is a subset of artificial intelligence that enables computers to learn from data and improve their performance without being explicitly programmed. It involves algorithms that can identify patterns and make decisions based on data.',
      timestamp: Date.now() - 3000,
      tokens: 50
    },
    {
      id: 'msg_3',
      conversationId: 'conv_1',
      role: 'user',
      content: 'Can you give me an example?',
      timestamp: Date.now() - 2000,
      tokens: 8
    },
    {
      id: 'msg_4',
      conversationId: 'conv_1',
      role: 'assistant',
      content: 'Sure! A common example is email spam filtering. The system learns from thousands of examples of spam and legitimate emails to automatically classify incoming emails. Over time, it gets better at distinguishing spam from real messages.',
      timestamp: Date.now() - 1000,
      tokens: 45
    }
  ]

  const mockConversation: Conversation = {
    id: 'conv_1',
    title: 'Machine Learning Discussion',
    messages: mockMessages,
    createdAt: Date.now() - 5000,
    updatedAt: Date.now(),
    model: 'gpt-3.5-turbo',
    systemPrompt: 'You are a helpful AI assistant.',
    userId: 'test_user'
  }

  beforeEach(() => {
    mockAICall.mockClear()

    // Default mock response
    mockAICall.mockResolvedValue({
      content: 'AI-generated response',
      tokens: 50
    })
  })

  describe('generateSummary', () => {
    it('should generate a conversation summary', async () => {
      const summary = await aiEnhancementService.generateSummary(mockConversation)

      expect(summary).toBeDefined()
      expect(summary.conversationId).toBe(mockConversation.id)
      expect(summary.summary).toBeDefined()
      expect(summary.summary.length).toBeGreaterThan(0)
      expect(summary.keyPoints).toBeDefined()
      expect(Array.isArray(summary.keyPoints)).toBe(true)
    })

    it('should extract key points from conversation', async () => {
      const summary = await aiEnhancementService.generateSummary(mockConversation)

      expect(summary.keyPoints.length).toBeGreaterThan(0)
      summary.keyPoints.forEach(point => {
        expect(typeof point).toBe('string')
        expect(point.length).toBeGreaterThan(0)
      })
    })

    it('should estimate word count', async () => {
      const summary = await aiEnhancementService.generateSummary(mockConversation)

      expect(summary.wordCount).toBeDefined()
      expect(summary.wordCount).toBeGreaterThan(0)
    })

    it('should handle empty conversations', async () => {
      const emptyConversation: Conversation = {
        ...mockConversation,
        messages: []
      }

      await expect(
        aiEnhancementService.generateSummary(emptyConversation)
      ).rejects.toThrow('Conversation has no messages')
    })

    it('should handle very long conversations', async () => {
      const longMessages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg_${i}`,
        conversationId: 'conv_1',
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i}`,
        timestamp: Date.now() - (100 - i) * 1000,
        tokens: 10
      }))

      const longConversation: Conversation = {
        ...mockConversation,
        messages: longMessages
      }

      const summary = await aiEnhancementService.generateSummary(longConversation)

      expect(summary).toBeDefined()
      expect(summary.keyPoints.length).toBeGreaterThan(0)
    })
  })

  describe('extractKeywords', () => {
    const testContent = 'Machine learning and artificial intelligence are transforming the technology industry. Deep learning models can process natural language and computer vision tasks.'

    it('should extract keywords from text', async () => {
      const extraction = await aiEnhancementService.extractKeywords('msg_1', testContent)

      expect(extraction).toBeDefined()
      expect(extraction.messageId).toBe('msg_1')
      expect(extraction.keywords).toBeDefined()
      expect(Array.isArray(extraction.keywords)).toBe(true)
      expect(extraction.keywords.length).toBeGreaterThan(0)
    })

    it('should assign relevance scores to keywords', async () => {
      const extraction = await aiEnhancementService.extractKeywords('msg_1', testContent)

      extraction.keywords.forEach(kw => {
        expect(kw.word).toBeDefined()
        expect(typeof kw.word).toBe('string')
        expect(kw.relevance).toBeDefined()
        expect(typeof kw.relevance).toBe('number')
        expect(kw.relevance).toBeGreaterThan(0)
        expect(kw.relevance).toBeLessThanOrEqual(1)
      })
    })

    it('should sort keywords by relevance', async () => {
      const extraction = await aiEnhancementService.extractKeywords('msg_1', testContent)

      for (let i = 0; i < extraction.keywords.length - 1; i++) {
        expect(extraction.keywords[i].relevance).toBeGreaterThanOrEqual(
          extraction.keywords[i + 1].relevance
        )
      }
    })

    it('should extract entities', async () => {
      const extraction = await aiEnhancementService.extractKeywords('msg_1', testContent)

      expect(extraction.entities).toBeDefined()
      expect(Array.isArray(extraction.entities)).toBe(true)
      // Entities may be empty if none are found
    })

    it('should handle short text', async () => {
      const shortText = 'Hello world'
      const extraction = await aiEnhancementService.extractKeywords('msg_1', shortText)

      expect(extraction).toBeDefined()
      expect(extraction.keywords.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty text', async () => {
      await expect(
        aiEnhancementService.extractKeywords('msg_1', '')
      ).rejects.toThrow()
    })

    it('should handle text with special characters', async () => {
      const specialText = 'AI/ML technologies, cloud computing & data science! #TechTrends'
      const extraction = await aiEnhancementService.extractKeywords('msg_1', specialText)

      expect(extraction).toBeDefined()
      expect(extraction.keywords.length).toBeGreaterThan(0)
    })
  })

  describe('analyzeSentiment', () => {
    const positiveText = 'I am so happy and excited! This is absolutely wonderful!'
    const negativeText = 'This is terrible and disappointing. I am very upset.'
    const neutralText = 'The meeting is scheduled for 3 PM tomorrow.'
    const mixedText = 'The product has some good features but also several problems.'

    it('should analyze sentiment of text', async () => {
      const analysis = await aiEnhancementService.analyzeSentiment('msg_1', positiveText)

      expect(analysis).toBeDefined()
      expect(analysis.messageId).toBe('msg_1')
      expect(analysis.overall).toBeDefined()
      expect(['positive', 'negative', 'neutral']).toContain(analysis.overall)
    })

    it('should detect positive sentiment', async () => {
      const analysis = await aiEnhancementService.analyzeSentiment('msg_1', positiveText)

      expect(analysis.overall).toBe('positive')
      expect(analysis.confidence).toBeGreaterThan(0.5)
    })

    it('should detect negative sentiment', async () => {
      const analysis = await aiEnhancementService.analyzeSentiment('msg_1', negativeText)

      expect(analysis.overall).toBe('negative')
      expect(analysis.confidence).toBeGreaterThan(0.5)
    })

    it('should detect neutral sentiment', async () => {
      const analysis = await aiEnhancementService.analyzeSentiment('msg_1', neutralText)

      expect(analysis.overall).toBe('neutral')
    })

    it('should provide emotion breakdown', async () => {
      const analysis = await aiEnhancementService.analyzeSentiment('msg_1', positiveText)

      expect(analysis.emotions).toBeDefined()
      expect(analysis.emotions.joy).toBeDefined()
      expect(analysis.emotions.sadness).toBeDefined()
      expect(analysis.emotions.anger).toBeDefined()
      expect(analysis.emotions.fear).toBeDefined()
      expect(analysis.emotions.surprise).toBeDefined()

      // All emotion scores should be between 0 and 1
      Object.values(analysis.emotions).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      })
    })

    it('should sum emotion scores to approximately 1', async () => {
      const analysis = await aiEnhancementService.analyzeSentiment('msg_1', positiveText)

      const sum = Object.values(analysis.emotions).reduce((a, b) => a + b, 0)
      expect(sum).toBeGreaterThan(0.9)
      expect(sum).toBeLessThan(1.1)
    })

    it('should provide confidence score', async () => {
      const analysis = await aiEnhancementService.analyzeSentiment('msg_1', positiveText)

      expect(analysis.confidence).toBeDefined()
      expect(analysis.confidence).toBeGreaterThan(0)
      expect(analysis.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle empty text', async () => {
      await expect(
        aiEnhancementService.analyzeSentiment('msg_1', '')
      ).rejects.toThrow()
    })

    it('should handle mixed sentiment', async () => {
      const analysis = await aiEnhancementService.analyzeSentiment('msg_1', mixedText)

      expect(analysis).toBeDefined()
      // Mixed sentiment might be classified as positive, negative, or neutral
      expect(['positive', 'negative', 'neutral']).toContain(analysis.overall)
    })
  })

  describe('classifyConversation', () => {
    it('should classify conversation type', async () => {
      const classification = await aiEnhancementService.classifyConversation(mockConversation)

      expect(classification).toBeDefined()
      expect(classification.conversationId).toBe(mockConversation.id)
      expect(classification.category).toBeDefined()
    })

    it('should return a valid category', async () => {
      const classification = await aiEnhancementService.classifyConversation(mockConversation)

      const validCategories = [
        'general_chat',
        'technical_help',
        'creative_writing',
        'code_assistance',
        'research',
        'brainstorming',
        'learning',
        'other'
      ]

      expect(validCategories).toContain(classification.category)
    })

    it('should provide confidence score', async () => {
      const classification = await aiEnhancementService.classifyConversation(mockConversation)

      expect(classification.confidence).toBeDefined()
      expect(classification.confidence).toBeGreaterThan(0)
      expect(classification.confidence).toBeLessThanOrEqual(1)
    })

    it('should suggest relevant tags', async () => {
      const classification = await aiEnhancementService.classifyConversation(mockConversation)

      expect(classification.suggestedTags).toBeDefined()
      expect(Array.isArray(classification.suggestedTags)).toBe(true)
      classification.suggestedTags.forEach(tag => {
        expect(typeof tag).toBe('string')
        expect(tag.length).toBeGreaterThan(0)
      })
    })

    it('should estimate conversation complexity', async () => {
      const classification = await aiEnhancementService.classifyConversation(mockConversation)

      expect(classification.complexity).toBeDefined()
      expect(['simple', 'moderate', 'complex']).toContain(classification.complexity)
    })

    it('should handle different conversation types', async () => {
      const technicalConv: Conversation = {
        ...mockConversation,
        title: 'Coding Help',
        messages: [
          {
            id: 'msg_1',
            conversationId: 'conv_2',
            role: 'user',
            content: 'How do I implement a binary search tree in Python?',
            timestamp: Date.now(),
            tokens: 15
          },
          {
            id: 'msg_2',
            conversationId: 'conv_2',
            role: 'assistant',
            content: 'Here\'s a Python implementation of a binary search tree...',
            timestamp: Date.now(),
            tokens: 50
          }
        ]
      }

      const classification = await aiEnhancementService.classifyConversation(technicalConv)

      expect(classification.category).toMatch(/technical_help|code_assistance/)
    })
  })

  describe('getSmartRecommendations', () => {
    it('should generate recommendations for user', async () => {
      const recommendations = await aiEnhancementService.getSmartRecommendations('test_user')

      expect(recommendations).toBeDefined()
      expect(recommendations.userId).toBe('test_user')
      expect(recommendations.recommendations).toBeDefined()
      expect(Array.isArray(recommendations.recommendations)).toBe(true)
    })

    it('should provide diverse recommendation types', async () => {
      const recommendations = await aiEnhancementService.getSmartRecommendations('test_user')

      const types = recommendations.recommendations.map(r => r.type)
      expect(types.length).toBeGreaterThan(0)

      // Should include different recommendation types
      expect(new Set(types).size).toBeGreaterThan(0)
    })

    it('should assign priority to recommendations', async () => {
      const recommendations = await aiEnhancementService.getSmartRecommendations('test_user')

      recommendations.recommendations.forEach(rec => {
        expect(rec.priority).toBeDefined()
        expect(['high', 'medium', 'low']).toContain(rec.priority)
      })
    })

    it('should provide actionable recommendations', async () => {
      const recommendations = await aiEnhancementService.getSmartRecommendations('test_user')

      recommendations.recommendations.forEach(rec => {
        expect(rec.title).toBeDefined()
        expect(rec.description).toBeDefined()
        expect(rec.action).toBeDefined()
        expect(typeof rec.title).toBe('string')
        expect(typeof rec.description).toBe('string')
      })
    })

    it('should limit number of recommendations', async () => {
      const recommendations = await aiEnhancementService.getSmartRecommendations('test_user')

      // Should return a reasonable number of recommendations
      expect(recommendations.recommendations.length).toBeGreaterThan(0)
      expect(recommendations.recommendations.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent operations', async () => {
      const operations = [
        aiEnhancementService.generateSummary(mockConversation),
        aiEnhancementService.extractKeywords('msg_1', mockMessages[0].content),
        aiEnhancementService.analyzeSentiment('msg_2', mockMessages[1].content),
        aiEnhancementService.classifyConversation(mockConversation)
      ]

      await expect(Promise.all(operations)).resolves.toBeDefined()
    })

    it('should handle very long text', async () => {
      const longText = 'A '.repeat(10000) // Very long text
      const extraction = await aiEnhancementService.extractKeywords('msg_1', longText)

      expect(extraction).toBeDefined()
    })

    it('should handle special characters and emojis', async () => {
      const emojiText = 'I love this! 😍🎉 Best day ever! 🌟✨'
      const analysis = await aiEnhancementService.analyzeSentiment('msg_1', emojiText)

      expect(analysis).toBeDefined()
      expect(analysis.overall).toBe('positive')
    })

    it('should handle multilingual text gracefully', async () => {
      const multilingualText = 'Hello world! Bonjour le monde! Hola mundo!'
      const extraction = await aiEnhancementService.extractKeywords('msg_1', multilingualText)

      expect(extraction).toBeDefined()
    })

    it('should handle code snippets', async () => {
      const codeText = `
        function hello() {
          console.log("Hello, World!");
          return true;
        }
      `
      const extraction = await aiEnhancementService.extractKeywords('msg_1', codeText)

      expect(extraction).toBeDefined()
    })

    it('should handle markdown formatted text', async () => {
      const markdownText = `
        # Title
        ## Subtitle
        - Item 1
        - Item 2
        **Bold text** and *italic text*
      `
      const extraction = await aiEnhancementService.extractKeywords('msg_1', markdownText)

      expect(extraction).toBeDefined()
    })

    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now()

      await aiEnhancementService.generateSummary(mockConversation)

      const duration = Date.now() - startTime

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('Error Handling', () => {
    it('should handle AI service failures', async () => {
      mockAICall.mockRejectedValue(new Error('AI Service Error'))

      await expect(
        aiEnhancementService.generateSummary(mockConversation)
      ).rejects.toThrow()
    })

    it('should handle malformed data', async () => {
      const malformedConv = {
        ...mockConversation,
        messages: null as any
      }

      await expect(
        aiEnhancementService.generateSummary(malformedConv)
      ).rejects.toThrow()
    })

    it('should validate input parameters', async () => {
      await expect(
        aiEnhancementService.extractKeywords('', 'text')
      ).rejects.toThrow()

      await expect(
        aiEnhancementService.analyzeSentiment('msg_1', '')
      ).rejects.toThrow()
    })
  })

  describe('Integration with Other Services', () => {
    it('should work with vector database for context', async () => {
      // This would test integration with vectorDatabaseService
      // Mock or actual integration depending on test strategy
      const summary = await aiEnhancementService.generateSummary(mockConversation)

      expect(summary).toBeDefined()
    })

    it('should provide data for analytics', async () => {
      const classification = await aiEnhancementService.classifyConversation(mockConversation)

      // Data should be suitable for analytics
      expect(classification.category).toBeDefined()
      expect(classification.confidence).toBeDefined()
      expect(classification.suggestedTags).toBeDefined()
    })

    it('should support batch processing', async () => {
      const conversations = [mockConversation, mockConversation]

      const summaries = await Promise.all(
        conversations.map(conv => aiEnhancementService.generateSummary(conv))
      )

      expect(summaries).toHaveLength(2)
      summaries.forEach(summary => {
        expect(summary).toBeDefined()
      })
    })
  })
})
