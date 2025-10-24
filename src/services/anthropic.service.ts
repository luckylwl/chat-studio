/**
 * Anthropic Claude API Service
 * Handles all interactions with Anthropic's Claude API
 */

export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AnthropicCompletionRequest {
  model: string
  messages: AnthropicMessage[]
  max_tokens: number
  temperature?: number
  top_p?: number
  top_k?: number
  stop_sequences?: string[]
  stream?: boolean
  system?: string
}

export interface AnthropicCompletionResponse {
  id: string
  type: string
  role: string
  content: Array<{
    type: string
    text: string
  }>
  model: string
  stop_reason: string
  stop_sequence: string | null
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export class AnthropicService {
  private apiKey: string
  private baseURL: string
  private anthropicVersion: string

  constructor(apiKey: string, baseURL?: string, version?: string) {
    this.apiKey = apiKey
    this.baseURL = baseURL || 'https://api.anthropic.com'
    this.anthropicVersion = version || '2023-06-01'
  }

  /**
   * Create a message completion
   */
  async createMessage(
    request: AnthropicCompletionRequest
  ): Promise<AnthropicCompletionResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': this.anthropicVersion,
    }

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        `Anthropic API Error (${response.status}): ${error.error?.message || 'Unknown error'}`
      )
    }

    return response.json()
  }

  /**
   * Create a streaming message completion
   */
  async createStreamingMessage(
    request: AnthropicCompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': this.anthropicVersion,
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...request, stream: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          `Anthropic API Error (${response.status}): ${error.error?.message || 'Unknown error'}`
        )
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          onComplete?.()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6))

              if (data.type === 'content_block_delta') {
                const text = data.delta?.text
                if (text) {
                  onChunk(text)
                }
              }

              if (data.type === 'message_stop') {
                onComplete?.()
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      onError?.(error as Error)
      throw error
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.createMessage({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get recommended models
   */
  getRecommendedModels(): string[] {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2',
    ]
  }

  /**
   * Get model information
   */
  getModelInfo(model: string) {
    const modelInfo: Record<string, { maxTokens: number; contextWindow: number }> = {
      'claude-3-opus-20240229': { maxTokens: 4096, contextWindow: 200000 },
      'claude-3-sonnet-20240229': { maxTokens: 4096, contextWindow: 200000 },
      'claude-3-haiku-20240307': { maxTokens: 4096, contextWindow: 200000 },
      'claude-2.1': { maxTokens: 4096, contextWindow: 200000 },
      'claude-2.0': { maxTokens: 4096, contextWindow: 100000 },
      'claude-instant-1.2': { maxTokens: 4096, contextWindow: 100000 },
    }

    return modelInfo[model] || modelInfo['claude-3-haiku-20240307']
  }

  /**
   * Estimate token count (approximate)
   */
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 3.5 characters for Claude
    return Math.ceil(text.length / 3.5)
  }

  /**
   * Calculate cost (approximate, in USD)
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 15 / 1000000, output: 75 / 1000000 },
      'claude-3-sonnet-20240229': { input: 3 / 1000000, output: 15 / 1000000 },
      'claude-3-haiku-20240307': { input: 0.25 / 1000000, output: 1.25 / 1000000 },
      'claude-2.1': { input: 8 / 1000000, output: 24 / 1000000 },
      'claude-2.0': { input: 8 / 1000000, output: 24 / 1000000 },
      'claude-instant-1.2': { input: 0.8 / 1000000, output: 2.4 / 1000000 },
    }

    const modelPricing = pricing[model] || pricing['claude-3-haiku-20240307']
    return inputTokens * modelPricing.input + outputTokens * modelPricing.output
  }
}

// Singleton instance
let anthropicInstance: AnthropicService | null = null

export const getAnthropicService = (
  apiKey?: string,
  baseURL?: string,
  version?: string
): AnthropicService => {
  if (!anthropicInstance || apiKey) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required')
    }
    anthropicInstance = new AnthropicService(apiKey, baseURL, version)
  }
  return anthropicInstance
}

export default AnthropicService
