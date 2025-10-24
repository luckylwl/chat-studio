import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/store'
import Sidebar from './Sidebar'
import Header from './Header'
import PerformanceMonitor from './PerformanceMonitor'
import { useUserInteractionTracking } from '@/hooks/useErrorReporting'
import { useResponsive } from '@/hooks/useResponsive'
import { cn } from '@/utils'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const { isMobile, isTablet, isTouch } = useResponsive()
  const { trackNavigation } = useUserInteractionTracking()

  // 在移动端自动关闭侧边栏
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [isMobile, sidebarOpen, setSidebarOpen])

  // Track navigation changes
  useEffect(() => {
    trackNavigation(document.referrer || 'direct', location.pathname)
  }, [location.pathname, trackNavigation])

  // 移动端点击遮罩关闭侧边栏
  const handleBackdropClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 移动端遮罩层 */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={handleBackdropClick}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'flex-shrink-0 transition-all duration-300 ease-in-out z-50',
        isMobile ? (
          sidebarOpen
            ? 'fixed left-0 top-0 h-full w-80 max-w-[85vw] shadow-2xl safe-all'
            : 'fixed left-0 top-0 h-full w-0 -translate-x-full'
        ) : (
          sidebarOpen ? 'w-80' : 'w-0'
        ),
        'border-r border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-900',
        isTouch && 'touchable'
      )}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className={cn(isMobile && 'safe-top')}>
          <Header />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-hidden relative">
          <div className={cn(
            'h-full w-full relative',
            isMobile && 'momentum-scroll'
          )}>
            {children}
          </div>
        </main>

        {/* 底部安全区域 (iOS) */}
        {isMobile && <div className="h-safe-bottom bg-gray-50 dark:bg-gray-900" />}
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor
        position="bottom-left"
        showFloatingButton={true}
      />
    </div>
  )
}

export default Layout