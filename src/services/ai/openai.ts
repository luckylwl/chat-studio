/**
 * OpenAI API 服务
 * 实现 GPT 系列模型的调用
 */

import { env } from '@/config/env'

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIRequest {
  model: string
  messages: OpenAIMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface OpenAIResponse {
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

export interface OpenAIStreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

/**
 * OpenAI API 客户端
 */
export class OpenAIService {
  private apiKey: string
  private apiBase: string
  private orgId?: string

  constructor(
    apiKey?: string,
    apiBase?: string,
    orgId?: string
  ) {
    this.apiKey = apiKey || env.openai.apiKey
    this.apiBase = apiBase || env.openai.apiBase
    this.orgId = orgId || env.openai.orgId

    if (!this.apiKey) {
      throw new Error('OpenAI API key is required')
    }
  }

  /**
   * 发送聊天请求 (非流式)
   */
  async chat(request: OpenAIRequest): Promise<OpenAIResponse> {
    const response = await fetch(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        stream: false
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 发送聊天请求 (流式)
   */
  async *chatStream(request: OpenAIRequest): AsyncGenerator<OpenAIStreamChunk> {
    const response = await fetch(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6))
              yield data
            } catch (e) {
              console.error('Failed to parse SSE data:', trimmed, e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * 获取可用模型列表
   */
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.apiBase}/models`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
      .filter((model: any) => model.id.includes('gpt'))
      .map((model: any) => model.id)
      .sort()
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    }

    if (this.orgId) {
      headers['OpenAI-Organization'] = this.orgId
    }

    return headers
  }
}

/**
 * 默认 OpenAI 服务实例
 */
export const openai = new OpenAIService()
