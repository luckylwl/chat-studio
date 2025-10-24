import React, { useState } from 'react'
import { MagnifyingGlassIcon, SparklesIcon, XMarkIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { Button, Card } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import { createWebSearchService, type WebSearchResult } from '@/services/webSearchService'

interface WebSearchPanelProps {
  onSearchComplete?: (query: string, results: WebSearchResult[]) => void
  onInsertResults?: (formattedResults: string) => void
  className?: string
}

const WebSearchPanel: React.FC<WebSearchPanelProps> = ({
  onSearchComplete,
  onInsertResults,
  className
}) => {
  const [query, setQuery] = useState('')
  const [provider, setProvider] = useState<'serper' | 'tavily' | 'duckduckgo' | 'brave'>('duckduckgo')
  const [apiKey, setApiKey] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<WebSearchResult[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('请输入搜索关键词')
      return
    }

    // Check API key requirement
    if ((provider === 'serper' || provider === 'tavily' || provider === 'brave') && !apiKey) {
      toast.error(`${provider} 需要 API 密钥`)
      return
    }

    setIsSearching(true)
    setResults([])
    setShowResults(false)

    try {
      const searchService = createWebSearchService({
        provider,
        apiKey: apiKey || undefined,
        maxResults: 10
      })

      const searchResults = await searchService.search(query)
      setResults(searchResults)
      setShowResults(true)
      toast.success(`找到 ${searchResults.length} 个结果`)

      if (onSearchComplete) {
        onSearchComplete(query, searchResults)
      }
    } catch (error: any) {
      console.error('Search error:', error)
      toast.error(`搜索失败: ${error.message}`)
    } finally {
      setIsSearching(false)
    }
  }

  const insertResultsIntoChat = () => {
    if (results.length === 0) return

    const searchService = createWebSearchService({ provider, maxResults: 10 })
    const formatted = searchService.formatForAI(results, query)

    if (onInsertResults) {
      onInsertResults(formatted)
    }

    toast.success('搜索结果已插入聊天')
  }

  const clearResults = () => {
    setResults([])
    setShowResults(false)
    setQuery('')
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <GlobeAltIcon className="w-5 h-5 text-primary-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          网络搜索
        </h3>
      </div>

      {/* Search Provider Selection */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            搜索引擎
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={isSearching}
          >
            <option value="duckduckgo">DuckDuckGo (免费)</option>
            <option value="serper">Serper (Google)</option>
            <option value="tavily">Tavily (AI优化)</option>
            <option value="brave">Brave Search</option>
          </select>
        </div>

        {(provider === 'serper' || provider === 'tavily' || provider === 'brave') && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              API 密钥
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入 API 密钥"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isSearching}
            />
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSearch()
            }
          }}
          placeholder="输入搜索关键词..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          disabled={isSearching}
        />
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="px-4"
        >
          {isSearching ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              搜索中
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              搜索
            </>
          )}
        </Button>
      </div>

      {/* Provider Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {provider === 'duckduckgo' && '💡 DuckDuckGo 免费使用，无需 API 密钥'}
        {provider === 'serper' && '🔑 需要 Serper API 密钥 (serper.dev)'}
        {provider === 'tavily' && '🤖 Tavily 为 AI 优化，需要 API 密钥 (tavily.com)'}
        {provider === 'brave' && '🦁 Brave Search API，需要密钥 (brave.com/search/api)'}
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <Card className="p-4 space-y-3 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                搜索结果 ({results.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={insertResultsIntoChat}
                className="h-7 text-xs"
              >
                插入到聊天
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearResults}
                className="h-7 w-7 p-0"
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline line-clamp-1"
                    >
                      {result.title}
                    </a>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {result.snippet}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      {result.source && (
                        <span className="flex items-center gap-1">
                          🔗 {result.source}
                        </span>
                      )}
                      {result.publishedDate && (
                        <span className="flex items-center gap-1">
                          📅 {result.publishedDate}
                        </span>
                      )}
                      {result.score !== undefined && (
                        <span className="flex items-center gap-1">
                          📊 {(result.score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && (
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            未找到相关结果
          </p>
        </Card>
      )}
    </div>
  )
}

export default WebSearchPanel
