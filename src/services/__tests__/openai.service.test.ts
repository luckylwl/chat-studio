import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIService } from '../openai.service'

// Mock fetch
global.fetch = vi.fn()

describe('OpenAIService', () => {
  let service: OpenAIService

  beforeEach(() => {
    service = new OpenAIService('test-api-key')
    vi.clearAllMocks()
  })

  describe('createChatCompletion', () => {
    it('makes successful API call', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25,
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await service.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      })

      expect(result.choices[0].message.content).toBe('Hello! How can I help you?')
      expect(result.usage.total_tokens).toBe(25)
    })

    it('handles API errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid API key',
            type: 'invalid_request_error',
          },
        }),
      })

      await expect(
        service.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('Invalid API key')
    })

    it('handles rate limit errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error',
          },
        }),
      })

      await expect(
        service.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('Rate limit exceeded')
    })

    it('includes temperature and max_tokens', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [{ message: { role: 'assistant', content: 'Test' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await service.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.7,
        max_tokens: 500,
      })

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.temperature).toBe(0.7)
      expect(requestBody.max_tokens).toBe(500)
    })
  })

  describe('estimateTokens', () => {
    it('estimates tokens correctly', () => {
      const text = 'Hello, how are you doing today?'
      const tokens = service.estimateTokens(text)

      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(20)
    })

    it('handles empty string', () => {
      const tokens = service.estimateTokens('')
      expect(tokens).toBe(0)
    })

    it('handles long text', () => {
      const longText = 'word '.repeat(1000)
      const tokens = service.estimateTokens(longText)

      expect(tokens).toBeGreaterThan(1000)
    })
  })

  describe('calculateCost', () => {
    it('calculates GPT-3.5 cost correctly', () => {
      const cost = service.calculateCost('gpt-3.5-turbo', 1000, 500)

      expect(cost).toBeGreaterThan(0)
      expect(cost).toBeLessThan(0.01)
    })

    it('calculates GPT-4 cost correctly', () => {
      const cost = service.calculateCost('gpt-4', 1000, 500)

      expect(cost).toBeGreaterThan(0)
      expect(cost).toBeGreaterThan(service.calculateCost('gpt-3.5-turbo', 1000, 500))
    })

    it('returns 0 for unknown model', () => {
      const cost = service.calculateCost('unknown-model', 1000, 500)
      expect(cost).toBe(0)
    })
  })
})
