import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  SignalIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import PerformanceDashboard from './PerformanceDashboard'
import { usePerformanceMonitoring } from '@/hooks/useErrorReporting'

interface PerformanceMonitorProps {
  className?: string
  showFloatingButton?: boolean
  position?: 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left'
}

interface LiveMetrics {
  memoryUsage?: number
  renderTime?: number
  connectionType?: string
  errorCount?: number
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className,
  showFloatingButton = true,
  position = 'bottom-right'
}) => {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({})
  const [isMonitoring, setIsMonitoring] = useState(true)
  const { measureAsync } = usePerformanceMonitoring()

  useEffect(() => {
    if (!isMonitoring) return

    const updateMetrics = async () => {
      const metrics: LiveMetrics = {}

      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory
        metrics.memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      }

      // Connection type
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        metrics.connectionType = connection.effectiveType || 'unknown'
      }

      // Error count from localStorage
      try {
        const crashReports = JSON.parse(localStorage.getItem('crashReports') || '[]')
        metrics.errorCount = crashReports.length
      } catch (error) {
        metrics.errorCount = 0
      }

      setLiveMetrics(metrics)
    }

    // Update metrics every 5 seconds
    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  const getMemoryStatus = () => {
    if (!liveMetrics.memoryUsage) return 'good'
    if (liveMetrics.memoryUsage > 80) return 'critical'
    if (liveMetrics.memoryUsage > 60) return 'warning'
    return 'good'
  }

  const getConnectionStatus = () => {
    const type = liveMetrics.connectionType
    if (type === 'slow-2g' || type === '2g') return 'critical'
    if (type === '3g') return 'warning'
    return 'good'
  }

  const renderCompactMetrics = () => {
    const memoryStatus = getMemoryStatus()
    const connectionStatus = getConnectionStatus()
    const hasErrors = (liveMetrics.errorCount || 0) > 0

    return (
      <div className="flex items-center gap-2 text-xs">
        {/* Memory indicator */}
        {liveMetrics.memoryUsage && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded",
            memoryStatus === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            memoryStatus === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          )}>
            <CpuChipIcon className="w-3 h-3" />
            {liveMetrics.memoryUsage}%
          </div>
        )}

        {/* Connection indicator */}
        {liveMetrics.connectionType && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded",
            connectionStatus === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            connectionStatus === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          )}>
            <SignalIcon className="w-3 h-3" />
            {liveMetrics.connectionType}
          </div>
        )}

        {/* Error indicator */}
        {hasErrors && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <ExclamationTriangleIcon className="w-3 h-3" />
            {liveMetrics.errorCount}
          </div>
        )}
      </div>
    )
  }

  if (!showFloatingButton) {
    return null
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "fixed z-40 flex flex-col gap-2",
          getPositionClasses(),
          className
        )}
      >
        {/* Compact metrics display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2"
        >
          {renderCompactMetrics()}
        </motion.div>

        {/* Main performance button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsDashboardOpen(true)}
            variant="ghost"
            size="sm"
            className="w-12 h-12 p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group"
            title="Open Performance Dashboard"
          >
            <ChartBarIcon className="w-5 h-5" />

            {/* Status indicator */}
            <div className={cn(
              "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800",
              getMemoryStatus() === 'critical' || (liveMetrics.errorCount || 0) > 0 ? 'bg-red-500' :
              getMemoryStatus() === 'warning' ? 'bg-yellow-500' :
              'bg-green-500'
            )} />

            {/* Tooltip */}
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Performance Dashboard
            </div>
          </Button>
        </motion.div>
      </motion.div>

      {/* Performance Dashboard Modal */}
      <PerformanceDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />
    </>
  )
}

// Inline performance widget for headers or status bars
export const InlinePerformanceWidget: React.FC<{
  className?: string
  showLabels?: boolean
}> = ({ className, showLabels = false }) => {
  const [metrics, setMetrics] = useState<LiveMetrics>({})

  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics: LiveMetrics = {}

      if ('memory' in performance) {
        const memory = (performance as any).memory
        newMetrics.memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      }

      setMetrics(newMetrics)
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const getMemoryStatus = () => {
    if (!metrics.memoryUsage) return 'good'
    if (metrics.memoryUsage > 80) return 'critical'
    if (metrics.memoryUsage > 60) return 'warning'
    return 'good'
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      {metrics.memoryUsage && (
        <div className="flex items-center gap-1">
          <div className={cn(
            "w-2 h-2 rounded-full",
            getMemoryStatus() === 'critical' ? 'bg-red-500' :
            getMemoryStatus() === 'warning' ? 'bg-yellow-500' :
            'bg-green-500'
          )} />
          {showLabels && <span className="text-gray-600 dark:text-gray-400">Memory:</span>}
          <span className={cn(
            "font-mono",
            getMemoryStatus() === 'critical' ? 'text-red-600 dark:text-red-400' :
            getMemoryStatus() === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-green-600 dark:text-green-400'
          )}>
            {metrics.memoryUsage}%
          </span>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor