import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  CommandLineIcon,
  BookmarkIcon,
  SparklesIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline'
import advancedSearchService, { type SearchResult, type SearchSuggestion } from '@/services/advancedSearchService'
import { cn } from '@/utils'

interface QuickSearchBarProps {
  isOpen: boolean
  onClose: () => void
  onOpenAdvanced: () => void
  onNavigateToResult?: (conversationId: string, messageId?: string) => void
  placeholder?: string
  className?: string
}

const QuickSearchBar: React.FC<QuickSearchBarProps> = ({
  isOpen,
  onClose,
  onOpenAdvanced,
  onNavigateToResult,
  placeholder = "搜索对话内容... (支持 /命令)",
  className
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const [recentQueries, setRecentQueries] = useState<string[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      loadRecentQueries()
    }
  }, [isOpen])

  useEffect(() => {
    // Reset selection when results change
    setSelectedIndex(-1)
  }, [results, suggestions])

  useEffect(() => {
    // Debounced search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (query.trim().length > 1) {
      debounceTimeoutRef.current = setTimeout(() => {
        performQuickSearch()
      }, 200)
    } else {
      setResults([])
      setSuggestions([])
      if (query.trim().length === 0) {
        loadRecentQueries()
      }
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      const totalItems = suggestions.length + results.length

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1))
          break

        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, -1))
          break

        case 'Enter':
          e.preventDefault()
          if (selectedIndex === -1) {
            if (query.trim()) {
              handleSearch()
            }
          } else {
            handleSelection(selectedIndex)
          }
          break

        case 'Escape':
          e.preventDefault()
          if (query) {
            setQuery('')
          } else {
            onClose()
          }
          break

        case 'Tab':
          if (e.shiftKey) {
            e.preventDefault()
            onOpenAdvanced()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, suggestions.length, results.length, query])

  const loadRecentQueries = () => {
    try {
      const stored = localStorage.getItem('quickSearch_recent')
      if (stored) {
        setRecentQueries(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load recent queries:', error)
    }
  }

  const saveRecentQuery = (query: string) => {
    const updated = [query, ...recentQueries.filter(q => q !== query)].slice(0, 5)
    setRecentQueries(updated)
    localStorage.setItem('quickSearch_recent', JSON.stringify(updated))
  }

  const performQuickSearch = async () => {
    setIsSearching(true)
    try {
      const response = await advancedSearchService.search({
        text: query,
        filters: {},
        sortBy: 'relevance',
        sortOrder: 'desc',
        limit: 8, // Limit for quick search
        offset: 0
      })

      setResults(response.results)
      setSuggestions(response.suggestions.slice(0, 5))
    } catch (error) {
      console.error('Quick search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = () => {
    if (query.trim()) {
      saveRecentQuery(query)
      onOpenAdvanced()
    }
  }

  const handleSelection = (index: number) => {
    if (index < suggestions.length) {
      // Handle suggestion selection
      const suggestion = suggestions[index]
      if (suggestion.type === 'query') {
        setQuery(suggestion.text)
      } else if (suggestion.type === 'command') {
        handleCommand(suggestion.text)
      } else {
        setQuery(suggestion.text)
        saveRecentQuery(suggestion.text)
        onOpenAdvanced()
      }
    } else {
      // Handle result selection
      const result = results[index - suggestions.length]
      if (result) {
        saveRecentQuery(query)
        onNavigateToResult?.(result.conversationId, result.messageId)
        onClose()
      }
    }
  }

  const handleCommand = (command: string) => {
    saveRecentQuery(command)
    setQuery('')
    onClose()

    // Execute command with slight delay to allow UI to update
    setTimeout(() => {
      onOpenAdvanced()
    }, 100)
  }

  const getItemIcon = (item: SearchResult | SearchSuggestion, isResult: boolean) => {
    if (isResult) {
      const result = item as SearchResult
      if (result.type === 'conversation') {
        return <SparklesIcon className="w-4 h-4 text-purple-500" />
      }
      switch (result.metadata.messageType) {
        case 'user':
          return <div className="w-4 h-4 rounded-full bg-blue-500" />
        case 'assistant':
          return <SparklesIcon className="w-4 h-4 text-green-500" />
        case 'system':
          return <CommandLineIcon className="w-4 h-4 text-orange-500" />
        default:
          return <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
      }
    } else {
      const suggestion = item as SearchSuggestion
      switch (suggestion.type) {
        case 'query':
          return <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
        case 'command':
          return <CommandLineIcon className="w-4 h-4 text-purple-500" />
        case 'filter':
          return <BookmarkIcon className="w-4 h-4 text-blue-500" />
        default:
          return <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
      }
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays <= 7) return `${diffDays}天前`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`
    return date.toLocaleDateString('zh-CN')
  }

  if (!isOpen) return null

  const allItems = [...suggestions, ...results]
  const hasItems = suggestions.length > 0 || results.length > 0
  const showRecentQueries = query.trim().length === 0 && recentQueries.length > 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-25 z-50 flex items-start justify-center pt-[10vh] px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className={cn(
            "w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full px-6 py-4 pl-14 pr-14 text-lg bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
            />

            <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {isSearching && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}

              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            {/* Recent Queries */}
            {showRecentQueries && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <ClockIcon className="w-3 h-3" />
                  最近搜索
                </div>
                <div className="space-y-1">
                  {recentQueries.map((recentQuery, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(recentQuery)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {recentQuery}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions and Results */}
            {hasItems && (
              <div ref={resultsRef} className="max-h-96 overflow-y-auto">
                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <SparklesIcon className="w-3 h-3" />
                      建议
                    </div>
                    <div className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelection(index)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                            selectedIndex === index
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          )}
                        >
                          {getItemIcon(suggestion, false)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {suggestion.text}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {suggestion.description}
                            </div>
                          </div>
                          {suggestion.type === 'command' && (
                            <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                              命令
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                {results.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <MagnifyingGlassIcon className="w-3 h-3" />
                        搜索结果
                      </div>
                      {results.length >= 8 && (
                        <button
                          onClick={onOpenAdvanced}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          查看全部
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {results.map((result, index) => {
                        const globalIndex = suggestions.length + index
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleSelection(globalIndex)}
                            className={cn(
                              'w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors',
                              selectedIndex === globalIndex
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            )}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {getItemIcon(result, true)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded font-medium',
                                  result.type === 'conversation'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                )}>
                                  {result.type === 'conversation' ? '对话' : '消息'}
                                </span>

                                {result.metadata.model && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {result.metadata.model}
                                  </span>
                                )}

                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTimestamp(result.metadata.timestamp)}
                                </span>
                              </div>

                              <div className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                                {result.snippet}
                              </div>

                              {result.metadata.tokens && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {result.metadata.tokens} tokens
                                </div>
                              )}
                            </div>

                            <div className="flex-shrink-0 text-xs text-gray-400 font-medium">
                              {result.score.toFixed(1)}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!hasItems && !showRecentQueries && query.trim().length > 0 && !isSearching && (
              <div className="p-8 text-center">
                <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 dark:text-gray-400 mb-2">未找到相关结果</div>
                <button
                  onClick={onOpenAdvanced}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  使用高级搜索
                </button>
              </div>
            )}

            {/* Footer Hint */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">↑↓</kbd>
                    导航
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Enter</kbd>
                    选择
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Esc</kbd>
                    关闭
                  </span>
                </div>
                <button
                  onClick={onOpenAdvanced}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Shift+Tab</kbd>
                  高级搜索
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default QuickSearchBar