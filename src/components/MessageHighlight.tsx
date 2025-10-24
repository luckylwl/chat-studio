import React from 'react'
import { cn } from '@/utils'

interface MessageHighlightProps {
  text: string
  searchQuery: string
  className?: string
  highlightClassName?: string
}

/**
 * 消息搜索高亮组件
 * 支持:
 * - 关键词高亮
 * - 大小写不敏感
 * - 多个关键词支持
 * - 自定义高亮样式
 */
export const MessageHighlight: React.FC<MessageHighlightProps> = ({
  text,
  searchQuery,
  className,
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-gray-100 px-0.5 rounded'
}) => {
  // 如果没有搜索词,直接返回原文本
  if (!searchQuery.trim()) {
    return <span className={className}>{text}</span>
  }

  // 转义正则表达式特殊字符
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // 创建正则表达式 (不区分大小写)
  const escapedQuery = escapeRegExp(searchQuery.trim())
  const regex = new RegExp(`(${escapedQuery})`, 'gi')

  // 分割文本
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // 如果匹配搜索词,添加高亮
        if (regex.test(part)) {
          return (
            <mark
              key={index}
              className={cn(highlightClassName, 'font-medium')}
            >
              {part}
            </mark>
          )
        }
        return <React.Fragment key={index}>{part}</React.Fragment>
      })}
    </span>
  )
}

interface MultiKeywordHighlightProps {
  text: string
  keywords: string[]
  className?: string
  colors?: string[]
}

/**
 * 多关键词高亮组件
 * 不同关键词使用不同颜色
 */
export const MultiKeywordHighlight: React.FC<MultiKeywordHighlightProps> = ({
  text,
  keywords,
  className,
  colors = [
    'bg-yellow-200 dark:bg-yellow-800',
    'bg-green-200 dark:bg-green-800',
    'bg-blue-200 dark:bg-blue-800',
    'bg-pink-200 dark:bg-pink-800',
    'bg-purple-200 dark:bg-purple-800'
  ]
}) => {
  if (!keywords.length) {
    return <span className={className}>{text}</span>
  }

  let result = [{ text, isHighlight: false, colorIndex: -1 }]

  // 为每个关键词应用高亮
  keywords.forEach((keyword, keywordIndex) => {
    if (!keyword.trim()) return

    const newResult: typeof result = []
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedKeyword})`, 'gi')

    result.forEach(segment => {
      if (segment.isHighlight) {
        // 已经高亮的部分不再处理
        newResult.push(segment)
      } else {
        // 分割并标记新的高亮
        const parts = segment.text.split(regex)
        parts.forEach((part, i) => {
          if (regex.test(part)) {
            newResult.push({
              text: part,
              isHighlight: true,
              colorIndex: keywordIndex % colors.length
            })
          } else if (part) {
            newResult.push({
              text: part,
              isHighlight: false,
              colorIndex: -1
            })
          }
        })
      }
    })

    result = newResult
  })

  return (
    <span className={className}>
      {result.map((segment, index) => {
        if (segment.isHighlight) {
          return (
            <mark
              key={index}
              className={cn(
                colors[segment.colorIndex],
                'text-gray-900 dark:text-gray-100 px-0.5 rounded font-medium'
              )}
            >
              {segment.text}
            </mark>
          )
        }
        return <React.Fragment key={index}>{segment.text}</React.Fragment>
      })}
    </span>
  )
}

export default MessageHighlight
