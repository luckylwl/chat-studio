import React, { useState, useRef, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  UserIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { useAppStore } from '@/store'
import { cn } from '@/utils'
import type { Message, Conversation } from '@/types'
import AdvancedSearchModal from './AdvancedSearchModal'
import { SearchService, SearchResult as AdvancedSearchResult } from '@/services/searchService'

interface SearchResult {
  id: string
  type: 'message' | 'conversation' | 'file'
  title: string
  content: string
  conversationId: string
  messageId?: string
  timestamp: number
  highlights?: string[]
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  onNavigate?: (conversationId: string, messageId?: string) => void
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const { conversations, setCurrentConversationId } = useAppStore()
  const searchService = SearchService.getInstance()

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex])
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  // Search function
  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    const query = searchQuery.toLowerCase()
    const searchResults: SearchResult[] = []

    // Search through conversations and messages
    conversations.forEach(conversation => {
      // Search conversation title
      if (conversation.title.toLowerCase().includes(query)) {
        searchResults.push({
          id: `conv-${conversation.id}`,
          type: 'conversation',
          title: conversation.title,
          content: `对话 · ${conversation.messages.length} 条消息`,
          conversationId: conversation.id,
          timestamp: conversation.createdAt,
          highlights: [conversation.title]
        })
      }

      // Search messages
      conversation.messages.forEach(message => {
        if (message.content.toLowerCase().includes(query)) {
          const snippet = getMessageSnippet(message.content, query)
          searchResults.push({
            id: `msg-${message.id}`,
            type: 'message',
            title: `${message.role === 'user' ? '用户' : 'AI'}: ${snippet.substring(0, 50)}...`,
            content: snippet,
            conversationId: conversation.id,
            messageId: message.id,
            timestamp: message.timestamp,
            highlights: getHighlights(message.content, query)
          })
        }
      })
    })

    // Sort by relevance and timestamp
    const sortedResults = searchResults
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.title.toLowerCase().includes(query)
        const bExact = b.title.toLowerCase().includes(query)
        if (aExact !== bExact) return aExact ? -1 : 1

        // Then by timestamp (newer first)
        return b.timestamp - a.timestamp
      })
      .slice(0, 50) // Limit results

    setResults(sortedResults)
    setSelectedIndex(0)
    setIsLoading(false)
  }

  // Get message snippet with context
  const getMessageSnippet = (content: string, query: string, contextLength = 100): string => {
    const lowerContent = content.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerContent.indexOf(lowerQuery)

    if (index === -1) return content.substring(0, contextLength)

    const start = Math.max(0, index - contextLength / 2)
    const end = Math.min(content.length, index + query.length + contextLength / 2)

    let snippet = content.substring(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'

    return snippet
  }

  // Get highlights for matching text
  const getHighlights = (text: string, query: string): string[] => {
    const regex = new RegExp(`(${query})`, 'gi')
    const matches = text.match(regex)
    return matches ? [...new Set(matches.map(m => m.toLowerCase()))] : []
  }

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    setCurrentConversationId(result.conversationId)

    if (onNavigate) {
      onNavigate(result.conversationId, result.messageId)
    }

    onClose()
    setQuery('')
    setResults([])
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    return date.toLocaleDateString('zh-CN')
  }

  // Get icon for result type
  const getResultIcon = (type: string, role?: string) => {
    switch (type) {
      case 'conversation':
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500" />
      case 'message':
        return role === 'user'
          ? <UserIcon className="h-4 w-4 text-green-500" />
          : <ChatBubbleLeftRightIcon className="h-4 w-4 text-purple-500" />
      case 'file':
        return <DocumentIcon className="h-4 w-4 text-orange-500" />
      default:
        return <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Debounce search
    const timer = setTimeout(() => {
      performSearch(value)
    }, 300)

    return () => clearTimeout(timer)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder="搜索对话、消息或文件..."
            className="flex-1 text-lg bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSearch(true)}
            className="h-8 w-8 p-0"
            title="高级搜索"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Results */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">搜索中...</span>
            </div>
          ) : results.length > 0 ? (
            <div>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    index === selectedIndex && "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getResultIcon(result.type,
                        result.type === 'message' && conversations
                          .find(c => c.id === result.conversationId)
                          ?.messages.find(m => m.id === result.messageId)?.role
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {result.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-3 w-3" />
                          {formatTimestamp(result.timestamp)}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {result.content}
                      </p>

                      {/* Conversation info for messages */}
                      {result.type === 'message' && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          来自对话: {conversations.find(c => c.id === result.conversationId)?.title || '未知对话'}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="text-center py-8">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">未找到相关结果</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                尝试使用不同的关键词搜索
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">输入关键词开始搜索</p>
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-500 space-y-1">
                <p>💡 搜索技巧:</p>
                <p>• 搜索对话标题和消息内容</p>
                <p>• 使用 ↑↓ 导航，Enter 选择</p>
                <p>• 按 ESC 关闭搜索</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>共找到 {results.length} 个结果</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">↑↓</kbd>
              <span>导航</span>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">Enter</kbd>
              <span>选择</span>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">ESC</kbd>
              <span>关闭</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSelectResult={(result: AdvancedSearchResult) => {
          setCurrentConversationId(result.conversationId)
          if (onNavigate) {
            onNavigate(result.conversationId, result.messageId)
          }
          setShowAdvancedSearch(false)
          onClose()
        }}
      />
    </div>
  )
}

export default GlobalSearch