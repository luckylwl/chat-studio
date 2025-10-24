import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CommandLineIcon,
  StarIcon,
  ClockIcon,
  TrendingUpIcon,
} from '@heroicons/react/24/outline'

export interface Command {
  id: string
  name: string
  description: string
  icon?: string
  category: string
  keywords: string[]
  usageCount?: number
  lastUsed?: number
}

export interface CommandRecommendation {
  command: Command
  score: number
  reason: string
}

interface SmartCommandRecommenderProps {
  commands: Command[]
  onCommandSelect: (command: Command) => void
  currentContext?: string
  maxRecommendations?: number
  learningEnabled?: boolean
}

/**
 * 智能命令推荐组件
 * 基于使用频率、时间和上下文推荐命令
 */
const SmartCommandRecommender: React.FC<SmartCommandRecommenderProps> = ({
  commands,
  onCommandSelect,
  currentContext = '',
  maxRecommendations = 5,
  learningEnabled = true,
}) => {
  const [recommendations, setRecommendations] = useState<CommandRecommendation[]>(
    []
  )
  const [commandStats, setCommandStats] = useState<
    Record<string, { count: number; lastUsed: number }>
  >({})

  // 加载命令使用统计
  useEffect(() => {
    if (learningEnabled) {
      const saved = localStorage.getItem('command-stats')
      if (saved) {
        try {
          setCommandStats(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to load command stats:', e)
        }
      }
    }
  }, [learningEnabled])

  // 保存命令统计
  const saveCommandStats = (stats: typeof commandStats) => {
    if (learningEnabled) {
      localStorage.setItem('command-stats', JSON.stringify(stats))
      setCommandStats(stats)
    }
  }

  // 生成推荐
  useEffect(() => {
    const newRecommendations = generateRecommendations(
      commands,
      commandStats,
      currentContext
    )

    setRecommendations(newRecommendations.slice(0, maxRecommendations))
  }, [commands, commandStats, currentContext, maxRecommendations])

  // 处理命令选择
  const handleCommandSelect = (command: Command) => {
    // 更新统计
    const newStats = {
      ...commandStats,
      [command.id]: {
        count: (commandStats[command.id]?.count || 0) + 1,
        lastUsed: Date.now(),
      },
    }
    saveCommandStats(newStats)

    onCommandSelect(command)
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="smart-command-recommender bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <CommandLineIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            智能命令推荐
          </h3>
        </div>
      </div>

      {/* 推荐列表 */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <AnimatePresence mode="popLayout">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.command.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => handleCommandSelect(rec.command)}
                className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
              >
                <div className="flex items-start gap-3">
                  {/* 图标/表情 */}
                  <div className="flex-shrink-0 text-2xl">
                    {rec.command.icon || '⚡'}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {rec.command.name}
                      </span>

                      {/* 使用频率指示器 */}
                      {commandStats[rec.command.id] && (
                        <div className="flex items-center gap-1">
                          {commandStats[rec.command.id].count > 10 && (
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                          )}
                          {isRecentlyUsed(commandStats[rec.command.id].lastUsed) && (
                            <ClockIcon className="w-4 h-4 text-green-500" />
                          )}
                          {isTrending(commandStats[rec.command.id]) && (
                            <TrendingUpIcon className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {rec.command.description}
                    </p>

                    {/* 推荐原因 */}
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {rec.reason}
                    </p>
                  </div>

                  {/* 评分 */}
                  <div className="flex-shrink-0">
                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {Math.round(rec.score * 100)}%
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 统计信息 */}
      {learningEnabled && Object.keys(commandStats).length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            已记录 {Object.keys(commandStats).length} 个命令的使用数据
          </p>
        </div>
      )}
    </div>
  )
}

// ============ 辅助函数 ============

/**
 * 生成命令推荐
 */
function generateRecommendations(
  commands: Command[],
  stats: Record<string, { count: number; lastUsed: number }>,
  context: string
): CommandRecommendation[] {
  const recommendations: CommandRecommendation[] = []

  commands.forEach((command) => {
    let score = 0
    const reasons: string[] = []

    // 1. 使用频率评分 (0-40分)
    const usageCount = stats[command.id]?.count || 0
    const frequencyScore = Math.min(usageCount / 10, 1) * 40
    score += frequencyScore

    if (usageCount > 5) {
      reasons.push('经常使用')
    }

    // 2. 最近使用评分 (0-30分)
    const lastUsed = stats[command.id]?.lastUsed || 0
    const daysSinceUsed = (Date.now() - lastUsed) / (1000 * 60 * 60 * 24)
    const recencyScore = Math.max(0, 1 - daysSinceUsed / 30) * 30
    score += recencyScore

    if (daysSinceUsed < 1) {
      reasons.push('今天使用过')
    } else if (daysSinceUsed < 7) {
      reasons.push('最近使用过')
    }

    // 3. 上下文匹配评分 (0-30分)
    const contextScore = calculateContextScore(command, context)
    score += contextScore * 30

    if (contextScore > 0.5) {
      reasons.push('与当前输入相关')
    }

    // 4. 趋势评分 (加成)
    if (isTrending(stats[command.id])) {
      score *= 1.2
      reasons.push('使用频率上升')
    }

    recommendations.push({
      command,
      score: score / 100, // 归一化到 0-1
      reason: reasons.join(' • ') || '推荐尝试',
    })
  })

  // 按评分排序
  return recommendations.sort((a, b) => b.score - a.score)
}

/**
 * 计算上下文匹配分数
 */
function calculateContextScore(command: Command, context: string): number {
  if (!context) return 0

  const contextLower = context.toLowerCase()
  let score = 0

  // 检查命令名称匹配
  if (contextLower.includes(command.name.toLowerCase())) {
    score += 0.5
  }

  // 检查关键词匹配
  const matchedKeywords = command.keywords.filter((keyword) =>
    contextLower.includes(keyword.toLowerCase())
  )
  score += (matchedKeywords.length / command.keywords.length) * 0.5

  return Math.min(score, 1)
}

/**
 * 检查是否最近使用
 */
function isRecentlyUsed(lastUsed: number): boolean {
  const hoursSince = (Date.now() - lastUsed) / (1000 * 60 * 60)
  return hoursSince < 24
}

/**
 * 检查是否趋势上升
 */
function isTrending(
  stats: { count: number; lastUsed: number } | undefined
): boolean {
  if (!stats) return false

  // 简单的趋势判断:最近7天使用次数占总数的50%以上
  const daysSinceUsed = (Date.now() - stats.lastUsed) / (1000 * 60 * 60 * 24)
  return daysSinceUsed < 7 && stats.count > 5
}

export default SmartCommandRecommender
export type { Command, CommandRecommendation }
