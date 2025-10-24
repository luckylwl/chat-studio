import React, { useEffect } from 'react'
import { AnimationProvider } from './AnimationProvider'
import { SecurityProvider } from './SecurityProvider'
import { NotificationProvider } from './SmartNotifications'
import { AccessibilityProvider } from './AccessibilityProvider'
import { PWAProvider } from './PWAProvider'
import { AnalyticsProvider, useAnalytics } from './AnalyticsProvider'
import { UXEnhancer } from './UXEnhancer'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationBell } from './SmartNotifications'
import { cn } from '@/utils'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import './i18n'

interface MasterIntegrationProps {
  children: React.ReactNode
  className?: string
}

// 性能监控组件
const PerformanceMonitor: React.FC = () => {
  const { trackPerformance } = useAnalytics()

  useEffect(() => {
    // 监控页面性能
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        switch (entry.entryType) {
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming
            trackPerformance('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart)
            trackPerformance('page_load', navEntry.loadEventEnd - navEntry.loadEventStart)
            break
          case 'paint':
            trackPerformance(entry.name.replace('-', '_'), entry.startTime)
            break
          case 'largest-contentful-paint':
            trackPerformance('largest_contentful_paint', entry.startTime)
            break
          case 'first-input':
            const fiEntry = entry as any
            trackPerformance('first_input_delay', fiEntry.processingStart - fiEntry.startTime)
            break
          case 'layout-shift':
            const lsEntry = entry as any
            if (!lsEntry.hadRecentInput) {
              trackPerformance('cumulative_layout_shift', lsEntry.value)
            }
            break
        }
      })
    })

    // 观察各种性能指标
    const supportedTypes = ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
    supportedTypes.forEach(type => {
      try {
        observer.observe({ entryTypes: [type] })
      } catch (e) {
        // 某些指标可能不被支持
      }
    })

    return () => observer.disconnect()
  }, [trackPerformance])

  return null
}

// 用户行为跟踪组件
const UserBehaviorTracker: React.FC = () => {
  const { trackUserAction, trackFeatureUsage } = useAnalytics()

  useEffect(() => {
    // 全局点击跟踪
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      const className = target.className
      const id = target.id
      const textContent = target.textContent?.substring(0, 100)

      trackUserAction('click', tagName, {
        className,
        id,
        textContent,
        x: e.clientX,
        y: e.clientY
      })

      // 特殊元素跟踪
      if (target.matches('[data-feature]')) {
        const feature = target.getAttribute('data-feature')
        if (feature) {
          trackFeatureUsage(feature)
        }
      }
    }

    // 键盘事件跟踪
    const handleKeydown = (e: KeyboardEvent) => {
      // 只跟踪特殊按键组合
      if (e.ctrlKey || e.metaKey || e.altKey) {
        trackUserAction('keyboard_shortcut', `${e.ctrlKey ? 'ctrl+' : ''}${e.metaKey ? 'cmd+' : ''}${e.altKey ? 'alt+' : ''}${e.key}`)
      }
    }

    // 滚动行为跟踪
    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        trackUserAction('scroll', 'page', { scrollPercent: Math.round(scrollPercent) })
      }, 150)
    }

    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleKeydown)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [trackUserAction, trackFeatureUsage])

  return null
}

// 智能预加载组件
const SmartPreloader: React.FC = () => {
  useEffect(() => {
    // 预加载可能的下一页资源
    const preloadNextPages = () => {
      const currentPath = window.location.pathname
      const likelyNextPages = [
        '/settings',
        '/models',
        '/history',
        '/knowledge'
      ].filter(path => path !== currentPath)

      likelyNextPages.forEach(path => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = path
        document.head.appendChild(link)
      })
    }

    // 预加载关键字体
    const preloadFonts = () => {
      const fonts = [
        '/fonts/Inter-Regular.woff2',
        '/fonts/Inter-Medium.woff2',
        '/fonts/Inter-SemiBold.woff2'
      ]

      fonts.forEach(font => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = font
        link.as = 'font'
        link.type = 'font/woff2'
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      })
    }

    // 延迟执行预加载，避免影响关键渲染路径
    const timer = setTimeout(() => {
      preloadNextPages()
      preloadFonts()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return null
}

// 自适应主题组件
const AdaptiveTheme: React.FC = () => {
  const { user, updateUser } = useAppStore()

  useEffect(() => {
    // 根据时间自动切换主题
    const autoSwitchTheme = () => {
      if (!user?.preferences?.autoTheme) return

      const hour = new Date().getHours()
      const isDayTime = hour >= 6 && hour < 18
      const shouldUseDarkMode = !isDayTime

      if (user.preferences.theme !== (shouldUseDarkMode ? 'dark' : 'light')) {
        updateUser({
          preferences: {
            ...user.preferences,
            theme: shouldUseDarkMode ? 'dark' : 'light'
          }
        })
      }
    }

    // 检查系统主题偏好变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (user?.preferences?.theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    // 每小时检查一次自动主题切换
    const interval = setInterval(autoSwitchTheme, 60 * 60 * 1000)
    autoSwitchTheme() // 立即执行一次

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
      clearInterval(interval)
    }
  }, [user, updateUser])

  return null
}

// 智能错误边界
class SmartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)

    // 发送错误到分析系统
    if (window.analytics) {
      window.analytics.trackError(error, 'react_error_boundary')
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              出现了一些问题
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              应用遇到了意外错误，请刷新页面重试
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 主集成组件
export const MasterIntegration: React.FC<MasterIntegrationProps> = ({ children, className }) => {
  const { t } = useTranslation()

  return (
    <SmartErrorBoundary>
      <AnalyticsProvider>
        <PWAProvider>
          <AccessibilityProvider>
            <NotificationProvider>
              <SecurityProvider>
                <AnimationProvider>
                  <div className={cn("min-h-screen bg-background text-foreground", className)}>
                    {/* 性能监控 */}
                    <PerformanceMonitor />

                    {/* 用户行为跟踪 */}
                    <UserBehaviorTracker />

                    {/* 智能预加载 */}
                    <SmartPreloader />

                    {/* 自适应主题 */}
                    <AdaptiveTheme />

                    {/* 顶部工具栏 */}
                    <div className="fixed top-0 right-0 z-50 flex items-center gap-2 p-4">
                      <NotificationBell />
                      <LanguageSwitcher />
                    </div>

                    {/* 主要内容区域 */}
                    <UXEnhancer className="w-full">
                      {children}
                    </UXEnhancer>

                    {/* 全局样式增强 */}
                    <style jsx global>{`
                      /* 平滑滚动 */
                      html {
                        scroll-behavior: smooth;
                      }

                      /* 选中文本样式 */
                      ::selection {
                        background-color: rgba(59, 130, 246, 0.3);
                        color: inherit;
                      }

                      /* 聚焦轮廓 */
                      *:focus-visible {
                        outline: 2px solid rgb(59, 130, 246);
                        outline-offset: 2px;
                      }

                      /* 滚动条样式 */
                      ::-webkit-scrollbar {
                        width: 8px;
                        height: 8px;
                      }

                      ::-webkit-scrollbar-track {
                        background: rgba(0, 0, 0, 0.1);
                        border-radius: 4px;
                      }

                      ::-webkit-scrollbar-thumb {
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 4px;
                      }

                      ::-webkit-scrollbar-thumb:hover {
                        background: rgba(0, 0, 0, 0.3);
                      }

                      .dark ::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.1);
                      }

                      .dark ::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.2);
                      }

                      .dark ::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.3);
                      }

                      /* 加载动画 */
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }

                      @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                      }

                      @keyframes bounce {
                        0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
                        50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
                      }

                      /* 响应式断点优化 */
                      @media (max-width: 768px) {
                        .container {
                          padding-left: 1rem;
                          padding-right: 1rem;
                        }
                      }

                      /* 高对比度支持 */
                      @media (prefers-contrast: high) {
                        * {
                          border-color: currentColor !important;
                        }
                      }

                      /* 减少动画支持 */
                      @media (prefers-reduced-motion: reduce) {
                        *, *::before, *::after {
                          animation-duration: 0.01ms !important;
                          animation-iteration-count: 1 !important;
                          transition-duration: 0.01ms !important;
                        }
                      }

                      /* 打印样式 */
                      @media print {
                        * {
                          background: transparent !important;
                          color: black !important;
                          box-shadow: none !important;
                          text-shadow: none !important;
                        }

                        .no-print {
                          display: none !important;
                        }

                        a, a:visited {
                          text-decoration: underline;
                        }

                        pre, blockquote {
                          border: 1px solid #999;
                          page-break-inside: avoid;
                        }

                        thead {
                          display: table-header-group;
                        }

                        tr, img {
                          page-break-inside: avoid;
                        }

                        p, h2, h3 {
                          orphans: 3;
                          widows: 3;
                        }

                        h2, h3 {
                          page-break-after: avoid;
                        }
                      }
                    `}</style>
                  </div>
                </AnimationProvider>
              </SecurityProvider>
            </NotificationProvider>
          </AccessibilityProvider>
        </PWAProvider>
      </AnalyticsProvider>
    </SmartErrorBoundary>
  )
}

// 导出用于全局使用的 window 对象扩展
declare global {
  interface Window {
    analytics: any
  }
}

export default MasterIntegration