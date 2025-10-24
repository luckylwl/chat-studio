import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBarIcon,
  BoltIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { modelManagementService, type AIModel, type ModelPerformanceMetrics } from '@/services/modelManagementService'
import { Button } from './ui'
import { cn } from '@/utils'

interface ModelAnalyticsDashboardProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface ModelAnalytics {
  model: AIModel
  metrics: ModelPerformanceMetrics
  trend: 'up' | 'down' | 'stable'
  score: number
  issues: string[]
}

interface TimeRange {
  label: string
  value: string
  days: number
}

const ModelAnalyticsDashboard: React.FC<ModelAnalyticsDashboardProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const [analytics, setAnalytics] = useState<ModelAnalytics[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState<'quality' | 'speed' | 'cost' | 'reliability'>('quality')
  const [sortBy, setSortBy] = useState<'performance' | 'usage' | 'cost' | 'trend'>('performance')
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const timeRanges: TimeRange[] = [
    { label: '24小时', value: '24h', days: 1 },
    { label: '7天', value: '7d', days: 7 },
    { label: '30天', value: '30d', days: 30 },
    { label: '90天', value: '90d', days: 90 }
  ]

  const providers = [
    { label: '全部', value: 'all' },
    { label: 'OpenAI', value: 'openai' },
    { label: 'Anthropic', value: 'anthropic' },
    { label: 'Google', value: 'google' }
  ]

  useEffect(() => {
    if (isOpen) {
      loadAnalytics()
    }
  }, [isOpen, selectedTimeRange, sortBy, filterProvider])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const models = modelManagementService.getAllModels()
      const filteredModels = filterProvider === 'all'
        ? models
        : models.filter(m => m.provider === filterProvider)

      const analyticsData: ModelAnalytics[] = filteredModels.map(model => {
        const metrics = modelManagementService.getModelPerformance(model.id)

        // Calculate trend (mock data for demonstration)
        const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down'

        // Calculate overall score
        const score = calculateOverallScore(model, metrics)

        // Identify issues
        const issues = identifyIssues(model, metrics)

        return {
          model,
          metrics: metrics || {
            totalRequests: 0,
            successRate: 0.95,
            averageLatency: model.latencyMs,
            averageCost: (model.costPer1KTokens.input + model.costPer1KTokens.output) / 2,
            totalTokens: 0,
            errorRate: 0.05,
            totalCost: 0,
            popularityScore: 50,
            lastUsed: new Date()
          },
          trend,
          score,
          issues
        }
      })

      // Sort analytics data
      const sortedData = sortAnalytics(analyticsData, sortBy)
      setAnalytics(sortedData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateOverallScore = (model: AIModel, metrics: ModelPerformanceMetrics | null): number => {
    if (!metrics) return model.qualityScore

    const weights = {
      quality: 0.3,
      speed: 0.25,
      cost: 0.2,
      reliability: 0.25
    }

    const qualityScore = model.qualityScore
    const speedScore = Math.max(0, 100 - (metrics.averageLatency / 50)) // Better speed = higher score
    const costScore = Math.max(0, 100 - (metrics.averageCost * 10000)) // Lower cost = higher score
    const reliabilityScore = metrics.successRate * 100

    return Math.round(
      qualityScore * weights.quality +
      speedScore * weights.speed +
      costScore * weights.cost +
      reliabilityScore * weights.reliability
    )
  }

  const identifyIssues = (model: AIModel, metrics: ModelPerformanceMetrics | null): string[] => {
    const issues: string[] = []

    if (!metrics) return issues

    if (metrics.successRate < 0.95) {
      issues.push('Low success rate')
    }

    if (metrics.averageLatency > model.latencyMs * 1.5) {
      issues.push('High latency')
    }

    if (metrics.errorRate > 0.1) {
      issues.push('High error rate')
    }

    if (metrics.totalRequests === 0) {
      issues.push('No recent usage')
    }

    if (metrics.averageCost > (model.costPer1KTokens.input + model.costPer1KTokens.output) / 2 * 1.5) {
      issues.push('Higher than expected costs')
    }

    return issues
  }

  const sortAnalytics = (data: ModelAnalytics[], sortBy: string): ModelAnalytics[] => {
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.score - a.score
        case 'usage':
          return b.metrics.totalRequests - a.metrics.totalRequests
        case 'cost':
          return a.metrics.averageCost - b.metrics.averageCost
        case 'trend':
          const trendOrder = { up: 3, stable: 2, down: 1 }
          return trendOrder[b.trend] - trendOrder[a.trend]
        default:
          return 0
      }
    })
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
      case 'stable':
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getProviderIcon = (provider: string) => {
    const icons: { [key: string]: string } = {
      openai: '🤖',
      anthropic: '🧠',
      google: '🔍',
      cohere: '📊',
      huggingface: '🤗',
      local: '💻'
    }
    return icons[provider] || '⚡'
  }

  const exportAnalytics = () => {
    const exportData = analytics.map(item => ({
      model: item.model.name,
      provider: item.model.provider,
      score: item.score,
      successRate: item.metrics.successRate,
      averageLatency: item.metrics.averageLatency,
      averageCost: item.metrics.averageCost,
      totalRequests: item.metrics.totalRequests,
      trend: item.trend,
      issues: item.issues.join(', ')
    }))

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `model-analytics-${selectedTimeRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
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
            "bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden",
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
                  AI模型分析仪表板
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  深度分析AI模型性能和使用情况
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={exportAnalytics}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                导出数据
              </Button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex flex-wrap items-center gap-4">
              {/* Time Range */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">时间范围:</span>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider Filter */}
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">提供商:</span>
                <select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  {providers.map(provider => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="performance">性能得分</option>
                  <option value="usage">使用量</option>
                  <option value="cost">成本</option>
                  <option value="trend">趋势</option>
                </select>
              </div>
            </div>
          </div>

          {/* Analytics Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">加载分析数据...</p>
                </div>
              </div>
            ) : analytics.length === 0 ? (
              <div className="text-center py-12">
                <InformationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  暂无数据
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  当前时间范围内没有模型使用数据
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">总请求数</p>
                        <p className="text-2xl font-bold">
                          {analytics.reduce((sum, item) => sum + item.metrics.totalRequests, 0).toLocaleString()}
                        </p>
                      </div>
                      <ChartBarIcon className="w-8 h-8 text-blue-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">平均成功率</p>
                        <p className="text-2xl font-bold">
                          {(analytics.reduce((sum, item) => sum + item.metrics.successRate, 0) / analytics.length * 100).toFixed(1)}%
                        </p>
                      </div>
                      <CheckCircleIcon className="w-8 h-8 text-green-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">平均延迟</p>
                        <p className="text-2xl font-bold">
                          {Math.round(analytics.reduce((sum, item) => sum + item.metrics.averageLatency, 0) / analytics.length)}ms
                        </p>
                      </div>
                      <BoltIcon className="w-8 h-8 text-purple-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">总成本</p>
                        <p className="text-2xl font-bold">
                          ${analytics.reduce((sum, item) => sum + item.metrics.totalCost, 0).toFixed(2)}
                        </p>
                      </div>
                      <CurrencyDollarIcon className="w-8 h-8 text-orange-200" />
                    </div>
                  </div>
                </div>

                {/* Model Analytics Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            模型
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            性能得分
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            使用量
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            成功率
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            平均延迟
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            平均成本
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            趋势
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            状态
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {analytics.map((item) => (
                          <tr key={item.model.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{getProviderIcon(item.model.provider)}</span>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {item.model.name}
                                  </div>
                                  <div className="text-xs text-gray-500 capitalize">
                                    {item.model.provider}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className={cn(
                                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
                                getScoreColor(item.score)
                              )}>
                                {item.score}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                              {item.metrics.totalRequests.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                              {(item.metrics.successRate * 100).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                              {Math.round(item.metrics.averageLatency)}ms
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                              ${item.metrics.averageCost.toFixed(4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {getTrendIcon(item.trend)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {item.issues.length > 0 ? (
                                <div className="flex items-center justify-center gap-1" title={item.issues.join(', ')}>
                                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                    {item.issues.length}个问题
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                  <span className="text-xs text-green-600 dark:text-green-400">
                                    正常
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ModelAnalyticsDashboard