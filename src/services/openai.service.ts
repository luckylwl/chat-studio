/**
 * OpenAI API Service
 * Handles all interactions with OpenAI's API
 */

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAICompletionRequest {
  model: string
  messages: OpenAIMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stream?: boolean
}

export interface OpenAICompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenAIService {
  private apiKey: string
  private baseURL: string
  private organizationId?: string

  constructor(apiKey: string, baseURL?: string, organizationId?: string) {
    this.apiKey = apiKey
    this.baseURL = baseURL || 'https://api.openai.com/v1'
    this.organizationId = organizationId
  }

  /**
   * Create a chat completion
   */
  async createChatCompletion(
    request: OpenAICompletionRequest
  ): Promise<OpenAICompletionResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }

    if (this.organizationId) {
      headers['OpenAI-Organization'] = this.organizationId
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        `OpenAI API Error (${response.status}): ${error.error?.message || 'Unknown error'}`
      )
    }

    return response.json()
  }

  /**
   * Create a streaming chat completion
   */
  async createStreamingChatCompletion(
    request: OpenAICompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }

    if (this.organizationId) {
      headers['OpenAI-Organization'] = this.organizationId
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...request, stream: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          `OpenAI API Error (${response.status}): ${error.error?.message || 'Unknown error'}`
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
          if (!trimmed || trimmed === 'data: [DONE]') continue

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6))
              const content = data.choices[0]?.delta?.content

              if (content) {
                onChunk(content)
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
   * List available models
   */
  async listModels(): Promise<string[]> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    }

    if (this.organizationId) {
      headers['OpenAI-Organization'] = this.organizationId
    }

    const response = await fetch(`${this.baseURL}/models`, {
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data.map((model: any) => model.id)
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.listModels()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get recommended models for chat
   */
  getRecommendedModels(): string[] {
    return [
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-4-32k',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ]
  }

  /**
   * Estimate token count (approximate)
   */
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Calculate cost (approximate, in USD)
   */
  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4-turbo-preview': { prompt: 0.01 / 1000, completion: 0.03 / 1000 },
      'gpt-4': { prompt: 0.03 / 1000, completion: 0.06 / 1000 },
      'gpt-4-32k': { prompt: 0.06 / 1000, completion: 0.12 / 1000 },
      'gpt-3.5-turbo': { prompt: 0.0005 / 1000, completion: 0.0015 / 1000 },
      'gpt-3.5-turbo-16k': { prompt: 0.003 / 1000, completion: 0.004 / 1000 },
    }

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo']
    return (
      promptTokens * modelPricing.prompt +
      completionTokens * modelPricing.completion
    )
  }
}

// Singleton instance
let openAIInstance: OpenAIService | null = null

export const getOpenAIService = (
  apiKey?: string,
  baseURL?: string,
  organizationId?: string
): OpenAIService => {
  if (!openAIInstance || apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required')
    }
    openAIInstance = new OpenAIService(apiKey, baseURL, organizationId)
  }
  return openAIInstance
}

export default OpenAIService
