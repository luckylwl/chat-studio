/**
 * React Hook for Performance Monitoring
 */

import { useEffect, useRef, useState } from 'react'
import { monitorComponentRender, trackEvent } from '../utils/monitoring'

/**
 * Monitor component render performance
 */
export const useRenderMonitor = (componentName: string) => {
  const renderCount = useRef(0)
  const renderStartTime = useRef(performance.now())

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current
    renderCount.current++

    monitorComponentRender(componentName, renderTime)

    if (renderCount.current > 10) {
      console.warn(`⚠️  Component ${componentName} has rendered ${renderCount.current} times`)
    }

    renderStartTime.current = performance.now()
  })

  return { renderCount: renderCount.current }
}

/**
 * Monitor network status
 */
export const useNetworkMonitor = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      trackEvent('network_online', 'Network')
    }

    const handleOffline = () => {
      setIsOnline(false)
      trackEvent('network_offline', 'Network')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline }
}
