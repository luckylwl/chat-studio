import React, { useState, useMemo, useCallback } from 'react'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  CpuChipIcon,
  TagIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Button, Badge } from './ui'
import { cn } from '@/utils'
import { useAppStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import type { Conversation, Message } from '@/types'

interface SearchFilters {
  query: string
  dateRange: {
    start: Date | null
    end: Date | null
  }
  models: string[]
  roles: ('user' | 'assistant' | 'system')[]
  hasAttachments: boolean
  minLength: number
  maxLength: number
  tags: string[]
  sortBy: 'relevance' | 'date' | 'length'
  sortOrder: 'asc' | 'desc'
}

interface SearchResult {
  conversationId: string
  conversationTitle: string
  messageId: string
  messageContent: string
  messageRole: 'user' | 'assistant' | 'system'
  timestamp: number
  model?: string
  highlights: string[]
  relevanceScore: number
}

interface AdvancedConversationSearchProps {
  isOpen: boolean
  onClose: () => void
  onSelectResult: (conversationId: string, messageId: string) => void
}

const AdvancedConversationSearch: React.FC<AdvancedConversationSearchProps> = ({
  isOpen,
  onClose,
  onSelectResult
}) => {
  const { conversations } = useAppStore()
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    dateRange: { start: null, end: null },
    models: [],
    roles: [],
    hasAttachments: false,
    minLength: 0,
    maxLength: 10000,
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // 获取所有可用的模型
  const availableModels = useMemo(() => {
    const models = new Set<string>()
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.model) models.add(msg.model)
      })
    })
    return Array.from(models)
  }, [conversations])

  // 搜索逻辑
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!filters.query.trim()) return []

    setIsSearching(true)
    const results: SearchResult[] = []
    const query = filters.query.toLowerCase()

    conversations.forEach(conversation => {
      conversation.messages.forEach(message => {
        // 基础文本匹配
        const content = message.content.toLowerCase()
        if (!content.includes(query)) return

        // 应用过滤器
        // 日期范围
        if (filters.dateRange.start && message.timestamp < filters.dateRange.start.getTime()) return
        if (filters.dateRange.end && message.timestamp > filters.dateRange.end.getTime()) return

        // 模型过滤
        if (filters.models.length > 0 && message.model && !filters.models.includes(message.model)) return

        // 角色过滤
        if (filters.roles.length > 0 && !filters.roles.includes(message.role)) return

        // 长度过滤
        if (message.content.length < filters.minLength || message.content.length > filters.maxLength) return

        // 计算相关性得分
        const occurrences = (content.match(new RegExp(query, 'g')) || []).length
        const position = content.indexOf(query)
        const relevanceScore = occurrences * 10 + (1000 - position) / 1000

        // 提取高亮片段
        const highlights: string[] = []
        let index = 0
        while (index < message.content.length) {
          const foundIndex = message.content.toLowerCase().indexOf(query, index)
          if (foundIndex === -1) break

          const start = Math.max(0, foundIndex - 50)
          const end = Math.min(message.content.length, foundIndex + query.length + 50)
          highlights.push(message.content.substring(start, end))

          index = foundIndex + query.length
          if (highlights.length >= 3) break
        }

        results.push({
          conversationId: conversation.id,
          conversationTitle: conversation.title,
          messageId: message.id,
          messageContent: message.content,
          messageRole: message.role,
          timestamp: message.timestamp,
          model: message.model,
          highlights,
          relevanceScore
        })
      })
    })

    // 排序
    results.sort((a, b) => {
      let comparison = 0
      switch (filters.sortBy) {
        case 'relevance':
          comparison = b.relevanceScore - a.relevanceScore
          break
        case 'date':
          comparison = b.timestamp - a.timestamp
          break
        case 'length':
          comparison = b.messageContent.length - a.messageContent.length
          break
      }
      return filters.sortOrder === 'asc' ? -comparison : comparison
    })

    setTimeout(() => setIsSearching(false), 100)
    return results
  }, [conversations, filters])

  const handleResetFilters = () => {
    setFilters({
      query: filters.query,
      dateRange: { start: null, end: null },
      models: [],
      roles: [],
      hasAttachments: false,
      minLength: 0,
      maxLength: 10000,
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc'
    })
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    )
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.models.length > 0) count++
    if (filters.roles.length > 0) count++
    if (filters.hasAttachments) count++
    if (filters.minLength > 0 || filters.maxLength < 10000) count++
    return count
  }, [filters])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm pt-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            placeholder="搜索对话内容..."
            className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 dark:text-gray-100 text-lg"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'relative',
              showFilters && 'bg-primary-100 dark:bg-primary-900/30'
            )}
          >
            <FunnelIcon className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Date Range */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CalendarIcon className="w-4 h-4" />
                    日期范围
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                      onChange={(e) =>
                        setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : null }
                        }))
                      }
                      className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                    <span className="text-gray-500">至</span>
                    <input
                      type="date"
                      value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                      onChange={(e) =>
                        setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : null }
                        }))
                      }
                      className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Models */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CpuChipIcon className="w-4 h-4" />
                    AI模型
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableModels.map(model => (
                      <button
                        key={model}
                        onClick={() =>
                          setFilters(prev => ({
                            ...prev,
                            models: prev.models.includes(model)
                              ? prev.models.filter(m => m !== model)
                              : [...prev.models, model]
                          }))
                        }
                        className={cn(
                          'px-3 py-1 rounded-lg text-sm transition-colors',
                          filters.models.includes(model)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Roles */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <UserIcon className="w-4 h-4" />
                    消息角色
                  </label>
                  <div className="flex gap-2">
                    {(['user', 'assistant', 'system'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() =>
                          setFilters(prev => ({
                            ...prev,
                            roles: prev.roles.includes(role)
                              ? prev.roles.filter(r => r !== role)
                              : [...prev.roles, role]
                          }))
                        }
                        className={cn(
                          'px-3 py-1 rounded-lg text-sm transition-colors',
                          filters.roles.includes(role)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {role === 'user' ? '用户' : role === 'assistant' ? 'AI助手' : '系统'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <ArrowPathIcon className="w-4 h-4" />
                    排序方式
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))
                    }
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  >
                    <option value="relevance">相关性</option>
                    <option value="date">日期</option>
                    <option value="length">长度</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))
                    }
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  >
                    <option value="desc">降序</option>
                    <option value="asc">升序</option>
                  </select>
                </div>

                {/* Reset */}
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    重置筛选
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Stats */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSearching ? (
                <span>搜索中...</span>
              ) : (
                <span>
                  找到 <strong className="text-gray-900 dark:text-gray-100">{searchResults.length}</strong> 条结果
                </span>
              )}
            </p>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            <AnimatePresence>
              {searchResults.map((result, index) => (
                <motion.div
                  key={result.messageId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectResult(result.conversationId, result.messageId)}
                  className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {result.conversationTitle}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {result.messageRole === 'user' ? '用户' : 'AI助手'}
                      </Badge>
                      {result.model && (
                        <Badge variant="secondary" className="text-xs">
                          {result.model}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {new Date(result.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {result.highlights.slice(0, 2).map((highlight, i) => (
                      <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        ...{highlightText(highlight, filters.query)}...
                      </p>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>相关性: {result.relevanceScore.toFixed(1)}</span>
                    <span>•</span>
                    <span>长度: {result.messageContent.length} 字符</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {!isSearching && filters.query.trim() && searchResults.length === 0 && (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">未找到匹配的结果</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  尝试调整搜索关键词或筛选条件
                </p>
              </div>
            )}

            {!filters.query.trim() && (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">输入关键词开始搜索</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AdvancedConversationSearch