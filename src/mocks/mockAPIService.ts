/**
 * Mock API Service for Development and Testing
 * Simulates AI API responses without making real API calls
 */

export interface MockCompletionRequest {
  messages: Array<{ role: string; content: string }>
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface MockCompletionResponse {
  id: string
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: string
}

/**
 * Mock responses for common queries
 */
const mockResponses: Record<string, string> = {
  greeting: `Hello! I'm a mock AI assistant. I'm here to demonstrate how the chat interface works.

In a real scenario, I would be powered by OpenAI, Anthropic, or Google's AI models. For now, I'm providing pre-programmed responses.

How can I help you today?`,

  help: `I can help you with:
- Understanding the chat interface
- Testing keyboard shortcuts
- Exploring conversation management
- Trying out different features

To use real AI responses, please configure your API key in Settings → API Settings.`,

  code: `Here's a simple code example:

\`\`\`javascript
// Hello World in JavaScript
function greet(name) {
  return \`Hello, \${name}!\`
}

console.log(greet('World'))
\`\`\`

This demonstrates:
- Function declaration
- Template literals
- Console logging

Would you like to see more examples?`,

  explain: `Let me explain that concept:

**Key Points:**
1. This is a mock response
2. Real AI would provide detailed explanations
3. Configure API key for actual AI responses

The mock service is useful for:
- Testing the UI
- Development without API costs
- Demonstrating the app to others`,

  default: `I'm a mock AI assistant. This is a simulated response.

To get real AI responses, configure your API key in Settings:
1. Click Settings (⚙️)
2. Go to API Settings
3. Add your OpenAI, Anthropic, or Google API key
4. Save and start chatting!

For now, I can demonstrate the interface and help you explore features.`,
}

/**
 * Mock AI Service Class
 */
export class MockAIService {
  private delay: number

  constructor(delay = 1000) {
    this.delay = delay
  }

  /**
   * Simulate API completion request
   */
  async createCompletion(request: MockCompletionRequest): Promise<MockCompletionResponse> {
    // Simulate network delay
    await this.sleep(this.delay)

    const lastMessage = request.messages[request.messages.length - 1]
    const userInput = lastMessage.content.toLowerCase()

    // Select response based on input
    let responseContent = mockResponses.default

    if (userInput.includes('hello') || userInput.includes('hi')) {
      responseContent = mockResponses.greeting
    } else if (userInput.includes('help') || userInput.includes('how')) {
      responseContent = mockResponses.help
    } else if (
      userInput.includes('code') ||
      userInput.includes('example') ||
      userInput.includes('function')
    ) {
      responseContent = mockResponses.code
    } else if (
      userInput.includes('explain') ||
      userInput.includes('what is') ||
      userInput.includes('why')
    ) {
      responseContent = mockResponses.explain
    }

    // Calculate mock token usage
    const promptTokens = this.estimateTokens(
      request.messages.map((m) => m.content).join(' ')
    )
    const completionTokens = this.estimateTokens(responseContent)

    return {
      id: `mock-${Date.now()}`,
      content: responseContent,
      model: request.model || 'mock-model',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      finishReason: 'stop',
    }
  }

  /**
   * Simulate streaming completion
   */
  async *createStreamingCompletion(
    request: MockCompletionRequest
  ): AsyncGenerator<string> {
    const response = await this.createCompletion(request)
    const words = response.content.split(' ')

    // Stream word by word
    for (const word of words) {
      await this.sleep(50) // Delay between words
      yield word + ' '
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Simulate error response
   */
  async createErrorResponse(errorType: 'rate_limit' | 'auth' | 'network'): Promise<never> {
    await this.sleep(500)

    const errors = {
      rate_limit: new Error('Rate limit exceeded. Please try again later.'),
      auth: new Error('Invalid API key. Please check your credentials.'),
      network: new Error('Network error. Please check your connection.'),
    }

    throw errors[errorType]
  }
}

/**
 * Mock API factory
 */
export const createMockAPI = (delay = 1000): MockAIService => {
  return new MockAIService(delay)
}

/**
 * Check if mock mode is enabled
 */
export const isMockMode = (): boolean => {
  // Check if running in development and no API keys configured
  const isDev = import.meta.env.DEV
  const hasApiKey =
    !!localStorage.getItem('openai_api_key') ||
    !!localStorage.getItem('anthropic_api_key') ||
    !!localStorage.getItem('google_api_key')

  return isDev && !hasApiKey
}

/**
 * Mock streaming response generator
 */
export async function* mockStreamResponse(text: string): AsyncGenerator<string> {
  const chunks = text.split(' ')

  for (const chunk of chunks) {
    await new Promise((resolve) => setTimeout(resolve, 30))
    yield chunk + ' '
  }
}

/**
 * Mock conversation templates
 */
export const mockConversationTemplates = {
  'Getting Started': [
    {
      role: 'user',
      content: 'How do I get started with this app?',
    },
    {
      role: 'assistant',
      content: mockResponses.help,
    },
  ],
  'Code Example': [
    {
      role: 'user',
      content: 'Can you show me a code example?',
    },
    {
      role: 'assistant',
      content: mockResponses.code,
    },
  ],
  Greeting: [
    {
      role: 'user',
      content: 'Hello!',
    },
    {
      role: 'assistant',
      content: mockResponses.greeting,
    },
  ],
}

/**
 * Usage example:
 *
 * import { createMockAPI, isMockMode } from './mocks/mockAPIService'
 *
 * const api = isMockMode() ? createMockAPI() : new RealAIService()
 *
 * const response = await api.createCompletion({
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   model: 'gpt-4'
 * })
 */
