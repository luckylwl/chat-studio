export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: number
  model?: string
  tokens?: number
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: string
  systemPrompt?: string
  temperature?: number
}

export interface AIModel {
  id: string
  name: string
  provider: string
  maxTokens: number
  description?: string
  pricing?: {
    input: number
    output: number
  }
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  defaultModel: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  fontSize: number
  enableSound: boolean
  enableAnimations: boolean
  // 网络功能配置
  enableWebSearch?: boolean
  searchEngine?: 'google' | 'bing' | 'duckduckgo'
  searchApiKey?: string
  enableWeather?: boolean
  enableStock?: boolean
  enableNews?: boolean
  networkTimeout?: number
  proxyServer?: string
}

export interface APIProvider {
  id: string
  name: string
  baseURL: string
  apiKey: string
  models: AIModel[]
  isEnabled: boolean
}

export interface ChatConfig {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt?: string
  stream?: boolean
}

export interface AppState {
  currentConversationId: string | null
  conversations: Conversation[]
  user: User | null
  apiProviders: APIProvider[]
  isLoading: boolean
  error: string | null
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
}

export type Theme = 'light' | 'dark' | 'system'
export type MessageRole = 'user' | 'assistant' | 'system'