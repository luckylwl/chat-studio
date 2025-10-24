import React, { useState } from 'react'
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline'
import {
  HandThumbUpIcon as HandThumbUpSolidIcon,
  HandThumbDownIcon as HandThumbDownSolidIcon
} from '@heroicons/react/24/solid'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Reaction {
  emoji: string
  count: number
  users: string[]
}

interface MessageReactionsProps {
  messageId: string
  currentUserId?: string
  onReact?: (emoji: string) => void
  className?: string
}

const REACTION_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🤔', '💯', '🔥', '🚀', '👀'
]

const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  currentUserId = 'current-user',
  onReact,
  className
}) => {
  const [reactions, setReactions] = useState<Record<string, Reaction>>({})
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [thumbsUp, setThumbsUp] = useState(false)
  const [thumbsDown, setThumbsDown] = useState(false)

  const handleThumbsUp = () => {
    if (thumbsDown) setThumbsDown(false)
    setThumbsUp(!thumbsUp)
    onReact?.('thumbs_up')
  }

  const handleThumbsDown = () => {
    if (thumbsUp) setThumbsUp(false)
    setThumbsDown(!thumbsDown)
    onReact?.('thumbs_down')
  }

  const handleEmojiReact = (emoji: string) => {
    setReactions(prev => {
      const current = prev[emoji] || { emoji, count: 0, users: [] }
      const hasReacted = current.users.includes(currentUserId)

      if (hasReacted) {
        // 取消反应
        const newUsers = current.users.filter(id => id !== currentUserId)
        if (newUsers.length === 0) {
          const { [emoji]: removed, ...rest } = prev
          return rest
        }
        return {
          ...prev,
          [emoji]: {
            ...current,
            count: current.count - 1,
            users: newUsers
          }
        }
      } else {
        // 添加反应
        return {
          ...prev,
          [emoji]: {
            emoji,
            count: current.count + 1,
            users: [...current.users, currentUserId]
          }
        }
      }
    })
    onReact?.(emoji)
    setShowEmojiPicker(false)
  }

  const hasUserReacted = (emoji: string) => {
    return reactions[emoji]?.users.includes(currentUserId) || false
  }

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* 点赞/点踩快捷按钮 */}
      <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleThumbsUp}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            thumbsUp
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          )}
          title="有帮助"
        >
          {thumbsUp ? (
            <HandThumbUpSolidIcon className="w-4 h-4" />
          ) : (
            <HandThumbUpIcon className="w-4 h-4" />
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleThumbsDown}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            thumbsDown
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          )}
          title="需要改进"
        >
          {thumbsDown ? (
            <HandThumbDownSolidIcon className="w-4 h-4" />
          ) : (
            <HandThumbDownIcon className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* 表情反应 */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="添加表情反应"
        >
          <FaceSmileIcon className="w-4 h-4" />
        </motion.button>

        {/* 表情选择器 */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50"
              onMouseLeave={() => setShowEmojiPicker(false)}
            >
              <div className="grid grid-cols-6 gap-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEmojiReact(emoji)}
                    className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center text-lg transition-colors',
                      hasUserReacted(emoji)
                        ? 'bg-primary-100 dark:bg-primary-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 显示已添加的表情反应 */}
      {Object.values(reactions).length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {Object.values(reactions).map((reaction) => (
            <motion.button
              key={reaction.emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEmojiReact(reaction.emoji)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors',
                hasUserReacted(reaction.emoji)
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
              title={`${reaction.users.length} 人反应`}
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}

export default MessageReactions