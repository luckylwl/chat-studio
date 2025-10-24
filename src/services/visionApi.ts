import type { APIProvider, Message, ChatConfig } from '@/types'
import type { UploadedImage } from '@/components/ImageUploader'

export interface VisionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: {
      url: string
      detail?: 'low' | 'high' | 'auto'
    }
  }>
}

export interface ImageGenerationRequest {
  prompt: string
  model?: string
  n?: number
  size?: '1024x1024' | '1792x1024' | '1024x1792' | '256x256' | '512x512'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
}

export interface ImageGenerationResponse {
  created: number
  data: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

export class VisionApiService {
  private provider: APIProvider

  constructor(provider: APIProvider) {
    this.provider = provider
  }

  /**
   * Send a message with images to a vision-capable model
   * Supports GPT-4 Vision, Claude 3 Vision
   */
  async sendMessageWithImages(
    messages: Message[],
    images: UploadedImage[],
    config: ChatConfig,
    onStream?: (chunk: string) => void
  ): Promise<{ content: string; tokens?: number }> {
    const visionMessages = this.prepareVisionMessages(messages, images)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    let requestBody: any
    let endpoint: string

    // Handle different providers
    if (this.provider.id === 'anthropic') {
      // Claude 3 format
      headers['x-api-key'] = this.provider.apiKey
      headers['anthropic-version'] = '2023-06-01'

      requestBody = {
        model: config.model,
        messages: visionMessages.map(msg => ({
          role: msg.role === 'system' ? 'user' : msg.role,
          content: this.convertToClaudeFormat(msg.content)
        })),
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature,
        stream: config.stream && !!onStream
      }

      if (config.systemPrompt) {
        requestBody.system = config.systemPrompt
      }

      endpoint = `${this.provider.baseURL}/messages`
    } else {
      // OpenAI GPT-4V format
      headers['Authorization'] = `Bearer ${this.provider.apiKey}`

      requestBody = {
        model: config.model,
        messages: visionMessages,
        temperature: config.temperature,
        max_tokens: config.maxTokens || 4096,
        stream: config.stream && !!onStream
      }

      if (config.systemPrompt && !visionMessages.some(msg => msg.role === 'system')) {
        requestBody.messages.unshift({
          role: 'system',
          content: config.systemPrompt
        })
      }

      endpoint = `${this.provider.baseURL}/chat/completions`
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Vision API Error (${response.status}): ${error}`)
      }

      if (config.stream && onStream) {
        if (this.provider.id === 'anthropic') {
          return this.handleClaudeStreamResponse(response, onStream)
        } else {
          return this.handleOpenAIStreamResponse(response, onStream)
        }
      } else {
        if (this.provider.id === 'anthropic') {
          return this.handleClaudeSingleResponse(response)
        } else {
          return this.handleOpenAISingleResponse(response)
        }
      }
    } catch (error: any) {
      console.error('Vision API error:', error)
      throw error
    }
  }

  /**
   * Generate images using DALL-E 3
   */
  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    if (this.provider.id !== 'openai') {
      throw new Error('Image generation is only supported with OpenAI provider')
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.provider.apiKey}`
    }

    const requestBody = {
      model: request.model || 'dall-e-3',
      prompt: request.prompt,
      n: request.n || 1,
      size: request.size || '1024x1024',
      quality: request.quality || 'standard',
      style: request.style || 'vivid',
      response_format: 'b64_json' // Get base64 for easier handling
    }

    try {
      const response = await fetch(`${this.provider.baseURL}/images/generations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Image Generation API Error (${response.status}): ${error}`)
      }

      const data = await response.json()
      return data as ImageGenerationResponse
    } catch (error: any) {
      console.error('Image generation error:', error)
      throw error
    }
  }

  /**
   * Prepare messages with images in the correct format
   */
  private prepareVisionMessages(
    messages: Message[],
    images: UploadedImage[]
  ): VisionMessage[] {
    const visionMessages: VisionMessage[] = []

    for (const message of messages) {
      if (message.role === 'user' && images.length > 0) {
        // Add images to the last user message
        const content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: any }> = []

        // Add text
        if (message.content.trim()) {
          content.push({
            type: 'text',
            text: message.content
          })
        }

        // Add images
        for (const image of images) {
          if (image.status === 'completed') {
            content.push({
              type: 'image_url',
              image_url: {
                url: image.base64,
                detail: 'high'
              }
            })
          }
        }

        visionMessages.push({
          role: message.role,
          content
        })

        // Clear images after adding to avoid duplicates
        images.length = 0
      } else {
        visionMessages.push({
          role: message.role,
          content: message.content
        })
      }
    }

    return visionMessages
  }

  /**
   * Convert message content to Claude format
   */
  private convertToClaudeFormat(content: string | any[]): any {
    if (typeof content === 'string') {
      return content
    }

    return content.map(item => {
      if (item.type === 'text') {
        return {
          type: 'text',
          text: item.text
        }
      } else if (item.type === 'image_url') {
        // Claude expects base64 in a different format
        const base64Data = item.image_url.url.split(',')[1] || item.image_url.url
        const mediaType = item.image_url.url.match(/data:(.*?);/)?.[1] || 'image/jpeg'

        return {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data
          }
        }
      }
      return item
    })
  }

  /**
   * Handle OpenAI stream response
   */
  private async handleOpenAIStreamResponse(
    response: Response,
    onStream: (chunk: string) => void
  ): Promise<{ content: string; tokens?: number }> {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (!reader) {
      throw new Error('No response body')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content || ''
            if (content) {
              fullContent += content
              onStream(content)
            }
          } catch (e) {
            console.error('Failed to parse chunk:', e)
          }
        }
      }
    }

    return { content: fullContent }
  }

  /**
   * Handle Claude stream response
   */
  private async handleClaudeStreamResponse(
    response: Response,
    onStream: (chunk: string) => void
  ): Promise<{ content: string; tokens?: number }> {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (!reader) {
      throw new Error('No response body')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text || ''
              if (content) {
                fullContent += content
                onStream(content)
              }
            }
          } catch (e) {
            console.error('Failed to parse chunk:', e)
          }
        }
      }
    }

    return { content: fullContent }
  }

  /**
   * Handle OpenAI single response
   */
  private async handleOpenAISingleResponse(response: Response): Promise<{ content: string; tokens?: number }> {
    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      tokens: data.usage?.total_tokens
    }
  }

  /**
   * Handle Claude single response
   */
  private async handleClaudeSingleResponse(response: Response): Promise<{ content: string; tokens?: number }> {
    const data = await response.json()
    return {
      content: data.content[0].text,
      tokens: data.usage?.input_tokens + data.usage?.output_tokens
    }
  }
}

export const createVisionService = (provider: APIProvider) => {
  return new VisionApiService(provider)
}
