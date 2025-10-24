/**
 * 统一 AI 服务接口
 * 提供统一的 API 调用接口，支持多个 AI 提供商
 */

import { openai, OpenAIService, type OpenAIMessage } from './openai'
import { anthropic, AnthropicService, type AnthropicMessage } from './anthropic'
import { google, GoogleService, type GeminiMessage } from './google'
import { env } from '@/config/env'

// 统一的消息格式
export interface UnifiedMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// 统一的请求配置
export interface UnifiedChatRequest {
  messages: UnifiedMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

// 统一的响应格式
export interface UnifiedChatResponse {
  content: string
  model: string
  finishReason: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// AI 提供商类型
export type AIProvider = 'openai' | 'anthropic' | 'google'

/**
 * 统一 AI 服务
 */
export class UnifiedAIService {
  private openai: OpenAIService
  private anthropic: AnthropicService
  private google: GoogleService

  constructor() {
    this.openai = openai
    this.anthropic = anthropic
    this.google = google
  }

  /**
   * 发送聊天请求
   */
  async chat(
    provider: AIProvider,
    request: UnifiedChatRequest
  ): Promise<UnifiedChatResponse> {
    switch (provider) {
      case 'openai':
        return this.chatWithOpenAI(request)
      case 'anthropic':
        return this.chatWithAnthropic(request)
      case 'google':
        return this.chatWithGoogle(request)
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  /**
   * 发送流式聊天请求
   */
  async *chatStream(
    provider: AIProvider,
    request: UnifiedChatRequest
  ): AsyncGenerator<string> {
    switch (provider) {
      case 'openai':
        yield* this.chatStreamWithOpenAI(request)
        break
      case 'anthropic':
        yield* this.chatStreamWithAnthropic(request)
        break
      case 'google':
        yield* this.chatStreamWithGoogle(request)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  /**
   * OpenAI 聊天
   */
  private async chatWithOpenAI(request: UnifiedChatRequest): Promise<UnifiedChatResponse> {
    const messages: OpenAIMessage[] = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const response = await this.openai.chat({
      model: request.model || env.openai.defaultModel,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens
    })

    return {
      content: response.choices[0].message.content,
      model: response.model,
      finishReason: response.choices[0].finish_reason,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      }
    }
  }

  /**
   * OpenAI 流式聊天
   */
  private async *chatStreamWithOpenAI(request: UnifiedChatRequest): AsyncGenerator<string> {
    const messages: OpenAIMessage[] = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const stream = this.openai.chatStream({
      model: request.model || env.openai.defaultModel,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }

  /**
   * Anthropic 聊天
   */
  private async chatWithAnthropic(request: UnifiedChatRequest): Promise<UnifiedChatResponse> {
    // 提取 system 消息
    const systemMessage = request.messages.find(m => m.role === 'system')?.content
    const messages: AnthropicMessage[] = request.messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

    const response = await this.anthropic.chat({
      model: request.model || env.anthropic.defaultModel,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      system: systemMessage
    })

    return {
      content: response.content[0].text,
      model: response.model,
      finishReason: response.stop_reason || 'stop',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      }
    }
  }

  /**
   * Anthropic 流式聊天
   */
  private async *chatStreamWithAnthropic(request: UnifiedChatRequest): AsyncGenerator<string> {
    const systemMessage = request.messages.find(m => m.role === 'system')?.content
    const messages: AnthropicMessage[] = request.messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

    const stream = this.anthropic.chatStream({
      model: request.model || env.anthropic.defaultModel,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      system: systemMessage
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        yield event.delta.text
      }
    }
  }

  /**
   * Google 聊天
   */
  private async chatWithGoogle(request: UnifiedChatRequest): Promise<UnifiedChatResponse> {
    const contents: GeminiMessage[] = request.messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

    const response = await this.google.chat(
      request.model || env.google.defaultModel,
      {
        contents,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens
        }
      }
    )

    return {
      content: response.candidates[0].content.parts[0].text,
      model: request.model || env.google.defaultModel,
      finishReason: response.candidates[0].finishReason || 'STOP'
    }
  }

  /**
   * Google 流式聊天
   */
  private async *chatStreamWithGoogle(request: UnifiedChatRequest): AsyncGenerator<string> {
    const contents: GeminiMessage[] = request.messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

    const stream = this.google.chatStream(
      request.model || env.google.defaultModel,
      {
        contents,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens
        }
      }
    )

    for await (const chunk of stream) {
      const content = chunk.candidates[0]?.content.parts[0]?.text
      if (content) {
        yield content
      }
    }
  }

  /**
   * 获取可用模型列表
   */
  async listModels(provider: AIProvider): Promise<string[]> {
    switch (provider) {
      case 'openai':
        return this.openai.listModels()
      case 'google':
        return this.google.listModels()
      case 'anthropic':
        // Anthropic 没有公开的模型列表 API，返回已知模型
        return [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ]
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }
}

/**
 * 默认 AI 服务实例
 */
export const aiService = new UnifiedAIService()

// 导出所有类型和服务
export * from './openai'
export * from './anthropic'
export * from './google'
export type { UnifiedMessage, UnifiedChatRequest, UnifiedChatResponse, AIProvider }
