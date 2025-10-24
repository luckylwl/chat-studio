/**
 * Header 组件
 *
 * 功能说明:
 * 应用顶部导航栏，提供全局导航和快捷操作
 *
 * 核心特性:
 * 1. 侧边栏切换 - 显示/隐藏对话列表侧边栏
 * 2. 主题切换 - 切换明亮/暗黑/跟随系统主题
 * 3. 快速搜索 - Ctrl/Cmd + K 快捷搜索对话和消息
 * 4. 高级搜索 - 支持过滤器、时间范围、模型等条件
 * 5. 模型对比 - 并排对比不同 AI 模型的回复
 * 6. 模型选择器 - 快速切换当前使用的 AI 模型
 * 7. 书签管理器 - 管理收藏的重要消息
 * 8. 分析仪表板 - 查看使用统计和性能分析
 * 9. 通知系统 - 显示系统通知和提醒
 * 10. 实时统计 - 显示当前对话的实时数据
 * 11. 响应式设计 - 移动端隐藏部分按钮以节省空间
 *
 * 快捷键:
 * - Ctrl/Cmd + K: 快速搜索
 * - Ctrl/Cmd + Shift + A: 分析仪表板
 *
 * 响应式断点:
 * - sm: 640px - 显示更大的图标和间距
 * - md: 768px - 显示书签管理器按钮
 * - lg: 1024px - 显示分析仪表板和实时统计
 *
 * @component
 */

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bars3Icon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  ScaleIcon,
  BookmarkIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useAppStore } from '@/store'
import { Button } from './ui'
import { cn } from '@/utils'
import GlobalSearch from './GlobalSearch'
import ModelComparison from './ModelComparison'
import ModelSelector from './ModelSelector'
import ModelStatusIndicator from './ModelStatusIndicator'
import NotificationSystem from './NotificationSystem'
import RealTimeStatistics from './RealTimeStatistics'
import BookmarkManager from './BookmarkManager'
import QuickSearchBar from './QuickSearchBar'
import AdvancedSearchPanel from './AdvancedSearchPanel'
import AnalyticsDashboard from './AnalyticsDashboard'

const Header: React.FC = () => {
  // ============================================
  // 路由和导航
  // ============================================

  /** React Router 导航函数 */
  const navigate = useNavigate()

  /** 当前路由位置 */
  const location = useLocation()

  // ============================================
  // 弹窗状态管理
  // ============================================

  /** 全局搜索弹窗（已废弃，保留用于向后兼容） */
  const [searchOpen, setSearchOpen] = useState(false)

  /** 快速搜索栏（Ctrl/Cmd + K） */
  const [quickSearchOpen, setQuickSearchOpen] = useState(false)

  /** 高级搜索面板 */
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)

  /** 模型对比弹窗 */
  const [comparisonOpen, setComparisonOpen] = useState(false)

  /** 模型选择器弹窗 */
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)

  /** 书签管理器弹窗 */
  const [bookmarkManagerOpen, setBookmarkManagerOpen] = useState(false)

  /** 分析仪表板弹窗 */
  const [analyticsDashboardOpen, setAnalyticsDashboardOpen] = useState(false)

  /** 当前选中的 AI 模型 */
  const [currentModel, setCurrentModel] = useState('gpt-4o')

  // ============================================
  // 全局状态（来自 Zustand Store）
  // ============================================

  const {
    /** 侧边栏是否打开 */
    sidebarOpen,
    /** 设置侧边栏状态 */
    setSidebarOpen,
    /** 当前主题（light/dark/system） */
    theme,
    /** 设置主题 */
    setTheme,
    /** 当前对话 ID */
    currentConversationId,
    /** 所有对话列表 */
    conversations,
    /** 设置当前对话 */
    setCurrentConversationId
  } = useAppStore()

  // ============================================
  // 派生状态
  // ============================================

  /** 当前对话对象 */
  const currentConversation = conversations.find(c => c.id === currentConversationId)

  /** 是否在设置页面 */
  const isSettingsPage = location.pathname === '/settings'

  // ============================================
  // 事件处理函数
  // ============================================

  /**
   * 切换侧边栏显示/隐藏
   *
   * 跨平台兼容性:
   * - 移动端: 侧边栏覆盖在内容上方（抽屉模式）
   * - 桌面端: 侧边栏推动内容（并排模式）
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  /**
   * 切换主题
   *
   * 循环顺序: light → dark → system → light
   *
   * 主题说明:
   * - light: 明亮模式
   * - dark: 暗黑模式
   * - system: 跟随系统设置（iOS/Android/Windows/macOS）
   */
  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  /**
   * 获取主题图标
   *
   * @returns 对应主题的图标组件
   */
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="h-full w-full" />
      case 'dark':
        return <MoonIcon className="h-full w-full" />
      case 'system':
        return <ComputerDesktopIcon className="h-full w-full" />
    }
  }

  /**
   * 获取页面标题
   *
   * 优先级:
   * 1. 设置页面 → "设置"
   * 2. 有当前对话 → 对话标题
   * 3. 默认 → "AI Chat Studio"
   *
   * @returns 页面标题字符串
   */
  const getPageTitle = () => {
    if (isSettingsPage) {
      return '设置'
    }
    if (currentConversation) {
      return currentConversation.title
    }
    return 'AI Chat Studio'
  }

  return (
    <header className="h-14 sm:h-16 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      <div className="h-full px-3 sm:px-4 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
          >
            <Bars3Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {getPageTitle()}
            </h1>
            {currentConversation && !isSettingsPage && (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-3">
                  {/* Model Status Indicator */}
                  <ModelStatusIndicator
                    currentModel={currentModel}
                    onModelSelect={() => setModelSelectorOpen(true)}
                    onModelComparison={() => setComparisonOpen(true)}
                    showDetails={false}
                    className="hidden sm:block"
                  />

                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentConversation.messages.length} 条消息
                  </p>
                </div>

                <div className="hidden lg:block">
                  <RealTimeStatistics compact />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* 移动端隐藏一些按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuickSearchOpen(true)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 sm:h-10 sm:w-10"
            title="快速搜索 (Ctrl/Cmd + K)"
          >
            <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setComparisonOpen(true)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
            title="模型对比"
          >
            <ScaleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBookmarkManagerOpen(true)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 sm:h-10 sm:w-10 hidden md:flex"
            title="书签管理器"
          >
            <BookmarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAnalyticsDashboardOpen(true)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 sm:h-10 sm:w-10 hidden lg:flex"
            title="分析仪表板 (Ctrl/Cmd + Shift + A)"
          >
            <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="hidden sm:block">
            <NotificationSystem />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 sm:h-10 sm:w-10"
            title={`切换主题 (当前: ${theme})`}
          >
            <div className="h-4 w-4 sm:h-5 sm:w-5">
              {getThemeIcon()}
            </div>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isSettingsPage ? '/chat' : '/settings')}
            className={cn(
              "hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 sm:h-10 sm:w-10",
              isSettingsPage && "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
            )}
          >
            <div className="h-4 w-4 sm:h-5 sm:w-5">
              {isSettingsPage ? (
                <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Cog6ToothIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </div>
          </Button>
        </div>
      </div>

      {/* Quick Search */}
      <QuickSearchBar
        isOpen={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
        onOpenAdvanced={() => {
          setQuickSearchOpen(false)
          setAdvancedSearchOpen(true)
        }}
        onNavigateToResult={(conversationId, messageId) => {
          setCurrentConversationId(conversationId)
          navigate(`/chat/${conversationId}`)
          setQuickSearchOpen(false)
        }}
      />

      {/* Advanced Search */}
      <AdvancedSearchPanel
        isOpen={advancedSearchOpen}
        onClose={() => setAdvancedSearchOpen(false)}
        onNavigateToResult={(conversationId, messageId) => {
          setCurrentConversationId(conversationId)
          navigate(`/chat/${conversationId}`)
          setAdvancedSearchOpen(false)
        }}
      />

      {/* Global Search (Legacy) */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(conversationId, messageId) => {
          setCurrentConversationId(conversationId)
          navigate(`/chat/${conversationId}`)

          // Scroll to specific message if messageId is provided
          if (messageId) {
            // Import and use message scroll service
            import('@/services/messageScrollService').then(({ messageScrollService }) => {
              // Wait for navigation to complete, then scroll
              setTimeout(() => {
                messageScrollService.scrollToMessage({
                  messageId,
                  conversationId,
                  highlight: true,
                  highlightDuration: 3000,
                  behavior: 'smooth'
                })
              }, 300)
            })
          }
        }}
      />

      {/* Model Comparison */}
      <ModelComparison
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
      />

      {/* Model Selector */}
      <ModelSelector
        isOpen={modelSelectorOpen}
        onClose={() => setModelSelectorOpen(false)}
        selectedModel={currentModel}
        onModelChange={(modelId) => {
          setCurrentModel(modelId)
          setModelSelectorOpen(false)
        }}
        conversationContext={{
          messageCount: currentConversation?.messages.length || 0,
          taskType: 'general',
          priority: 'quality'
        }}
        showRecommendations={true}
      />

      {/* Bookmark Manager */}
      <BookmarkManager
        isOpen={bookmarkManagerOpen}
        onClose={() => setBookmarkManagerOpen(false)}
        onNavigateToBookmark={(conversationId, messageId) => {
          setCurrentConversationId(conversationId)
          navigate(`/chat/${conversationId}`)

          // Scroll to bookmarked message if messageId is provided
          if (messageId) {
            import('@/services/messageScrollService').then(({ messageScrollService }) => {
              setTimeout(() => {
                messageScrollService.scrollToMessage({
                  messageId,
                  conversationId,
                  highlight: true,
                  highlightDuration: 3000,
                  behavior: 'smooth'
                })
              }, 300)
            })
          }
        }}
      />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={analyticsDashboardOpen}
        onClose={() => setAnalyticsDashboardOpen(false)}
      />
    </header>
  )
}

export default Header