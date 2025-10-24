import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  CommandLineIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import advancedSearchService, { type SearchQuery, type SearchResult, type SearchFilter, type SearchSuggestion } from '@/services/advancedSearchService'
import { Button } from './ui'
import { cn } from '@/utils'

interface AdvancedSearchPanelProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToResult?: (conversationId: string, messageId?: string) => void
  className?: string
}

const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  isOpen,
  onClose,
  onNavigateToResult,
  className
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedResult, setSelectedResult] = useState<string | null>(null)

  // Filter states
  const [filters, setFilters] = useState<SearchFilter>({})
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'tokens' | 'length'>('relevance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Facets for dynamic filtering
  const [facets, setFacets] = useState<{
    models: Map<string, number>
    languages: Map<string, number>
    messageTypes: Map<string, number>
    dateRanges: Map<string, number>
  }>({
    models: new Map(),
    languages: new Map(),
    messageTypes: new Map(),
    dateRanges: new Map()
  })

  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  const PAGE_SIZE = 20

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    // Debounced search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (query.trim().length > 0) {
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch()
      }, 300)
    } else {
      setResults([])
      setSuggestions([])
      setTotalCount(0)
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [query, filters, sortBy, sortOrder, currentPage])

  const performSearch = async () => {
    if (!query.trim() && Object.keys(filters).length === 0) return

    setIsSearching(true)
    try {
      const searchQuery: SearchQuery = {
        text: query,
        filters,
        sortBy,
        sortOrder,
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE
      }

      const response = await advancedSearchService.search(searchQuery)

      setResults(response.results)
      setSuggestions(response.suggestions)
      setTotalCount(response.totalCount)
      setFacets(response.facets)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'query') {
      setQuery(suggestion.text)
    } else if (suggestion.type === 'filter') {
      // Parse filter suggestion and apply it
      if (suggestion.text.startsWith('model:')) {
        const model = suggestion.text.replace('model:', '')
        setFilters(prev => ({
          ...prev,
          models: [...(prev.models || []), model]
        }))
      }
    } else if (suggestion.type === 'command') {
      handleCommand(suggestion.text)
    }
  }

  const handleCommand = (command: string) => {
    switch (command) {
      case '/recent':
        setFilters({
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date()
          }
        })
        setQuery('')
        break
      case '/long':
        setFilters({
          messageLength: { min: 500, max: Number.MAX_SAFE_INTEGER }
        })
        setQuery('')
        break
      case '/errors':
        setQuery('error OR 错误 OR failed OR 失败')
        break
      case '/bookmarks':
        // This would need integration with bookmark service
        break
    }
  }

  const updateFilter = (key: keyof SearchFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setCurrentPage(0) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({})
    setCurrentPage(0)
  }

  const exportResults = async (format: 'json' | 'csv' | 'txt') => {
    try {
      const exported = await advancedSearchService.exportResults(results, format)

      const blob = new Blob([exported], {
        type: format === 'json' ? 'application/json' : 'text/plain'
      })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `search-results-${Date.now()}.${format}`
      a.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const highlightText = (text: string, highlights: string[]) => {
    if (!highlights.length) return text

    let highlightedText = text
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
    })

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
  }

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'conversation') {
      return <DocumentTextIcon className="w-4 h-4" />
    }

    switch (result.metadata.messageType) {
      case 'user':
        return <div className="w-4 h-4 rounded-full bg-blue-500" />
      case 'assistant':
        return <SparklesIcon className="w-4 h-4" />
      case 'system':
        return <CommandLineIcon className="w-4 h-4" />
      default:
        return <DocumentTextIcon className="w-4 h-4" />
    }
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
            "bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  高级搜索
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  智能搜索对话内容和消息
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowStats(!showStats)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ChartBarIcon className="w-4 h-4" />
                统计
              </Button>

              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FunnelIcon className="w-4 h-4" />
                过滤器
              </Button>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索消息内容、模型名称或使用命令（如 /recent, /long）..."
                className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Suggestions */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm"
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        suggestion.type === 'query' ? 'bg-blue-500' :
                        suggestion.type === 'filter' ? 'bg-green-500' : 'bg-purple-500'
                      )} />
                      <span className="text-gray-900 dark:text-gray-100">{suggestion.text}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-auto">{suggestion.description}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filters */}
            {Object.keys(filters).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.dateRange && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    <CalendarIcon className="w-3 h-3" />
                    日期范围
                    <button onClick={() => updateFilter('dateRange', undefined)}>
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {filters.models && filters.models.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                    <SparklesIcon className="w-3 h-3" />
                    模型: {filters.models.join(', ')}
                    <button onClick={() => updateFilter('models', undefined)}>
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {filters.messageType && filters.messageType !== 'all' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                    <DocumentTextIcon className="w-3 h-3" />
                    类型: {filters.messageType}
                    <button onClick={() => updateFilter('messageType', undefined)}>
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                >
                  清除所有过滤器
                </button>
              </div>
            )}
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        日期范围
                      </label>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
                          onChange={(e) => updateFilter('dateRange', {
                            start: new Date(e.target.value),
                            end: filters.dateRange?.end || new Date()
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                        <input
                          type="date"
                          value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
                          onChange={(e) => updateFilter('dateRange', {
                            start: filters.dateRange?.start || new Date('2020-01-01'),
                            end: new Date(e.target.value)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>
                    </div>

                    {/* Message Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        消息类型
                      </label>
                      <select
                        value={filters.messageType || 'all'}
                        onChange={(e) => updateFilter('messageType', e.target.value === 'all' ? undefined : e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="all">所有类型</option>
                        <option value="user">用户消息</option>
                        <option value="assistant">AI回复</option>
                        <option value="system">系统消息</option>
                      </select>
                    </div>

                    {/* Token Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Token范围
                      </label>
                      <div className="space-y-2">
                        <input
                          type="number"
                          placeholder="最小Token"
                          value={filters.tokenRange?.min || ''}
                          onChange={(e) => updateFilter('tokenRange', {
                            min: parseInt(e.target.value) || 0,
                            max: filters.tokenRange?.max || Number.MAX_SAFE_INTEGER
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="最大Token"
                          value={filters.tokenRange?.max === Number.MAX_SAFE_INTEGER ? '' : filters.tokenRange?.max || ''}
                          onChange={(e) => updateFilter('tokenRange', {
                            min: filters.tokenRange?.min || 0,
                            max: parseInt(e.target.value) || Number.MAX_SAFE_INTEGER
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Faceted Search */}
                  {facets.models.size > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        模型
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(facets.models.entries()).map(([model, count]) => (
                          <button
                            key={model}
                            onClick={() => {
                              const currentModels = filters.models || []
                              const isSelected = currentModels.includes(model)
                              updateFilter('models',
                                isSelected
                                  ? currentModels.filter(m => m !== model)
                                  : [...currentModels, model]
                              )
                            }}
                            className={cn(
                              'px-3 py-1 rounded-full text-sm border transition-colors',
                              filters.models?.includes(model)
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            )}
                          >
                            {model} ({count})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Header */}
          {(results.length > 0 || query.trim()) && (
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isSearching ? '搜索中...' : `找到 ${totalCount} 个结果`}
                  </span>

                  {totalCount > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">排序:</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="relevance">相关性</option>
                        <option value="date">日期</option>
                        <option value="tokens">Token数</option>
                        <option value="length">长度</option>
                      </select>

                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        {sortOrder === 'desc' ? '↓' : '↑'}
                      </button>
                    </div>
                  )}
                </div>

                {results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => exportResults('json')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ArrowDownTrayIcon className="w-3 h-3" />
                      JSON
                    </Button>
                    <Button
                      onClick={() => exportResults('csv')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ArrowDownTrayIcon className="w-3 h-3" />
                      CSV
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="flex-1 overflow-y-auto">
            {results.length === 0 && query.trim() && !isSearching ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    未找到结果
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    尝试调整搜索条件或清除过滤器
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    清除过滤器
                  </Button>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    开始搜索
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    输入关键词搜索对话内容和消息
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                      selectedResult === result.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                    onClick={() => {
                      setSelectedResult(result.id)
                      onNavigateToResult?.(result.conversationId, result.messageId)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getResultIcon(result)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            result.type === 'conversation'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          )}>
                            {result.type === 'conversation' ? '对话' : '消息'}
                          </span>

                          {result.metadata.model && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400 rounded text-xs">
                              {result.metadata.model}
                            </span>
                          )}

                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <ClockIcon className="w-3 h-3" />
                            {formatDate(result.metadata.timestamp)}
                          </div>

                          <div className="ml-auto flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <StarIconSolid className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {result.score.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                          {highlightText(result.snippet, result.highlights)}
                        </p>

                        {result.metadata.tokens && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Token: {result.metadata.tokens}</span>
                            <span>长度: {result.content.length}字符</span>
                            {result.metadata.language && (
                              <span>语言: {result.metadata.language}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Pagination */}
                {totalCount > PAGE_SIZE && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      variant="outline"
                      size="sm"
                    >
                      上一页
                    </Button>

                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      第 {currentPage + 1} 页，共 {Math.ceil(totalCount / PAGE_SIZE)} 页
                    </span>

                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={(currentPage + 1) * PAGE_SIZE >= totalCount}
                      variant="outline"
                      size="sm"
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AdvancedSearchPanel