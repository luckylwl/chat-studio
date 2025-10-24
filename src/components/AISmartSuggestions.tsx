import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  LightBulbIcon,
  ClockIcon,
  FireIcon,
} from '@heroicons/react/24/outline'

export interface SmartSuggestion {
  id: string
  text: string
  type: 'completion' | 'question' | 'topic' | 'followup'
  confidence: number // 0-1
  reasoning?: string
}

export interface SuggestionContext {
  currentInput: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  userPreferences?: Record<string, any>
  recentTopics?: string[]
}

interface AISmartSuggestionsProps {
  context: SuggestionContext
  onSuggestionSelect: (suggestion: SmartSuggestion) => void
  onSuggestionDismiss?: (suggestionId: string) => void
  maxSuggestions?: number
  enabled?: boolean
  learningEnabled?: boolean
}

/**
 * AI智能输入建议组件
 * 基于上下文和用户习惯提供智能建议
 */
const AISmartSuggestions: React.FC<AISmartSuggestionsProps> = ({
  context,
  onSuggestionSelect,
  onSuggestionDismiss,
  maxSuggestions = 3,
  enabled = true,
  learningEnabled = true,
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userBehavior, setUserBehavior] = useState<Record<string, number>>({})

  // 加载用户行为数据
  useEffect(() => {
    if (learningEnabled) {
      const saved = localStorage.getItem('smart-suggestions-behavior')
      if (saved) {
        try {
          setUserBehavior(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to load user behavior:', e)
        }
      }
    }
  }, [learningEnabled])

  // 保存用户行为
  const saveUserBehavior = useCallback(
    (behavior: Record<string, number>) => {
      if (learningEnabled) {
        localStorage.setItem('smart-suggestions-behavior', JSON.stringify(behavior))
        setUserBehavior(behavior)
      }
    },
    [learningEnabled]
  )

  // 生成智能建议
  const generateSuggestions = useCallback(async () => {
    if (!enabled || !context.currentInput) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    try {
      const newSuggestions: SmartSuggestion[] = []

      // 1. 基于输入的自动补全建议
      if (context.currentInput.length >= 3) {
        const completionSuggestions = generateCompletionSuggestions(
          context.currentInput,
          context.conversationHistory
        )
        newSuggestions.push(...completionSuggestions)
      }

      // 2. 基于对话历史的后续问题建议
      if (context.conversationHistory.length > 0) {
        const followupSuggestions = generateFollowupSuggestions(
          context.conversationHistory
        )
        newSuggestions.push(...followupSuggestions)
      }

      // 3. 基于最近话题的相关建议
      if (context.recentTopics && context.recentTopics.length > 0) {
        const topicSuggestions = generateTopicSuggestions(context.recentTopics)
        newSuggestions.push(...topicSuggestions)
      }

      // 4. 应用用户习惯加权
      const weightedSuggestions = applyUserBehaviorWeighting(
        newSuggestions,
        userBehavior
      )

      // 5. 排序和过滤
      const finalSuggestions = weightedSuggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxSuggestions)

      setSuggestions(finalSuggestions)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [context, enabled, maxSuggestions, userBehavior])

  // 防抖生成建议
  useEffect(() => {
    const timer = setTimeout(() => {
      generateSuggestions()
    }, 300)

    return () => clearTimeout(timer)
  }, [generateSuggestions])

  // 处理建议选择
  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    // 记录用户选择
    const newBehavior = {
      ...userBehavior,
      [suggestion.type]: (userBehavior[suggestion.type] || 0) + 1,
    }
    saveUserBehavior(newBehavior)

    onSuggestionSelect(suggestion)
  }

  // 处理建议关闭
  const handleDismiss = (suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
    onSuggestionDismiss?.(suggestionId)
  }

  if (!enabled || suggestions.length === 0) {
    return null
  }

  return (
    <div className="ai-smart-suggestions">
      <AnimatePresence mode="popLayout">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
            className="mb-2"
          >
            <button
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                {/* 图标 */}
                <div className="flex-shrink-0 mt-0.5">
                  {suggestion.type === 'completion' && (
                    <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                  {suggestion.type === 'question' && (
                    <LightBulbIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                  {suggestion.type === 'followup' && (
                    <ClockIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  {suggestion.type === 'topic' && (
                    <FireIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  )}
                </div>

                {/* 文本 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {suggestion.text}
                  </p>
                  {suggestion.reasoning && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {suggestion.reasoning}
                    </p>
                  )}
                </div>

                {/* 置信度指示器 */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-3 rounded-full ${
                          i < Math.ceil(suggestion.confidence * 3)
                            ? 'bg-blue-600 dark:bg-blue-400'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-4 py-2"
        >
          <SparklesIcon className="w-4 h-4 animate-pulse" />
          <span>生成智能建议中...</span>
        </motion.div>
      )}
    </div>
  )
}

// ============ 辅助函数 ============

/**
 * 生成自动补全建议
 */
function generateCompletionSuggestions(
  input: string,
  history: Array<{ role: string; content: string }>
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = []

  // 基于常见模式的补全
  const patterns = [
    {
      trigger: /^如何/,
      completions: ['如何使用', '如何实现', '如何解决'],
      type: 'question' as const,
    },
    {
      trigger: /^什么是/,
      completions: ['什么是最佳实践', '什么是原理', '什么是区别'],
      type: 'question' as const,
    },
    {
      trigger: /^帮我/,
      completions: ['帮我写一个', '帮我解释', '帮我优化'],
      type: 'completion' as const,
    },
  ]

  for (const pattern of patterns) {
    if (pattern.trigger.test(input)) {
      pattern.completions.forEach((completion, index) => {
        suggestions.push({
          id: `completion-${index}`,
          text: completion,
          type: pattern.type,
          confidence: 0.7 - index * 0.1,
        })
      })
    }
  }

  return suggestions
}

/**
 * 生成后续问题建议
 */
function generateFollowupSuggestions(
  history: Array<{ role: string; content: string }>
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = []
  const lastMessage = history[history.length - 1]

  if (!lastMessage || lastMessage.role !== 'assistant') {
    return suggestions
  }

  // 基于最后一条AI回复生成后续问题
  const followups = [
    '能详细解释一下吗?',
    '有什么相关的例子吗?',
    '这个方法的优缺点是什么?',
  ]

  followups.forEach((text, index) => {
    suggestions.push({
      id: `followup-${index}`,
      text,
      type: 'followup',
      confidence: 0.8 - index * 0.1,
      reasoning: '基于上一条回复',
    })
  })

  return suggestions
}

/**
 * 生成话题相关建议
 */
function generateTopicSuggestions(topics: string[]): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = []

  topics.slice(0, 2).forEach((topic, index) => {
    suggestions.push({
      id: `topic-${index}`,
      text: `继续讨论${topic}`,
      type: 'topic',
      confidence: 0.6 - index * 0.1,
      reasoning: '最近讨论的话题',
    })
  })

  return suggestions
}

/**
 * 应用用户习惯加权
 */
function applyUserBehaviorWeighting(
  suggestions: SmartSuggestion[],
  behavior: Record<string, number>
): SmartSuggestion[] {
  const totalClicks = Object.values(behavior).reduce((sum, count) => sum + count, 0)

  if (totalClicks === 0) {
    return suggestions
  }

  return suggestions.map((suggestion) => {
    const typeClicks = behavior[suggestion.type] || 0
    const typeWeight = typeClicks / totalClicks

    return {
      ...suggestion,
      confidence: suggestion.confidence * (1 + typeWeight),
    }
  })
}

export default AISmartSuggestions
export type { SmartSuggestion, SuggestionContext }
