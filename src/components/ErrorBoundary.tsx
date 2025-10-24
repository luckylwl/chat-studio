import React, { Component, ReactNode, ErrorInfo } from 'react'
import { Button } from './ui'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
  showReportButton?: boolean
  level?: 'page' | 'component' | 'critical'
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props
    const { errorId } = this.state

    this.setState({
      error,
      errorInfo,
      errorId
    })

    // Report error to crash reporting service
    this.reportError(error, errorInfo, errorId, level)

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo, errorId)
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string, level: string) => {
    try {
      const errorReport = {
        errorId,
        level,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
        buildVersion: this.getBuildVersion(),
        additionalInfo: {
          retryCount: this.retryCount,
          errorBoundaryProps: {
            level,
            showReportButton: this.props.showReportButton
          }
        }
      }

      // Store error locally for offline reporting
      this.storeErrorLocally(errorReport)

      // Send to crash reporting service (implement your service here)
      await this.sendToCrashReportingService(errorReport)

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private getUserId = (): string => {
    try {
      return localStorage.getItem('userId') || 'anonymous'
    } catch {
      return 'anonymous'
    }
  }

  private getBuildVersion = (): string => {
    return import.meta.env.VITE_APP_VERSION || 'unknown'
  }

  private storeErrorLocally = (errorReport: any) => {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('pendingErrorReports') || '[]')
      existingErrors.push(errorReport)

      // Keep only last 10 errors
      const recentErrors = existingErrors.slice(-10)
      localStorage.setItem('pendingErrorReports', JSON.stringify(recentErrors))
    } catch (error) {
      console.error('Failed to store error locally:', error)
    }
  }

  private sendToCrashReportingService = async (errorReport: any) => {
    // This would integrate with services like Sentry, Bugsnag, etc.
    // For now, we'll just log it
    console.log('Crash report:', errorReport)

    // Example implementation:
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // })
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      })
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleDownloadErrorReport = () => {
    const { error, errorInfo, errorId } = this.state

    const errorReport = {
      errorId,
      timestamp: new Date().toISOString(),
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    const blob = new Blob([JSON.stringify(errorReport, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-report-${errorId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  render() {
    const { hasError, error, errorId } = this.state
    const { children, fallback, showReportButton = true, level = 'component' } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center">
            <div className="mb-6">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {level === 'critical' ? 'Critical Error' : 'Something went wrong'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {level === 'critical'
                  ? 'A critical error has occurred and the application cannot continue.'
                  : 'We encountered an unexpected error. This has been reported to our team.'}
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs text-left">
                <p className="font-mono text-gray-700 dark:text-gray-300 break-all">
                  Error ID: {errorId}
                </p>
                {error?.message && (
                  <p className="font-mono text-red-600 dark:text-red-400 mt-2">
                    {error.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {this.retryCount < this.maxRetries && (
                <Button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-2"
                >
                  <HomeIcon className="w-4 h-4" />
                  Go Home
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Reload
                </Button>
              </div>

              {showReportButton && (
                <Button
                  onClick={this.handleDownloadErrorReport}
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  Download Error Report
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              If this problem persists, please contact support with the Error ID above.
            </p>
          </div>
        </div>
      )
    }

    return children
  }
}

// Specialized error boundaries for different scenarios
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page" showReportButton={true}>
    {children}
  </ErrorBoundary>
)

export const ComponentErrorBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
}> = ({ children, fallback }) => (
  <ErrorBoundary
    level="component"
    showReportButton={false}
    fallback={fallback || (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Component Error</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-xs mt-1">
          This component failed to load. Please try refreshing the page.
        </p>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
)

export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="critical" showReportButton={true}>
    {children}
  </ErrorBoundary>
)

export default ErrorBoundary