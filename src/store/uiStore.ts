import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import themeService from '@/services/themeService'

interface UIState {
  sidebarOpen: boolean
  isLoading: boolean
  error: string | null
  theme: 'light' | 'dark' | 'system'
}

interface UIActions {
  setSidebarOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setThemeById: (themeId: string) => void
  toggleSidebar: () => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // State
      sidebarOpen: true,
      isLoading: false,
      error: null,
      theme: 'system',

      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // 使用 themeService 统一管理主题
      setTheme: (mode) => {
        set({ theme: mode })
        themeService.setMode(mode)
      },

      // 通过 themeId 设置主题 (使用高级主题系统)
      setThemeById: (themeId) => {
        themeService.setTheme(themeId)
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme
      })
    }
  )
)

// 初始化主题 - 使用 themeService
if (typeof window !== 'undefined') {
  const settings = themeService.getSettings()

  // 同步 theme mode 到 store
  useUIStore.setState({ theme: settings.mode })

  // 监听 themeService 的变化
  themeService.addEventListener('mode_changed', (mode: string) => {
    useUIStore.setState({ theme: mode as 'light' | 'dark' | 'system' })
  })
}
