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

// 缓存配置
interface CacheConfig {
  enabled: boolean
  ttl: number // 缓存生存时间（毫秒）
  maxSize: number // 最大缓存条目数
}

// 重试配置
interface RetryConfig {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
}

// 缓存条目
interface CacheEntry {
  content: string
  tokens?: number
  timestamp: number
}

// 默认配置
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttl: 5 * 60 * 1000, // 5分钟
  maxSize: 100
}

// 指数退避重试函数
async function retryWithBackoff<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  config: RetryConfig = {},
  signal?: AbortSignal
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2
  } = config

  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      // 检查是否已取消
      if (signal?.aborted) {
        throw new Error('Request cancelled')
      }

      return await fn(signal)
    } catch (error: any) {
      lastError = error

      // 如果是取消请求,直接抛出
      if (error.name === 'AbortError' || error.message === 'Request cancelled') {
        throw error
      }

      // 最后一次重试失败,抛出错误
      if (i === maxRetries - 1) {
        throw error
      }

      // 计算延迟时间(指数退避)
      const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, i), maxDelay)

      console.log(`Request failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`, error)

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

export class AIApiServiceEnhanced {
  private provider: APIProvider
  private abortController: AbortController | null = null
  private cache: Map<string, CacheEntry> = new Map()
  private cacheConfig: CacheConfig
  private pendingRequests: Map<string, Promise<any>> = new Map()

  // 性能统计
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    retries: 0,
    failures: 0,
    totalResponseTime: 0
  }

  constructor(provider: APIProvider, cacheConfig?: Partial<CacheConfig>) {
    this.provider = provider
    this.cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig }

    // 定期清理过期缓存
    this.startCacheCleanup()
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(messages: Message[], config: ChatConfig): string {
    const messageHash = messages
      .map(m => `${m.role}:${m.content}`)
      .join('|')

    const configHash = `${config.model}:${config.temperature}:${config.maxTokens}:${config.systemPrompt || ''}`

    return `${messageHash}::${configHash}`
  }

  /**
   * 从缓存获取结果
   */
  private getFromCache(key: string): CacheEntry | null {
    if (!this.cacheConfig.enabled) return null

    const entry = this.cache.get(key)
    if (!entry) return null

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.cacheConfig.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry
  }

  /**
   * 保存到缓存
   */
  private saveToCache(key: string, content: string, tokens?: number): void {
    if (!this.cacheConfig.enabled) return

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.cacheConfig.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      content,
      tokens,
      timestamp: Date.now()
    })
  }

  /**
   * 定期清理过期缓存
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.cacheConfig.ttl) {
          this.cache.delete(key)
        }
      }
    }, 60000) // 每分钟清理一次
  }

  async sendMessage(
    messages: Message[],
    config: ChatConfig,
    onStream?: (chunk: string) => void
  ): Promise<{ content: string; tokens?: number }> {
    const startTime = Date.now()
    this.stats.totalRequests++

    // 流式请求不使用缓存
    if (config.stream && onStream) {
      return this.executeFetch(messages, config, onStream)
    }

    // 生成缓存键
    const cacheKey = this.generateCacheKey(messages, config)

    // 检查缓存
    const cachedResult = this.getFromCache(cacheKey)
    if (cachedResult) {
      this.stats.cacheHits++
      console.log('✓ Cache hit', { key: cacheKey.substring(0, 50) + '...' })
      return {
        content: cachedResult.content,
        tokens: cachedResult.tokens
      }
    }

    this.stats.cacheMisses++

    // 检查是否有相同的请求正在进行（请求去重）
    const pendingRequest = this.pendingRequests.get(cacheKey)
    if (pendingRequest) {
      console.log('⚡ Request deduplication', { key: cacheKey.substring(0, 50) + '...' })
      return pendingRequest
    }

    // 执行请求
    const requestPromise = this.executeFetch(messages, config).then(result => {
      // 保存到缓存
      this.saveToCache(cacheKey, result.content, result.tokens)

      // 更新统计
      const responseTime = Date.now() - startTime
      this.stats.totalResponseTime += responseTime

      // 清除pending请求
      this.pendingRequests.delete(cacheKey)

      return result
    }).catch(error => {
      this.stats.failures++
      this.pendingRequests.delete(cacheKey)
      throw error
    })

    // 保存pending请求
    this.pendingRequests.set(cacheKey, requestPromise)

    return requestPromise
  }

  private async executeFetch(
    messages: Message[],
    config: ChatConfig,
    onStream?: (chunk: string) => void
  ): Promise<{ content: string; tokens?: number }> {
    // 创建新的 AbortController
    this.abortController = new AbortController()

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
      headers['Authorization'] = `Bearer ${this.provider.apiKey}`
    }

    try {
      // 使用重试机制
      return await retryWithBackoff(
        async (signal) => {
          const response = await fetch(`${this.provider.baseURL}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: signal || this.abortController?.signal
          })

          if (!response.ok) {
            const error = await response.text()
            throw new Error(`API Error (${response.status}): ${error}`)
          }

          if (config.stream && onStream) {
            return this.handleStreamResponse(response, onStream, signal)
          } else {
            return this.handleSingleResponse(response)
          }
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2
        },
        this.abortController.signal
      )
    } catch (error: any) {
      console.error('AI API Error:', error)

      // 提供更友好的错误消息
      if (error.name === 'AbortError' || error.message === 'Request cancelled') {
        throw new Error('请求已取消')
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败,请检查网络设置')
      } else if (error.message.includes('401')) {
        throw new Error('API密钥无效,请检查配置')
      } else if (error.message.includes('429')) {
        throw new Error('请求过于频繁,请稍后再试')
      } else if (error.message.includes('500')) {
        throw new Error('服务器错误,请稍后再试')
      }

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
    onStream: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<{ content: string; tokens?: number }> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response stream')
    }

    let fullContent = ''
    const decoder = new TextDecoder()

    try {
      while (true) {
        // 检查是否已取消
        if (signal?.aborted) {
          reader.cancel()
          throw new Error('Request cancelled')
        }

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

  // 取消当前请求
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ Cache cleared')
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    const hitRate = this.stats.totalRequests > 0
      ? (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(2) + '%'
      : '0%'

    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxSize,
      hitRate,
      hits: this.stats.cacheHits,
      misses: this.stats.cacheMisses
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const avgResponseTime = this.stats.totalRequests > 0
      ? Math.round(this.stats.totalResponseTime / this.stats.totalRequests)
      : 0

    const successRate = this.stats.totalRequests > 0
      ? ((this.stats.totalRequests - this.stats.failures) / this.stats.totalRequests * 100).toFixed(2) + '%'
      : '100%'

    return {
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      retries: this.stats.retries,
      failures: this.stats.failures,
      avgResponseTime: avgResponseTime + 'ms',
      successRate,
      ...this.getCacheStats()
    }
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      retries: 0,
      failures: 0,
      totalResponseTime: 0
    }
    console.log('📊 Stats reset')
  }

  /**
   * 配置缓存
   */
  configureCaching(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config }
    if (!config.enabled) {
      this.clearCache()
    }
    console.log('⚙️ Cache configured', this.cacheConfig)
  }

  // Test API connection with timeout
  async testConnection(timeout = 10000): Promise<boolean> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

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

      await retryWithBackoff(
        async (signal) => {
          const response = await fetch(`${this.provider.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.provider.apiKey}`
            },
            body: JSON.stringify({
              model: config.model,
              messages: testMessages.map(m => ({ role: m.role, content: m.content })),
              temperature: config.temperature,
              max_tokens: config.maxTokens
            }),
            signal: signal || controller.signal
          })

          if (!response.ok) {
            throw new Error(`Connection test failed: ${response.status}`)
          }

          return response.json()
        },
        { maxRetries: 2, initialDelay: 500 },
        controller.signal
      )

      clearTimeout(timeoutId)
      return true
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('Connection test failed:', error)
      return false
    }
  }
}

// Factory function to create AI service based on provider
export function createAIServiceEnhanced(
  provider: APIProvider,
  cacheConfig?: Partial<CacheConfig>
): AIApiServiceEnhanced {
  return new AIApiServiceEnhanced(provider, cacheConfig)
}

// Export types
export type { CacheConfig }

// Default providers configuration
export const DEFAULT_PROVIDERS: APIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    apiKey: '',
    isEnabled: false,
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        maxTokens: 8192,
        description: '最强大的模型,适用于复杂任务',
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
