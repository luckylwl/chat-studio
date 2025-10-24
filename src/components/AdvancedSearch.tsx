import React, { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/store'
import { Button, Input } from './ui'
import { cn } from '@/utils'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface SearchFilters {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom'
  startDate?: string
  endDate?: string
  model: string
  role: 'all' | 'user' | 'assistant'
  messageLength: 'all' | 'short' | 'medium' | 'long'
  hasAttachments: boolean | null
  keywords: string[]
}

interface SearchResult {
  type: 'message' | 'conversation'
  conversationId: string
  conversationTitle: string
  messageId?: string
  content: string
  role?: 'user' | 'assistant'
  timestamp: number
  model: string
  relevanceScore: number
  highlights: string[]
}

interface AdvancedSearchProps {
  className?: string
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: 'all',
    model: 'all',
    role: 'all',
    messageLength: 'all',
    hasAttachments: null,
    keywords: []
  })
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const { conversations, apiProviders } = useAppStore()

  // Get all available models from conversations
  const availableModels = useMemo(() => {
    const models = new Set<string>()
    conversations.forEach(conv => {
      models.add(conv.model)
    })
    return Array.from(models)
  }, [conversations])

  // Advanced search algorithm
  const performSearch = useMemo(() => {
    return () => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setIsSearching(true)

      const searchResults: SearchResult[] = []
      const query = searchQuery.toLowerCase()

      conversations.forEach(conversation => {
        // Filter by date range
        if (filters.dateRange !== 'all') {
          const convDate = new Date(conversation.updatedAt)
          const now = new Date()

          switch (filters.dateRange) {
            case 'today':
              if (convDate.toDateString() !== now.toDateString()) return
              break
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              if (convDate < weekAgo) return
              break
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              if (convDate < monthAgo) return
              break
            case 'custom':
              if (filters.startDate && convDate < new Date(filters.startDate)) return
              if (filters.endDate && convDate > new Date(filters.endDate)) return
              break
          }
        }

        // Filter by model
        if (filters.model !== 'all' && conversation.model !== filters.model) {
          return
        }

        // Search in conversation title
        if (conversation.title.toLowerCase().includes(query)) {
          const highlights = [conversation.title]
          searchResults.push({
            type: 'conversation',
            conversationId: conversation.id,
            conversationTitle: conversation.title,
            content: conversation.title,
            timestamp: conversation.updatedAt,
            model: conversation.model,
            relevanceScore: 0.8,
            highlights
          })
        }

        // Search in messages
        conversation.messages.forEach(message => {
          // Filter by role
          if (filters.role !== 'all' && message.role !== filters.role) {
            return
          }

          // Filter by message length
          if (filters.messageLength !== 'all') {
            const length = message.content.length
            switch (filters.messageLength) {
              case 'short':
                if (length > 100) return
                break
              case 'medium':
                if (length <= 100 || length > 500) return
                break
              case 'long':
                if (length <= 500) return
                break
            }
          }

          // Search in message content
          const content = message.content.toLowerCase()
          if (content.includes(query)) {
            const highlights = extractHighlights(message.content, query)
            let relevanceScore = 0.5

            // Boost relevance for exact matches
            if (content === query) relevanceScore = 1.0
            else if (content.startsWith(query)) relevanceScore = 0.9
            else if (content.includes(query)) relevanceScore = 0.6

            // Boost relevance for keyword matches
            if (filters.keywords.length > 0) {
              const keywordMatches = filters.keywords.filter(keyword =>
                content.includes(keyword.toLowerCase())
              ).length
              relevanceScore += keywordMatches * 0.1
            }

            searchResults.push({
              type: 'message',
              conversationId: conversation.id,
              conversationTitle: conversation.title,
              messageId: message.id,
              content: message.content,
              role: message.role,
              timestamp: message.timestamp,
              model: conversation.model,
              relevanceScore,
              highlights
            })
          }
        })
      })

      // Sort by relevance score and timestamp
      const sortedResults = searchResults.sort((a, b) => {
        const scoreDiff = b.relevanceScore - a.relevanceScore
        if (scoreDiff !== 0) return scoreDiff
        return b.timestamp - a.timestamp
      })

      setResults(sortedResults.slice(0, 50)) // Limit to 50 results
      setIsSearching(false)
    }
  }, [searchQuery, filters, conversations])

  // Extract highlights from content
  const extractHighlights = (content: string, query: string): string[] => {
    const highlights: string[] = []
    const queryRegex = new RegExp(`(.{0,30})(${query})(.{0,30})`, 'gi')
    let match

    while ((match = queryRegex.exec(content)) !== null && highlights.length < 3) {
      highlights.push(`...${match[1]}<mark>${match[2]}</mark>${match[3]}...`)
    }

    return highlights.length > 0 ? highlights : [content.slice(0, 100) + '...']
  }

  // Perform search when query or filters change
  useEffect(() => {
    const timeoutId = setTimeout(performSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [performSearch])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !filters.keywords.includes(keyword.trim())) {
      setFilters(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }))
    }
  }

  const removeKeyword = (keyword: string) => {
    setFilters(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const resetFilters = () => {
    setFilters({
      dateRange: 'all',
      model: 'all',
      role: 'all',
      messageLength: 'all',
      hasAttachments: null,
      keywords: []
    })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className={cn("flex items-center gap-2", className)}
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
        高级搜索
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <MagnifyingGlassIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">高级搜索</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">在所有对话和消息中搜索内容</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入搜索关键词..."
              className="pl-10 pr-4 py-3 text-lg"
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" />
              高级筛选
              {showFilters ? '收起' : '展开'}
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              找到 {results.length} 条结果
              {results.length === 50 && ' (仅显示前50条)'}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  时间范围
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">全部时间</option>
                  <option value="today">今天</option>
                  <option value="week">最近一周</option>
                  <option value="month">最近一个月</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              {/* Model Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <SparklesIcon className="inline h-4 w-4 mr-1" />
                  AI模型
                </label>
                <select
                  value={filters.model}
                  onChange={(e) => handleFilterChange('model', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">全部模型</option>
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <UserIcon className="inline h-4 w-4 mr-1" />
                  消息角色
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">全部</option>
                  <option value="user">用户消息</option>
                  <option value="assistant">AI回复</option>
                </select>
              </div>

              {/* Message Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                  消息长度
                </label>
                <select
                  value={filters.messageLength}
                  onChange={(e) => handleFilterChange('messageLength', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">全部长度</option>
                  <option value="short">短消息 (≤100字)</option>
                  <option value="medium">中等 (100-500字)</option>
                  <option value="long">长消息 (&gt;500字)</option>
                </select>
              </div>

              {/* Keywords */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <TagIcon className="inline h-4 w-4 mr-1" />
                  关键词标签
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {filters.keywords.map(keyword => (
                    <span
                      key={keyword}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-1"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  placeholder="输入关键词后按回车添加"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addKeyword(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
              >
                重置筛选
              </Button>
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? '未找到匹配的结果' : '输入关键词开始搜索'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={`${result.conversationId}-${result.messageId || 'conv'}-${index}`}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => {
                    // Navigate to conversation/message
                    console.log('Navigate to:', result)
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.type === 'conversation' ? (
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500" />
                      ) : (
                        <DocumentTextIcon className="h-4 w-4 text-purple-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {result.conversationTitle}
                      </span>
                      {result.role && (
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded-full',
                          result.role === 'user'
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        )}>
                          {result.role === 'user' ? '用户' : 'AI'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{result.model}</span>
                      <ClockIcon className="h-3 w-3" />
                      <span>{formatDate(result.timestamp)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {result.highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: highlight }}
                      />
                    ))}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(result.relevanceScore * 5) }, (_, i) => (
                        <div key={i} className="w-1 h-1 bg-yellow-400 rounded-full" />
                      ))}
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        相关度 {Math.round(result.relevanceScore * 100)}%
                      </span>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      查看详情 →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdvancedSearch