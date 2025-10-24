import { useState, useEffect, useCallback, useRef } from 'react'
import type { Message } from '@/types'

export interface InfiniteMessagesOptions {
  pageSize?: number
  initialPage?: number
  loadDirection?: 'up' | 'down'
}

export interface InfiniteMessagesResult {
  visibleMessages: Message[]
  hasMore: boolean
  isLoading: boolean
  loadMore: () => void
  reset: () => void
  currentPage: number
  totalPages: number
}

/**
 * 无限滚动消息加载Hook
 * 支持分页加载历史消息,优化大量消息的性能
 */
export function useInfiniteMessages(
  allMessages: Message[],
  options: InfiniteMessagesOptions = {}
): InfiniteMessagesResult {
  const {
    pageSize = 50,
    initialPage = 1,
    loadDirection = 'up'
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isLoading, setIsLoading] = useState(false)
  const loadingRef = useRef(false)

  // 计算总页数
  const totalPages = Math.ceil(allMessages.length / pageSize)

  // 计算可见消息
  const visibleMessages = loadDirection === 'up'
    ? allMessages.slice(-currentPage * pageSize) // 从后往前加载(最新消息)
    : allMessages.slice(0, currentPage * pageSize) // 从前往后加载(最旧消息)

  // 是否还有更多消息
  const hasMore = currentPage < totalPages

  /**
   * 加载更多消息
   */
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return

    loadingRef.current = true
    setIsLoading(true)

    // 模拟加载延迟
    setTimeout(() => {
      setCurrentPage(prev => Math.min(prev + 1, totalPages))
      setIsLoading(false)
      loadingRef.current = false
    }, 300)
  }, [hasMore, totalPages])

  /**
   * 重置分页
   */
  const reset = useCallback(() => {
    setCurrentPage(initialPage)
    setIsLoading(false)
    loadingRef.current = false
  }, [initialPage])

  // 当消息数组变化时,如果是新增消息,自动加载
  useEffect(() => {
    if (loadDirection === 'up' && allMessages.length > visibleMessages.length) {
      // 有新消息到达,保持在最新页
      const newTotalPages = Math.ceil(allMessages.length / pageSize)
      const messagesInLastPage = allMessages.length % pageSize || pageSize
      const shouldLoadMore = messagesInLastPage <= 5 // 最后一页少于5条,自动加载

      if (shouldLoadMore && currentPage === totalPages) {
        setCurrentPage(newTotalPages)
      }
    }
  }, [allMessages.length, visibleMessages.length, loadDirection, pageSize, currentPage, totalPages])

  return {
    visibleMessages,
    hasMore,
    isLoading,
    loadMore,
    reset,
    currentPage,
    totalPages
  }
}

/**
 * 滚动加载触发器Hook
 */
export function useScrollLoadTrigger(
  containerRef: React.RefObject<HTMLElement>,
  onLoadMore: () => void,
  enabled: boolean = true,
  threshold: number = 100
) {
  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop } = container

      // 滚动到顶部时触发加载更多
      if (scrollTop < threshold) {
        onLoadMore()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef, onLoadMore, enabled, threshold])
}

export default useInfiniteMessages
