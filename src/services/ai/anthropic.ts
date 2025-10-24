/**
 * Anthropic Claude API 服务
 * 实现 Claude 系列模型的调用
 */

import { env } from '@/config/env'

export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AnthropicRequest {
  model: string
  messages: AnthropicMessage[]
  max_tokens: number
  temperature?: number
  top_p?: number
  top_k?: number
  stream?: boolean
  system?: string
}

export interface AnthropicResponse {
  id: string
  type: 'message'
  role: 'assistant'
  content: Array<{
    type: 'text'
    text: string
  }>
  model: string
  stop_reason: string | null
  stop_sequence: string | null
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export interface AnthropicStreamEvent {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop'
  message?: Partial<AnthropicResponse>
  content_block?: any
  delta?: {
    type: 'text_delta'
    text: string
  }
  index?: number
  usage?: {
    output_tokens: number
  }
}

/**
 * Anthropic API 客户端
 */
export class AnthropicService {
  private apiKey: string
  private apiBase: string
  private apiVersion = '2023-06-01'

  constructor(
    apiKey?: string,
    apiBase?: string
  ) {
    this.apiKey = apiKey || env.anthropic.apiKey
    this.apiBase = apiBase || env.anthropic.apiBase

    if (!this.apiKey) {
      throw new Error('Anthropic API key is required')
    }
  }

  /**
   * 发送聊天请求 (非流式)
   */
  async chat(request: AnthropicRequest): Promise<AnthropicResponse> {
    const response = await fetch(`${this.apiBase}/v1/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        stream: false
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `Anthropic API error: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 发送聊天请求 (流式)
   */
  async *chatStream(request: AnthropicRequest): AsyncGenerator<AnthropicStreamEvent> {
    const response = await fetch(`${this.apiBase}/v1/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `Anthropic API error: ${response.statusText}`)
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
          if (!trimmed) continue

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
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': this.apiVersion
    }
  }
}

/**
 * 默认 Anthropic 服务实例
 */
export const anthropic = new AnthropicService()
