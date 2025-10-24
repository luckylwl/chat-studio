import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Conversation, Message } from '@/types'
import { generateId } from '@/utils'

interface ConversationState {
  currentConversationId: string | null
  conversations: Conversation[]
  systemPrompt: string
}

interface ConversationActions {
  setCurrentConversation: (id: string | null) => void
  createConversation: (title?: string, model?: string) => string
  deleteConversation: (id: string) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  deleteMessage: (conversationId: string, messageId: string) => void
  clearConversations: () => void
  setSystemPrompt: (prompt: string) => void
}

type ConversationStore = ConversationState & ConversationActions

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      // State
      currentConversationId: null,
      conversations: [],
      systemPrompt: '',

      // Actions
      setCurrentConversation: (id) =>
        set({ currentConversationId: id }),

      createConversation: (title, model) => {
        const id = generateId()
        const defaultModel = model || 'gpt-4'

        const conversation: Conversation = {
          id,
          title: title || '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: defaultModel
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

      setSystemPrompt: (prompt) => set({ systemPrompt: prompt })
    }),
    {
      name: 'conversation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations.slice(0, 100), // 限制保存最近100个对话
        currentConversationId: state.currentConversationId,
        systemPrompt: state.systemPrompt
      })
    }
  )
)
