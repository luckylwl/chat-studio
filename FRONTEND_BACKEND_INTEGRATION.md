# 🔗 前后端完整集成指南

完整的前端与后端集成教程，包含代码示例、最佳实践和常见问题解决方案。

---

## 📚 目录

1. [集成架构](#集成架构)
2. [API 客户端封装](#api-客户端封装)
3. [状态管理集成](#状态管理集成)
4. [WebSocket 实时通信](#websocket-实时通信)
5. [认证流程](#认证流程)
6. [错误处理](#错误处理)
7. [文件上传下载](#文件上传下载)
8. [实战示例](#实战示例)
9. [性能优化](#性能优化)
10. [测试策略](#测试策略)

---

## 🏗️ 集成架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   组件层     │  │   状态层     │  │   服务层     │     │
│  │  Components  │◄─│   Zustand    │◄─│   Services   │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
│                                               │              │
└───────────────────────────────────────────────┼─────────────┘
                                                │
                                    HTTP/WebSocket
                                                │
┌───────────────────────────────────────────────┼─────────────┐
│                                               │              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────▼───────┐     │
│  │  路由层      │  │  中间件      │  │   端点层     │     │
│  │  Routes      │─►│  Middleware  │─►│  Endpoints   │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
│                                               │              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────▼───────┐     │
│  │  数据库      │◄─│  服务层      │◄─│   业务逻辑   │     │
│  │  Database    │  │  Services    │  │   Logic      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│                     后端 (FastAPI)                          │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈对应

| 层级 | 前端 | 后端 |
|------|------|------|
| UI层 | React 18 + TypeScript | - |
| 状态管理 | Zustand | - |
| 路由 | React Router | FastAPI Router |
| HTTP客户端 | Axios / Fetch | httpx |
| 实时通信 | WebSocket API | WebSockets |
| 数据验证 | Zod / Yup | Pydantic |
| 认证 | JWT (localStorage) | JWT (PyJWT) |
| 数据库 | - | SQLAlchemy + PostgreSQL |
| 缓存 | LRU Cache (前端) | Redis (后端) |

---

## 🔌 API 客户端封装

### 基础 HTTP 客户端

```typescript
// src/services/httpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

class HttpClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor(baseURL: string = 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加认证token
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }

        console.log('[HTTP Request]', config.method?.toUpperCase(), config.url)
        return config
      },
      (error) => {
        console.error('[HTTP Request Error]', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log('[HTTP Response]', response.status, response.config.url)
        return response
      },
      (error) => {
        // 统一错误处理
        if (error.response) {
          const { status, data } = error.response

          switch (status) {
            case 401:
              // Token过期，清除并跳转到登录
              this.clearToken()
              window.location.href = '/login'
              break

            case 403:
              console.error('权限不足')
              break

            case 404:
              console.error('资源不存在')
              break

            case 500:
              console.error('服务器错误')
              break

            default:
              console.error('请求失败:', data.detail || data.message)
          }
        } else if (error.request) {
          console.error('网络错误: 无法连接到服务器')
        }

        return Promise.reject(error)
      }
    )
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token')
    }
    return this.token
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }
}

// 导出单例
export const httpClient = new HttpClient()
```

### API 服务封装

```typescript
// src/services/backendApi.ts
import { httpClient } from './httpClient'

// 类型定义
export interface User {
  id: string
  username: string
  email: string
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: number
  model?: string
  tokens?: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: string
  systemPrompt?: string
  userId: string
}

export interface ChatRequest {
  messages: Message[]
  model: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatResponse {
  content: string
  tokens: number
  model: string
}

export interface Stats {
  total_conversations: number
  total_messages: number
  total_tokens: number
  average_messages_per_conversation: number
}

/**
 * 后端API服务
 */
class BackendApiService {
  // ==================== 认证 ====================

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<TokenResponse> {
    const response = await httpClient.post<TokenResponse>('/api/auth/register', data)
    httpClient.setToken(response.access_token)
    return response
  }

  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await httpClient.post<TokenResponse>('/api/auth/login', data)
    httpClient.setToken(response.access_token)
    return response
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    return httpClient.get<User>('/api/auth/me')
  }

  /**
   * 登出
   */
  logout() {
    httpClient.clearToken()
  }

  // ==================== 对话 ====================

  /**
   * 获取所有对话
   */
  async getConversations(): Promise<Conversation[]> {
    return httpClient.get<Conversation[]>('/api/conversations')
  }

  /**
   * 获取特定对话
   */
  async getConversation(id: string): Promise<Conversation> {
    return httpClient.get<Conversation>(`/api/conversations/${id}`)
  }

  /**
   * 创建对话
   */
  async createConversation(conversation: Partial<Conversation>): Promise<Conversation> {
    return httpClient.post<Conversation>('/api/conversations', conversation)
  }

  /**
   * 更新对话
   */
  async updateConversation(id: string, conversation: Partial<Conversation>): Promise<Conversation> {
    return httpClient.put<Conversation>(`/api/conversations/${id}`, conversation)
  }

  /**
   * 删除对话
   */
  async deleteConversation(id: string): Promise<{ message: string }> {
    return httpClient.delete(`/api/conversations/${id}`)
  }

  // ==================== 聊天 ====================

  /**
   * 发送聊天消息
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return httpClient.post<ChatResponse>('/api/chat', request)
  }

  // ==================== 统计 ====================

  /**
   * 获取用户统计信息
   */
  async getStats(): Promise<Stats> {
    return httpClient.get<Stats>('/api/stats')
  }

  // ==================== 健康检查 ====================

  /**
   * 健康检查
   */
  async healthCheck(): Promise<any> {
    return httpClient.get('/health')
  }
}

// 导出单例
export const backendApi = new BackendApiService()
```

---

## 🗃️ 状态管理集成

### Zustand Store

```typescript
// src/store/index.ts
import create from 'zustand'
import { persist } from 'zustand/middleware'
import { backendApi, Conversation, User } from '@/services/backendApi'

interface AppState {
  // 用户状态
  user: User | null
  isAuthenticated: boolean

  // 对话状态
  conversations: Conversation[]
  currentConversationId: string | null
  loading: boolean
  error: string | null

  // Actions - 认证
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>

  // Actions - 对话
  fetchConversations: () => Promise<void>
  createConversation: (conversation: Partial<Conversation>) => Promise<void>
  updateConversation: (id: string, conversation: Partial<Conversation>) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  setCurrentConversation: (id: string) => void

  // Actions - 消息
  sendMessage: (content: string) => Promise<void>
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      conversations: [],
      currentConversationId: null,
      loading: false,
      error: null,

      // ==================== 认证 Actions ====================

      login: async (username, password) => {
        try {
          set({ loading: true, error: null })

          await backendApi.login({ username, password })
          const user = await backendApi.getCurrentUser()

          set({
            user,
            isAuthenticated: true,
            loading: false
          })

          // 登录后自动加载对话
          get().fetchConversations()
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || '登录失败',
            loading: false
          })
          throw error
        }
      },

      register: async (username, email, password) => {
        try {
          set({ loading: true, error: null })

          await backendApi.register({ username, email, password })
          const user = await backendApi.getCurrentUser()

          set({
            user,
            isAuthenticated: true,
            loading: false
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || '注册失败',
            loading: false
          })
          throw error
        }
      },

      logout: () => {
        backendApi.logout()
        set({
          user: null,
          isAuthenticated: false,
          conversations: [],
          currentConversationId: null
        })
      },

      fetchCurrentUser: async () => {
        try {
          const user = await backendApi.getCurrentUser()
          set({ user, isAuthenticated: true })
        } catch (error) {
          set({ user: null, isAuthenticated: false })
        }
      },

      // ==================== 对话 Actions ====================

      fetchConversations: async () => {
        try {
          set({ loading: true, error: null })

          const conversations = await backendApi.getConversations()

          set({
            conversations,
            loading: false
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || '获取对话失败',
            loading: false
          })
        }
      },

      createConversation: async (conversation) => {
        try {
          set({ loading: true, error: null })

          const newConversation = await backendApi.createConversation(conversation)

          set((state) => ({
            conversations: [...state.conversations, newConversation],
            currentConversationId: newConversation.id,
            loading: false
          }))
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || '创建对话失败',
            loading: false
          })
          throw error
        }
      },

      updateConversation: async (id, conversation) => {
        try {
          const updated = await backendApi.updateConversation(id, conversation)

          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === id ? updated : conv
            )
          }))
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || '更新对话失败'
          })
          throw error
        }
      },

      deleteConversation: async (id) => {
        try {
          await backendApi.deleteConversation(id)

          set((state) => ({
            conversations: state.conversations.filter((conv) => conv.id !== id),
            currentConversationId:
              state.currentConversationId === id ? null : state.currentConversationId
          }))
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || '删除对话失败'
          })
          throw error
        }
      },

      setCurrentConversation: (id) => {
        set({ currentConversationId: id })
      },

      // ==================== 消息 Actions ====================

      sendMessage: async (content) => {
        const { currentConversationId, conversations } = get()

        if (!currentConversationId) {
          throw new Error('没有选中的对话')
        }

        const conversation = conversations.find((c) => c.id === currentConversationId)
        if (!conversation) {
          throw new Error('对话不存在')
        }

        try {
          // 添加用户消息
          const userMessage: Message = {
            id: `msg_${Date.now()}`,
            content,
            role: 'user',
            timestamp: Date.now()
          }

          const updatedMessages = [...conversation.messages, userMessage]

          // 乐观更新UI
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === currentConversationId
                ? { ...conv, messages: updatedMessages }
                : conv
            )
          }))

          // 发送到后端
          const response = await backendApi.sendMessage({
            messages: updatedMessages,
            model: conversation.model
          })

          // 添加AI响应
          const aiMessage: Message = {
            id: `msg_${Date.now()}_ai`,
            content: response.content,
            role: 'assistant',
            timestamp: Date.now(),
            model: response.model,
            tokens: response.tokens
          }

          const finalMessages = [...updatedMessages, aiMessage]

          // 更新对话
          await get().updateConversation(currentConversationId, {
            messages: finalMessages,
            updatedAt: Date.now()
          })
        } catch (error: any) {
          // 回滚乐观更新
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === currentConversationId ? conversation : conv
            ),
            error: error.response?.data?.detail || '发送消息失败'
          }))
          throw error
        }
      }
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
```

---

## 🔄 WebSocket 实时通信

### WebSocket Manager

```typescript
// src/services/websocketManager.ts
type MessageHandler = (data: any) => void

export class WebSocketManager {
  private ws: WebSocket | null = null
  private url: string
  private userId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private handlers: Map<string, MessageHandler[]> = new Map()
  private heartbeatInterval: number | null = null

  constructor(baseUrl: string = 'ws://localhost:8000') {
    this.url = baseUrl
  }

  /**
   * 连接WebSocket
   */
  connect(userId: string) {
    this.userId = userId
    this.ws = new WebSocket(`${this.url}/ws/${userId}`)

    this.ws.onopen = () => {
      console.log('[WebSocket] 已连接')
      this.reconnectAttempts = 0
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[WebSocket] 收到消息:', data)

        // 触发对应的处理器
        const handlers = this.handlers.get(data.type) || []
        handlers.forEach((handler) => handler(data))

        // 触发通用处理器
        const allHandlers = this.handlers.get('*') || []
        allHandlers.forEach((handler) => handler(data))
      } catch (error) {
        console.error('[WebSocket] 解析消息失败:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[WebSocket] 错误:', error)
    }

    this.ws.onclose = () => {
      console.log('[WebSocket] 已断开')
      this.stopHeartbeat()

      // 自动重连
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(`[WebSocket] ${this.reconnectDelay}ms后重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

        setTimeout(() => {
          if (this.userId) {
            this.connect(this.userId)
          }
        }, this.reconnectDelay)

        // 指数退避
        this.reconnectDelay *= 2
      } else {
        console.error('[WebSocket] 重连失败，已达到最大重试次数')
      }
    }
  }

  /**
   * 发送消息
   */
  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
      console.log('[WebSocket] 发送消息:', data)
    } else {
      console.error('[WebSocket] 连接未就绪')
    }
  }

  /**
   * 注册消息处理器
   */
  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type)!.push(handler)
  }

  /**
   * 移除消息处理器
   */
  off(type: string, handler: MessageHandler) {
    const handlers = this.handlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.handlers.clear()
    this.userId = null
  }

  /**
   * 开始心跳
   */
  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000) // 每30秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 发送聊天消息
   */
  sendChat(content: string) {
    this.send({
      type: 'chat',
      content
    })
  }

  /**
   * 发送打字状态
   */
  sendTyping() {
    this.send({
      type: 'typing'
    })
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// 导出单例
export const wsManager = new WebSocketManager()
```

### React Hook

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useState } from 'react'
import { wsManager } from '@/services/websocketManager'

export function useWebSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (!userId) return

    // 连接WebSocket
    wsManager.connect(userId)

    // 监听连接状态
    const statusHandler = () => {
      setIsConnected(wsManager.isConnected)
    }

    const statusInterval = setInterval(statusHandler, 1000)

    // 监听所有消息
    const messageHandler = (data: any) => {
      setMessages((prev) => [...prev, data])
    }

    wsManager.on('*', messageHandler)

    return () => {
      clearInterval(statusInterval)
      wsManager.off('*', messageHandler)
      wsManager.disconnect()
    }
  }, [userId])

  return {
    isConnected,
    messages,
    sendChat: (content: string) => wsManager.sendChat(content),
    sendTyping: () => wsManager.sendTyping()
  }
}
```

---

## 🔐 认证流程

### 完整认证流程

```typescript
// src/pages/LoginPage.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import toast from 'react-hot-toast'

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const login = useStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      toast.error('请输入用户名和密码')
      return
    }

    setIsLoading(true)

    try {
      await login(username, password)
      toast.success('登录成功!')
      navigate('/chat')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '登录失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">登录</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          还没有账号?{' '}
          <a href="/register" className="text-blue-500 hover:underline">
            注册
          </a>
        </p>
      </div>
    </div>
  )
}
```

### 路由保护

```typescript
// src/components/ProtectedRoute.tsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useStore } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

### Token刷新

```typescript
// src/services/tokenRefresh.ts
import { httpClient } from './httpClient'

/**
 * 定期刷新Token
 */
export function setupTokenRefresh() {
  const refreshInterval = 25 * 60 * 1000 // 25分钟

  setInterval(async () => {
    const token = httpClient.getToken()

    if (token) {
      try {
        // 调用刷新端点 (需要后端实现)
        const response = await httpClient.post('/api/auth/refresh')
        httpClient.setToken(response.access_token)
        console.log('[Token] 已刷新')
      } catch (error) {
        console.error('[Token] 刷新失败:', error)
        // 刷新失败，清除token并跳转到登录
        httpClient.clearToken()
        window.location.href = '/login'
      }
    }
  }, refreshInterval)
}
```

---

## ⚠️ 错误处理

### 统一错误处理

```typescript
// src/utils/errorHandler.ts
import toast from 'react-hot-toast'

export interface ApiError {
  message: string
  status: number
  detail?: string
}

export class ErrorHandler {
  /**
   * 处理API错误
   */
  static handleApiError(error: any): ApiError {
    if (error.response) {
      // 服务器返回错误
      const { status, data } = error.response

      const apiError: ApiError = {
        message: data.detail || data.message || '请求失败',
        status,
        detail: data.detail
      }

      // 显示错误提示
      this.showErrorToast(apiError)

      return apiError
    } else if (error.request) {
      // 网络错误
      const apiError: ApiError = {
        message: '网络错误，请检查连接',
        status: 0
      }

      this.showErrorToast(apiError)
      return apiError
    } else {
      // 其他错误
      const apiError: ApiError = {
        message: error.message || '未知错误',
        status: -1
      }

      this.showErrorToast(apiError)
      return apiError
    }
  }

  /**
   * 显示错误提示
   */
  private static showErrorToast(error: ApiError) {
    toast.error(error.message, {
      duration: 4000,
      position: 'top-center'
    })
  }

  /**
   * 处理表单验证错误
   */
  static handleValidationError(errors: Record<string, string>) {
    Object.entries(errors).forEach(([field, message]) => {
      toast.error(`${field}: ${message}`)
    })
  }
}
```

### React 组件中使用

```typescript
// src/components/ChatComponent.tsx
import React, { useState } from 'react'
import { useStore } from '@/store'
import { ErrorHandler } from '@/utils/errorHandler'

export const ChatComponent: React.FC = () => {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const sendMessage = useStore((state) => state.sendMessage)

  const handleSend = async () => {
    if (!input.trim()) {
      toast.error('请输入消息')
      return
    }

    setLoading(true)

    try {
      await sendMessage(input)
      setInput('') // 清空输入
    } catch (error) {
      ErrorHandler.handleApiError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-container">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        disabled={loading}
        placeholder="输入消息..."
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? '发送中...' : '发送'}
      </button>
    </div>
  )
}
```

---

## 📁 文件上传下载

### 文件上传

```typescript
// src/services/fileUpload.ts
import { httpClient } from './httpClient'

export class FileUploadService {
  /**
   * 上传文件
   */
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await httpClient.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress?.(progress)
        }
      }
    })

    return response.url
  }

  /**
   * 批量上传文件
   */
  async uploadMultipleFiles(files: File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file))
    return Promise.all(uploadPromises)
  }
}

export const fileUploadService = new FileUploadService()
```

### React 文件上传组件

```typescript
// src/components/FileUploader.tsx
import React, { useState, useRef } from 'react'
import { fileUploadService } from '@/services/fileUpload'
import toast from 'react-hot-toast'

export const FileUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setProgress(0)

    try {
      const file = files[0]

      // 验证文件大小 (最大 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('文件大小不能超过 10MB')
        return
      }

      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error('不支持的文件类型')
        return
      }

      // 上传文件
      const url = await fileUploadService.uploadFile(file, setProgress)

      toast.success('文件上传成功!')
      console.log('文件URL:', url)
    } catch (error) {
      toast.error('文件上传失败')
      console.error(error)
    } finally {
      setUploading(false)
      setProgress(0)

      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="file-uploader">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id="file-input"
      />

      <label
        htmlFor="file-input"
        className={`
          px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer
          hover:bg-blue-600 transition-colors
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {uploading ? `上传中 ${progress}%` : '选择文件'}
      </label>

      {uploading && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
```

### 后端文件上传处理

```python
# main.py 添加文件上传端点
from fastapi import File, UploadFile
import shutil
from pathlib import Path

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """上传文件"""
    # 验证文件大小
    if file.size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="文件过大")

    # 验证文件类型
    allowed_types = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="不支持的文件类型")

    # 生成唯一文件名
    file_ext = Path(file.filename).suffix
    unique_filename = f"{user_id}_{int(time.time())}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename

    # 保存文件
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 返回文件URL
    return {
        "url": f"/uploads/{unique_filename}",
        "filename": file.filename,
        "size": file.size
    }
```

---

## 🎯 实战示例

### 完整的聊天应用示例

```typescript
// src/pages/ChatPage.tsx
import React, { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { ErrorHandler } from '@/utils/errorHandler'
import toast from 'react-hot-toast'

export const ChatPage: React.FC = () => {
  const [input, setInput] = useState('')
  const [useRealtime, setUseRealtime] = useState(false)

  // 从状态管理获取数据
  const user = useStore((state) => state.user)
  const conversations = useStore((state) => state.conversations)
  const currentConversationId = useStore((state) => state.currentConversationId)
  const loading = useStore((state) => state.loading)

  // Actions
  const fetchConversations = useStore((state) => state.fetchConversations)
  const createConversation = useStore((state) => state.createConversation)
  const setCurrentConversation = useStore((state) => state.setCurrentConversation)
  const sendMessage = useStore((state) => state.sendMessage)

  // WebSocket 实时通信
  const { isConnected, sendChat, sendTyping } = useWebSocket(user?.id || null)

  // 获取当前对话
  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  )

  // 加载对话列表
  useEffect(() => {
    fetchConversations()
  }, [])

  // 创建新对话
  const handleCreateConversation = async () => {
    try {
      await createConversation({
        id: `conv_${Date.now()}`,
        title: '新对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: 'gpt-3.5-turbo',
        userId: user!.id
      })
      toast.success('对话创建成功')
    } catch (error) {
      ErrorHandler.handleApiError(error)
    }
  }

  // 发送消息
  const handleSend = async () => {
    if (!input.trim()) {
      toast.error('请输入消息')
      return
    }

    if (!currentConversationId) {
      toast.error('请先选择或创建对话')
      return
    }

    try {
      if (useRealtime && isConnected) {
        // 使用 WebSocket 实时发送
        sendChat(input)
        setInput('')
        toast.success('消息已通过 WebSocket 发送')
      } else {
        // 使用 HTTP API 发送
        await sendMessage(input)
        setInput('')
      }
    } catch (error) {
      ErrorHandler.handleApiError(error)
    }
  }

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    // 发送打字状态
    if (useRealtime && isConnected) {
      sendTyping()
    }
  }

  return (
    <div className="flex h-screen">
      {/* 侧边栏 - 对话列表 */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <button
            onClick={handleCreateConversation}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            新建对话
          </button>
        </div>

        <div className="space-y-2 p-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setCurrentConversation(conv.id)}
              className={`
                p-3 rounded-lg cursor-pointer transition-colors
                ${
                  conv.id === currentConversationId
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-gray-50'
                }
              `}
            >
              <div className="font-medium truncate">{conv.title}</div>
              <div className="text-sm opacity-75">
                {conv.messages.length} 条消息
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold">
              {currentConversation?.title || '请选择对话'}
            </h1>
            {currentConversation && (
              <p className="text-sm text-gray-600">
                模型: {currentConversation.model}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* WebSocket 状态 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm">
                {isConnected ? 'WebSocket 已连接' : 'WebSocket 未连接'}
              </span>
            </div>

            {/* 实时模式切换 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useRealtime}
                onChange={(e) => setUseRealtime(e.target.checked)}
                disabled={!isConnected}
                className="w-4 h-4"
              />
              <span className="text-sm">实时模式</span>
            </label>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentConversation?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`
                  max-w-2xl px-4 py-3 rounded-lg
                  ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }
                `}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.tokens && (
                  <div className="text-xs opacity-75 mt-2">
                    {message.tokens} tokens
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-4">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={loading || !currentConversationId}
            />

            <button
              onClick={handleSend}
              disabled={loading || !currentConversationId || !input.trim()}
              className="px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## ⚡ 性能优化

### 1. 请求去重

```typescript
// src/utils/requestDeduplication.ts
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map()

  async deduplicate<T>(key: string, request: () => Promise<T>): Promise<T> {
    // 如果已有相同请求在进行中，返回该请求
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>
    }

    // 创建新请求
    const promise = request()
      .finally(() => {
        // 请求完成后移除
        this.pendingRequests.delete(key)
      })

    this.pendingRequests.set(key, promise)
    return promise
  }
}

export const requestDeduplicator = new RequestDeduplicator()
```

### 2. 响应缓存

```typescript
// src/utils/responseCache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
}

class ResponseCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private ttl: number = 5 * 60 * 1000 // 5分钟

  set<T>(key: string, data: T, ttl?: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  clear(pattern?: string) {
    if (pattern) {
      // 清除匹配的键
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      // 清除所有
      this.cache.clear()
    }
  }
}

export const responseCache = new ResponseCache()
```

### 3. 虚拟滚动优化

```typescript
// 使用 react-virtual 优化长列表
import { useVirtualizer } from '@tanstack/react-virtual'

const MessageList: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // 估计每项高度
    overscan: 5 // 预渲染项数
  })

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <MessageComponent message={message} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## 🧪 测试策略

### 单元测试 - API Service

```typescript
// src/services/__tests__/backendApi.test.ts
import { backendApi } from '../backendApi'
import { httpClient } from '../httpClient'

jest.mock('../httpClient')

describe('BackendApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('should register user and set token', async () => {
      const mockResponse = {
        access_token: 'test-token',
        token_type: 'bearer'
      }

      jest.spyOn(httpClient, 'post').mockResolvedValue(mockResponse)
      jest.spyOn(httpClient, 'setToken')

      const result = await backendApi.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })

      expect(httpClient.post).toHaveBeenCalledWith('/api/auth/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })

      expect(httpClient.setToken).toHaveBeenCalledWith('test-token')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getConversations', () => {
    it('should fetch conversations', async () => {
      const mockConversations = [
        { id: '1', title: 'Test 1' },
        { id: '2', title: 'Test 2' }
      ]

      jest.spyOn(httpClient, 'get').mockResolvedValue(mockConversations)

      const result = await backendApi.getConversations()

      expect(httpClient.get).toHaveBeenCalledWith('/api/conversations')
      expect(result).toEqual(mockConversations)
    })
  })
})
```

### 集成测试 - Zustand Store

```typescript
// src/store/__tests__/store.test.ts
import { renderHook, act } from '@testing-library/react-hooks'
import { useStore } from '../index'
import { backendApi } from '@/services/backendApi'

jest.mock('@/services/backendApi')

describe('useStore', () => {
  beforeEach(() => {
    useStore.getState().logout() // 重置状态
  })

  it('should login successfully', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      created_at: '2025-01-01'
    }

    jest.spyOn(backendApi, 'login').mockResolvedValue({
      access_token: 'test-token',
      token_type: 'bearer'
    })

    jest.spyOn(backendApi, 'getCurrentUser').mockResolvedValue(mockUser)

    const { result } = renderHook(() => useStore())

    await act(async () => {
      await result.current.login('testuser', 'password')
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })
})
```

### E2E 测试 - Playwright

```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('should login and send message', async ({ page }) => {
    // 登录
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 等待跳转到聊天页面
    await page.waitForURL('**/chat')

    // 创建新对话
    await page.click('text=新建对话')

    // 发送消息
    await page.fill('textarea[placeholder*="输入消息"]', 'Hello, AI!')
    await page.click('button:has-text("发送")')

    // 验证消息已发送
    await expect(page.locator('text=Hello, AI!')).toBeVisible()

    // 等待AI响应
    await expect(page.locator('.message.assistant')).toBeVisible({
      timeout: 10000
    })
  })
})
```

---

## 📝 最佳实践总结

### 代码组织
✅ 使用 TypeScript 严格模式
✅ 分离业务逻辑和UI组件
✅ 使用自定义 Hooks 复用逻辑
✅ 统一错误处理
✅ API 客户端封装

### 性能优化
✅ 请求去重和缓存
✅ 虚拟滚动处理长列表
✅ 乐观更新提升用户体验
✅ WebSocket 心跳保持连接
✅ 懒加载和代码分割

### 安全性
✅ Token 安全存储
✅ 请求拦截器统一处理认证
✅ 敏感数据加密
✅ XSS 和 CSRF 防护
✅ 输入验证

### 用户体验
✅ Loading 状态提示
✅ 错误友好提示
✅ 离线状态处理
✅ 实时连接状态显示
✅ 响应式设计

---

## 🎓 学习资源

**前端:**
- [React 官方文档](https://react.dev)
- [Zustand 文档](https://zustand-demo.pmnd.rs)
- [Axios 文档](https://axios-http.com)

**后端:**
- [FastAPI 文档](https://fastapi.tiangolo.com)
- [Pydantic 文档](https://docs.pydantic.dev)
- [WebSockets 指南](https://websockets.readthedocs.io)

**测试:**
- [Jest 文档](https://jestjs.io)
- [React Testing Library](https://testing-library.com/react)
- [Playwright 文档](https://playwright.dev)

---

## 🎯 下一步

完成前后端集成后，你可以：

1. **优化性能**
   - 实现请求缓存策略
   - 添加 Service Worker
   - 优化打包体积

2. **增强功能**
   - 添加文件上传功能
   - 实现语音输入
   - 添加多语言支持

3. **提升安全性**
   - 实现 refresh token
   - 添加 CSRF 保护
   - 实现 API 限流

4. **部署上线**
   - 配置 CI/CD
   - Docker 容器化
   - 配置 HTTPS

---

**完整的前后端集成指南！现在你可以构建完整的全栈应用了！** 🚀

---

*最后更新: 2025-10-16*
*版本: 2.0.0*