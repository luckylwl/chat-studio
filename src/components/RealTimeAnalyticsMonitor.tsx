import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  SignalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/utils'
import analyticsService from '@/services/analyticsService'

interface RealTimeAnalyticsMonitorProps {
  isVisible?: boolean
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  onToggleVisibility?: () => void
  compact?: boolean
}

interface LiveMetric {
  id: string
  label: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change: number
  color: string
  icon: React.ReactNode
}

interface AlertItem {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  message: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface ActivityEvent {
  id: string
  type: 'message' | 'conversation' | 'error' | 'performance'
  description: string
  timestamp: Date
  metadata?: any
}

const RealTimeAnalyticsMonitor: React.FC<RealTimeAnalyticsMonitorProps> = ({
  isVisible = true,
  position = 'bottom-right',
  onToggleVisibility,
  compact = false
}) => {
  const [metrics, setMetrics] = useState<LiveMetric[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([])
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const metricsRef = useRef<Map<string, number>>(new Map())
  const updateIntervalRef = useRef<NodeJS.Timeout>()
  const alertTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    if (isVisible) {
      startMonitoring()
    } else {
      stopMonitoring()
    }

    return () => stopMonitoring()
  }, [isVisible])

  const startMonitoring = () => {
    // Initialize metrics
    updateMetrics()

    // Set up real-time updates
    updateIntervalRef.current = setInterval(() => {
      updateMetrics()
    }, 2000) // Update every 2 seconds

    // Listen to analytics events
    analyticsService.addEventListener('event_tracked', handleAnalyticsEvent)
    analyticsService.addEventListener('metric_updated', handleMetricUpdate)
    analyticsService.addEventListener('insight_generated', handleInsightGenerated)

    setConnectionStatus('connected')
  }

  const stopMonitoring = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
    }

    analyticsService.removeEventListener('event_tracked', handleAnalyticsEvent)
    analyticsService.removeEventListener('metric_updated', handleMetricUpdate)
    analyticsService.removeEventListener('insight_generated', handleInsightGenerated)

    setConnectionStatus('disconnected')
  }

  const updateMetrics = async () => {
    try {
      const currentMetrics = analyticsService.getMetrics()
      const newMetrics: LiveMetric[] = []

      // Messages per minute
      const totalMessages = currentMetrics.get('total_messages')?.value || 0
      const previousMessages = metricsRef.current.get('total_messages') || totalMessages
      const messagesChange = totalMessages - previousMessages
      metricsRef.current.set('total_messages', totalMessages)

      newMetrics.push({
        id: 'messages_rate',
        label: '消息/分钟',
        value: messagesChange * 30, // Approximate per minute based on 2-second intervals
        unit: '',
        trend: messagesChange > 0 ? 'up' : messagesChange < 0 ? 'down' : 'stable',
        change: messagesChange,
        color: 'text-blue-600',
        icon: <SignalIcon className="h-4 w-4" />
      })

      // Average response time
      const responseTime = currentMetrics.get('average_response_time')?.value || 0
      const previousResponseTime = metricsRef.current.get('average_response_time') || responseTime
      const responseTimeChange = responseTime - previousResponseTime
      metricsRef.current.set('average_response_time', responseTime)

      newMetrics.push({
        id: 'response_time',
        label: '响应时间',
        value: responseTime / 1000,
        unit: 's',
        trend: responseTimeChange < 0 ? 'up' : responseTimeChange > 0 ? 'down' : 'stable', // Inverted because lower is better
        change: Math.abs(responseTimeChange),
        color: responseTime < 2000 ? 'text-green-600' : responseTime < 5000 ? 'text-yellow-600' : 'text-red-600',
        icon: <ClockIcon className="h-4 w-4" />
      })

      // Token usage rate
      const totalTokens = currentMetrics.get('total_tokens')?.value || 0
      const previousTokens = metricsRef.current.get('total_tokens') || totalTokens
      const tokensChange = totalTokens - previousTokens
      metricsRef.current.set('total_tokens', totalTokens)

      newMetrics.push({
        id: 'token_rate',
        label: 'Token/分钟',
        value: tokensChange * 30,
        unit: '',
        trend: tokensChange > 0 ? 'up' : tokensChange < 0 ? 'down' : 'stable',
        change: tokensChange,
        color: 'text-purple-600',
        icon: <CpuChipIcon className="h-4 w-4" />
      })

      // Error rate
      const errorRate = currentMetrics.get('error_rate')?.value || 0
      const previousErrorRate = metricsRef.current.get('error_rate') || errorRate
      const errorRateChange = errorRate - previousErrorRate
      metricsRef.current.set('error_rate', errorRate)

      newMetrics.push({
        id: 'error_rate',
        label: '错误率',
        value: errorRate,
        unit: '%',
        trend: errorRateChange < 0 ? 'up' : errorRateChange > 0 ? 'down' : 'stable', // Inverted because lower is better
        change: Math.abs(errorRateChange),
        color: errorRate < 2 ? 'text-green-600' : errorRate < 5 ? 'text-yellow-600' : 'text-red-600',
        icon: <ExclamationTriangleIcon className="h-4 w-4" />
      })

      setMetrics(newMetrics)
      setLastUpdate(new Date())

      // Check for alerts
      checkForAlerts(newMetrics)

    } catch (error) {
      console.error('Failed to update real-time metrics:', error)
      setConnectionStatus('disconnected')
    }
  }

  const handleAnalyticsEvent = (data: any) => {
    const { type, data: eventData } = data

    // Add to recent activity
    const activity: ActivityEvent = {
      id: `activity_${Date.now()}`,
      type: type as any,
      description: getEventDescription(type, eventData),
      timestamp: new Date(),
      metadata: eventData
    }

    setRecentActivity(prev => [activity, ...prev.slice(0, 19)]) // Keep last 20 activities
  }

  const handleMetricUpdate = (data: any) => {
    // Metric updated, will be picked up in next updateMetrics call
  }

  const handleInsightGenerated = (insight: any) => {
    const alert: AlertItem = {
      id: `alert_${Date.now()}`,
      type: insight.type === 'performance_warning' ? 'warning' : 'info',
      message: insight.title,
      timestamp: new Date(),
      priority: insight.priority || 'medium'
    }

    addAlert(alert)
  }

  const checkForAlerts = (currentMetrics: LiveMetric[]) => {
    currentMetrics.forEach(metric => {
      // Response time alert
      if (metric.id === 'response_time' && metric.value > 5) {
        addAlert({
          id: `alert_response_time_${Date.now()}`,
          type: 'warning',
          message: `响应时间过长: ${metric.value.toFixed(2)}s`,
          timestamp: new Date(),
          priority: 'high'
        })
      }

      // Error rate alert
      if (metric.id === 'error_rate' && metric.value > 5) {
        addAlert({
          id: `alert_error_rate_${Date.now()}`,
          type: 'error',
          message: `错误率过高: ${metric.value.toFixed(1)}%`,
          timestamp: new Date(),
          priority: 'critical'
        })
      }

      // High activity alert
      if (metric.id === 'messages_rate' && metric.value > 100) {
        addAlert({
          id: `alert_high_activity_${Date.now()}`,
          type: 'info',
          message: `活动量激增: ${metric.value.toFixed(0)} 消息/分钟`,
          timestamp: new Date(),
          priority: 'medium'
        })
      }
    })
  }

  const addAlert = (alert: AlertItem) => {
    setAlerts(prev => {
      // Check if similar alert already exists
      const exists = prev.some(a =>
        a.message === alert.message &&
        Date.now() - a.timestamp.getTime() < 60000 // Within last minute
      )

      if (exists) return prev

      const newAlerts = [alert, ...prev.slice(0, 9)] // Keep last 10 alerts

      // Auto-remove alert after timeout
      const timeout = setTimeout(() => {
        setAlerts(current => current.filter(a => a.id !== alert.id))
      }, getAlertTimeout(alert.priority))

      alertTimeoutRef.current.set(alert.id, timeout)

      return newAlerts
    })
  }

  const removeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))

    const timeout = alertTimeoutRef.current.get(alertId)
    if (timeout) {
      clearTimeout(timeout)
      alertTimeoutRef.current.delete(alertId)
    }
  }

  const getEventDescription = (type: string, data: any): string => {
    switch (type) {
      case 'message':
        return `新消息: ${data.role === 'user' ? '用户' : 'AI'} (${data.contentLength || 0} 字符)`
      case 'conversation':
        return `新对话: ${data.title || '未命名对话'}`
      case 'error':
        return `错误: ${data.context || '未知错误'}`
      case 'performance':
        return `性能: ${data.metric || '未知指标'}`
      default:
        return `事件: ${type}`
    }
  }

  const getAlertTimeout = (priority: string): number => {
    switch (priority) {
      case 'critical': return 30000 // 30 seconds
      case 'high': return 20000 // 20 seconds
      case 'medium': return 15000 // 15 seconds
      case 'low': return 10000 // 10 seconds
      default: return 15000
    }
  }

  const getAlertColor = (type: string): string => {
    switch (type) {
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'success': return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      case 'info': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getPositionClasses = (): string => {
    switch (position) {
      case 'top-left': return 'top-4 left-4'
      case 'top-right': return 'top-4 right-4'
      case 'bottom-left': return 'bottom-4 left-4'
      case 'bottom-right': return 'bottom-4 right-4'
      default: return 'bottom-4 right-4'
    }
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "fixed z-40 select-none",
        getPositionClasses()
      )}
    >
      <div className={cn(
        "bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden",
        isExpanded ? "w-80" : "w-16"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          {isExpanded && (
            <div className="flex items-center gap-2">
              <BoltIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                实时监控
              </span>
              <div className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              )} />
            </div>
          )}

          <div className="flex items-center gap-1">
            {isExpanded && onToggleVisibility && (
              <button
                onClick={onToggleVisibility}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <EyeSlashIcon className="h-4 w-4 text-gray-500" />
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isExpanded ? (
                <span className="text-gray-500 text-xs">−</span>
              ) : (
                <BoltIcon className="h-4 w-4 text-yellow-500" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {/* Alerts */}
              {alerts.length > 0 && (
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    {alerts.slice(0, 3).map(alert => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          "flex items-start gap-2 p-2 rounded-lg border text-xs",
                          getAlertColor(alert.type)
                        )}
                      >
                        <div className="flex-1">
                          <p className="text-gray-800 dark:text-gray-200">
                            {alert.message}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {alert.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAlert(alert.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  {metrics.map(metric => (
                    <div key={metric.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={metric.color}>
                          {metric.icon}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {metric.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {typeof metric.value === 'number' && metric.value < 1
                            ? metric.value.toFixed(2)
                            : metric.value.toFixed(0)
                          }{metric.unit}
                        </span>

                        {metric.trend !== 'stable' && (
                          <div className={cn(
                            "flex items-center",
                            metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                          )}>
                            {metric.trend === 'up' ? (
                              <ArrowTrendingUpIcon className="h-3 w-3" />
                            ) : (
                              <ArrowTrendingDownIcon className="h-3 w-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    最近活动
                  </span>
                  <span className="text-xs text-gray-500">
                    {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {recentActivity.slice(0, 5).map(activity => (
                    <div key={activity.id} className="text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 flex-shrink-0">
                          {activity.timestamp.toLocaleTimeString().slice(0, -3)}
                        </span>
                        <span className="flex-1 leading-relaxed">
                          {activity.description}
                        </span>
                      </div>
                    </div>
                  ))}

                  {recentActivity.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      暂无活动
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default RealTimeAnalyticsMonitor