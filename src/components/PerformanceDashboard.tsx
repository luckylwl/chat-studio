import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { crashReportingService } from '@/services/crashReportingService'

interface PerformanceMetric {
  name: string
  value: number | string
  unit?: string
  status: 'good' | 'warning' | 'critical'
  description: string
  threshold?: number
}

interface PerformanceDashboardProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [storedReports, setStoredReports] = useState<any>({
    crashReports: [],
    performanceMetrics: [],
    pendingReports: []
  })

  const refreshMetrics = async () => {
    setIsRefreshing(true)

    try {
      const reports = crashReportingService.getStoredReports()
      setStoredReports(reports)

      // Get current performance metrics
      const currentMetrics: PerformanceMetric[] = []

      // Memory metrics
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

        currentMetrics.push({
          name: 'Memory Usage',
          value: Math.round(memoryUsage),
          unit: '%',
          status: memoryUsage > 80 ? 'critical' : memoryUsage > 60 ? 'warning' : 'good',
          description: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB`,
          threshold: 80
        })

        currentMetrics.push({
          name: 'Heap Size',
          value: (memory.usedJSHeapSize / 1024 / 1024).toFixed(1),
          unit: 'MB',
          status: memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8 ? 'critical' : 'good',
          description: 'Current heap memory usage'
        })
      }

      // Performance timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.navigationStart
        currentMetrics.push({
          name: 'Page Load Time',
          value: Math.round(loadTime),
          unit: 'ms',
          status: loadTime > 3000 ? 'critical' : loadTime > 1500 ? 'warning' : 'good',
          description: 'Time from navigation to load complete',
          threshold: 3000
        })

        const ttfb = navigation.responseStart - navigation.navigationStart
        currentMetrics.push({
          name: 'Time to First Byte',
          value: Math.round(ttfb),
          unit: 'ms',
          status: ttfb > 800 ? 'critical' : ttfb > 400 ? 'warning' : 'good',
          description: 'Time to receive first byte from server',
          threshold: 800
        })
      }

      // Error metrics
      currentMetrics.push({
        name: 'Error Count',
        value: reports.crashReports.length,
        unit: 'errors',
        status: reports.crashReports.length > 5 ? 'critical' : reports.crashReports.length > 2 ? 'warning' : 'good',
        description: 'Total number of recorded errors',
        threshold: 5
      })

      // Connection metrics
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        const effectiveType = connection.effectiveType || 'unknown'
        const downlink = connection.downlink || 0

        currentMetrics.push({
          name: 'Connection Speed',
          value: effectiveType,
          status: effectiveType === 'slow-2g' || effectiveType === '2g' ? 'critical' :
                 effectiveType === '3g' ? 'warning' : 'good',
          description: `${downlink} Mbps downlink`
        })
      }

      // Bundle size estimation (rough calculation)
      const bundleSize = document.querySelectorAll('script').length * 50 // Rough estimate
      currentMetrics.push({
        name: 'Bundle Size',
        value: bundleSize,
        unit: 'KB',
        status: bundleSize > 1000 ? 'critical' : bundleSize > 500 ? 'warning' : 'good',
        description: 'Estimated JavaScript bundle size'
      })

      setMetrics(currentMetrics)

    } catch (error) {
      console.error('Failed to refresh metrics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const clearStoredReports = () => {
    crashReportingService.clearStoredReports()
    refreshMetrics()
  }

  const downloadReports = () => {
    const reports = crashReportingService.getStoredReports()
    const dataStr = JSON.stringify(reports, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `performance-reports-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  useEffect(() => {
    if (isOpen) {
      refreshMetrics()
    }
  }, [isOpen])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      case 'critical': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 dark:bg-green-900/20'
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/20'
      case 'critical': return 'bg-red-100 dark:bg-red-900/20'
      default: return 'bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircleIcon
      case 'warning': return ExclamationTriangleIcon
      case 'critical': return ExclamationTriangleIcon
      default: return ClockIcon
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={cn(
              "bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Performance Dashboard
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Real-time performance monitoring and error tracking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={refreshMetrics}
                  disabled={isRefreshing}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowPathIcon className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                  Refresh
                </Button>
                <Button
                  onClick={downloadReports}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  Export
                </Button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                {/* Metrics Grid */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.map((metric, index) => {
                      const StatusIcon = getStatusIcon(metric.status)
                      return (
                        <motion.div
                          key={metric.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "p-4 rounded-lg border",
                            getStatusBg(metric.status)
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {metric.name}
                            </h4>
                            <StatusIcon className={cn("w-5 h-5", getStatusColor(metric.status))} />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {metric.value}
                            </span>
                            {metric.unit && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {metric.unit}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {metric.description}
                          </p>
                          {metric.threshold && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                              Threshold: {metric.threshold}{metric.unit}
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Error Reports Summary */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Error Reports
                    </h3>
                    {storedReports.crashReports.length > 0 && (
                      <Button
                        onClick={clearStoredReports}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Clear Reports
                      </Button>
                    )}
                  </div>

                  {storedReports.crashReports.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p>No error reports found</p>
                      <p className="text-sm">Application is running smoothly</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {storedReports.crashReports.slice(-5).map((report: any, index: number) => (
                        <div
                          key={report.errorId || index}
                          className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={cn(
                                  "px-2 py-1 text-xs font-medium rounded",
                                  report.level === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  report.level === 'component' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                )}>
                                  {report.level}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(report.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                {report.message}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Error ID: {report.errorId}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {storedReports.crashReports.length > 5 && (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                          ... and {storedReports.crashReports.length - 5} more reports
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Performance Metrics History */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Recent Performance Data
                  </h3>
                  {storedReports.performanceMetrics.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <CpuChipIcon className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No performance data yet</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {storedReports.performanceMetrics.length} performance entries recorded
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PerformanceDashboard