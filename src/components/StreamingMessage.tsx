import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/utils'

interface StreamingMessageProps {
  content: string
  isStreaming: boolean
  onStreamComplete?: () => void
  className?: string
  speed?: 'slow' | 'normal' | 'fast' | 'instant'
  showCursor?: boolean
  highlightNewText?: boolean
}

/**
 * 流式消息显示组件
 * 提供平滑的打字机效果和流式内容渲染
 */
export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  isStreaming,
  onStreamComplete,
  className,
  speed = 'normal',
  showCursor = true,
  highlightNewText = false
}) => {
  const [displayedContent, setDisplayedContent] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const contentRef = useRef(content)
  const displayedRef = useRef('')

  // 根据速度设置延迟
  const getDelay = () => {
    switch (speed) {
      case 'slow':
        return 50
      case 'normal':
        return 20
      case 'fast':
        return 10
      case 'instant':
        return 0
      default:
        return 20
    }
  }

  // 流式显示效果
  useEffect(() => {
    contentRef.current = content

    if (speed === 'instant' || !isStreaming) {
      setDisplayedContent(content)
      displayedRef.current = content
      return
    }

    // 渐进显示新内容
    if (content.length > displayedRef.current.length) {
      const newContent = content.slice(displayedRef.current.length)
      let index = 0

      const interval = setInterval(() => {
        if (index < newContent.length) {
          const char = newContent[index]
          setDisplayedContent(prev => prev + char)
          displayedRef.current += char
          index++
        } else {
          clearInterval(interval)
        }
      }, getDelay())

      return () => clearInterval(interval)
    } else if (content.length < displayedRef.current.length) {
      // 内容被删减,直接更新
      setDisplayedContent(content)
      displayedRef.current = content
    }
  }, [content, isStreaming, speed])

  // 光标闪烁效果
  useEffect(() => {
    if (!showCursor || !isStreaming) return

    const interval = setInterval(() => {
      setCursorVisible(prev => !prev)
    }, 530)

    return () => clearInterval(interval)
  }, [showCursor, isStreaming])

  // 流式完成回调
  useEffect(() => {
    if (!isStreaming && displayedContent === content && onStreamComplete) {
      onStreamComplete()
    }
  }, [isStreaming, displayedContent, content, onStreamComplete])

  return (
    <div className={cn('relative', className)}>
      <span className={cn(
        'inline-block',
        highlightNewText && isStreaming && 'animate-pulse-subtle'
      )}>
        {displayedContent}
      </span>
      {isStreaming && showCursor && (
        <span
          className={cn(
            'inline-block w-0.5 h-5 bg-blue-500 ml-0.5 align-middle',
            'transition-opacity duration-100',
            cursorVisible ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  )
}

/**
 * 流式代码块组件
 */
interface StreamingCodeBlockProps {
  code: string
  language?: string
  isStreaming: boolean
  className?: string
}

export const StreamingCodeBlock: React.FC<StreamingCodeBlockProps> = ({
  code,
  language,
  isStreaming,
  className
}) => {
  return (
    <div className={cn('relative rounded-lg bg-gray-900 overflow-hidden', className)}>
      {/* 语言标签 */}
      {language && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-xs font-mono text-gray-400 uppercase">
            {language}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-blue-400">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              流式输入中...
            </span>
          )}
        </div>
      )}

      {/* 代码内容 */}
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-gray-100">
          <StreamingMessage
            content={code}
            isStreaming={isStreaming}
            speed="fast"
            showCursor={true}
          />
        </code>
      </pre>
    </div>
  )
}

/**
 * 流式思考过程显示
 */
interface StreamingThinkingProps {
  thoughts: string[]
  isThinking: boolean
  className?: string
}

export const StreamingThinking: React.FC<StreamingThinkingProps> = ({
  thoughts,
  isThinking,
  className
}) => {
  return (
    <div className={cn(
      'space-y-2 p-4 rounded-lg',
      'bg-gradient-to-r from-purple-50 to-blue-50',
      'dark:from-purple-900/20 dark:to-blue-900/20',
      'border border-purple-200 dark:border-purple-700',
      className
    )}>
      <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
        <svg
          className={cn('w-4 h-4', isThinking && 'animate-spin')}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        思考过程
      </div>

      <div className="space-y-1.5">
        {thoughts.map((thought, index) => (
          <div
            key={index}
            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-700 flex items-center justify-center text-xs font-medium">
              {index + 1}
            </span>
            <StreamingMessage
              content={thought}
              isStreaming={isThinking && index === thoughts.length - 1}
              speed="normal"
              showCursor={false}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 流式统计信息
 */
interface StreamingStatsProps {
  stats: {
    tokensUsed?: number
    responseTime?: number
    model?: string
  }
  isStreaming: boolean
  className?: string
}

export const StreamingStats: React.FC<StreamingStatsProps> = ({
  stats,
  isStreaming,
  className
}) => {
  const [displayTime, setDisplayTime] = useState(0)

  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setDisplayTime(prev => prev + 100)
      }, 100)

      return () => clearInterval(interval)
    } else if (stats.responseTime) {
      setDisplayTime(stats.responseTime)
    }
  }, [isStreaming, stats.responseTime])

  return (
    <div className={cn(
      'flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400',
      className
    )}>
      {stats.model && (
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {stats.model}
        </span>
      )}

      <span className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {(displayTime / 1000).toFixed(1)}s
        {isStreaming && (
          <span className="ml-1 w-1 h-1 bg-green-500 rounded-full animate-pulse" />
        )}
      </span>

      {stats.tokensUsed && (
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          {stats.tokensUsed} tokens
        </span>
      )}
    </div>
  )
}

export default StreamingMessage
