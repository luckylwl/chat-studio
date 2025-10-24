import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  // Web Vitals
  FCP?: number  // First Contentful Paint
  LCP?: number  // Largest Contentful Paint
  FID?: number  // First Input Delay
  CLS?: number  // Cumulative Layout Shift
  TTFB?: number // Time to First Byte

  // 自定义指标
  componentRenderTime?: number
  apiResponseTime?: number
  memoryUsage?: number

  timestamp: number
}

interface PerformanceMonitorOptions {
  enableWebVitals?: boolean
  enableMemoryTracking?: boolean
  enableNetworkTracking?: boolean
  reportInterval?: number
  onMetricUpdate?: (metrics: PerformanceMetrics) => void
}

export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const {
    enableWebVitals = true,
    enableMemoryTracking = true,
    enableNetworkTracking = true,
    reportInterval = 5000,
    onMetricUpdate
  } = options

  const metricsRef = useRef<PerformanceMetrics>({ timestamp: Date.now() })
  const reportTimerRef = useRef<NodeJS.Timeout>()

  // 测量组件渲染时间
  const measureRenderTime = useCallback((componentName: string) => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      metricsRef.current.componentRenderTime = renderTime

      if (renderTime > 16) { // 超过一帧时间(16ms)
        console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [])

  // 测量 API 响应时间
  const measureApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<T> => {
    const startTime = performance.now()

    try {
      const result = await apiCall()
      const endTime = performance.now()
      const responseTime = endTime - startTime

      metricsRef.current.apiResponseTime = responseTime

      if (responseTime > 1000) { // 超过1秒
        console.warn(`[Performance] ${apiName} took ${responseTime.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      console.error(`[Performance] ${apiName} failed after ${(endTime - startTime).toFixed(2)}ms`)
      throw error
    }
  }, [])

  // Web Vitals 监控
  useEffect(() => {
    if (!enableWebVitals) return

    // FCP - First Contentful Paint
    const observeFCP = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metricsRef.current.FCP = entry.startTime
            console.log(`[Web Vitals] FCP: ${entry.startTime.toFixed(2)}ms`)
          }
        }
      })
      observer.observe({ entryTypes: ['paint'] })
      return observer
    }

    // LCP - Largest Contentful Paint
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        metricsRef.current.LCP = lastEntry.startTime
        console.log(`[Web Vitals] LCP: ${lastEntry.startTime.toFixed(2)}ms`)
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      return observer
    }

    // FID - First Input Delay
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any
          metricsRef.current.FID = fidEntry.processingStart - fidEntry.startTime
          console.log(`[Web Vitals] FID: ${metricsRef.current.FID?.toFixed(2)}ms`)
        }
      })
      observer.observe({ entryTypes: ['first-input'] })
      return observer
    }

    // CLS - Cumulative Layout Shift
    const observeCLS = () => {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value
            metricsRef.current.CLS = clsValue
          }
        }
      })
      observer.observe({ entryTypes: ['layout-shift'] })
      return observer
    }

    // TTFB - Time to First Byte
    const measureTTFB = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationEntry) {
        metricsRef.current.TTFB = navigationEntry.responseStart - navigationEntry.requestStart
        console.log(`[Web Vitals] TTFB: ${metricsRef.current.TTFB?.toFixed(2)}ms`)
      }
    }

    const observers: PerformanceObserver[] = []

    try {
      observers.push(observeFCP())
      observers.push(observeLCP())
      observers.push(observeFID())
      observers.push(observeCLS())
      measureTTFB()
    } catch (error) {
      console.error('[Performance Monitor] Error setting up observers:', error)
    }

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [enableWebVitals])

  // 内存监控
  useEffect(() => {
    if (!enableMemoryTracking) return

    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        metricsRef.current.memoryUsage = memory.usedJSHeapSize / 1048576 // MB

        // 警告: 内存使用超过 100MB
        if (metricsRef.current.memoryUsage > 100) {
          console.warn(`[Performance] High memory usage: ${metricsRef.current.memoryUsage.toFixed(2)}MB`)
        }
      }
    }

    const interval = setInterval(measureMemory, reportInterval)
    return () => clearInterval(interval)
  }, [enableMemoryTracking, reportInterval])

  // 网络性能监控
  useEffect(() => {
    if (!enableNetworkTracking) return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming

        // 只记录慢速请求 (超过2秒)
        if (resourceEntry.duration > 2000) {
          console.warn(`[Performance] Slow resource: ${resourceEntry.name} (${resourceEntry.duration.toFixed(2)}ms)`)
        }

        // 检查大文件 (超过1MB)
        if (resourceEntry.transferSize > 1048576) {
          console.warn(`[Performance] Large resource: ${resourceEntry.name} (${(resourceEntry.transferSize / 1048576).toFixed(2)}MB)`)
        }
      }
    })

    observer.observe({ entryTypes: ['resource'] })

    return () => observer.disconnect()
  }, [enableNetworkTracking])

  // 定期报告指标
  useEffect(() => {
    if (!onMetricUpdate) return

    const reportMetrics = () => {
      const currentMetrics = {
        ...metricsRef.current,
        timestamp: Date.now()
      }
      onMetricUpdate(currentMetrics)
    }

    reportTimerRef.current = setInterval(reportMetrics, reportInterval)

    return () => {
      if (reportTimerRef.current) {
        clearInterval(reportTimerRef.current)
      }
    }
  }, [reportInterval, onMetricUpdate])

  // 获取当前指标
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current }
  }, [])

  // 获取性能报告
  const getPerformanceReport = useCallback(() => {
    const metrics = getMetrics()

    const ratings = {
      FCP: metrics.FCP ? (metrics.FCP < 1800 ? 'good' : metrics.FCP < 3000 ? 'needs-improvement' : 'poor') : 'unknown',
      LCP: metrics.LCP ? (metrics.LCP < 2500 ? 'good' : metrics.LCP < 4000 ? 'needs-improvement' : 'poor') : 'unknown',
      FID: metrics.FID ? (metrics.FID < 100 ? 'good' : metrics.FID < 300 ? 'needs-improvement' : 'poor') : 'unknown',
      CLS: metrics.CLS ? (metrics.CLS < 0.1 ? 'good' : metrics.CLS < 0.25 ? 'needs-improvement' : 'poor') : 'unknown',
      TTFB: metrics.TTFB ? (metrics.TTFB < 800 ? 'good' : metrics.TTFB < 1800 ? 'needs-improvement' : 'poor') : 'unknown',
    }

    return {
      metrics,
      ratings,
      overall: Object.values(ratings).every(r => r === 'good') ? 'excellent' :
               Object.values(ratings).some(r => r === 'poor') ? 'poor' : 'fair'
    }
  }, [getMetrics])

  // 性能优化建议
  const getSuggestions = useCallback(() => {
    const metrics = getMetrics()
    const suggestions: string[] = []

    if (metrics.FCP && metrics.FCP > 3000) {
      suggestions.push('Consider code splitting to improve First Contentful Paint')
    }

    if (metrics.LCP && metrics.LCP > 4000) {
      suggestions.push('Optimize largest content element (images, fonts) to improve LCP')
    }

    if (metrics.FID && metrics.FID > 300) {
      suggestions.push('Reduce JavaScript execution time to improve First Input Delay')
    }

    if (metrics.CLS && metrics.CLS > 0.25) {
      suggestions.push('Add size attributes to images/videos to prevent layout shifts')
    }

    if (metrics.componentRenderTime && metrics.componentRenderTime > 50) {
      suggestions.push('Consider using React.memo or useMemo to optimize component rendering')
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 100) {
      suggestions.push('High memory usage detected. Check for memory leaks or optimize data structures')
    }

    if (metrics.apiResponseTime && metrics.apiResponseTime > 3000) {
      suggestions.push('API response is slow. Consider caching or optimizing backend')
    }

    return suggestions
  }, [getMetrics])

  return {
    measureRenderTime,
    measureApiCall,
    getMetrics,
    getPerformanceReport,
    getSuggestions
  }
}

// 性能监控 Provider
export function PerformanceMonitorProvider({ children }: { children: React.ReactNode }) {
  const { getPerformanceReport, getSuggestions } = usePerformanceMonitor({
    enableWebVitals: true,
    enableMemoryTracking: true,
    enableNetworkTracking: true,
    reportInterval: 10000,
    onMetricUpdate: (metrics) => {
      // 在开发环境显示性能指标
      if (process.env.NODE_ENV === 'development') {
        console.log('[Performance Metrics]', metrics)
      }
    }
  })

  // 在开发环境中添加全局性能检查
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 添加到 window 对象供开发者工具使用
      (window as any).__performanceReport = getPerformanceReport
      (window as any).__performanceSuggestions = getSuggestions

      console.log('[Performance Monitor] Enabled. Use window.__performanceReport() to get report')
    }
  }, [getPerformanceReport, getSuggestions])

  return <>{children}</>
}
