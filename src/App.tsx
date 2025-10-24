import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import Layout from '@/components/Layout'
import ChatPage from '@/pages/ChatPage'
import SettingsPage from '@/pages/SettingsPage'
import QuickSetup from '@/pages/QuickSetup'
import AdvancedFeaturesPage from '@/pages/AdvancedFeaturesPage'
import { CriticalErrorBoundary, PageErrorBoundary } from '@/components/ErrorBoundary'
import { useErrorReporting } from '@/hooks/useErrorReporting'
import { useRoutePreloading } from '@/hooks/useRoutePreloading'
import pwaService from '@/services/pwaService'
import offlineStorageService from '@/services/offlineStorageService'
import bundleAnalyzer from '@/utils/bundleAnalysis'
import i18nService from '@/services/i18nService'
import themeService from '@/services/themeService'

function App() {
  const theme = useAppStore((state) => state.theme)
  const { trackUserAction } = useErrorReporting({
    enablePerformanceTracking: true
  })

  // Initialize route preloading
  useRoutePreloading({
    preloadOnHover: true,
    preloadAdjacent: true,
    preloadPopular: true,
    componentPreloading: true
  })

  // 初始化主题服务
  React.useEffect(() => {
    // 主题服务会自动应用主题设置
    themeService.getSettings()
  }, [])

  // 保持与存储状态的兼容性
  React.useEffect(() => {
    const root = window.document.documentElement
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const actualTheme = theme === 'system' ? systemTheme : theme

    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)

    // Track theme changes
    trackUserAction('theme_change', { theme: actualTheme })
  }, [theme, trackUserAction])

  // 初始化国际化服务
  React.useEffect(() => {
    i18nService.getSettings()
    trackUserAction('app_initialization', { timestamp: new Date().toISOString() })
  }, [trackUserAction])

  // Initialize PWA and offline services
  React.useEffect(() => {
    // Initialize PWA service
    pwaService

    // Initialize offline storage
    offlineStorageService

    // Initialize bundle analyzer
    bundleAnalyzer

    // Track app loading performance
    const loadTime = performance.now()
    trackUserAction('app_load_complete', {
      loadTime: Math.round(loadTime),
      timestamp: new Date().toISOString()
    })
  }, [trackUserAction])

  return (
    <CriticalErrorBoundary>
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
        <Routes>
          <Route path="/setup" element={
            <PageErrorBoundary>
              <QuickSetup />
            </PageErrorBoundary>
          } />
          <Route path="/*" element={
            <PageErrorBoundary>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/chat" replace />} />
                  <Route path="/chat" element={
                    <PageErrorBoundary>
                      <ChatPage />
                    </PageErrorBoundary>
                  } />
                  <Route path="/chat/:conversationId" element={
                    <PageErrorBoundary>
                      <ChatPage />
                    </PageErrorBoundary>
                  } />
                  <Route path="/advanced" element={
                    <PageErrorBoundary>
                      <AdvancedFeaturesPage />
                    </PageErrorBoundary>
                  } />
                  <Route path="/settings" element={
                    <PageErrorBoundary>
                      <SettingsPage />
                    </PageErrorBoundary>
                  } />
                </Routes>
              </Layout>
            </PageErrorBoundary>
          } />
        </Routes>
      </div>
    </CriticalErrorBoundary>
  )
}

export default App