import { useState, useMemo, useCallback } from 'react'
import type { Conversation, Message } from '@/types'

export interface SearchResult {
  conversation: Conversation
  message: Message
  messageIndex: number
  matchCount: number
}

export interface SearchOptions {
  caseSensitive?: boolean
  wholeWord?: boolean
  useRegex?: boolean
  searchInCode?: boolean
}

/**
 * 消息搜索Hook
 * 提供全局消息搜索功能
 */
export function useMessageSearch(conversations: Conversation[]) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    searchInCode: true
  })
  const [currentResultIndex, setCurrentResultIndex] = useState(0)

  /**
   * 搜索消息
   */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    const results: SearchResult[] = []
    const query = searchOptions.caseSensitive
      ? searchQuery
      : searchQuery.toLowerCase()

    // 构建搜索正则
    let searchPattern: RegExp
    try {
      if (searchOptions.useRegex) {
        searchPattern = new RegExp(
          searchQuery,
          searchOptions.caseSensitive ? 'g' : 'gi'
        )
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const pattern = searchOptions.wholeWord ? `\\b${escaped}\\b` : escaped
        searchPattern = new RegExp(
          pattern,
          searchOptions.caseSensitive ? 'g' : 'gi'
        )
      }
    } catch (e) {
      // 无效的正则表达式
      return []
    }

    // 遍历所有对话和消息
    conversations.forEach(conversation => {
      conversation.messages.forEach((message, index) => {
        const content = searchOptions.caseSensitive
          ? message.content
          : message.content.toLowerCase()

        // 检查是否匹配
        const matches = content.match(searchPattern)
        if (matches && matches.length > 0) {
          results.push({
            conversation,
            message,
            messageIndex: index,
            matchCount: matches.length
          })
        }
      })
    })

    return results
  }, [searchQuery, searchOptions, conversations])

  /**
   * 导航到下一个结果
   */
  const nextResult = useCallback(() => {
    if (searchResults.length === 0) return null

    const nextIndex = (currentResultIndex + 1) % searchResults.length
    setCurrentResultIndex(nextIndex)
    return searchResults[nextIndex]
  }, [searchResults, currentResultIndex])

  /**
   * 导航到上一个结果
   */
  const previousResult = useCallback(() => {
    if (searchResults.length === 0) return null

    const prevIndex =
      currentResultIndex === 0
        ? searchResults.length - 1
        : currentResultIndex - 1
    setCurrentResultIndex(prevIndex)
    return searchResults[prevIndex]
  }, [searchResults, currentResultIndex])

  /**
   * 跳转到特定结果
   */
  const goToResult = useCallback(
    (index: number) => {
      if (index >= 0 && index < searchResults.length) {
        setCurrentResultIndex(index)
        return searchResults[index]
      }
      return null
    },
    [searchResults]
  )

  /**
   * 清除搜索
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setCurrentResultIndex(0)
  }, [])

  /**
   * 获取当前结果
   */
  const currentResult = searchResults[currentResultIndex] || null

  return {
    searchQuery,
    setSearchQuery,
    searchOptions,
    setSearchOptions,
    searchResults,
    currentResult,
    currentResultIndex,
    totalResults: searchResults.length,
    nextResult,
    previousResult,
    goToResult,
    clearSearch,
    hasResults: searchResults.length > 0
  }
}

export default useMessageSearch
