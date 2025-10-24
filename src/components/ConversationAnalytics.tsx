import React, { useMemo, useState } from 'react'
import { useAppStore } from '@/store'
import { Button } from './ui'
import { cn } from '@/utils'
import {
  ChartBarIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarDaysIcon,
  UserIcon,
  AcademicCapIcon,
  TagIcon,
  ArrowPathIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  totalConversations: number
  totalMessages: number
  averageMessagesPerConversation: number
  totalCharacters: number
  averageCharactersPerMessage: number
  mostActiveModel: string
  mostActiveDay: string
  conversationTrends: Array<{
    date: string
    conversations: number
    messages: number
  }>
  modelUsage: Array<{
    model: string
    count: number
    percentage: number
  }>
  messageLengthDistribution: Array<{
    range: string
    count: number
    percentage: number
  }>
  timePatterns: Array<{
    hour: number
    count: number
  }>
  topKeywords: Array<{
    keyword: string
    count: number
  }>
}

interface ConversationAnalyticsProps {
  className?: string
}

const ConversationAnalytics: React.FC<ConversationAnalyticsProps> = ({ className }) => {
  const { conversations } = useAppStore()
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [refreshing, setRefreshing] = useState(false)

  // Calculate analytics data
  const analyticsData: AnalyticsData = useMemo(() => {
    if (conversations.length === 0) {
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageMessagesPerConversation: 0,
        totalCharacters: 0,
        averageCharactersPerMessage: 0,
        mostActiveModel: '',
        mostActiveDay: '',
        conversationTrends: [],
        modelUsage: [],
        messageLengthDistribution: [],
        timePatterns: [],
        topKeywords: []
      }
    }

    // Filter conversations by selected period
    const now = Date.now()
    const periodMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      'all': Infinity
    }

    const filteredConversations = conversations.filter(conv =>
      selectedPeriod === 'all' || (now - conv.updatedAt) <= periodMs[selectedPeriod]
    )

    const totalConversations = filteredConversations.length
    const totalMessages = filteredConversations.reduce((sum, conv) => sum + conv.messages.length, 0)
    const averageMessagesPerConversation = totalMessages / totalConversations || 0

    // Character statistics
    const allMessages = filteredConversations.flatMap(conv => conv.messages)
    const totalCharacters = allMessages.reduce((sum, msg) => sum + msg.content.length, 0)
    const averageCharactersPerMessage = totalCharacters / totalMessages || 0

    // Model usage statistics
    const modelCounts = new Map<string, number>()
    filteredConversations.forEach(conv => {
      modelCounts.set(conv.model, (modelCounts.get(conv.model) || 0) + 1)
    })

    const modelUsage = Array.from(modelCounts.entries())
      .map(([model, count]) => ({
        model,
        count,
        percentage: (count / totalConversations) * 100
      }))
      .sort((a, b) => b.count - a.count)

    const mostActiveModel = modelUsage[0]?.model || ''

    // Time patterns (by hour of day)
    const hourCounts = new Array(24).fill(0)
    allMessages.forEach(msg => {
      const hour = new Date(msg.timestamp).getHours()
      hourCounts[hour]++
    })

    const timePatterns = hourCounts.map((count, hour) => ({ hour, count }))

    // Day patterns
    const dayCounts = new Map<string, number>()
    filteredConversations.forEach(conv => {
      const date = new Date(conv.updatedAt).toLocaleDateString()
      dayCounts.set(date, (dayCounts.get(date) || 0) + 1)
    })

    const mostActiveDay = Array.from(dayCounts.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || ''

    // Conversation trends (last 30 days)
    const trends = new Map<string, { conversations: number, messages: number }>()
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    last30Days.forEach(date => {
      trends.set(date, { conversations: 0, messages: 0 })
    })

    filteredConversations.forEach(conv => {
      const date = new Date(conv.updatedAt).toISOString().split('T')[0]
      if (trends.has(date)) {
        const current = trends.get(date)!
        trends.set(date, {
          conversations: current.conversations + 1,
          messages: current.messages + conv.messages.length
        })
      }
    })

    const conversationTrends = Array.from(trends.entries()).map(([date, data]) => ({
      date,
      ...data
    }))

    // Message length distribution
    const lengthBuckets = {
      'Very Short (1-20)': { min: 1, max: 20, count: 0 },
      'Short (21-100)': { min: 21, max: 100, count: 0 },
      'Medium (101-300)': { min: 101, max: 300, count: 0 },
      'Long (301-500)': { min: 301, max: 500, count: 0 },
      'Very Long (500+)': { min: 501, max: Infinity, count: 0 }
    }

    allMessages.forEach(msg => {
      const length = msg.content.length
      Object.entries(lengthBuckets).forEach(([range, bucket]) => {
        if (length >= bucket.min && length <= bucket.max) {
          bucket.count++
        }
      })
    })

    const messageLengthDistribution = Object.entries(lengthBuckets).map(([range, bucket]) => ({
      range,
      count: bucket.count,
      percentage: (bucket.count / totalMessages) * 100 || 0
    }))

    // Extract keywords (simple approach)
    const wordCounts = new Map<string, number>()
    allMessages
      .filter(msg => msg.role === 'user') // Only user messages
      .forEach(msg => {
        const words = msg.content
          .toLowerCase()
          .replace(/[^\u4e00-\u9fa5a-z\s]/g, '') // Keep only Chinese, English, and spaces
          .split(/\s+/)
          .filter(word => word.length > 1) // Filter short words

        words.forEach(word => {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
        })
      })

    const topKeywords = Array.from(wordCounts.entries())
      .filter(([, count]) => count > 2) // Only words used more than 2 times
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }))

    return {
      totalConversations,
      totalMessages,
      averageMessagesPerConversation,
      totalCharacters,
      averageCharactersPerMessage,
      mostActiveModel,
      mostActiveDay,
      conversationTrends,
      modelUsage,
      messageLengthDistribution,
      timePatterns,
      topKeywords
    }
  }, [conversations, selectedPeriod])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend
  }: {
    title: string
    value: string | number
    change?: string
    icon: React.ComponentType<any>
    trend?: 'up' | 'down' | 'neutral'
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
          {change && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm',
              trend === 'up' ? 'text-green-600 dark:text-green-400' :
              trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-gray-500 dark:text-gray-400'
            )}>
              {trend === 'up' && <ArrowUpIcon className="h-4 w-4" />}
              {trend === 'down' && <ArrowDownIcon className="h-4 w-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">对话分析报告</h2>
          <p className="text-gray-600 dark:text-gray-400">深入了解您的AI对话模式和使用习惯</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
            <option value="all">全部时间</option>
          </select>

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            刷新
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总对话数"
          value={analyticsData.totalConversations}
          icon={ChatBubbleLeftRightIcon}
          change="+12% 较上期"
          trend="up"
        />
        <StatCard
          title="总消息数"
          value={analyticsData.totalMessages}
          icon={DocumentChartBarIcon}
          change="+8% 较上期"
          trend="up"
        />
        <StatCard
          title="平均每对话消息数"
          value={analyticsData.averageMessagesPerConversation.toFixed(1)}
          icon={ChartBarIcon}
          change="-2% 较上期"
          trend="down"
        />
        <StatCard
          title="平均消息长度"
          value={`${analyticsData.averageCharactersPerMessage.toFixed(0)} 字符`}
          icon={AcademicCapIcon}
          change="+5% 较上期"
          trend="up"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Usage Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <SparklesIcon className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">模型使用分布</h3>
          </div>
          <div className="space-y-3">
            {analyticsData.modelUsage.slice(0, 5).map((model) => (
              <div key={model.model} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{model.model}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${model.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                    {model.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Length Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <DocumentChartBarIcon className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">消息长度分布</h3>
          </div>
          <div className="space-y-3">
            {analyticsData.messageLengthDistribution.map((dist) => (
              <div key={dist.range} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{dist.range}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                    {dist.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">活跃时间分布</h3>
        </div>
        <div className="grid grid-cols-24 gap-1">
          {analyticsData.timePatterns.map((pattern) => {
            const maxCount = Math.max(...analyticsData.timePatterns.map(p => p.count))
            const intensity = maxCount > 0 ? pattern.count / maxCount : 0

            return (
              <div
                key={pattern.hour}
                className="relative group"
                title={`${pattern.hour}:00 - ${pattern.count} 条消息`}
              >
                <div
                  className={cn(
                    'w-full h-8 rounded-sm border border-gray-200 dark:border-gray-700',
                    intensity > 0.7 ? 'bg-blue-500' :
                    intensity > 0.5 ? 'bg-blue-400' :
                    intensity > 0.3 ? 'bg-blue-300' :
                    intensity > 0.1 ? 'bg-blue-200 dark:bg-blue-800' :
                    'bg-gray-100 dark:bg-gray-700'
                  )}
                />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400">
                  {pattern.hour % 6 === 0 ? pattern.hour : ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Keywords and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TagIcon className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">热门关键词</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analyticsData.topKeywords.slice(0, 15).map((keyword) => (
              <span
                key={keyword.keyword}
                className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm flex items-center gap-1"
              >
                {keyword.keyword}
                <span className="text-xs opacity-75">({keyword.count})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Summary Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <AcademicCapIcon className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">智能洞察</h3>
          </div>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-1">活跃模式</p>
              <p>您最常使用的模型是 <strong>{analyticsData.mostActiveModel}</strong>，占总对话的 {analyticsData.modelUsage[0]?.percentage.toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="font-medium text-green-700 dark:text-green-300 mb-1">对话深度</p>
              <p>平均每个对话包含 {analyticsData.averageMessagesPerConversation.toFixed(1)} 条消息，显示您倾向于进行深入讨论</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="font-medium text-yellow-700 dark:text-yellow-300 mb-1">使用建议</p>
              <p>建议在活跃时间段（{analyticsData.timePatterns.reduce((max, p) => p.count > max.count ? p : max).hour}:00）进行重要对话以获得最佳体验</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationAnalytics