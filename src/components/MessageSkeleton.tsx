import React from 'react'
import { cn } from '@/utils'
import { motion } from 'framer-motion'

interface MessageSkeletonProps {
  isUser?: boolean
  className?: string
}

const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ isUser = false, className }) => {
  return (
    <div
      className={cn(
        'group flex gap-4 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar skeleton */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full animate-pulse',
          isUser
            ? 'bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-800'
            : 'bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-800'
        )}
      />

      {/* Content skeleton */}
      <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : 'text-left')}>
        {/* Header skeleton */}
        <div
          className={cn(
            'flex items-center gap-2 mb-2',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Message content skeleton */}
        <div
          className={cn(
            'p-4 rounded-2xl border',
            isUser
              ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-11/12" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/5" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface TypingIndicatorProps {
  className?: string
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className }) => {
  return (
    <div className={cn('flex gap-4 p-4', className)}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
      </div>

      {/* Typing animation */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            AI助手
          </span>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-primary-500 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2
                }}
              />
            ))}
          </motion.div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            正在思考...
          </span>
        </div>
      </div>
    </div>
  )
}

interface ChatSkeletonProps {
  count?: number
  className?: string
}

export const ChatSkeleton: React.FC<ChatSkeletonProps> = ({ count = 3, className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton
          key={index}
          isUser={index % 2 === 0}
        />
      ))}
    </div>
  )
}

export default MessageSkeleton