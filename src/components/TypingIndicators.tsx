import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import collaborationService, { type TypingIndicator, type CollaborationUser } from '@/services/collaborationService'
import { cn } from '@/utils'

interface TypingIndicatorsProps {
  messageId?: string
  enabled?: boolean
  className?: string
}

interface ActiveTyping {
  user: CollaborationUser
  indicator: TypingIndicator
  timeoutId?: NodeJS.Timeout
}

const TypingIndicators: React.FC<TypingIndicatorsProps> = ({
  messageId,
  enabled = true,
  className
}) => {
  const [activeTyping, setActiveTyping] = useState<Map<string, ActiveTyping>>(new Map())
  const [currentUserTyping, setCurrentUserTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled) return

    // Set up event listeners
    const handleTypingUpdated = ({ userId, typing }: { userId: string; typing: TypingIndicator }) => {
      // Filter by messageId if specified
      if (messageId && typing.messageId !== messageId) return

      const session = collaborationService.getCurrentSession()
      const user = session?.participants.find(p => p.id === userId)
      const currentUser = collaborationService.getCurrentUser()

      // Don't show current user's typing indicator
      if (userId === currentUser?.id) return

      if (user) {
        setActiveTyping(prev => {
          const newMap = new Map(prev)

          if (typing.isTyping) {
            // Clear existing timeout if any
            const existing = newMap.get(userId)
            if (existing?.timeoutId) {
              clearTimeout(existing.timeoutId)
            }

            // Set timeout to hide indicator after 3 seconds of inactivity
            const timeoutId = setTimeout(() => {
              setActiveTyping(current => {
                const updated = new Map(current)
                updated.delete(userId)
                return updated
              })
            }, 3000)

            newMap.set(userId, {
              user,
              indicator: typing,
              timeoutId
            })
          } else {
            // User stopped typing
            const existing = newMap.get(userId)
            if (existing?.timeoutId) {
              clearTimeout(existing.timeoutId)
            }
            newMap.delete(userId)
          }

          return newMap
        })
      }
    }

    const handleUserLeft = (user: CollaborationUser) => {
      setActiveTyping(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(user.id)
        if (existing?.timeoutId) {
          clearTimeout(existing.timeoutId)
        }
        newMap.delete(user.id)
        return newMap
      })
    }

    collaborationService.on('typing_updated', handleTypingUpdated)
    collaborationService.on('user_left', handleUserLeft)

    return () => {
      collaborationService.off('typing_updated', handleTypingUpdated)
      collaborationService.off('user_left', handleUserLeft)

      // Clear all timeouts
      activeTyping.forEach(({ timeoutId }) => {
        if (timeoutId) clearTimeout(timeoutId)
      })
    }
  }, [messageId, enabled])

  const handleStartTyping = () => {
    if (!enabled || currentUserTyping) return

    setCurrentUserTyping(true)
    collaborationService.updateTyping(messageId, true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setCurrentUserTyping(false)
      collaborationService.updateTyping(messageId, false)
    }, 1000)
  }

  const handleStopTyping = () => {
    if (!enabled || !currentUserTyping) return

    setCurrentUserTyping(false)
    collaborationService.updateTyping(messageId, false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  // Expose methods for parent components to call
  React.useImperativeHandle(undefined, () => ({
    startTyping: handleStartTyping,
    stopTyping: handleStopTyping
  }))

  const typingUsers = Array.from(activeTyping.values())

  if (!enabled || typingUsers.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <AnimatePresence mode="popLayout">
        {typingUsers.map(({ user, indicator }) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1.5"
          >
            {/* User avatar */}
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: user.color }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Typing animation */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {user.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                正在输入
              </span>
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full"
                    animate={{
                      y: [0, -3, 0],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook for using typing indicators in input components
export const useTypingIndicator = (messageId?: string, enabled: boolean = true) => {
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const startTyping = () => {
    if (!enabled || isTyping) return

    setIsTyping(true)
    collaborationService.updateTyping(messageId, true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      collaborationService.updateTyping(messageId, false)
    }, 2000)
  }

  const stopTyping = () => {
    if (!enabled || !isTyping) return

    setIsTyping(false)
    collaborationService.updateTyping(messageId, false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const updateTyping = () => {
    if (!enabled) return

    if (!isTyping) {
      startTyping()
    } else {
      // Reset the timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        collaborationService.updateTyping(messageId, false)
      }, 2000)
    }
  }

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTyping) {
        collaborationService.updateTyping(messageId, false)
      }
    }
  }, [])

  return {
    isTyping,
    startTyping,
    stopTyping,
    updateTyping
  }
}

export default TypingIndicators