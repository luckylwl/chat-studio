import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, APIProvider } from '@/types'
import { DEFAULT_PROVIDERS } from '@/services/aiApi'

interface SettingsState {
  user: User | null
  apiProviders: APIProvider[]
}

interface SettingsActions {
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
  addAPIProvider: (provider: APIProvider) => void
  updateAPIProvider: (id: string, updates: Partial<APIProvider>) => void
  deleteAPIProvider: (id: string) => void
}

type SettingsStore = SettingsState & SettingsActions

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

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // State
      user: defaultUser,
      apiProviders: DEFAULT_PROVIDERS,

      // Actions
      setUser: (user) => set({ user }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),

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
        }))
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        apiProviders: state.apiProviders
      })
    }
  )
)
