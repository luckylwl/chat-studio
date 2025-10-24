import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call the optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to error reporting service (e.g., Sentry)
    if (import.meta.env.VITE_SENTRY_DSN) {
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
      console.log('Error would be sent to Sentry:', error)
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="flex justify-center mb-6"
            >
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Oops! Something went wrong
            </h1>

            {/* Description */}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              We're sorry for the inconvenience. An unexpected error occurred in the application.
            </p>

            {/* Error details (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto max-h-60"
              >
                <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                  <strong>Error:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                      Component Stack
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
              >
                <RefreshCw size={18} />
                Try Again
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                <Home size={18} />
                Go Home
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Reload Page
              </motion.button>
            </div>

            {/* Help text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8"
            >
              If the problem persists, please contact support or{' '}
              <a
                href="https://github.com/your-repo/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                report an issue
              </a>
            </motion.p>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}
