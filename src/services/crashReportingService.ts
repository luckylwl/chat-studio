interface CrashReport {
  errorId: string
  level: 'page' | 'component' | 'critical'
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  userAgent: string
  url: string
  userId: string
  buildVersion: string
  additionalInfo?: any
}

interface PerformanceMetrics {
  timestamp: string
  userId: string
  sessionId: string
  metrics: {
    // Core Web Vitals
    LCP?: number // Largest Contentful Paint
    FID?: number // First Input Delay
    CLS?: number // Cumulative Layout Shift
    TTFB?: number // Time to First Byte
    FCP?: number // First Contentful Paint

    // Custom metrics
    memoryUsage?: {
      usedHeap: number
      totalHeap: number
      limit: number
    }
    renderTime?: number
    apiResponseTime?: number
    errorCount?: number
    userInteractions?: number
  }
  page: string
  buildVersion: string
}

class CrashReportingService {
  private static instance: CrashReportingService
  private userId: string
  private sessionId: string
  private buildVersion: string
  private performanceBuffer: PerformanceMetrics[] = []
  private errorBuffer: CrashReport[] = []
  private isOnline: boolean = navigator.onLine

  constructor() {
    this.userId = this.getUserId()
    this.sessionId = this.generateSessionId()
    this.buildVersion = import.meta.env.VITE_APP_VERSION || 'unknown'
    this.initializeService()
  }

  static getInstance(): CrashReportingService {
    if (!CrashReportingService.instance) {
      CrashReportingService.instance = new CrashReportingService()
    }
    return CrashReportingService.instance
  }

  private initializeService() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushBufferedReports()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Set up performance monitoring
    this.setupPerformanceMonitoring()

    // Set up global error handling
    this.setupGlobalErrorHandling()

    // Periodic flush of buffered data
    setInterval(() => {
      if (this.isOnline) {
        this.flushBufferedReports()
      }
    }, 30000) // Flush every 30 seconds

    // Before unload - send final reports
    window.addEventListener('beforeunload', () => {
      this.flushBufferedReports()
    })
  }

  private setupGlobalErrorHandling() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        errorId: this.generateErrorId(),
        level: 'critical',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.userId,
        buildVersion: this.buildVersion,
        additionalInfo: {
          type: 'unhandledrejection',
          reason: event.reason
        }
      })
    })

    // Catch global JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        errorId: this.generateErrorId(),
        level: 'critical',
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.userId,
        buildVersion: this.buildVersion,
        additionalInfo: {
          type: 'javascript-error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })
  }

  private setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.reportPerformanceMetric('LCP', lastEntry.startTime)
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.warn('LCP observer not supported')
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.reportPerformanceMetric('FID', entry.processingStart - entry.startTime)
        })
      })

      try {
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        console.warn('FID observer not supported')
      }

      // Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.reportPerformanceMetric('CLS', clsValue)
      })

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.warn('CLS observer not supported')
      }
    }

    // Monitor memory usage
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.reportPerformanceMetric('memoryUsage', {
          usedHeap: memory.usedJSHeapSize,
          totalHeap: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        })
      }
    }, 10000) // Every 10 seconds
  }

  reportError(crashReport: CrashReport) {
    console.error('Crash Report:', crashReport)

    // Add to buffer
    this.errorBuffer.push(crashReport)

    // Store locally for offline reporting
    this.storeErrorLocally(crashReport)

    // Try to send immediately if online
    if (this.isOnline) {
      this.sendErrorReport(crashReport)
    }
  }

  reportPerformanceMetric(metric: string, value: any) {
    const performanceData: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      metrics: { [metric]: value },
      page: window.location.pathname,
      buildVersion: this.buildVersion
    }

    this.performanceBuffer.push(performanceData)

    // Send batch of performance metrics periodically
    if (this.performanceBuffer.length >= 10) {
      this.flushPerformanceMetrics()
    }
  }

  private async sendErrorReport(report: CrashReport) {
    try {
      // This would be replaced with your actual crash reporting service
      // Examples: Sentry, Bugsnag, LogRocket, etc.

      console.log('Sending crash report to service:', report)

      // Example implementation:
      // await fetch('/api/crash-reports', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // })

      // For demo purposes, we'll use localStorage as a mock service
      const existingReports = JSON.parse(localStorage.getItem('crashReports') || '[]')
      existingReports.push(report)
      localStorage.setItem('crashReports', JSON.stringify(existingReports))

    } catch (error) {
      console.error('Failed to send crash report:', error)
    }
  }

  private async sendPerformanceMetrics(metrics: PerformanceMetrics[]) {
    try {
      console.log('Sending performance metrics:', metrics)

      // Example implementation:
      // await fetch('/api/performance-metrics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metrics)
      // })

      // For demo purposes, store in localStorage
      const existingMetrics = JSON.parse(localStorage.getItem('performanceMetrics') || '[]')
      existingMetrics.push(...metrics)
      localStorage.setItem('performanceMetrics', JSON.stringify(existingMetrics.slice(-100))) // Keep last 100

    } catch (error) {
      console.error('Failed to send performance metrics:', error)
    }
  }

  private flushBufferedReports() {
    if (this.errorBuffer.length > 0) {
      this.errorBuffer.forEach(report => this.sendErrorReport(report))
      this.errorBuffer = []
    }

    this.flushPerformanceMetrics()
  }

  private flushPerformanceMetrics() {
    if (this.performanceBuffer.length > 0) {
      this.sendPerformanceMetrics([...this.performanceBuffer])
      this.performanceBuffer = []
    }
  }

  private storeErrorLocally(report: CrashReport) {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('pendingErrorReports') || '[]')
      existingErrors.push(report)

      // Keep only last 50 errors
      const recentErrors = existingErrors.slice(-50)
      localStorage.setItem('pendingErrorReports', JSON.stringify(recentErrors))
    } catch (error) {
      console.error('Failed to store error locally:', error)
    }
  }

  private getUserId(): string {
    try {
      let userId = localStorage.getItem('userId')
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('userId', userId)
      }
      return userId
    } catch {
      return 'anonymous'
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API methods
  trackUserAction(action: string, data?: any) {
    this.reportPerformanceMetric('userInteraction', {
      action,
      data,
      timestamp: new Date().toISOString()
    })
  }

  trackApiCall(endpoint: string, duration: number, success: boolean) {
    this.reportPerformanceMetric('apiCall', {
      endpoint,
      duration,
      success,
      timestamp: new Date().toISOString()
    })
  }

  trackPageLoad(page: string, loadTime: number) {
    this.reportPerformanceMetric('pageLoad', {
      page,
      loadTime,
      timestamp: new Date().toISOString()
    })
  }

  // Get stored reports for debugging
  getStoredReports() {
    return {
      crashReports: JSON.parse(localStorage.getItem('crashReports') || '[]'),
      performanceMetrics: JSON.parse(localStorage.getItem('performanceMetrics') || '[]'),
      pendingReports: JSON.parse(localStorage.getItem('pendingErrorReports') || '[]')
    }
  }

  // Clear all stored reports
  clearStoredReports() {
    localStorage.removeItem('crashReports')
    localStorage.removeItem('performanceMetrics')
    localStorage.removeItem('pendingErrorReports')
  }
}

export const crashReportingService = CrashReportingService.getInstance()
export default crashReportingService