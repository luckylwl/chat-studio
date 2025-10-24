import type { APIProvider, Message, ChatConfig } from '@/types'

export interface ChatCompletionRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface ChatCompletionResponse {
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

export class AIApiService {
  private provider: APIProvider

  constructor(provider: APIProvider) {
    this.provider = provider
  }

  async sendMessage(
    messages: Message[],
    config: ChatConfig,
    onStream?: (chunk: string) => void
  ): Promise<{ content: string; tokens?: number }> {
    const apiMessages = messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content
    }))

    const requestBody: ChatCompletionRequest = {
      model: config.model,
      messages: apiMessages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: config.stream && !!onStream
    }

    if (config.systemPrompt && !apiMessages.some(msg => msg.role === 'system')) {
      requestBody.messages.unshift({
        role: 'system',
        content: config.systemPrompt
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Set authorization header based on provider
    if (this.provider.id === 'anthropic') {
      headers['x-api-key'] = this.provider.apiKey
      headers['anthropic-version'] = '2023-06-01'
    } else if (this.provider.id === 'ollama') {
      // Ollama doesn't require authorization
    } else {
      // Default to OpenAI format (Bearer token) for all other providers
      headers['Authorization'] = `Bearer ${this.provider.apiKey}`
    }

    try {
      const response = await fetch(`${this.provider.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API Error (${response.status}): ${error}`)
      }

      if (config.stream && onStream) {
        return this.handleStreamResponse(response, onStream)
      } else {
        return this.handleSingleResponse(response)
      }
    } catch (error) {
      console.error('AI API Error:', error)
      throw error
    }
  }

  private async handleSingleResponse(response: Response): Promise<{ content: string; tokens?: number }> {
    const data: ChatCompletionResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI model')
    }

    return {
      content: data.choices[0].message.content,
      tokens: data.usage?.total_tokens
    }
  }

  private async handleStreamResponse(
    response: Response,
    onStream: (chunk: string) => void
  ): Promise<{ content: string; tokens?: number }> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response stream')
    }

    let fullContent = ''
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim()

            if (jsonStr === '[DONE]') {
              continue
            }

            try {
              const data = JSON.parse(jsonStr)
              const content = data.choices?.[0]?.delta?.content

              if (content) {
                fullContent += content
                onStream(content)
              }
            } catch (e) {
              // Skip invalid JSON
              continue
            }
          }
        }
      }

      return { content: fullContent }
    } finally {
      reader.releaseLock()
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      const testMessages: Message[] = [{
        id: 'test',
        content: 'Hello',
        role: 'user',
        timestamp: Date.now()
      }]

      const config: ChatConfig = {
        model: this.provider.models[0]?.id || 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 10
      }

      await this.sendMessage(testMessages, config)
      return true
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }
}

// Factory function to create AI service based on provider
export function createAIService(provider: APIProvider): AIApiService {
  return new AIApiService(provider)
}

// Default providers configuration
export const DEFAULT_PROVIDERS: APIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    apiKey: '',
    isEnabled: false, // 默认禁用，需要用户配置API Key后启用
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        maxTokens: 8192,
        description: '最强大的模型，适用于复杂任务',
        pricing: { input: 0.03, output: 0.06 }
      },
      {
        id: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        maxTokens: 128000,
        description: '更大上下文的GPT-4版本',
        pricing: { input: 0.01, output: 0.03 }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        maxTokens: 4096,
        description: '快速且经济的选择',
        pricing: { input: 0.001, output: 0.002 }
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    apiKey: '',
    models: [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        maxTokens: 200000,
        description: 'Anthropic最强大的模型',
        pricing: { input: 0.015, output: 0.075 }
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        maxTokens: 200000,
        description: '平衡性能和成本',
        pricing: { input: 0.003, output: 0.015 }
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        maxTokens: 200000,
        description: '最快最经济的选择',
        pricing: { input: 0.00025, output: 0.00125 }
      }
    ],
    isEnabled: false
  },
  {
    id: 'google',
    name: 'Google AI',
    baseURL: 'https://generativelanguage.googleapis.com/v1',
    apiKey: '',
    models: [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        maxTokens: 32768,
        description: 'Google的多模态AI模型',
        pricing: { input: 0.0005, output: 0.0015 }
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        provider: 'google',
        maxTokens: 16384,
        description: '支持图像输入的Gemini模型',
        pricing: { input: 0.0005, output: 0.0015 }
      }
    ],
    isEnabled: false
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseURL: 'http://localhost:11434/v1',
    apiKey: '',
    models: [
      {
        id: 'llama3.2:3b',
        name: 'Llama 3.2 3B',
        provider: 'ollama',
        maxTokens: 8192,
        description: '本地运行的轻量级模型',
        pricing: { input: 0, output: 0 }
      },
      {
        id: 'llama3.1:8b',
        name: 'Llama 3.1 8B',
        provider: 'ollama',
        maxTokens: 32768,
        description: '本地运行的平衡性能模型',
        pricing: { input: 0, output: 0 }
      },
      {
        id: 'codellama:7b',
        name: 'Code Llama 7B',
        provider: 'ollama',
        maxTokens: 16384,
        description: '本地代码生成专用模型',
        pricing: { input: 0, output: 0 }
      },
      {
        id: 'mistral:7b',
        name: 'Mistral 7B',
        provider: 'ollama',
        maxTokens: 8192,
        description: '本地高性能开源模型',
        pricing: { input: 0, output: 0 }
      }
    ],
    isEnabled: false
  }
]