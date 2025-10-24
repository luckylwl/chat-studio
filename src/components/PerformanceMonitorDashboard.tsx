import React, { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  SignalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { Modal } from '@/components/ui'
import { cn } from '@/utils'

interface PerformanceMetrics {
  fps: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  network: {
    requests: number
    avgLatency: number
    errors: number
  }
  cache: {
    hits: number
    misses: number
    hitRate: number
  }
  render: {
    count: number
    avgTime: number
  }
}

interface PerformanceMonitorDashboardProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 性能监控仪表板
 * 实时监控应用性能指标
 */
export const PerformanceMonitorDashboard: React.FC<PerformanceMonitorDashboardProps> = ({
  isOpen,
  onClose
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: { used: 0, total: 0, percentage: 0 },
    network: { requests: 0, avgLatency: 0, errors: 0 },
    cache: { hits: 0, misses: 0, hitRate: 0 },
    render: { count: 0, avgTime: 0 }
  })

  const [history, setHistory] = useState<Array<{ time: number; fps: number; memory: number }>>([])

  // 监控FPS
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      const elapsed = currentTime - lastTime

      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed)
        setMetrics(prev => ({ ...prev, fps }))
        frameCount = 0
        lastTime = currentTime
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    if (isOpen) {
      animationId = requestAnimationFrame(measureFPS)
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isOpen])

  // 监控内存
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const used = Math.round(memory.usedJSHeapSize / 1024 / 1024)
        const total = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        const percentage = Math.round((used / total) * 100)

        setMetrics(prev => ({
          ...prev,
          memory: { used, total, percentage }
        }))
      }
    }

    if (isOpen) {
      measureMemory()
      const interval = setInterval(measureMemory, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  // 收集历史数据
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setHistory(prev => {
          const newHistory = [
            ...prev,
            {
              time: Date.now(),
              fps: metrics.fps,
              memory: metrics.memory.percentage
            }
          ]
          // 只保留最近60个数据点
          return newHistory.slice(-60)
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isOpen, metrics.fps, metrics.memory.percentage])

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600 dark:text-green-400'
    if (value >= thresholds.warning) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getStatusBg = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'bg-green-500'
    if (value >= thresholds.warning) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    unit,
    status,
    subtitle,
    trend
  }: {
    icon: any
    title: string
    value: number | string
    unit?: string
    status: 'good' | 'warning' | 'error'
    subtitle?: string
    trend?: 'up' | 'down' | 'stable'
  }) => (
    <div className={cn(
      'p-4 rounded-lg border',
      status === 'good' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
      status === 'warning' && 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
      status === 'error' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn(
            'w-5 h-5',
            status === 'good' && 'text-green-600 dark:text-green-400',
            status === 'warning' && 'text-yellow-600 dark:text-yellow-400',
            status === 'error' && 'text-red-600 dark:text-red-400'
          )} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </span>
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            {trend === 'up' && <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />}
            {trend === 'down' && <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />}
          </div>
        )}
      </div>

      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}{unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="性能监控仪表板"
      size="xl"
    >
      <div className="space-y-6">
        {/* 概览指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={SignalIcon}
            title="FPS"
            value={metrics.fps}
            status={metrics.fps >= 50 ? 'good' : metrics.fps >= 30 ? 'warning' : 'error'}
            subtitle="帧率"
            trend={metrics.fps >= 50 ? 'stable' : 'down'}
          />

          <MetricCard
            icon={CpuChipIcon}
            title="内存"
            value={metrics.memory.used}
            unit="MB"
            status={metrics.memory.percentage < 60 ? 'good' : metrics.memory.percentage < 80 ? 'warning' : 'error'}
            subtitle={`${metrics.memory.percentage}% 已使用`}
          />

          <MetricCard
            icon={ClockIcon}
            title="网络延迟"
            value={metrics.network.avgLatency}
            unit="ms"
            status={metrics.network.avgLatency < 200 ? 'good' : metrics.network.avgLatency < 500 ? 'warning' : 'error'}
            subtitle={`${metrics.network.requests} 个请求`}
          />

          <MetricCard
            icon={ChartBarIcon}
            title="缓存命中率"
            value={metrics.cache.hitRate}
            unit="%"
            status={metrics.cache.hitRate >= 70 ? 'good' : metrics.cache.hitRate >= 40 ? 'warning' : 'error'}
            subtitle={`${metrics.cache.hits}/${metrics.cache.hits + metrics.cache.misses}`}
          />
        </div>

        {/* FPS 图表 */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            FPS 趋势 (最近60秒)
          </h3>
          <div className="h-32 flex items-end gap-1">
            {history.map((point, index) => {
              const height = (point.fps / 60) * 100
              const color = point.fps >= 50 ? 'bg-green-500' : point.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'
              return (
                <div
                  key={index}
                  className={cn('flex-1 rounded-t transition-all', color)}
                  style={{ height: `${height}%` }}
                  title={`${point.fps} FPS`}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>60秒前</span>
            <span>现在</span>
          </div>
        </div>

        {/* 内存使用图表 */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            内存使用趋势
          </h3>
          <div className="h-32 flex items-end gap-1">
            {history.map((point, index) => {
              const height = point.memory
              const color = point.memory < 60 ? 'bg-blue-500' : point.memory < 80 ? 'bg-yellow-500' : 'bg-red-500'
              return (
                <div
                  key={index}
                  className={cn('flex-1 rounded-t transition-all', color)}
                  style={{ height: `${height}%` }}
                  title={`${point.memory}%`}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 详细统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 网络统计 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              网络统计
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">总请求数</span>
                <span className="font-medium">{metrics.network.requests}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">平均延迟</span>
                <span className="font-medium">{metrics.network.avgLatency}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">错误数</span>
                <span className={cn(
                  'font-medium',
                  metrics.network.errors === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {metrics.network.errors}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">成功率</span>
                <span className="font-medium">
                  {metrics.network.requests > 0
                    ? ((1 - metrics.network.errors / metrics.network.requests) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* 渲染统计 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              渲染统计
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">渲染次数</span>
                <span className="font-medium">{metrics.render.count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">平均渲染时间</span>
                <span className="font-medium">{metrics.render.avgTime.toFixed(2)}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">当前FPS</span>
                <span className={cn(
                  'font-medium',
                  getStatusColor(metrics.fps, { good: 50, warning: 30 })
                )}>
                  {metrics.fps}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">目标FPS</span>
                <span className="font-medium">60</span>
              </div>
            </div>
          </div>
        </div>

        {/* 性能建议 */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 性能建议
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            {metrics.fps < 30 && (
              <li>• FPS过低，建议减少页面动画或使用虚拟滚动</li>
            )}
            {metrics.memory.percentage > 80 && (
              <li>• 内存使用过高，建议清理缓存或刷新页面</li>
            )}
            {metrics.network.avgLatency > 500 && (
              <li>• 网络延迟较高，建议检查网络连接或启用缓存</li>
            )}
            {metrics.cache.hitRate < 40 && (
              <li>• 缓存命中率低，建议调整缓存策略</li>
            )}
            {metrics.fps >= 50 && metrics.memory.percentage < 60 && metrics.cache.hitRate >= 70 && (
              <li>• ✅ 性能表现优秀，继续保持！</li>
            )}
          </ul>
        </div>
      </div>
    </Modal>
  )
}

export default PerformanceMonitorDashboard
