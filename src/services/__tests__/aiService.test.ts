import { aiService } from '../aiService'
import { mockApiResponses, mockNetworkRequest, mockNetworkError } from '@/utils/testUtils'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('API Key Management', () => {
    it('sets and gets API keys correctly', () => {
      aiService.setApiKey('openai', 'test-openai-key')
      aiService.setApiKey('anthropic', 'test-anthropic-key')

      expect(aiService.getApiKey('openai')).toBe('test-openai-key')
      expect(aiService.getApiKey('anthropic')).toBe('test-anthropic-key')
    })

    it('validates API keys before making requests', async () => {
      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }

      // Should throw error when no API key is set
      await expect(aiService.sendMessage(message, 'gpt-3.5-turbo')).rejects.toThrow('API key not found')
    })

    it('persists API keys in localStorage', () => {
      aiService.setApiKey('openai', 'persistent-key')

      // Create new instance to test persistence
      const newService = new (aiService.constructor as any)()
      expect(newService.getApiKey('openai')).toBe('persistent-key')
    })
  })

  describe('Message Sending', () => {
    beforeEach(() => {
      aiService.setApiKey('openai', 'test-key')
    })

    it('sends messages successfully', async () => {
      const mockResponse = mockApiResponses.chat.success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response)

      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello, AI!',
        timestamp: Date.now()
      }

      const response = await aiService.sendMessage(message, 'gpt-3.5-turbo')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('openai.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          })
        })
      )

      expect(response.content).toBe(mockResponse.choices[0].message.content)
    })

    it('handles API errors gracefully', async () => {
      const mockError = mockApiResponses.chat.error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockError
      } as Response)

      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }

      await expect(aiService.sendMessage(message, 'gpt-3.5-turbo')).rejects.toThrow('Invalid API key')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }

      await expect(aiService.sendMessage(message, 'gpt-3.5-turbo')).rejects.toThrow('Network error')
    })

    it('supports different AI providers', async () => {
      aiService.setApiKey('anthropic', 'anthropic-key')

      const mockResponse = {
        id: 'msg_123',
        type: 'message',
        content: [{ type: 'text', text: 'Hello from Claude!' }],
        model: 'claude-3-haiku',
        usage: { input_tokens: 10, output_tokens: 15 }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response)

      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }

      const response = await aiService.sendMessage(message, 'claude-3-haiku')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('anthropic.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'anthropic-key'
          })
        })
      )

      expect(response.content).toBe('Hello from Claude!')
    })

    it('respects rate limiting', async () => {
      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }

      // Mock rate limit response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } })
      } as Response)

      await expect(aiService.sendMessage(message, 'gpt-3.5-turbo')).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('Streaming Support', () => {
    beforeEach(() => {
      aiService.setApiKey('openai', 'test-key')
    })

    it('handles streaming responses', async () => {
      const mockStreamData = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" there"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
        'data: [DONE]\n\n'
      ]

      const mockStream = new ReadableStream({
        start(controller) {
          mockStreamData.forEach(chunk => {
            controller.enqueue(new TextEncoder().encode(chunk))
          })
          controller.close()
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStream
      } as Response)

      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }

      const chunks: string[] = []
      const onChunk = (chunk: string) => chunks.push(chunk)

      await aiService.sendStreamingMessage(message, 'gpt-3.5-turbo', onChunk)

      expect(chunks).toEqual(['Hello', ' there', '!'])
    })
  })

  describe('Model Management', () => {
    it('lists available models', () => {
      const models = aiService.getAvailableModels()

      expect(models).toContain('gpt-3.5-turbo')
      expect(models).toContain('gpt-4')
      expect(models).toContain('claude-3-haiku')
      expect(models).toContain('claude-3-sonnet')
    })

    it('validates model names', () => {
      expect(aiService.isModelSupported('gpt-3.5-turbo')).toBe(true)
      expect(aiService.isModelSupported('invalid-model')).toBe(false)
    })

    it('gets model provider correctly', () => {
      expect(aiService.getModelProvider('gpt-3.5-turbo')).toBe('openai')
      expect(aiService.getModelProvider('claude-3-haiku')).toBe('anthropic')
      expect(aiService.getModelProvider('gemini-pro')).toBe('google')
    })
  })

  describe('Conversation Context', () => {
    beforeEach(() => {
      aiService.setApiKey('openai', 'test-key')
    })

    it('maintains conversation history', async () => {
      const mockResponse = mockApiResponses.chat.success
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response)

      const messages = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          role: 'user' as const,
          content: 'Hello',
          timestamp: Date.now()
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          role: 'assistant' as const,
          content: 'Hi there!',
          timestamp: Date.now()
        },
        {
          id: 'msg-3',
          conversationId: 'conv-1',
          role: 'user' as const,
          content: 'How are you?',
          timestamp: Date.now()
        }
      ]

      await aiService.sendMessageWithContext(messages, 'gpt-3.5-turbo')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"messages":[')
        })
      )

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body)
      expect(callBody.messages).toHaveLength(3)
    })

    it('applies system prompts correctly', async () => {
      const mockResponse = mockApiResponses.chat.success
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response)

      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }

      const settings = {
        systemPrompt: 'You are a helpful assistant.',
        temperature: 0.7,
        maxTokens: 1000
      }

      await aiService.sendMessage(message, 'gpt-3.5-turbo', settings)

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body)
      expect(callBody.messages[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant.'
      })
    })
  })

  describe('Error Recovery', () => {
    beforeEach(() => {
      aiService.setApiKey('openai', 'test-key')
    })

    it('retries failed requests', async () => {
      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }

      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApiResponses.chat.success
      } as Response)

      const response = await aiService.sendMessage(message, 'gpt-3.5-turbo')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(response.content).toBe(mockApiResponses.chat.success.choices[0].message.content)
    })

    it('gives up after max retries', async () => {
      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }

      // All calls fail
      mockFetch.mockRejectedValue(new Error('Persistent network error'))

      await expect(aiService.sendMessage(message, 'gpt-3.5-turbo')).rejects.toThrow('Persistent network error')

      expect(mockFetch).toHaveBeenCalledTimes(3) // Original + 2 retries
    })
  })

  describe('Performance', () => {
    beforeEach(() => {
      aiService.setApiKey('openai', 'test-key')
    })

    it('caches model information', () => {
      const models1 = aiService.getAvailableModels()
      const models2 = aiService.getAvailableModels()

      expect(models1).toBe(models2) // Should return same reference for cached result
    })

    it('batches concurrent requests appropriately', async () => {
      const mockResponse = mockApiResponses.chat.success
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response)

      const message1 = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello 1',
        timestamp: Date.now()
      }

      const message2 = {
        id: 'test-2',
        conversationId: 'conv-2',
        role: 'user' as const,
        content: 'Hello 2',
        timestamp: Date.now()
      }

      // Send multiple messages concurrently
      const promises = [
        aiService.sendMessage(message1, 'gpt-3.5-turbo'),
        aiService.sendMessage(message2, 'gpt-3.5-turbo')
      ]

      await Promise.all(promises)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Security', () => {
    it('sanitizes input to prevent injection attacks', async () => {
      aiService.setApiKey('openai', 'test-key')

      const mockResponse = mockApiResponses.chat.success
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response)

      const maliciousMessage = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: '"><script>alert("XSS")</script>',
        timestamp: Date.now()
      }

      await aiService.sendMessage(maliciousMessage, 'gpt-3.5-turbo')

      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body)
      // Should not contain script tags or other malicious content in processed form
      expect(callBody.messages[0].content).not.toContain('<script>')
    })

    it('validates API responses', async () => {
      aiService.setApiKey('openai', 'test-key')

      // Mock malformed response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'response' })
      } as Response)

      const message = {
        id: 'test-1',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: Date.now()
      }

      await expect(aiService.sendMessage(message, 'gpt-3.5-turbo')).rejects.toThrow()
    })

    it('does not log sensitive information', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      aiService.setApiKey('openai', 'secret-key-123')

      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('secret-key-123'))

      consoleSpy.mockRestore()
    })
  })
})