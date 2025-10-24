import { useCallback, useEffect } from 'react'
import { crashReportingService } from '@/services/crashReportingService'

interface UseErrorReportingOptions {
  userId?: string
  context?: Record<string, any>
  enablePerformanceTracking?: boolean
}

export const useErrorReporting = (options: UseErrorReportingOptions = {}) => {
  const {
    userId,
    context = {},
    enablePerformanceTracking = true
  } = options

  // Track page load performance
  useEffect(() => {
    if (!enablePerformanceTracking) return

    const startTime = performance.now()

    const handlePageLoad = () => {
      const loadTime = performance.now() - startTime
      crashReportingService.trackPageLoad(window.location.pathname, loadTime)
    }

    if (document.readyState === 'complete') {
      handlePageLoad()
    } else {
      window.addEventListener('load', handlePageLoad)
      return () => window.removeEventListener('load', handlePageLoad)
    }
  }, [enablePerformanceTracking])

  // Report custom errors
  const reportError = useCallback((error: Error, errorInfo?: any) => {
    crashReportingService.reportError({
      errorId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level: 'component',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: userId || 'unknown',
      buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
      additionalInfo: {
        context,
        errorInfo,
        type: 'manual-report'
      }
    })
  }, [userId, context])

  // Track user actions
  const trackUserAction = useCallback((action: string, data?: any) => {
    crashReportingService.trackUserAction(action, {
      ...data,
      context,
      userId
    })
  }, [context, userId])

  // Track API calls
  const trackApiCall = useCallback((endpoint: string, duration: number, success: boolean, data?: any) => {
    crashReportingService.trackApiCall(endpoint, duration, success)
  }, [])

  // Track component render performance
  const trackRenderPerformance = useCallback((componentName: string, renderTime: number) => {
    crashReportingService.reportPerformanceMetric('componentRender', {
      component: componentName,
      renderTime,
      context,
      timestamp: new Date().toISOString()
    })
  }, [context])

  return {
    reportError,
    trackUserAction,
    trackApiCall,
    trackRenderPerformance
  }
}

// Hook for tracking component mount/unmount
export const useComponentLifecycle = (componentName: string) => {
  const { trackUserAction } = useErrorReporting()

  useEffect(() => {
    const mountTime = performance.now()
    trackUserAction('component_mount', { componentName, mountTime })

    return () => {
      const unmountTime = performance.now()
      const lifetime = unmountTime - mountTime
      trackUserAction('component_unmount', { componentName, unmountTime, lifetime })
    }
  }, [componentName, trackUserAction])
}

// Hook for tracking user interactions
export const useUserInteractionTracking = () => {
  const { trackUserAction } = useErrorReporting()

  const trackClick = useCallback((elementId: string, elementType?: string, data?: any) => {
    trackUserAction('click', {
      elementId,
      elementType,
      ...data
    })
  }, [trackUserAction])

  const trackInput = useCallback((inputId: string, inputType?: string, value?: string) => {
    trackUserAction('input', {
      inputId,
      inputType,
      valueLength: value?.length || 0
    })
  }, [trackUserAction])

  const trackNavigation = useCallback((from: string, to: string) => {
    trackUserAction('navigation', {
      from,
      to,
      timestamp: new Date().toISOString()
    })
  }, [trackUserAction])

  const trackFeatureUsage = useCallback((featureName: string, data?: any) => {
    trackUserAction('feature_usage', {
      featureName,
      ...data
    })
  }, [trackUserAction])

  return {
    trackClick,
    trackInput,
    trackNavigation,
    trackFeatureUsage
  }
}

// Hook for API request tracking
export const useApiTracking = () => {
  const { trackApiCall } = useErrorReporting()

  const trackRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    endpoint: string,
    options?: { timeout?: number }
  ): Promise<T> => {
    const startTime = performance.now()
    let success = false

    try {
      const result = await requestFn()
      success = true
      return result
    } catch (error) {
      success = false
      throw error
    } finally {
      const duration = performance.now() - startTime
      trackApiCall(endpoint, duration, success)
    }
  }, [trackApiCall])

  return { trackRequest }
}

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const startTime = useCallback(() => {
    return performance.now()
  }, [])

  const endTime = useCallback((start: number, operation: string, data?: any) => {
    const duration = performance.now() - start
    crashReportingService.reportPerformanceMetric('operation', {
      operation,
      duration,
      ...data,
      timestamp: new Date().toISOString()
    })
    return duration
  }, [])

  const measureAsync = useCallback(async <T>(
    operation: string,
    asyncFn: () => Promise<T>,
    data?: any
  ): Promise<T> => {
    const start = startTime()
    try {
      const result = await asyncFn()
      endTime(start, operation, { ...data, success: true })
      return result
    } catch (error) {
      endTime(start, operation, { ...data, success: false, error: (error as Error).message })
      throw error
    }
  }, [startTime, endTime])

  return {
    startTime,
    endTime,
    measureAsync
  }
}