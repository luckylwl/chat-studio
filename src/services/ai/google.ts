/**
 * Google Gemini API 服务
 * 实现 Gemini 系列模型的调用
 */

import { env } from '@/config/env'

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{
    text: string
  }>
}

export interface GeminiRequest {
  contents: GeminiMessage[]
  generationConfig?: {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
    stopSequences?: string[]
  }
  safetySettings?: Array<{
    category: string
    threshold: string
  }>
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
      role: string
    }
    finishReason: string
    index: number
    safetyRatings: Array<{
      category: string
      probability: string
    }>
  }>
  promptFeedback?: {
    safetyRatings: Array<{
      category: string
      probability: string
    }>
  }
}

export interface GeminiStreamChunk {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
      role: string
    }
    finishReason?: string
    index: number
    safetyRatings: Array<{
      category: string
      probability: string
    }>
  }>
}

/**
 * Google Gemini API 客户端
 */
export class GoogleService {
  private apiKey: string
  private apiBase: string

  constructor(
    apiKey?: string,
    apiBase?: string
  ) {
    this.apiKey = apiKey || env.google.apiKey
    this.apiBase = apiBase || env.google.apiBase

    if (!this.apiKey) {
      throw new Error('Google API key is required')
    }
  }

  /**
   * 发送聊天请求 (非流式)
   */
  async chat(model: string, request: GeminiRequest): Promise<GeminiResponse> {
    const url = `${this.apiBase}/v1/models/${model}:generateContent?key=${this.apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `Google API error: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 发送聊天请求 (流式)
   */
  async *chatStream(model: string, request: GeminiRequest): AsyncGenerator<GeminiStreamChunk> {
    const url = `${this.apiBase}/v1/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `Google API error: ${response.statusText}`)
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
    const url = `${this.apiBase}/v1/models?key=${this.apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const data = await response.json()
    return data.models
      .filter((model: any) => model.name.includes('gemini'))
      .map((model: any) => model.name.split('/').pop())
      .sort()
  }
}

/**
 * 默认 Google 服务实例
 */
export const google = new GoogleService()
