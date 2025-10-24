import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/store'

interface AnalyticsEvent {
  id: string
  type: string
  category: string
  action: string
  label?: string
  value?: number
  userId?: string
  sessionId: string
  timestamp: number
  properties: Record<string, any>
  url: string
  userAgent: string
  screenSize: string
  language: string
}

interface UserSession {
  id: string
  userId?: string
  startTime: number
  endTime?: number
  duration?: number
  pageViews: number
  events: number
  referrer: string
  landingPage: string
  exitPage?: string
  isActive: boolean
}

interface AnalyticsMetrics {
  totalUsers: number
  totalSessions: number
  totalEvents: number
  avgSessionDuration: number
  bounceRate: number
  topFeatures: Array<{ name: string; usage: number }>
  topModels: Array<{ name: string; usage: number }>
  dailyActive: number
  weeklyActive: number
  monthlyActive: number
  retentionRate: number
  errorRate: number
  loadTime: number
}

interface AnalyticsContextType {
  trackEvent: (type: string, category: string, action: string, label?: string, value?: number, properties?: Record<string, any>) => void
  trackPageView: (page: string, title?: string) => void
  trackError: (error: Error, context?: string) => void
  trackPerformance: (metric: string, value: number, context?: string) => void
  trackUserAction: (action: string, element: string, properties?: Record<string, any>) => void
  trackFeatureUsage: (feature: string, properties?: Record<string, any>) => void
  getMetrics: () => AnalyticsMetrics
  getEvents: (filters?: { category?: string; type?: string; startDate?: Date; endDate?: Date }) => AnalyticsEvent[]
  getSessions: () => UserSession[]
  exportData: () => string
  clearData: () => void
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider')
  }
  return context
}

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { user } = useAppStore()
  const [isEnabled, setIsEnabled] = useState(true)
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null)

  const sessionId = useRef(generateId())
  const startTime = useRef(Date.now())
  const lastActivity = useRef(Date.now())
  const pageViewCount = useRef(0)
  const eventCount = useRef(0)

  // 生成唯一ID
  function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取设备信息
  const getDeviceInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      screenSize: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine
    }
  }, [])

  // 初始化会话
  useEffect(() => {
    if (!isEnabled) return

    const session: UserSession = {
      id: sessionId.current,
      userId: user?.id,
      startTime: startTime.current,
      pageViews: 0,
      events: 0,
      referrer: document.referrer,
      landingPage: window.location.pathname,
      isActive: true
    }

    setCurrentSession(session)
    setSessions(prev => [...prev, session])

    // 页面可见性变化监听
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateSession({ isActive: false })
      } else {
        updateSession({ isActive: true })
        lastActivity.current = Date.now()
      }
    }

    // 页面卸载监听
    const handleBeforeUnload = () => {
      endSession()
    }

    // 用户活动监听
    const handleUserActivity = () => {
      lastActivity.current = Date.now()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 监听用户活动
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // 定期更新会话
    const sessionUpdateInterval = setInterval(() => {
      if (Date.now() - lastActivity.current > 30 * 60 * 1000) { // 30分钟无活动
        endSession()
      } else {
        updateSession({})
      }
    }, 60000) // 每分钟检查一次

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
      clearInterval(sessionUpdateInterval)
      endSession()
    }
  }, [isEnabled, user])

  // 更新会话
  const updateSession = useCallback((updates: Partial<UserSession>) => {
    if (!currentSession) return

    const updatedSession = {
      ...currentSession,
      ...updates,
      duration: Date.now() - currentSession.startTime,
      pageViews: pageViewCount.current,
      events: eventCount.current
    }

    setCurrentSession(updatedSession)
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s))
  }, [currentSession])

  // 结束会话
  const endSession = useCallback(() => {
    if (!currentSession) return

    const endedSession = {
      ...currentSession,
      endTime: Date.now(),
      duration: Date.now() - currentSession.startTime,
      exitPage: window.location.pathname,
      isActive: false,
      pageViews: pageViewCount.current,
      events: eventCount.current
    }

    setSessions(prev => prev.map(s => s.id === endedSession.id ? endedSession : s))
    setCurrentSession(null)
  }, [currentSession])

  // 跟踪事件
  const trackEvent = useCallback((
    type: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    properties: Record<string, any> = {}
  ) => {
    if (!isEnabled) return

    const event: AnalyticsEvent = {
      id: generateId(),
      type,
      category,
      action,
      label,
      value,
      userId: user?.id,
      sessionId: sessionId.current,
      timestamp: Date.now(),
      properties: {
        ...properties,
        ...getDeviceInfo()
      },
      url: window.location.href,
      userAgent: navigator.userAgent,
      screenSize: `${screen.width}x${screen.height}`,
      language: navigator.language
    }

    setEvents(prev => [...prev, event])
    eventCount.current++
    lastActivity.current = Date.now()
  }, [isEnabled, user, getDeviceInfo])

  // 跟踪页面浏览
  const trackPageView = useCallback((page: string, title?: string) => {
    pageViewCount.current++
    trackEvent('pageview', 'navigation', 'page_view', page, 1, {
      title: title || document.title,
      path: page,
      search: window.location.search,
      hash: window.location.hash
    })
  }, [trackEvent])

  // 跟踪错误
  const trackError = useCallback((error: Error, context?: string) => {
    trackEvent('error', 'javascript', 'error', error.name, 1, {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href
    })
  }, [trackEvent])

  // 跟踪性能
  const trackPerformance = useCallback((metric: string, value: number, context?: string) => {
    trackEvent('performance', 'timing', metric, context, value, {
      metric,
      value,
      context,
      timestamp: Date.now()
    })
  }, [trackEvent])

  // 跟踪用户行为
  const trackUserAction = useCallback((action: string, element: string, properties: Record<string, any> = {}) => {
    trackEvent('user_action', 'interaction', action, element, 1, properties)
  }, [trackEvent])

  // 跟踪功能使用
  const trackFeatureUsage = useCallback((feature: string, properties: Record<string, any> = {}) => {
    trackEvent('feature_usage', 'feature', 'use', feature, 1, properties)
  }, [trackEvent])

  // 获取分析指标
  const getMetrics = useCallback((): AnalyticsMetrics => {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const weekMs = 7 * dayMs
    const monthMs = 30 * dayMs

    // 活跃用户统计
    const dailyActiveUsers = new Set(
      events
        .filter(e => now - e.timestamp < dayMs)
        .map(e => e.userId)
        .filter(Boolean)
    ).size

    const weeklyActiveUsers = new Set(
      events
        .filter(e => now - e.timestamp < weekMs)
        .map(e => e.userId)
        .filter(Boolean)
    ).size

    const monthlyActiveUsers = new Set(
      events
        .filter(e => now - e.timestamp < monthMs)
        .map(e => e.userId)
        .filter(Boolean)
    ).size

    // 会话统计
    const completedSessions = sessions.filter(s => s.endTime)
    const avgDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length
      : 0

    // 跳出率（单页面会话比例）
    const bounceRate = completedSessions.length > 0
      ? (completedSessions.filter(s => s.pageViews <= 1).length / completedSessions.length) * 100
      : 0

    // 功能使用统计
    const featureEvents = events.filter(e => e.category === 'feature')
    const featureUsage = featureEvents.reduce((acc, event) => {
      const feature = event.label || 'unknown'
      acc[feature] = (acc[feature] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topFeatures = Object.entries(featureUsage)
      .map(([name, usage]) => ({ name, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10)

    // 模型使用统计
    const modelEvents = events.filter(e => e.category === 'ai' && e.action === 'send_message')
    const modelUsage = modelEvents.reduce((acc, event) => {
      const model = event.properties?.model || 'unknown'
      acc[model] = (acc[model] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topModels = Object.entries(modelUsage)
      .map(([name, usage]) => ({ name, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10)

    // 错误率
    const errorEvents = events.filter(e => e.type === 'error')
    const errorRate = events.length > 0 ? (errorEvents.length / events.length) * 100 : 0

    // 加载时间
    const performanceEvents = events.filter(e => e.category === 'timing')
    const loadTimeEvents = performanceEvents.filter(e => e.action === 'page_load')
    const avgLoadTime = loadTimeEvents.length > 0
      ? loadTimeEvents.reduce((sum, e) => sum + (e.value || 0), 0) / loadTimeEvents.length
      : 0

    return {
      totalUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
      totalSessions: sessions.length,
      totalEvents: events.length,
      avgSessionDuration: avgDuration,
      bounceRate,
      topFeatures,
      topModels,
      dailyActive: dailyActiveUsers,
      weeklyActive: weeklyActiveUsers,
      monthlyActive: monthlyActiveUsers,
      retentionRate: 0, // 需要更复杂的计算
      errorRate,
      loadTime: avgLoadTime
    }
  }, [events, sessions])

  // 获取事件数据
  const getEvents = useCallback((filters: { category?: string; type?: string; startDate?: Date; endDate?: Date } = {}) => {
    return events.filter(event => {
      if (filters.category && event.category !== filters.category) return false
      if (filters.type && event.type !== filters.type) return false
      if (filters.startDate && event.timestamp < filters.startDate.getTime()) return false
      if (filters.endDate && event.timestamp > filters.endDate.getTime()) return false
      return true
    })
  }, [events])

  // 获取会话数据
  const getSessions = useCallback(() => sessions, [sessions])

  // 导出数据
  const exportData = useCallback(() => {
    const data = {
      events: events,
      sessions: sessions,
      metrics: getMetrics(),
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    }
    return JSON.stringify(data, null, 2)
  }, [events, sessions, getMetrics])

  // 清空数据
  const clearData = useCallback(() => {
    setEvents([])
    setSessions([])
    setCurrentSession(null)
    pageViewCount.current = 0
    eventCount.current = 0
  }, [])

  // 自动跟踪性能指标
  useEffect(() => {
    if (!isEnabled) return

    // 页面加载性能
    const measureLoadTime = () => {
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
        if (loadTime > 0) {
          trackPerformance('page_load', loadTime, 'initial_load')
        }
      }
    }

    // Web Vitals (简化版)
    const measureWebVitals = () => {
      // First Contentful Paint
      if (performance.getEntriesByType) {
        const paintEntries = performance.getEntriesByType('paint')
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        if (fcp) {
          trackPerformance('first_contentful_paint', fcp.startTime, 'web_vitals')
        }
      }
    }

    setTimeout(measureLoadTime, 0)
    setTimeout(measureWebVitals, 100)

    // 监听错误
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), `${event.filename}:${event.lineno}:${event.colno}`)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error(String(event.reason)), 'unhandled_promise_rejection')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [isEnabled, trackPerformance, trackError])

  // 数据持久化
  useEffect(() => {
    const saveData = () => {
      if (isEnabled) {
        localStorage.setItem('analytics_events', JSON.stringify(events.slice(-1000))) // 只保存最近1000条
        localStorage.setItem('analytics_sessions', JSON.stringify(sessions.slice(-100))) // 只保存最近100个会话
      }
    }

    const loadData = () => {
      try {
        const savedEvents = localStorage.getItem('analytics_events')
        const savedSessions = localStorage.getItem('analytics_sessions')

        if (savedEvents) {
          setEvents(JSON.parse(savedEvents))
        }

        if (savedSessions) {
          setSessions(JSON.parse(savedSessions))
        }
      } catch (error) {
        console.error('Failed to load analytics data:', error)
      }
    }

    loadData()

    // 定期保存数据
    const saveInterval = setInterval(saveData, 30000) // 每30秒保存一次

    return () => {
      clearInterval(saveInterval)
      saveData()
    }
  }, [events, sessions, isEnabled])

  const value: AnalyticsContextType = {
    trackEvent,
    trackPageView,
    trackError,
    trackPerformance,
    trackUserAction,
    trackFeatureUsage,
    getMetrics,
    getEvents,
    getSessions,
    exportData,
    clearData,
    isEnabled,
    setEnabled
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export default {
  AnalyticsProvider,
  useAnalytics
}