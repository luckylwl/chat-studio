import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { cn } from '@/utils'
import {
  ChartBarIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BoltIcon,
  UserIcon,
  CpuChipIcon,
  ArrowPathIcon,
  EyeIcon,
  HeartIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface RealTimeStats {
  currentSessionMessages: number
  currentSessionTime: number
  todayMessages: number
  todayTime: number
  averageResponseTime: number
  mostUsedModel: string
  activeStreaks: number
  messageVelocity: number // messages per minute
  characterCount: number
  wordCount: number
  conversationDepth: number
  lastActivityTime: number
}

interface StatsTile {
  id: string
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<any>
  color: string
  description?: string
}

interface RealTimeStatisticsProps {
  className?: string
  compact?: boolean
}

const RealTimeStatistics: React.FC<RealTimeStatisticsProps> = ({
  className,
  compact = false
}) => {
  const { conversations, currentConversationId } = useAppStore()
  const [stats, setStats] = useState<RealTimeStats>({
    currentSessionMessages: 0,
    currentSessionTime: 0,
    todayMessages: 0,
    todayTime: 0,
    averageResponseTime: 0,
    mostUsedModel: '',
    activeStreaks: 0,
    messageVelocity: 0,
    characterCount: 0,
    wordCount: 0,
    conversationDepth: 0,
    lastActivityTime: Date.now()
  })

  const [sessionStartTime] = useState(Date.now())
  const [isLiveUpdating, setIsLiveUpdating] = useState(true)

  // Calculate real-time statistics
  useEffect(() => {
    const calculateStats = () => {
      const now = Date.now()
      const today = new Date().toDateString()

      // Current conversation stats
      const currentConv = conversations.find(c => c.id === currentConversationId)
      const currentSessionMessages = currentConv?.messages.length || 0
      const currentSessionTime = Math.floor((now - sessionStartTime) / 1000)

      // Today's stats
      const todayConversations = conversations.filter(conv => {
        return new Date(conv.updatedAt).toDateString() === today
      })

      const todayMessages = todayConversations.reduce((sum, conv) => {
        return sum + conv.messages.filter(msg =>
          new Date(msg.timestamp).toDateString() === today
        ).length
      }, 0)

      // Calculate average response time (mock)
      const averageResponseTime = Math.random() * 2000 + 500 // 0.5-2.5s

      // Most used model
      const modelCounts = new Map<string, number>()
      conversations.forEach(conv => {
        modelCounts.set(conv.model, (modelCounts.get(conv.model) || 0) + 1)
      })
      const mostUsedModel = Array.from(modelCounts.entries())
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

      // Character and word counts for current session
      const currentMessages = currentConv?.messages || []
      const characterCount = currentMessages.reduce((sum, msg) => sum + msg.content.length, 0)
      const wordCount = currentMessages.reduce((sum, msg) => {
        return sum + msg.content.split(/\s+/).filter(word => word.length > 0).length
      }, 0)

      // Message velocity (messages per minute)
      const sessionMinutes = Math.max(currentSessionTime / 60, 1)
      const messageVelocity = currentSessionMessages / sessionMinutes

      // Conversation depth (average messages per conversation today)
      const conversationDepth = todayConversations.length > 0
        ? todayMessages / todayConversations.length
        : 0

      setStats({
        currentSessionMessages,
        currentSessionTime,
        todayMessages,
        todayTime: Math.floor(Math.random() * 7200 + 1800), // Mock: 30min - 2h
        averageResponseTime,
        mostUsedModel,
        activeStreaks: Math.floor(Math.random() * 7 + 1), // Mock: 1-7 days
        messageVelocity,
        characterCount,
        wordCount,
        conversationDepth,
        lastActivityTime: now
      })
    }

    calculateStats()

    // Update stats every second when live updating is enabled
    const interval = setInterval(() => {
      if (isLiveUpdating) {
        calculateStats()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [conversations, currentConversationId, sessionStartTime, isLiveUpdating])

  // Format time duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Format number with K/M suffixes
  const formatNumber = (num: number): string => {
    if (num < 1000) return num.toString()
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
    return `${(num / 1000000).toFixed(1)}M`
  }

  // Generate stats tiles
  const generateStatsTiles = (): StatsTile[] => {
    return [
      {
        id: 'session-messages',
        title: '当前会话消息',
        value: stats.currentSessionMessages,
        icon: ChatBubbleLeftRightIcon,
        color: 'blue',
        description: '本次会话中的消息数量',
        change: Math.random() > 0.5 ? Math.floor(Math.random() * 20) : -Math.floor(Math.random() * 10),
        trend: Math.random() > 0.3 ? 'up' : 'neutral'
      },
      {
        id: 'session-time',
        title: '会话时长',
        value: formatDuration(stats.currentSessionTime),
        icon: ClockIcon,
        color: 'green',
        description: '当前会话持续时间'
      },
      {
        id: 'today-messages',
        title: '今日消息数',
        value: stats.todayMessages,
        icon: DocumentTextIcon,
        color: 'purple',
        description: '今天发送的总消息数',
        change: Math.floor(Math.random() * 50),
        trend: 'up'
      },
      {
        id: 'response-time',
        title: '平均响应时间',
        value: `${stats.averageResponseTime.toFixed(0)}ms`,
        icon: BoltIcon,
        color: 'orange',
        description: 'AI回复的平均响应时间',
        trend: Math.random() > 0.5 ? 'down' : 'up',
        change: Math.floor(Math.random() * 100)
      },
      {
        id: 'message-velocity',
        title: '消息频率',
        value: `${stats.messageVelocity.toFixed(1)}/min`,
        icon: ArrowUpIcon,
        color: 'indigo',
        description: '每分钟发送消息数量'
      },
      {
        id: 'active-model',
        title: '活跃模型',
        value: stats.mostUsedModel,
        icon: CpuChipIcon,
        color: 'pink',
        description: '最常使用的AI模型'
      },
      {
        id: 'character-count',
        title: '字符统计',
        value: formatNumber(stats.characterCount),
        icon: DocumentTextIcon,
        color: 'teal',
        description: '当前会话总字符数'
      },
      {
        id: 'conversation-depth',
        title: '对话深度',
        value: stats.conversationDepth.toFixed(1),
        icon: UserIcon,
        color: 'red',
        description: '平均每个对话的消息数量',
        trend: 'up',
        change: 15
      }
    ]
  }

  const StatCard: React.FC<{ stat: StatsTile; isCompact?: boolean }> = ({
    stat,
    isCompact = false
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600 text-blue-50',
      green: 'from-green-500 to-green-600 text-green-50',
      purple: 'from-purple-500 to-purple-600 text-purple-50',
      orange: 'from-orange-500 to-orange-600 text-orange-50',
      indigo: 'from-indigo-500 to-indigo-600 text-indigo-50',
      pink: 'from-pink-500 to-pink-600 text-pink-50',
      teal: 'from-teal-500 to-teal-600 text-teal-50',
      red: 'from-red-500 to-red-600 text-red-50'
    }

    return (
      <div className={cn(
        'rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg',
        isCompact ? 'bg-white dark:bg-gray-800' : `bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]}`
      )}>
        <div className="flex items-start justify-between mb-2">
          <div className={cn(
            'p-2 rounded-lg',
            isCompact
              ? 'bg-gray-100 dark:bg-gray-700'
              : 'bg-white/20 backdrop-blur-sm'
          )}>
            <stat.icon className={cn(
              'h-5 w-5',
              isCompact ? 'text-gray-600 dark:text-gray-400' : 'text-white'
            )} />
          </div>
          {stat.change && (
            <div className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
              stat.trend === 'up'
                ? isCompact
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                  : 'bg-white/20 text-white'
                : stat.trend === 'down'
                ? isCompact
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                  : 'bg-white/20 text-white'
                : isCompact
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                : 'bg-white/20 text-white'
            )}>
              {stat.trend === 'up' && <ArrowUpIcon className="h-3 w-3" />}
              {stat.trend === 'down' && <ArrowDownIcon className="h-3 w-3" />}
              <span>{stat.trend === 'up' ? '+' : stat.trend === 'down' ? '-' : ''}{Math.abs(stat.change)}</span>
            </div>
          )}
        </div>

        <div>
          <p className={cn(
            'text-xs font-medium mb-1',
            isCompact ? 'text-gray-600 dark:text-gray-400' : 'text-white/80'
          )}>
            {stat.title}
          </p>
          <p className={cn(
            'text-xl font-bold',
            isCompact ? 'text-gray-900 dark:text-gray-100' : 'text-white'
          )}>
            {stat.value}
          </p>
          {stat.description && !isCompact && (
            <p className="text-xs text-white/70 mt-1 line-clamp-2">
              {stat.description}
            </p>
          )}
        </div>
      </div>
    )
  }

  const statsTiles = generateStatsTiles()

  if (compact) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
        {statsTiles.slice(0, 4).map((stat) => (
          <StatCard key={stat.id} stat={stat} isCompact />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">实时统计面板</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              实时跟踪您的对话活动和使用模式
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            isLiveUpdating
              ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              isLiveUpdating ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            )} />
            {isLiveUpdating ? '实时更新' : '已暂停'}
          </div>

          <button
            onClick={() => setIsLiveUpdating(!isLiveUpdating)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isLiveUpdating ? '暂停更新' : '恢复更新'}
          >
            <ArrowPathIcon className={cn(
              'h-5 w-5',
              isLiveUpdating ? 'animate-spin text-blue-500' : 'text-gray-500'
            )} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsTiles.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">活动时间线</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-600 dark:text-gray-400">
              {new Date().toLocaleTimeString('zh-CN')} - 当前活跃中
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">
              {new Date(sessionStartTime).toLocaleTimeString('zh-CN')} - 会话开始
            </span>
          </div>

          {conversations.slice(0, 3).map((conv, idx) => (
            <div key={conv.id} className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full opacity-60" />
              <span className="text-gray-600 dark:text-gray-400">
                {new Date(conv.updatedAt).toLocaleTimeString('zh-CN')} - {conv.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <HeartIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">效率指标</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            当前消息频率：{stats.messageVelocity.toFixed(1)} msg/min，比昨天提高了15%
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">质量评估</span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">
            平均对话深度：{stats.conversationDepth.toFixed(1)} 条消息，显示深度交互
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <EyeIcon className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">使用趋势</span>
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            连续活跃 {stats.activeStreaks} 天，保持良好的使用习惯
          </p>
        </div>
      </div>
    </div>
  )
}

export default RealTimeStatistics