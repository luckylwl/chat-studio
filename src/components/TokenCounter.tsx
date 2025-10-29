import React, { useState, useEffect, useMemo } from 'react'
import {
  CalculatorIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Button, Card, Badge } from './ui'
import { cn } from '@/utils'
import { motion } from 'framer-motion'
import type { Conversation, Message } from '@/types'

interface TokenCounterProps {
  isOpen: boolean
  onClose: () => void
  conversation?: Conversation
  allConversations?: Conversation[]
}

// 模型定价（美元/1K tokens）
const MODEL_PRICING = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'gemini-pro': { input: 0.00025, output: 0.0005 },
  'gemini-1.5-pro': { input: 0.0035, output: 0.0105 }
}

// 简单的 Token 估算（英文 ~4字符/token，中文 ~2字符/token）
const estimateTokens = (text: string): number => {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars / 2 + otherChars / 4)
}

const TokenCounter: React.FC<TokenCounterProps> = ({
  isOpen,
  onClose,
  conversation,
  allConversations = []
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5-turbo')
  const [showAllConversations, setShowAllConversations] = useState(false)

  // 计算单个对话的 Token 和成本
  const calculateConversationStats = (conv: Conversation) => {
    let inputTokens = 0
    let outputTokens = 0

    conv.messages.forEach(msg => {
      const tokens = msg.tokens || estimateTokens(msg.content)
      if (msg.role === 'user' || msg.role === 'system') {
        inputTokens += tokens
      } else if (msg.role === 'assistant') {
        outputTokens += tokens
      }
    })

    const model = conv.model || selectedModel
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING['gpt-3.5-turbo']

    const inputCost = (inputTokens / 1000) * pricing.input
    const outputCost = (outputTokens / 1000) * pricing.output
    const totalCost = inputCost + outputCost

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost,
      model
    }
  }

  // 当前对话统计
  const currentStats = useMemo(() => {
    if (!conversation) return null
    return calculateConversationStats(conversation)
  }, [conversation, selectedModel])

  // 所有对话统计
  const allStats = useMemo(() => {
    if (!showAllConversations || allConversations.length === 0) return null

    let totalInputTokens = 0
    let totalOutputTokens = 0
    let totalCost = 0
    const modelBreakdown: Record<string, { tokens: number; cost: number; count: number }> = {}

    allConversations.forEach(conv => {
      const stats = calculateConversationStats(conv)
      totalInputTokens += stats.inputTokens
      totalOutputTokens += stats.outputTokens
      totalCost += stats.totalCost

      if (!modelBreakdown[stats.model]) {
        modelBreakdown[stats.model] = { tokens: 0, cost: 0, count: 0 }
      }
      modelBreakdown[stats.model].tokens += stats.totalTokens
      modelBreakdown[stats.model].cost += stats.totalCost
      modelBreakdown[stats.model].count += 1
    })

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      totalCost,
      modelBreakdown,
      conversationCount: allConversations.length
    }
  }, [allConversations, showAllConversations, selectedModel])

  // 格式化成本
  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`
    return `$${cost.toFixed(2)}`
  }

  // 格式化 Token 数量
  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] rounded-xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <CalculatorIcon className="w-6 h-6 text-green-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Token 计数器 & 成本计算
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                分析 Token 使用量和 API 调用成本
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* View Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAllConversations(false)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                !showAllConversations
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              当前对话
            </button>
            <button
              onClick={() => setShowAllConversations(true)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                showAllConversations
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              所有对话 ({allConversations.length})
            </button>
          </div>

          {/* Current Conversation Stats */}
          {!showAllConversations && currentStats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {conversation?.title || '当前对话'}
                </h3>
                <Badge variant="info">{currentStats.model}</Badge>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">输入 Token</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatTokens(currentStats.inputTokens)}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {formatCost(currentStats.inputCost)}
                      </p>
                    </div>
                    <ChartBarIcon className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">输出 Token</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatTokens(currentStats.outputTokens)}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {formatCost(currentStats.outputCost)}
                      </p>
                    </div>
                    <ChartBarIcon className="w-8 h-8 text-purple-500" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">总计</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatTokens(currentStats.totalTokens)}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-semibold">
                        {formatCost(currentStats.totalCost)}
                      </p>
                    </div>
                    <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
                  </div>
                </Card>
              </div>

              {/* Message Breakdown */}
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">消息明细</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {conversation?.messages.map((msg, idx) => {
                    const tokens = msg.tokens || estimateTokens(msg.content)
                    return (
                      <div
                        key={msg.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {msg.role === 'user' ? '👤 用户' : '🤖 助手'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {msg.content.substring(0, 50)}...
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatTokens(tokens)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">tokens</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* All Conversations Stats */}
          {showAllConversations && allStats && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                总览统计
              </h3>

              {/* Overall Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">对话数量</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {allStats.conversationCount}
                  </p>
                </Card>

                <Card className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">总 Token</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatTokens(allStats.totalTokens)}
                  </p>
                </Card>

                <Card className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">总成本</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatCost(allStats.totalCost)}
                  </p>
                </Card>

                <Card className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">平均成本</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCost(allStats.totalCost / allStats.conversationCount)}
                  </p>
                </Card>
              </div>

              {/* Model Breakdown */}
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">按模型统计</h4>
                <div className="space-y-3">
                  {Object.entries(allStats.modelBreakdown).map(([model, data]) => (
                    <div
                      key={model}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">{model}</p>
                          <Badge variant="secondary">{data.count} 对话</Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatTokens(data.tokens)} tokens
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {formatCost(data.cost)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Info */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">💡 提示</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Token 数量为估算值，实际值可能略有差异</li>
                  <li>成本基于官方定价，实际费用以账单为准</li>
                  <li>不同模型定价不同，GPT-4 最贵，Gemini 最便宜</li>
                  <li>输出 token 通常比输入 token 贵 2-5 倍</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-200 dark:border-gray-700 p-6">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default TokenCounter
