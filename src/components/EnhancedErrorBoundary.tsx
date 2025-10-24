import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  level?: 'page' | 'component' | 'critical'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
  copied: boolean
}

class EnhancedErrorBoundary extends Component<Props, State> {
  private errorTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      copied: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props

    // 记录错误
    console.error(`[Error Boundary ${level}]`, error, errorInfo)

    // 更新状态
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // 调用错误回调
    if (onError) {
      onError(error, errorInfo)
    }

    // 发送错误报告到监控服务
    this.reportError(error, errorInfo)

    // 自动恢复机制 (仅限组件级错误)
    if (level === 'component' && this.state.errorCount < 3) {
      this.errorTimeout = setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null
        })
      }, 5000)
    }
  }

  componentWillUnmount() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout)
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // 这里可以集成 Sentry, LogRocket 等错误追踪服务
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level
    }

    // 发送到错误追踪服务
    if (process.env.NODE_ENV === 'production') {
      // fetch('/api/error-report', {
      //   method: 'POST',
      //   body: JSON.stringify(errorReport)
      // })
    }

    // 开发环境打印详细信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🐛 Error Report')
      console.error('Error:', error)
      console.error('Component Stack:', errorInfo.componentStack)
      console.error('Full Report:', errorReport)
      console.groupEnd()
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private copyErrorDetails = () => {
    const { error, errorInfo } = this.state
    const errorText = `
Error: ${error?.message}

Stack Trace:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}

User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `.trim()

    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    })
  }

  render() {
    const { hasError, error, errorInfo, copied } = this.state
    const { children, fallback, showDetails = true, level = 'component' } = this.props

    if (hasError) {
      // 使用自定义 fallback
      if (fallback) {
        return fallback
      }

      // 根据错误级别显示不同的UI
      if (level === 'critical') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4">
            <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    应用程序崩溃
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    很抱歉,应用程序遇到了严重错误
                  </p>
                </div>
              </div>

              {showDetails && error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm font-mono text-red-800 dark:text-red-300 mb-2">
                    {error.message}
                  </p>
                  {errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-red-700 dark:text-red-400 hover:underline">
                        查看详细信息
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 dark:text-red-500 overflow-auto max-h-40 p-2 bg-white dark:bg-gray-900 rounded">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  重新加载
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  返回首页
                </button>
                <button
                  onClick={this.copyErrorDetails}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title="复制错误信息"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )
      }

      if (level === 'page') {
        return (
          <div className="min-h-[400px] flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
              <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bug className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                页面加载失败
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error?.message || '发生了未知错误'}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  重试
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  返回首页
                </button>
              </div>
            </div>
          </div>
        )
      }

      // 组件级错误 (轻量级提示)
      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                组件加载失败
              </p>
              {showDetails && (
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  {error?.message}
                </p>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="flex-shrink-0 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return children
  }
}

export default EnhancedErrorBoundary

// 便捷的包装组件
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <EnhancedErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </EnhancedErrorBoundary>
    )
  }
}

// HOC 用法示例
// export default withErrorBoundary(MyComponent, { level: 'page', showDetails: true })
