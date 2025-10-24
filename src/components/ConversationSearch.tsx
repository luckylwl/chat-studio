import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Filter, Calendar, User, MessageSquare, Clock, Tag, FileText, Star, Download, Share2, Archive, Trash2, RefreshCw, SortAsc, SortDesc, Eye, ChevronDown, X } from 'lucide-react'

interface SearchResult {
  id: string
  conversationId: string
  messageId: string
  title: string
  content: string
  snippet: string
  timestamp: Date
  speaker: 'user' | 'assistant'
  model?: string
  tags: string[]
  relevanceScore: number
  highlights: { start: number; end: number }[]
}

interface SearchFilters {
  dateRange: { start?: Date; end?: Date }
  speaker: 'all' | 'user' | 'assistant'
  models: string[]
  tags: string[]
  minLength: number
  hasCode: boolean
  hasLinks: boolean
  isStarred: boolean
}

interface SearchStats {
  totalResults: number
  conversationsCount: number
  timeRange: { start: Date; end: Date }
  topModels: { name: string; count: number }[]
  topTags: { name: string; count: number }[]
}

const ConversationSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: {},
    speaker: 'all',
    models: [],
    tags: [],
    minLength: 0,
    hasCode: false,
    hasLinks: false,
    isStarred: false
  })
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'length'>('relevance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<{ name: string; query: string; filters: SearchFilters }[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Mock data for demonstration
  const mockConversations = useMemo(() => [
    {
      id: 'conv-1',
      title: 'React Performance Optimization',
      messages: [
        { id: 'msg-1', content: 'How can I optimize React component performance?', speaker: 'user' as const, timestamp: new Date('2024-01-15'), model: 'gpt-4' },
        { id: 'msg-2', content: 'Here are several strategies for React performance optimization: 1. Use React.memo() for functional components...', speaker: 'assistant' as const, timestamp: new Date('2024-01-15'), model: 'gpt-4' }
      ],
      tags: ['react', 'performance', 'optimization'],
      isStarred: true
    },
    {
      id: 'conv-2',
      title: 'Python Data Analysis',
      messages: [
        { id: 'msg-3', content: 'Can you help me analyze this dataset using pandas?', speaker: 'user' as const, timestamp: new Date('2024-01-10'), model: 'claude-3' },
        { id: 'msg-4', content: 'I\'d be happy to help you analyze your dataset with pandas. Here\'s how you can start...', speaker: 'assistant' as const, timestamp: new Date('2024-01-10'), model: 'claude-3' }
      ],
      tags: ['python', 'pandas', 'data-analysis'],
      isStarred: false
    }
  ], [])

  // Advanced search function with fuzzy matching and relevance scoring
  const performSearch = async (query: string, searchFilters: SearchFilters) => {
    if (!query.trim()) {
      setResults([])
      setSearchStats(null)
      return
    }

    setIsSearching(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API delay

      const searchResults: SearchResult[] = []
      const queryWords = query.toLowerCase().split(/\s+/)

      mockConversations.forEach(conv => {
        conv.messages.forEach(msg => {
          const content = msg.content.toLowerCase()
          const title = conv.title.toLowerCase()

          // Calculate relevance score
          let relevanceScore = 0
          const highlights: { start: number; end: number }[] = []

          queryWords.forEach(word => {
            if (content.includes(word)) {
              relevanceScore += 1
              const index = content.indexOf(word)
              highlights.push({ start: index, end: index + word.length })
            }
            if (title.includes(word)) {
              relevanceScore += 2 // Title matches have higher weight
            }
          })

          // Apply filters
          if (relevanceScore === 0) return
          if (searchFilters.speaker !== 'all' && msg.speaker !== searchFilters.speaker) return
          if (searchFilters.models.length > 0 && !searchFilters.models.includes(msg.model || '')) return
          if (searchFilters.tags.length > 0 && !searchFilters.tags.some(tag => conv.tags.includes(tag))) return
          if (searchFilters.minLength > 0 && msg.content.length < searchFilters.minLength) return
          if (searchFilters.hasCode && !msg.content.includes('```')) return
          if (searchFilters.hasLinks && !msg.content.includes('http')) return
          if (searchFilters.isStarred && !conv.isStarred) return

          // Date range filter
          if (searchFilters.dateRange.start && msg.timestamp < searchFilters.dateRange.start) return
          if (searchFilters.dateRange.end && msg.timestamp > searchFilters.dateRange.end) return

          const snippet = msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : '')

          searchResults.push({
            id: `${conv.id}-${msg.id}`,
            conversationId: conv.id,
            messageId: msg.id,
            title: conv.title,
            content: msg.content,
            snippet,
            timestamp: msg.timestamp,
            speaker: msg.speaker,
            model: msg.model,
            tags: conv.tags,
            relevanceScore,
            highlights
          })
        })
      })

      // Sort results
      searchResults.sort((a, b) => {
        switch (sortBy) {
          case 'relevance':
            return sortOrder === 'desc' ? b.relevanceScore - a.relevanceScore : a.relevanceScore - b.relevanceScore
          case 'date':
            return sortOrder === 'desc' ? b.timestamp.getTime() - a.timestamp.getTime() : a.timestamp.getTime() - b.timestamp.getTime()
          case 'length':
            return sortOrder === 'desc' ? b.content.length - a.content.length : a.content.length - b.content.length
          default:
            return 0
        }
      })

      setResults(searchResults)

      // Calculate search statistics
      const uniqueConversations = new Set(searchResults.map(r => r.conversationId))
      const modelCounts = searchResults.reduce((acc, r) => {
        if (r.model) {
          acc[r.model] = (acc[r.model] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
      const tagCounts = searchResults.reduce((acc, r) => {
        r.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)

      const dates = searchResults.map(r => r.timestamp)
      const timeRange = dates.length > 0 ? {
        start: new Date(Math.min(...dates.map(d => d.getTime()))),
        end: new Date(Math.max(...dates.map(d => d.getTime())))
      } : { start: new Date(), end: new Date() }

      setSearchStats({
        totalResults: searchResults.length,
        conversationsCount: uniqueConversations.size,
        timeRange,
        topModels: Object.entries(modelCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        topTags: Object.entries(tagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      })

      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 9)])
      }

    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery, filters)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, filters, sortBy, sortOrder])

  const handleResultSelect = (resultId: string) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resultId)) {
        newSet.delete(resultId)
      } else {
        newSet.add(resultId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set())
    } else {
      setSelectedResults(new Set(results.map(r => r.id)))
    }
  }

  const exportResults = () => {
    const data = results.filter(r => selectedResults.has(r.id))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `search-results-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveSearch = () => {
    const name = prompt('Enter a name for this search:')
    if (name) {
      setSavedSearches(prev => [...prev, { name, query: searchQuery, filters }])
    }
  }

  const loadSavedSearch = (savedSearch: { name: string; query: string; filters: SearchFilters }) => {
    setSearchQuery(savedSearch.query)
    setFilters(savedSearch.filters)
  }

  const highlightText = (text: string, highlights: { start: number; end: number }[]) => {
    if (highlights.length === 0) return text

    let result = ''
    let lastIndex = 0

    highlights.forEach(({ start, end }) => {
      result += text.substring(lastIndex, start)
      result += `<mark class="bg-yellow-200 dark:bg-yellow-600">${text.substring(start, end)}</mark>`
      lastIndex = end
    })
    result += text.substring(lastIndex)

    return result
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Search Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Search className="w-6 h-6" />
            Conversation Search
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Advanced
            </button>
          </div>
        </div>

        {/* Main Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all conversations..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {isSearching && (
            <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
          )}
        </div>

        {/* Search History & Saved Searches */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Searches</h4>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(query)}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Saved Searches</h4>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((savedSearch, index) => (
                  <button
                    key={index}
                    onClick={() => loadSavedSearch(savedSearch)}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    {savedSearch.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Filters */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : undefined }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : undefined }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Speaker Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Speaker</label>
                <select
                  value={filters.speaker}
                  onChange={(e) => setFilters(prev => ({ ...prev, speaker: e.target.value as 'all' | 'user' | 'assistant' }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                </select>
              </div>

              {/* Content Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasCode}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasCode: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Has Code</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasLinks}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasLinks: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Has Links</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isStarred}
                      onChange={(e) => setFilters(prev => ({ ...prev, isStarred: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Starred</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <button
                onClick={() => setFilters({
                  dateRange: {},
                  speaker: 'all',
                  models: [],
                  tags: [],
                  minLength: 0,
                  hasCode: false,
                  hasLinks: false,
                  isStarred: false
                })}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Results Header */}
      {searchStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {searchStats.totalResults} results in {searchStats.conversationsCount} conversations
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {selectedResults.size === results.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedResults.size > 0 && (
                  <>
                    <button
                      onClick={exportResults}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Export ({selectedResults.size})
                    </button>
                    <button
                      onClick={saveSearch}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                    >
                      <Star className="w-3 h-3" />
                      Save Search
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date' | 'length')}
                className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="length">Length</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Search Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <strong>Time Range:</strong> {searchStats.timeRange.start.toLocaleDateString()} - {searchStats.timeRange.end.toLocaleDateString()}
            </div>
            <div>
              <strong>Top Models:</strong> {searchStats.topModels.map(m => `${m.name} (${m.count})`).join(', ')}
            </div>
            <div>
              <strong>Top Tags:</strong> {searchStats.topTags.slice(0, 3).map(t => `${t.name} (${t.count})`).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all ${
              selectedResults.has(result.id)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedResults.has(result.id)}
                    onChange={() => handleResultSelect(result.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{result.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.speaker === 'user'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      }`}>
                        {result.speaker}
                      </span>
                      {result.model && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                          {result.model}
                        </span>
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Score: {result.relevanceScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {result.timestamp.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {result.content.length} chars
                      </div>
                      {result.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {result.tags.join(', ')}
                        </div>
                      )}
                    </div>
                    <div
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: highlightText(result.snippet, result.highlights) }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* No Results */}
        {searchQuery && !isSearching && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search terms or filters</p>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Search Your Conversations</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Find messages, topics, and insights across all your AI conversations
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['react optimization', 'data analysis', 'code review'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchQuery(suggestion)}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationSearch