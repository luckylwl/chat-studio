import React, { useState, useEffect } from 'react'
import { BookmarkIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import { BookmarkService } from '@/services/bookmarkService'
import { useAppStore } from '@/store'

interface BookmarkButtonProps {
  conversationId: string
  messageId?: string
  title: string
  content?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  conversationId,
  messageId,
  title,
  content,
  className = '',
  size = 'md'
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { conversations } = useAppStore()

  const bookmarkService = BookmarkService.getInstance()

  useEffect(() => {
    checkBookmarkStatus()
  }, [conversationId, messageId])

  const checkBookmarkStatus = () => {
    const bookmarked = bookmarkService.isBookmarked(conversationId, messageId)
    setIsBookmarked(bookmarked)
  }

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)

    try {
      if (isBookmarked) {
        // 查找并删除书签
        const existingBookmarks = bookmarkService.getConversationBookmarks(conversationId)
        const targetBookmark = existingBookmarks.find(bookmark =>
          messageId ? bookmark.messageId === messageId : bookmark.type === 'conversation'
        )

        if (targetBookmark) {
          await bookmarkService.removeBookmark(targetBookmark.id)
        }
      } else {
        // 创建新书签
        const conversation = conversations.find(c => c.id === conversationId)
        let bookmarkTitle = title
        let bookmarkContent = content

        if (messageId && conversation) {
          const message = conversation.messages.find(m => m.id === messageId)
          if (message) {
            bookmarkTitle = `${message.role === 'user' ? '用户' : 'AI'}: ${message.content.slice(0, 50)}...`
            bookmarkContent = message.content
          }
        }

        await bookmarkService.addBookmark({
          type: messageId ? 'message' : 'conversation',
          conversationId,
          messageId,
          title: bookmarkTitle,
          description: bookmarkContent ? (bookmarkContent.length > 200 ? bookmarkContent.slice(0, 200) + '...' : bookmarkContent) : undefined,
          tags: [],
          isFavorite: false
        })
      }

      checkBookmarkStatus()
    } catch (error) {
      console.error('Toggle bookmark error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3'
      case 'lg':
        return 'w-6 h-6'
      default:
        return 'w-4 h-4'
    }
  }

  const getButtonClasses = () => {
    const baseClasses = `
      inline-flex items-center justify-center rounded-lg transition-all duration-200
      hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
    `

    const sizeClasses = {
      sm: 'p-1',
      md: 'p-1.5',
      lg: 'p-2'
    }

    const colorClasses = isBookmarked
      ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30'
      : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'

    return `${baseClasses} ${sizeClasses[size]} ${colorClasses} ${className}`
  }

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={isLoading}
      className={getButtonClasses()}
      title={isBookmarked ? '取消书签' : '添加书签'}
    >
      {isLoading ? (
        <div className={`animate-spin border-2 border-current border-t-transparent rounded-full ${getSizeClasses()}`} />
      ) : isBookmarked ? (
        <BookmarkSolidIcon className={getSizeClasses()} />
      ) : (
        <BookmarkIcon className={getSizeClasses()} />
      )}
    </button>
  )
}

export default BookmarkButton