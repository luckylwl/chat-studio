import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import {
  SearchService,
  SearchResult,
  SearchFilter,
  SearchOptions
} from '@/services/searchService'

interface AdvancedSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectResult: (result: SearchResult) => void
}

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult
}) => {
  const { conversations, apiProviders } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 搜索过滤器状态
  const [filters, setFilters] = useState<SearchFilter>({
    messageType: 'all',
    models: [],
    hasAttachments: undefined
  })

  // 搜索选项
  const [searchOptions, setSearchOptions] = useState<Omit<SearchOptions, 'query'>>({
    limit: 20,
    sortBy: 'relevance',
    sortOrder: 'desc'
  })

  const searchService = SearchService.getInstance()

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus()
      setSearchHistory(searchService.getSearchHistory())
    }
  }, [isOpen])

  useEffect(() => {
    if (query.trim()) {
      const newSuggestions = searchService.getSearchSuggestions(query)
      setSuggestions(newSuggestions)
    } else {
      setSuggestions([])
    }
  }, [query])

  const performSearch = async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const searchResults = await searchService.search(conversations, {
        query,
        filters,
        ...searchOptions
      })
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const performSemanticSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const semanticResults = await searchService.semanticSearch(
        conversations,
        query,
        searchOptions.limit
      )
      setResults(semanticResults)
    } catch (error) {
      console.error('Semantic search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      performSearch()
    } else if (event.key === 'Escape') {
      onClose()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setSuggestions([])
  }

  const handleResultClick = (result: SearchResult) => {
    onSelectResult(result)
    onClose()
  }

  const updateFilter = (key: keyof SearchFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      messageType: 'all',
      models: [],
      hasAttachments: undefined
    })
  }

  const availableModels = Array.from(
    new Set(conversations.map(c => c.model))
  )

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                高级搜索
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    showFilters
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  过滤器
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='搜索对话内容... (支持 "精确匹配" -排除词 AND OR)'
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={performSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                >
                  🔍
                </button>
              </div>

              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Search Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={performSearch}
                  disabled={!query.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  搜索
                </button>
                <button
                  onClick={performSemanticSearch}
                  disabled={!query.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  语义搜索
                </button>
                <span className="text-sm text-gray-500">
                  在 {conversations.length} 个对话中搜索
                </span>
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && !query && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    搜索历史
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 5).map((historyItem, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(historyItem)}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {historyItem}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 消息类型过滤 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          消息类型
                        </label>
                        <select
                          value={filters.messageType}
                          onChange={(e) => updateFilter('messageType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                        >
                          <option value="all">全部</option>
                          <option value="user">用户消息</option>
                          <option value="assistant">AI回复</option>
                        </select>
                      </div>

                      {/* 模型过滤 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          AI模型
                        </label>
                        <select
                          multiple
                          value={filters.models}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value)
                            updateFilter('models', selected)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                        >
                          {availableModels.map(model => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 排序选项 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          排序方式
                        </label>
                        <select
                          value={`${searchOptions.sortBy}-${searchOptions.sortOrder}`}
                          onChange={(e) => {
                            const [sortBy, sortOrder] = e.target.value.split('-')
                            setSearchOptions(prev => ({
                              ...prev,
                              sortBy: sortBy as any,
                              sortOrder: sortOrder as any
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                        >
                          <option value="relevance-desc">相关性（高到低）</option>
                          <option value="date-desc">时间（新到旧）</option>
                          <option value="date-asc">时间（旧到新）</option>
                          <option value="conversation-asc">对话（A-Z）</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={clearFilters}
                        className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        清除过滤器
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      搜索结果 ({results.length})
                    </h3>
                  </div>

                  {results.map((result, index) => (
                    <motion.div
                      key={`${result.conversationId}-${result.messageId}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {result.conversationTitle}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              result.message.role === 'user'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            }`}>
                              {result.message.role === 'user' ? '用户' : 'AI'}
                            </span>
                            <span>{formatDate(result.message.timestamp)}</span>
                            <span className="text-orange-600">
                              相关性: {Math.round(result.relevanceScore * 10)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="text-gray-700 dark:text-gray-300 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
                      />

                      {/* Context Messages */}
                      {(result.context.previousMessage || result.context.nextMessage) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 space-y-1">
                            {result.context.previousMessage && (
                              <div>
                                <span className="font-medium">上文:</span> {result.context.previousMessage.content.slice(0, 100)}...
                              </div>
                            )}
                            {result.context.nextMessage && (
                              <div>
                                <span className="font-medium">下文:</span> {result.context.nextMessage.content.slice(0, 100)}...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : query && !loading ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    没有找到相关结果
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    尝试调整搜索关键词或使用不同的过滤条件
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    开始搜索对话
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    在上方输入关键词搜索您的对话历史
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AdvancedSearchModal