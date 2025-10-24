import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoadingAnimation, { PageLoader } from '@/components/LoadingAnimation'
import { PageErrorBoundary } from '@/components/ErrorBoundary'

// Lazy load pages for code splitting
const ChatPage = React.lazy(() => import('@/pages/ChatPage'))
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'))
const QuickSetup = React.lazy(() => import('@/pages/QuickSetup'))
const AdvancedFeaturesPage = React.lazy(() => import('@/pages/AdvancedFeaturesPage'))

// Wrapper component for lazy-loaded pages
const LazyPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </PageErrorBoundary>
)

// Main routing component with lazy loading
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/setup"
        element={
          <LazyPageWrapper>
            <QuickSetup />
          </LazyPageWrapper>
        }
      />
      <Route path="/">
        <Route index element={<Navigate to="/chat" replace />} />
        <Route
          path="chat"
          element={
            <LazyPageWrapper>
              <ChatPage />
            </LazyPageWrapper>
          }
        />
        <Route
          path="chat/:conversationId"
          element={
            <LazyPageWrapper>
              <ChatPage />
            </LazyPageWrapper>
          }
        />
        <Route
          path="advanced"
          element={
            <LazyPageWrapper>
              <AdvancedFeaturesPage />
            </LazyPageWrapper>
          }
        />
        <Route
          path="settings"
          element={
            <LazyPageWrapper>
              <SettingsPage />
            </LazyPageWrapper>
          }
        />
      </Route>
    </Routes>
  )
}

// Component-level lazy loading for heavy components
export const LazyVoiceControl = React.lazy(() => import('@/components/VoiceControl'))
export const LazyPerformanceDashboard = React.lazy(() => import('@/components/PerformanceDashboard'))
export const LazyExportButton = React.lazy(() => import('@/components/ExportButton'))
export const LazyAdvancedSearch = React.lazy(() => import('@/components/AdvancedSearch'))
export const LazyDragDropUpload = React.lazy(() => import('@/components/DragDropUpload'))

// Lazy wrapper for heavy components
export const LazyComponentWrapper: React.FC<{
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ children, fallback }) => (
  <Suspense fallback={fallback || <LoadingAnimation variant="spinner" size="sm" />}>
    {children}
  </Suspense>
)

export default AppRoutes