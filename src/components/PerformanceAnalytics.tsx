import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  ChartBarIcon,
  ServerIcon,
  WifiIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'

interface PerformanceAnalyticsProps {
  className?: string
}

interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  threshold: {
    good: number
    warning: number
    critical: number
  }
  trend: number[]
  description: string
  category: 'latency' | 'throughput' | 'reliability' | 'resource'
}

interface PerformanceAlert {
  id: string
  metric: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: Date
  value: number
  threshold: number
}

interface SystemHealth {
  overall: 'excellent' | 'good' | 'degraded' | 'critical'
  score: number
  components: {
    api: 'healthy' | 'degraded' | 'down'
    database: 'healthy' | 'degraded' | 'down'
    cache: 'healthy' | 'degraded' | 'down'
    network: 'healthy' | 'degraded' | 'down'
  }
}

interface WebVitals {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'good',
    score: 85,
    components: {
      api: 'healthy',
      database: 'healthy',
      cache: 'healthy',
      network: 'healthy'
    }
  })
  const [webVitals, setWebVitals] = useState<WebVitals>({
    lcp: 2.1,
    fid: 45,
    cls: 0.08,
    fcp: 1.8,
    ttfb: 320
  })
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedCategory, setSelectedCategory] = useState<'all' | PerformanceMetric['category']>('all')

  useEffect(() => {
    initializeMetrics()
    startPerformanceMonitoring()

    return () => {
      stopPerformanceMonitoring()
    }
  }, [])

  const initializeMetrics = () => {
    const initialMetrics: PerformanceMetric[] = [
      {
        id: 'response_time',
        name: 'API响应时间',
        value: 1250,
        unit: 'ms',
        threshold: { good: 1000, warning: 2000, critical: 5000 },
        trend: [1200, 1180, 1300, 1250, 1220, 1250],
        description: 'API请求的平均响应时间',
        category: 'latency'
      },
      {
        id: 'throughput',
        name: '请求吞吐量',
        value: 156,
        unit: '请求/分钟',
        threshold: { good: 100, warning: 50, critical: 20 },
        trend: [120, 135, 148, 156, 162, 156],
        description: '每分钟处理的请求数量',
        category: 'throughput'
      },
      {
        id: 'error_rate',
        name: '错误率',
        value: 2.1,
        unit: '%',
        threshold: { good: 1, warning: 3, critical: 5 },
        trend: [1.8, 2.2, 1.9, 2.1, 2.3, 2.1],
        description: '失败请求占总请求的百分比',
        category: 'reliability'
      },
      {
        id: 'memory_usage',
        name: '内存使用率',
        value: 68,
        unit: '%',
        threshold: { good: 70, warning: 85, critical: 95 },
        trend: [65, 67, 69, 68, 70, 68],
        description: '系统内存使用百分比',
        category: 'resource'
      },
      {
        id: 'cpu_usage',
        name: 'CPU使用率',
        value: 42,
        unit: '%',
        threshold: { good: 50, warning: 75, critical: 90 },
        trend: [38, 41, 44, 42, 45, 42],
        description: 'CPU处理器使用百分比',
        category: 'resource'
      },
      {
        id: 'db_query_time',
        name: '数据库查询时间',
        value: 180,
        unit: 'ms',
        threshold: { good: 100, warning: 300, critical: 1000 },
        trend: [160, 175, 185, 180, 190, 180],
        description: '数据库查询的平均响应时间',
        category: 'latency'
      },
      {
        id: 'cache_hit_rate',
        name: '缓存命中率',
        value: 87.5,
        unit: '%',
        threshold: { good: 85, warning: 70, critical: 50 },
        trend: [85, 86, 88, 87.5, 89, 87.5],
        description: '缓存成功命中的百分比',
        category: 'reliability'
      },
      {
        id: 'concurrent_users',
        name: '并发用户数',
        value: 234,
        unit: '用户',
        threshold: { good: 1000, warning: 2000, critical: 3000 },
        trend: [220, 225, 230, 234, 240, 234],
        description: '当前同时在线的用户数量',
        category: 'throughput'
      }
    ]

    setMetrics(initialMetrics)
    checkForAlerts(initialMetrics)
  }

  const startPerformanceMonitoring = () => {
    setIsMonitoring(true)

    // Simulate real-time monitoring
    const interval = setInterval(() => {
      updateMetrics()
      updateWebVitals()
      updateSystemHealth()
      setLastUpdate(new Date())
    }, 3000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }

  const stopPerformanceMonitoring = () => {
    setIsMonitoring(false)
  }

  const updateMetrics = () => {
    setMetrics(prevMetrics => {
      const updatedMetrics = prevMetrics.map(metric => {
        // Simulate realistic metric fluctuations
        const variation = (Math.random() - 0.5) * 0.1 * metric.value
        const newValue = Math.max(0, metric.value + variation)

        // Update trend data
        const newTrend = [...metric.trend.slice(1), newValue]

        return {
          ...metric,
          value: newValue,
          trend: newTrend
        }
      })

      checkForAlerts(updatedMetrics)
      return updatedMetrics
    })
  }

  const updateWebVitals = () => {
    setWebVitals(prev => ({
      lcp: Math.max(0.5, prev.lcp + (Math.random() - 0.5) * 0.2),
      fid: Math.max(1, prev.fid + (Math.random() - 0.5) * 10),
      cls: Math.max(0, Math.min(1, prev.cls + (Math.random() - 0.5) * 0.02)),
      fcp: Math.max(0.3, prev.fcp + (Math.random() - 0.5) * 0.2),
      ttfb: Math.max(50, prev.ttfb + (Math.random() - 0.5) * 50)
    }))
  }

  const updateSystemHealth = () => {
    const components = ['api', 'database', 'cache', 'network'] as const
    const healthStates = ['healthy', 'degraded', 'down'] as const

    setSystemHealth(prev => {
      const newComponents = { ...prev.components }

      // Randomly update one component
      const randomComponent = components[Math.floor(Math.random() * components.length)]
      const randomHealth = healthStates[Math.floor(Math.random() * healthStates.length)]

      // Bias towards healthy state
      if (Math.random() > 0.9) {
        newComponents[randomComponent] = randomHealth
      }

      // Calculate overall health score
      const healthyCount = Object.values(newComponents).filter(status => status === 'healthy').length
      const degradedCount = Object.values(newComponents).filter(status => status === 'degraded').length
      const downCount = Object.values(newComponents).filter(status => status === 'down').length

      const score = (healthyCount * 100 + degradedCount * 50) / components.length

      let overall: SystemHealth['overall'] = 'excellent'
      if (score >= 90) overall = 'excellent'
      else if (score >= 75) overall = 'good'
      else if (score >= 50) overall = 'degraded'
      else overall = 'critical'

      return {
        overall,
        score,
        components: newComponents
      }
    })
  }

  const checkForAlerts = (currentMetrics: PerformanceMetric[]) => {
    const newAlerts: PerformanceAlert[] = []

    currentMetrics.forEach(metric => {
      let severity: PerformanceAlert['severity'] = 'info'
      let threshold = 0

      if (metric.category === 'reliability' || metric.id === 'error_rate') {
        // For reliability metrics, higher is worse
        if (metric.value >= metric.threshold.critical) {
          severity = 'critical'
          threshold = metric.threshold.critical
        } else if (metric.value >= metric.threshold.warning) {
          severity = 'warning'
          threshold = metric.threshold.warning
        } else if (metric.value <= metric.threshold.good) {
          severity = 'info'
          threshold = metric.threshold.good
        }
      } else {
        // For performance metrics, lower is worse (except cache hit rate)
        if (metric.id === 'cache_hit_rate') {
          // Cache hit rate: higher is better
          if (metric.value <= metric.threshold.critical) {
            severity = 'critical'
            threshold = metric.threshold.critical
          } else if (metric.value <= metric.threshold.warning) {
            severity = 'warning'
            threshold = metric.threshold.warning
          }
        } else {
          // Response times, etc: lower is better
          if (metric.value >= metric.threshold.critical) {
            severity = 'critical'
            threshold = metric.threshold.critical
          } else if (metric.value >= metric.threshold.warning) {
            severity = 'warning'
            threshold = metric.threshold.warning
          }
        }
      }

      if (severity === 'warning' || severity === 'critical') {
        const alertExists = alerts.some(alert =>
          alert.metric === metric.id &&
          Date.now() - alert.timestamp.getTime() < 60000 // Within last minute
        )

        if (!alertExists) {
          newAlerts.push({
            id: `alert_${metric.id}_${Date.now()}`,
            metric: metric.id,
            severity,
            message: `${metric.name}异常: ${metric.value.toFixed(2)}${metric.unit}`,
            timestamp: new Date(),
            value: metric.value,
            threshold
          })
        }
      }
    })

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]) // Keep last 10 alerts
    }
  }

  const getMetricStatus = (metric: PerformanceMetric): 'good' | 'warning' | 'critical' => {
    if (metric.category === 'reliability' || metric.id === 'error_rate') {
      if (metric.value >= metric.threshold.critical) return 'critical'
      if (metric.value >= metric.threshold.warning) return 'warning'
      return 'good'
    } else {
      if (metric.id === 'cache_hit_rate') {
        if (metric.value <= metric.threshold.critical) return 'critical'
        if (metric.value <= metric.threshold.warning) return 'warning'
        return 'good'
      } else {
        if (metric.value >= metric.threshold.critical) return 'critical'
        if (metric.value >= metric.threshold.warning) return 'warning'
        return 'good'
      }
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good':
      case 'healthy':
      case 'excellent':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30'
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      case 'critical':
      case 'down':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  const getWebVitalStatus = (vital: string, value: number): 'good' | 'warning' | 'critical' => {
    const thresholds = {
      lcp: { good: 2.5, warning: 4.0 },
      fid: { good: 100, warning: 300 },
      cls: { good: 0.1, warning: 0.25 },
      fcp: { good: 1.8, warning: 3.0 },
      ttfb: { good: 200, warning: 500 }
    }

    const threshold = thresholds[vital as keyof typeof thresholds]
    if (!threshold) return 'good'

    if (value >= threshold.warning) return 'critical'
    if (value >= threshold.good) return 'warning'
    return 'good'
  }

  const filteredMetrics = useMemo(() => {
    if (selectedCategory === 'all') return metrics
    return metrics.filter(metric => metric.category === selectedCategory)
  }, [metrics, selectedCategory])

  const renderTrendSparkline = (trend: number[], status: string) => {
    const max = Math.max(...trend)
    const min = Math.min(...trend)
    const range = max - min || 1

    const points = trend.map((value, index) => {
      const x = (index / (trend.length - 1)) * 60
      const y = 20 - ((value - min) / range) * 20
      return `${x},${y}`
    }).join(' ')

    const color = status === 'good' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444'

    return (
      <svg width="60" height="20" className="inline">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.8"
        />
      </svg>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BoltIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            性能分析
          </h2>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
            isMonitoring ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-600"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isMonitoring ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            {isMonitoring ? '实时监控' : '已暂停'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            更新于 {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              updateMetrics()
              updateWebVitals()
              updateSystemHealth()
              setLastUpdate(new Date())
            }}
          >
            <ArrowPathIcon className="h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              系统健康度
            </h3>
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              getStatusColor(systemHealth.overall)
            )}>
              {systemHealth.overall === 'excellent' ? '优秀' :
               systemHealth.overall === 'good' ? '良好' :
               systemHealth.overall === 'degraded' ? '降级' : '严重'}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {systemHealth.score.toFixed(0)}
            </div>
            <div className="flex-1">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${systemHealth.score}%` }}
                  className={cn(
                    "h-full rounded-full",
                    systemHealth.score >= 90 ? "bg-green-500" :
                    systemHealth.score >= 75 ? "bg-yellow-500" : "bg-red-500"
                  )}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(systemHealth.components).map(([component, status]) => (
              <div key={component} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {component === 'api' ? 'API' : component}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  status === 'healthy' ? "bg-green-500" :
                  status === 'degraded' ? "bg-yellow-500" : "bg-red-500"
                )} />
              </div>
            ))}
          </div>
        </div>

        {/* Web Vitals */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Core Web Vitals
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(webVitals).map(([vital, value]) => {
              const status = getWebVitalStatus(vital, value)
              const unit = vital === 'cls' ? '' : vital === 'fid' || vital === 'ttfb' ? 'ms' : 's'

              return (
                <div key={vital} className="text-center">
                  <div className="text-xs text-gray-500 uppercase mb-1">
                    {vital.toUpperCase()}
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    status === 'good' ? 'text-green-600' :
                    status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {value.toFixed(vital === 'cls' ? 3 : vital === 'fid' || vital === 'ttfb' ? 0 : 1)}{unit}
                  </div>
                  <div className={cn(
                    "w-2 h-2 rounded-full mx-auto mt-1",
                    status === 'good' ? 'bg-green-500' :
                    status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  )} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            活跃警报 ({alerts.length})
          </h3>

          <div className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  alert.severity === 'critical' ? "border-red-500 bg-red-50 dark:bg-red-900/20" :
                  alert.severity === 'warning' ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" :
                  "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                )}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            性能指标
          </h3>

          <div className="flex items-center gap-2">
            {['all', 'latency', 'throughput', 'reliability', 'resource'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category as any)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  selectedCategory === category
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                {category === 'all' ? '全部' :
                 category === 'latency' ? '延迟' :
                 category === 'throughput' ? '吞吐量' :
                 category === 'reliability' ? '可靠性' : '资源'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMetrics.map(metric => {
            const status = getMetricStatus(metric)

            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {metric.name}
                  </h4>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    status === 'good' ? "bg-green-500" :
                    status === 'warning' ? "bg-yellow-500" : "bg-red-500"
                  )} />
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {metric.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {metric.description}
                  </p>
                  {renderTrendSparkline(metric.trend, status)}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PerformanceAnalytics