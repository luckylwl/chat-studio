import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBarIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import analyticsService, {
  AnalyticsReport,
  ConversationMetrics,
  ModelUsageStats,
  TimeSeriesData,
  AnalyticsSettings
} from '@/services/analyticsService'

interface AnalyticsDashboardProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon: React.ReactNode
  description?: string
  isLoading?: boolean
}

interface TimeRange {
  label: string
  value: 'day' | 'week' | 'month' | 'year' | 'custom'
  days: number
}

const TIME_RANGES: TimeRange[] = [
  { label: '今天', value: 'day', days: 1 },
  { label: '本周', value: 'week', days: 7 },
  { label: '本月', value: 'month', days: 30 },
  { label: '本年', value: 'year', days: 365 },
  { label: '自定义', value: 'custom', days: 0 }
]

const MetricCard: React.FC<MetricCardProps> = ({
  title, value, change, trend, icon, description, isLoading
}) => {
  const getTrendIcon = () => {
    if (!change || trend === 'stable') return null
    return trend === 'up' ? (
      <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
    )
  }

  const getTrendColor = () => {
    if (!change || trend === 'stable') return 'text-gray-500'
    return trend === 'up' ? 'text-green-600' : 'text-red-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {icon}
            {title}
          </div>

          {isLoading ? (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          ) : (
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          )}

          {change !== undefined && !isLoading && (
            <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
              {getTrendIcon()}
              <span>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-gray-500">vs 上期</span>
            </div>
          )}

          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface ChartData {
  date: string
  conversations: number
  messages: number
  tokens: number
  errors: number
}

const LineChart: React.FC<{ data: ChartData[]; metric: keyof ChartData }> = ({ data, metric }) => {
  const maxValue = Math.max(...data.map(d => d[metric] as number))
  const minValue = Math.min(...data.map(d => d[metric] as number))
  const range = maxValue - minValue || 1

  const getYPosition = (value: number) => {
    return 100 - ((value - minValue) / range) * 100
  }

  const pathData = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = getYPosition(d[metric] as number)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <div className="h-32 w-full relative">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={`gradient-${metric}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={`${pathData} L 100 100 L 0 100 Z`}
          fill={`url(#gradient-${metric})`}
          className="text-blue-500"
        />

        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-600"
        />

        {data.map((d, i) => (
          <circle
            key={i}
            cx={(i / (data.length - 1)) * 100}
            cy={getYPosition(d[metric] as number)}
            r="2"
            fill="currentColor"
            className="text-blue-600"
          />
        ))}
      </svg>
    </div>
  )
}

const ModelUsageChart: React.FC<{ models: ModelUsageStats[] }> = ({ models }) => {
  const maxUsage = Math.max(...models.map(m => m.usageCount))

  return (
    <div className="space-y-3">
      {models.slice(0, 5).map((model, index) => (
        <div key={model.modelId} className="flex items-center gap-3">
          <div className="w-16 text-xs text-gray-600 dark:text-gray-400 truncate">
            {model.modelName}
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(model.usageCount / maxUsage) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            />
          </div>
          <div className="w-12 text-xs text-gray-600 dark:text-gray-400 text-right">
            {model.usageCount}
          </div>
          <div className="w-16 text-xs text-gray-500 text-right">
            {model.successRate.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  )
}

const InsightCard: React.FC<{ insights: string[]; recommendations: string[] }> = ({
  insights, recommendations
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations'>('insights')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setActiveTab('insights')}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            activeTab === 'insights'
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <InformationCircleIcon className="h-4 w-4 inline mr-1.5" />
          洞察
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            activeTab === 'recommendations'
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <ExclamationTriangleIcon className="h-4 w-4 inline mr-1.5" />
          建议
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-3"
        >
          {activeTab === 'insights' ? (
            insights.length > 0 ? (
              insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">暂无洞察数据</p>
            )
          ) : (
            recommendations.length > 0 ? (
              recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">暂无建议</p>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen, onClose, className
}) => {
  const [report, setReport] = useState<AnalyticsReport | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(TIME_RANGES[1]) // 本周
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [activeChartMetric, setActiveChartMetric] = useState<keyof ChartData>('messages')
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadData()
      loadSettings()
    }
  }, [isOpen, selectedTimeRange])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()

      if (selectedTimeRange.value === 'custom') {
        if (customDateRange.start && customDateRange.end) {
          startDate.setTime(new Date(customDateRange.start).getTime())
          endDate.setTime(new Date(customDateRange.end).getTime())
        } else {
          startDate.setDate(startDate.getDate() - 7) // Default to week if custom not set
        }
      } else {
        startDate.setDate(startDate.getDate() - selectedTimeRange.days)
      }

      const [reportData, dashboardData] = await Promise.all([
        analyticsService.generateReport(startDate, endDate, selectedTimeRange.value),
        analyticsService.getDashboardData()
      ])

      setReport(reportData)
      setDashboardData(dashboardData)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = () => {
    const currentSettings = analyticsService.getSettings()
    setSettings(currentSettings)
    setIsTrackingEnabled(currentSettings.enableTracking)
  }

  const handleToggleTracking = () => {
    const newValue = !isTrackingEnabled
    setIsTrackingEnabled(newValue)
    analyticsService.updateSettings({ enableTracking: newValue })
  }

  const handleExportData = async (format: 'json' | 'csv' = 'json') => {
    try {
      const data = await analyticsService.exportData(format)
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const chartData: ChartData[] = useMemo(() => {
    if (!report) return []

    return report.timeSeries.map(data => ({
      date: new Date(data.timestamp).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      }),
      conversations: data.conversations,
      messages: data.messages,
      tokens: data.tokens,
      errors: data.errors
    }))
  }, [report])

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const getTrend = (change: number): 'up' | 'down' | 'stable' => {
    if (Math.abs(change) < 5) return 'stable'
    return change > 0 ? 'up' : 'down'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "absolute inset-4 bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              分析仪表板
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTracking}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isTrackingEnabled
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                {isTrackingEnabled ? (
                  <EyeIcon className="h-4 w-4" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4" />
                )}
                {isTrackingEnabled ? '跟踪中' : '已暂停'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <select
                value={selectedTimeRange.value}
                onChange={(e) => {
                  const range = TIME_RANGES.find(r => r.value === e.target.value)
                  if (range) setSelectedTimeRange(range)
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {TIME_RANGES.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedTimeRange.value === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
                />
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
            >
              <ArrowPathIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
              刷新
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExportData('json')}
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              导出
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {!isTrackingEnabled && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="font-medium">数据跟踪已暂停</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                启用跟踪以开始收集新的分析数据。现有数据仍可查看。
              </p>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="总对话数"
              value={report?.overview.totalConversations || 0}
              change={dashboardData ? getChangePercentage(
                report?.overview.totalConversations || 0,
                dashboardData.todayStats.totalConversations
              ) : undefined}
              trend={dashboardData ? getTrend(getChangePercentage(
                report?.overview.totalConversations || 0,
                dashboardData.todayStats.totalConversations
              )) : 'stable'}
              icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />}
              isLoading={isLoading}
            />

            <MetricCard
              title="总消息数"
              value={report?.overview.totalMessages || 0}
              change={dashboardData ? getChangePercentage(
                report?.overview.totalMessages || 0,
                dashboardData.todayStats.totalMessages
              ) : undefined}
              trend={dashboardData ? getTrend(getChangePercentage(
                report?.overview.totalMessages || 0,
                dashboardData.todayStats.totalMessages
              )) : 'stable'}
              icon={<ChartBarIcon className="h-5 w-5" />}
              isLoading={isLoading}
            />

            <MetricCard
              title="Token使用量"
              value={report?.overview.totalTokens.toLocaleString() || 0}
              change={dashboardData ? getChangePercentage(
                report?.overview.totalTokens || 0,
                dashboardData.todayStats.totalTokens
              ) : undefined}
              trend={dashboardData ? getTrend(getChangePercentage(
                report?.overview.totalTokens || 0,
                dashboardData.todayStats.totalTokens
              )) : 'stable'}
              icon={<CpuChipIcon className="h-5 w-5" />}
              isLoading={isLoading}
            />

            <MetricCard
              title="平均响应时间"
              value={report ? `${(report.overview.responseTime / 1000).toFixed(2)}s` : '0s'}
              change={dashboardData ? getChangePercentage(
                report?.overview.responseTime || 0,
                dashboardData.todayStats.responseTime
              ) : undefined}
              trend={dashboardData ? getTrend(-getChangePercentage( // Negative because lower is better
                report?.overview.responseTime || 0,
                dashboardData.todayStats.responseTime
              )) : 'stable'}
              icon={<ClockIcon className="h-5 w-5" />}
              description="越低越好"
              isLoading={isLoading}
            />
          </div>

          {/* Charts and Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  使用趋势
                </h3>
                <div className="flex items-center gap-1">
                  {(['messages', 'conversations', 'tokens', 'errors'] as const).map((metric) => (
                    <button
                      key={metric}
                      onClick={() => setActiveChartMetric(metric)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                        activeChartMetric === metric
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      )}
                    >
                      {metric === 'messages' ? '消息' :
                       metric === 'conversations' ? '对话' :
                       metric === 'tokens' ? 'Token' : '错误'}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <LineChart data={chartData} metric={activeChartMetric} />
              )}
            </div>

            {/* Model Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                模型使用情况
              </h3>

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <ModelUsageChart models={report?.modelStats || []} />
              )}
            </div>
          </div>

          {/* Insights and Recommendations */}
          <InsightCard
            insights={report?.insights || []}
            recommendations={report?.recommendations || []}
          />

          {/* Detailed Stats Table */}
          {report && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                详细统计
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-600 dark:text-gray-400">模型</th>
                      <th className="text-right py-2 text-gray-600 dark:text-gray-400">使用次数</th>
                      <th className="text-right py-2 text-gray-600 dark:text-gray-400">Token总量</th>
                      <th className="text-right py-2 text-gray-600 dark:text-gray-400">平均响应时间</th>
                      <th className="text-right py-2 text-gray-600 dark:text-gray-400">成功率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.modelStats.map((model, index) => (
                      <tr key={model.modelId} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 text-gray-900 dark:text-gray-100">
                          {model.modelName}
                        </td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                          {model.usageCount.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                          {model.totalTokens.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                          {(model.averageResponseTime / 1000).toFixed(2)}s
                        </td>
                        <td className="py-3 text-right">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            model.successRate >= 95
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : model.successRate >= 90
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          )}>
                            {(model.successRate * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyticsDashboard