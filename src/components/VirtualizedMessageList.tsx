import React, { useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Message } from '@/types'
import ChatMessage from './ChatMessage'

interface VirtualizedMessageListProps {
  messages: Message[]
  className?: string
  onScrollToBottom?: () => void
  collaborationEnabled?: boolean
}

/**
 * 虚拟化消息列表组件
 * 使用 @tanstack/react-virtual 实现虚拟滚动
 *
 * 性能优化:
 * - 只渲染可见区域的消息
 * - 支持大量消息无性能下降
 * - 动态高度计算
 * - 平滑滚动
 */
export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  className,
  onScrollToBottom,
  collaborationEnabled = false
}) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(messages.length)

  // 配置虚拟化
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // 估计每条消息高度
    overscan: 5, // 预渲染上下5条消息
    measureElement:
      typeof window !== 'undefined' &&
      'ResizeObserver' in window
        ? (element) => element?.getBoundingClientRect().height ?? 0
        : undefined,
  })

  // 当新消息到达时自动滚动到底部
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      // 新消息,滚动到底部
      const lastItem = rowVirtualizer.getVirtualItems().pop()
      if (lastItem) {
        rowVirtualizer.scrollToIndex(messages.length - 1, {
          align: 'end',
          behavior: 'smooth'
        })
      }
    }
    lastMessageCountRef.current = messages.length
  }, [messages.length, rowVirtualizer])

  // 检查是否滚动到底部
  useEffect(() => {
    const handleScroll = () => {
      if (!parentRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = parentRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100

      if (isAtBottom && onScrollToBottom) {
        onScrollToBottom()
      }
    }

    const element = parentRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [onScrollToBottom])

  const virtualItems = rowVirtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        overflow: 'auto',
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const message = messages[virtualRow.index]
          const isLast = virtualRow.index === messages.length - 1

          return (
            <div
              key={message.id}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="max-w-4xl mx-auto py-3 px-4">
                <ChatMessage
                  message={message}
                  isLast={isLast}
                  collaborationEnabled={collaborationEnabled}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VirtualizedMessageList
