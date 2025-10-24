import React, { useMemo } from 'react'
import {
  ChartBarIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  TrophyIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Badge } from './ui'
import { cn } from '@/utils'
import { useAppStore } from '@/store'
import { motion } from 'framer-motion'

interface ConversationAnalyticsDashboardProps {
  className?: string
}

interface AnalyticsData {
  totalConversations: number
  totalMessages: number
  avgMessagesPerConversation: number
  totalTokens: number
  mostUsedModel: string
  conversationsToday: number
  messagesThisWeek: number
  activeHours: Record<number, number>
  modelUsage: Record<string, number>
  conversationLengths: number[]
  messagesByDay: Record<string, number>
}

const ConversationAnalyticsDashboard: React.FC<ConversationAnalyticsDashboardProps> = ({
  className
}) => {
  const { conversations } = useAppStore()

  const analytics = useMemo<AnalyticsData>(() => {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

    let totalMessages = 0
    let totalTokens = 0
    const modelUsage: Record<string, number> = {}
    const activeHours: Record<number, number> = {}
    const conversationLengths: number[] = []
    const messagesByDay: Record<string, number> = {}

    let conversationsToday = 0
    let messagesThisWeek = 0

    conversations.forEach(conv => {
      totalMessages += conv.messages.length
      conversationLengths.push(conv.messages.length)

      if (conv.createdAt > oneDayAgo) {
        conversationsToday++
      }

      conv.messages.forEach(msg => {
        // Tokens
        if (msg.tokens) {
          totalTokens += msg.tokens
        }

        // Model usage
        if (msg.model) {
          modelUsage[msg.model] = (modelUsage[msg.model] || 0) + 1
        }

        // Active hours
        const hour = new Date(msg.timestamp).getHours()
        activeHours[hour] = (activeHours[hour] || 0) + 1

        // Messages this week
        if (msg.timestamp > oneWeekAgo) {
          messagesThisWeek++
        }

        // Messages by day
        const day = new Date(msg.timestamp).toLocaleDateString()
        messagesByDay[day] = (messagesByDay[day] || 0) + 1
      })
    })

    const mostUsedModel = Object.entries(modelUsage).reduce(
      (a, b) => (b[1] > a[1] ? b : a),
      ['未知', 0]
    )[0]

    return {
      totalConversations: conversations.length,
      totalMessages,
      avgMessagesPerConversation:
        conversations.length > 0 ? totalMessages / conversations.length : 0,
      totalTokens,
      mostUsedModel,
      conversationsToday,
      messagesThisWeek,
      activeHours,
      modelUsage,
      conversationLengths,
      messagesByDay
    }
  }, [conversations])

  const StatCard = ({
    icon: Icon,
    label,
    value,
    change,
    changeType = 'neutral'
  }: {
    icon: React.ElementType
    label: string
    value: string | number
    change?: string
    changeType?: 'positive' | 'negative' | 'neutral'
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <Badge
            variant={changeType === 'positive' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {change}
          </Badge>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    </motion.div>
  )

  const BarChart = ({
    data,
    maxValue
  }: {
    data: Record<string | number, number>
    maxValue?: number
  }) => {
    const max = maxValue || Math.max(...Object.values(data))

    return (
      <div className="space-y-2">
        {Object.entries(data)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-24 truncate">
                {key}
              </span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(value / max) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-end px-2"
                >
                  <span className="text-xs text-white font-medium">{value}</span>
                </motion.div>
              </div>
            </div>
          ))}
      </div>
    )
  }

  const HeatMap = ({ data }: { data: Record<number, number> }) => {
    const max = Math.max(...Object.values(data))

    return (
      <div className="grid grid-cols-12 gap-2">
        {Array.from({ length: 24 }, (_, i) => {
          const value = data[i] || 0
          const intensity = max > 0 ? value / max : 0

          return (
            <div
              key={i}
              className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium relative group cursor-pointer transition-transform hover:scale-110"
              style={{
                backgroundColor: `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`
              }}
            >
              {i}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {i}:00 - {value} 条消息
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const LineChart = ({ data }: { data: Record<string, number> }) => {
    const sortedEntries = Object.entries(data).sort((a, b) =>
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
    ).slice(-7) // Last 7 days

    const max = Math.max(...sortedEntries.map(([, v]) => v))

    return (
      <div className="h-48 flex items-end justify-between gap-2">
        {sortedEntries.map(([date, value], index) => {
          const height = max > 0 ? (value / max) * 100 : 0

          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center relative group">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg cursor-pointer hover:from-primary-600 hover:to-primary-500 transition-colors"
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {value} 条消息
                  </div>
                </motion.div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 transform -rotate-45 origin-top-left">
                {new Date(date).toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            对话分析
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            深入了解你的AI对话数据
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          最近 7 天
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ChatBubbleLeftRightIcon}
          label="总对话数"
          value={analytics.totalConversations}
          change={`+${analytics.conversationsToday}`}
          changeType="positive"
        />
        <StatCard
          icon={ChartBarIcon}
          label="总消息数"
          value={analytics.totalMessages}
          change={`本周 ${analytics.messagesThisWeek}`}
          changeType="positive"
        />
        <StatCard
          icon={CpuChipIcon}
          label="最常用模型"
          value={analytics.mostUsedModel}
        />
        <StatCard
          icon={TrophyIcon}
          label="平均消息数"
          value={analytics.avgMessagesPerConversation.toFixed(1)}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Usage */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            模型使用统计
          </h3>
          <BarChart data={analytics.modelUsage} />
        </div>

        {/* Active Hours Heatmap */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            活跃时段分布
          </h3>
          <HeatMap data={analytics.activeHours} />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
            颜色越深表示该时段消息越多
          </p>
        </div>

        {/* Messages Trend */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            消息趋势（最近7天）
          </h3>
          <LineChart data={analytics.messagesByDay} />
        </div>

        {/* Conversation Length Distribution */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            对话长度分布
          </h3>
          <div className="space-y-3">
            {[
              { label: '短对话 (1-5 消息)', range: [1, 5] },
              { label: '中等对话 (6-15 消息)', range: [6, 15] },
              { label: '长对话 (16-30 消息)', range: [16, 30] },
              { label: '超长对话 (30+ 消息)', range: [31, Infinity] }
            ].map((category) => {
              const count = analytics.conversationLengths.filter(
                (len) => len >= category.range[0] && len <= category.range[1]
              ).length
              const percentage =
                analytics.totalConversations > 0
                  ? (count / analytics.totalConversations) * 100
                  : 0

              return (
                <div key={category.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {category.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Token Usage (if available) */}
        {analytics.totalTokens > 0 && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Token 使用情况
            </h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {analytics.totalTokens.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  总计使用 tokens
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {(analytics.totalTokens / analytics.totalMessages).toFixed(0)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    平均每消息
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {(analytics.totalTokens / analytics.totalConversations).toFixed(0)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    平均每对话
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="p-6 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-primary-600" />
          智能洞察
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            📊 你的对话效率很高，平均每个对话包含{' '}
            <strong>{analytics.avgMessagesPerConversation.toFixed(1)}</strong> 条消息
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            ⏰ 你最活跃的时段是{' '}
            <strong>
              {Object.entries(analytics.activeHours).reduce((a, b) =>
                b[1] > a[1] ? b : a
              )[0]}
              :00
            </strong>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            🚀 本周你已经进行了{' '}
            <strong>{analytics.messagesThisWeek}</strong> 次对话互动
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationAnalyticsDashboard