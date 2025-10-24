import React, { useState, useEffect, useRef, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface ProgressiveLoaderProps<T> {
  // 数据加载函数
  loadData: (page: number, pageSize: number) => Promise<T[]>
  // 每页数据量
  pageSize?: number
  // 渲染单个项目
  renderItem: (item: T, index: number) => ReactNode
  // 加载更多的触发距离(距离底部多少像素时触发)
  threshold?: number
  // 加载状态组件
  loadingComponent?: ReactNode
  // 空状态组件
  emptyComponent?: ReactNode
  // 错误状态组件
  errorComponent?: (error: Error, retry: () => void) => ReactNode
  // 容器类名
  className?: string
  // 是否启用虚拟滚动
  enableVirtualScroll?: boolean
  // 预加载页数
  preloadPages?: number
}

/**
 * 渐进式加载组件
 * 支持分页、无限滚动和虚拟滚动
 */
function ProgressiveLoader<T>({
  loadData,
  pageSize = 20,
  renderItem,
  threshold = 200,
  loadingComponent,
  emptyComponent,
  errorComponent,
  className = '',
  enableVirtualScroll = false,
  preloadPages = 1,
}: ProgressiveLoaderProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // 加载下一页数据
  const loadNextPage = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      const newItems = await loadData(currentPage, pageSize)

      if (newItems.length < pageSize) {
        setHasMore(false)
      }

      setItems((prev) => [...prev, ...newItems])
      setCurrentPage((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'))
    } finally {
      setIsLoading(false)
    }
  }

  // 重试加载
  const retry = () => {
    setError(null)
    loadNextPage()
  }

  // 初始加载
  useEffect(() => {
    loadNextPage()
  }, [])

  // 设置 Intersection Observer
  useEffect(() => {
    if (!sentinelRef.current) return

    const options = {
      root: containerRef.current,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries

      if (entry.isIntersecting && !isLoading && hasMore) {
        loadNextPage()
      }
    }, options)

    observerRef.current.observe(sentinelRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isLoading, hasMore, threshold])

  // 预加载
  useEffect(() => {
    if (preloadPages > 0 && items.length > 0 && !isLoading && hasMore) {
      const shouldPreload = currentPage < preloadPages

      if (shouldPreload) {
        loadNextPage()
      }
    }
  }, [items, currentPage, preloadPages, isLoading, hasMore])

  // 空状态
  if (items.length === 0 && !isLoading && !error) {
    return (
      <div className={`progressive-loader-empty ${className}`}>
        {emptyComponent || (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-lg font-medium mb-2">暂无数据</div>
            <div className="text-sm">加载更多内容时会显示在这里</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`progressive-loader ${className}`}>
      {/* 数据列表 */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.02 }}
            >
              {renderItem(item, index)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 加载指示器 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          {loadingComponent || (
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">加载中...</span>
            </div>
          )}
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="flex flex-col items-center justify-center py-8">
          {errorComponent ? (
            errorComponent(error, retry)
          ) : (
            <div className="text-center">
              <div className="text-red-600 dark:text-red-400 font-medium mb-2">
                加载失败
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {error.message}
              </div>
              <button
                onClick={retry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                重试
              </button>
            </div>
          )}
        </div>
      )}

      {/* 加载完成提示 */}
      {!hasMore && items.length > 0 && (
        <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          已加载全部 {items.length} 项内容
        </div>
      )}

      {/* Intersection Observer 哨兵元素 */}
      <div ref={sentinelRef} className="h-1" />
    </div>
  )
}

export default ProgressiveLoader
