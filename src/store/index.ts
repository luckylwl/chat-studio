import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppState, Conversation, Message, User, APIProvider, Theme } from '@/types'
import { generateId, getSystemTheme } from '@/utils'
import { DEFAULT_PROVIDERS } from '@/services/aiApi'

interface AppStore extends AppState {
  // Actions
  setCurrentConversation: (id: string | null) => void
  createConversation: (title?: string, model?: string) => string
  deleteConversation: (id: string) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  deleteMessage: (conversationId: string, messageId: string) => void
  clearConversations: () => void
  setUser: (user: User | null) => void
  addAPIProvider: (provider: APIProvider) => void
  updateAPIProvider: (id: string, updates: Partial<APIProvider>) => void
  deleteAPIProvider: (id: string) => void
  setTheme: (theme: Theme) => void
  setSidebarOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSystemPrompt: (prompt: string) => void
  systemPrompt: string
}

const defaultUser: User = {
  id: 'default-user',
  name: '用户',
  email: '',
  preferences: {
    theme: 'system',
    language: 'zh-CN',
    defaultModel: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: '你是一个有用的AI助手。',
    fontSize: 14,
    enableSound: false,
    enableAnimations: true
  }
}

const defaultAPIProviders: APIProvider[] = DEFAULT_PROVIDERS

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentConversationId: null,
      conversations: [],
      user: defaultUser,
      apiProviders: defaultAPIProviders,
      isLoading: false,
      error: null,
      sidebarOpen: true,
      theme: 'system',
      systemPrompt: '',

      // Actions
      setCurrentConversation: (id) =>
        set({ currentConversationId: id }),

      createConversation: (title, model) => {
        const id = generateId()
        const conversation: Conversation = {
          id,
          title: title || '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: model || get().user?.preferences.defaultModel || 'gpt-4'
        }

        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: id
        }))

        return id
      },

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          currentConversationId:
            state.currentConversationId === id ? null : state.currentConversationId
        })),

      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          )
        })),

      addMessage: (conversationId, message) => {
        const newMessage: Message = {
          ...message,
          id: generateId(),
          timestamp: Date.now()
        }

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, newMessage],
                  updatedAt: Date.now(),
                  title: c.messages.length === 0 && message.role === 'user'
                    ? message.content.slice(0, 50)
                    : c.title
                }
              : c
          )
        }))

        return newMessage.id
      },

      updateMessage: (conversationId, messageId, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                  updatedAt: Date.now()
                }
              : c
          )
        })),

      deleteMessage: (conversationId, messageId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== messageId),
                  updatedAt: Date.now()
                }
              : c
          )
        })),

      clearConversations: () =>
        set({ conversations: [], currentConversationId: null }),

      setUser: (user) => set({ user }),

      addAPIProvider: (provider) =>
        set((state) => ({
          apiProviders: [...state.apiProviders, provider]
        })),

      updateAPIProvider: (id, updates) =>
        set((state) => ({
          apiProviders: state.apiProviders.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          )
        })),

      deleteAPIProvider: (id) =>
        set((state) => ({
          apiProviders: state.apiProviders.filter((p) => p.id !== id)
        })),

      setTheme: (theme) => {
        set({ theme })

        const root = window.document.documentElement
        const systemTheme = getSystemTheme()
        const actualTheme = theme === 'system' ? systemTheme : theme

        root.classList.remove('light', 'dark')
        root.classList.add(actualTheme)
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt })
    }),
    {
      name: 'ai-chat-studio-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        user: state.user,
        apiProviders: state.apiProviders,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        systemPrompt: state.systemPrompt
      })
    }
  )
)

// Initialize theme on app start
if (typeof window !== 'undefined') {
  const theme = useAppStore.getState().theme
  const systemTheme = getSystemTheme()
  const actualTheme = theme === 'system' ? systemTheme : theme

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(actualTheme)

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = useAppStore.getState().theme
    if (currentTheme === 'system') {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(e.matches ? 'dark' : 'light')
    }
  })
}