/**
 * 模块化的 Zustand Store
 *
 * 优势:
 * 1. 按功能拆分,更易维护
 * 2. 减少不必要的 re-renders
 * 3. 更好的代码组织
 * 4. 独立的持久化策略
 */

export { useConversationStore } from './conversationStore'
export { useUIStore } from './uiStore'
export { useSettingsStore } from './settingsStore'

// 兼容旧的 useAppStore (可选)
import { useConversationStore } from './conversationStore'
import { useUIStore } from './uiStore'
import { useSettingsStore } from './settingsStore'

/**
 * 组合 Hook - 提供类似原始 useAppStore 的体验
 * 仅在需要多个 store 数据时使用
 */
export function useAppStore() {
  const conversationStore = useConversationStore()
  const uiStore = useUIStore()
  const settingsStore = useSettingsStore()

  return {
    // Conversation Store
    currentConversationId: conversationStore.currentConversationId,
    conversations: conversationStore.conversations,
    systemPrompt: conversationStore.systemPrompt,
    setCurrentConversation: conversationStore.setCurrentConversation,
    createConversation: conversationStore.createConversation,
    deleteConversation: conversationStore.deleteConversation,
    updateConversation: conversationStore.updateConversation,
    addMessage: conversationStore.addMessage,
    updateMessage: conversationStore.updateMessage,
    deleteMessage: conversationStore.deleteMessage,
    clearConversations: conversationStore.clearConversations,
    setSystemPrompt: conversationStore.setSystemPrompt,

    // UI Store
    sidebarOpen: uiStore.sidebarOpen,
    isLoading: uiStore.isLoading,
    error: uiStore.error,
    theme: uiStore.theme,
    setSidebarOpen: uiStore.setSidebarOpen,
    setLoading: uiStore.setLoading,
    setError: uiStore.setError,
    setTheme: uiStore.setTheme,
    toggleSidebar: uiStore.toggleSidebar,

    // Settings Store
    user: settingsStore.user,
    apiProviders: settingsStore.apiProviders,
    setUser: settingsStore.setUser,
    updateUser: settingsStore.updateUser,
    addAPIProvider: settingsStore.addAPIProvider,
    updateAPIProvider: settingsStore.updateAPIProvider,
    deleteAPIProvider: settingsStore.deleteAPIProvider,
  }
}

/**
 * 性能优化提示:
 *
 * ❌ 不推荐 - 导致不必要的 re-renders:
 * const { conversations, theme, user } = useAppStore()
 *
 * ✅ 推荐 - 只订阅需要的数据:
 * const conversations = useConversationStore(state => state.conversations)
 * const theme = useUIStore(state => state.theme)
 * const user = useSettingsStore(state => state.user)
 *
 * ✅ 更好 - 使用独立的 store:
 * const { conversations, addMessage } = useConversationStore()
 * const { theme, setTheme } = useUIStore()
 */
