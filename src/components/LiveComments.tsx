import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  ReplyIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import collaborationService, { type LiveComment, type CollaborationUser } from '@/services/collaborationService'
import { Button } from './ui'
import { cn } from '@/utils'

interface LiveCommentsProps {
  messageId: string
  enabled?: boolean
  className?: string
}

interface CommentPosition {
  x: number
  y: number
}

const LiveComments: React.FC<LiveCommentsProps> = ({
  messageId,
  enabled = true,
  className
}) => {
  const [comments, setComments] = useState<LiveComment[]>([])
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [commentPosition, setCommentPosition] = useState<CommentPosition>({ x: 0, y: 0 })
  const [newCommentContent, setNewCommentContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [hoveredComment, setHoveredComment] = useState<string | null>(null)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    // Load existing comments for this message
    const existingComments = collaborationService.getComments(messageId)
    setComments(existingComments)

    // Set up event listeners
    const handleCommentAdded = (comment: LiveComment) => {
      if (comment.messageId === messageId) {
        setComments(prev => [...prev, comment])
      }
    }

    const handleCommentResolved = (commentId: string) => {
      setComments(prev => prev.map(comment =>
        comment.id === commentId
          ? { ...comment, resolved: true, updatedAt: new Date() }
          : comment
      ))
    }

    collaborationService.on('comment_added', handleCommentAdded)
    collaborationService.on('comment_resolved', handleCommentResolved)

    return () => {
      collaborationService.off('comment_added', handleCommentAdded)
      collaborationService.off('comment_resolved', handleCommentResolved)
    }
  }, [messageId, enabled])

  useEffect(() => {
    if (!enabled) return

    // Handle right-click to add comments
    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const messageElement = target.closest(`[data-message-id="${messageId}"]`)

      if (messageElement) {
        event.preventDefault()
        const rect = messageElement.getBoundingClientRect()
        setCommentPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        })
        setShowCommentDialog(true)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu)
      return () => container.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [messageId, enabled])

  const handleAddComment = async () => {
    if (!newCommentContent.trim()) return

    setIsAddingComment(true)
    try {
      await collaborationService.addComment(
        messageId,
        newCommentContent,
        commentPosition
      )

      setNewCommentContent('')
      setShowCommentDialog(false)
      setReplyingTo(null)
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsAddingComment(false)
    }
  }

  const handleResolveComment = async (commentId: string) => {
    try {
      await collaborationService.resolveComment(commentId)
    } catch (error) {
      console.error('Failed to resolve comment:', error)
    }
  }

  const getCommentAuthor = (userId: string): CollaborationUser | null => {
    const session = collaborationService.getCurrentSession()
    return session?.participants.find(p => p.id === userId) || null
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return '刚刚'
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`
    return `${Math.floor(diffInMinutes / 1440)}天前`
  }

  const unresolvedComments = comments.filter(c => !c.resolved)
  const resolvedComments = comments.filter(c => c.resolved)

  if (!enabled) return null

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      data-message-id={messageId}
    >
      {/* Comment indicators */}
      <AnimatePresence>
        {unresolvedComments.map((comment) => {
          const author = getCommentAuthor(comment.userId)
          return (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-20"
              style={{
                left: comment.position.x,
                top: comment.position.y,
                transform: 'translate(-50%, -50%)'
              }}
              onMouseEnter={() => setHoveredComment(comment.id)}
              onMouseLeave={() => setHoveredComment(null)}
            >
              {/* Comment bubble indicator */}
              <div
                className={cn(
                  'w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-110',
                  'flex items-center justify-center'
                )}
                style={{ backgroundColor: author?.color || '#3b82f6' }}
                onClick={() => setHoveredComment(hoveredComment === comment.id ? null : comment.id)}
              >
                <ChatBubbleLeftIcon className="w-3 h-3 text-white" />
              </div>

              {/* Comment tooltip/popup */}
              <AnimatePresence>
                {hoveredComment === comment.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-8 left-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-30"
                    style={{ transform: 'translateX(-50%)' }}
                  >
                    {/* Comment header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {author?.avatar ? (
                          <img
                            src={author.avatar}
                            alt={author.name}
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: author?.color || '#3b82f6' }}
                          >
                            <UserIcon className="w-3 h-3" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {author?.name || 'Unknown User'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleResolveComment(comment.id)}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          title="标记为已解决"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setHoveredComment(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Comment content */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {comment.content}
                    </p>

                    {/* Comment timestamp */}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(comment.createdAt)}
                    </p>

                    {/* Replies (if any) */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          {comment.replies.map((reply) => {
                            const replyAuthor = getCommentAuthor(reply.userId)
                            return (
                              <div key={reply.id} className="flex gap-2">
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: replyAuthor?.color || '#6b7280' }}
                                >
                                  <UserIcon className="w-2 h-2 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                      {replyAuthor?.name || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimestamp(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-700 dark:text-gray-300">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Add comment dialog */}
      <AnimatePresence>
        {showCommentDialog && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-25 z-40"
              onClick={() => setShowCommentDialog(false)}
            />

            {/* Comment dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-72"
              style={{
                left: commentPosition.x,
                top: commentPosition.y,
                transform: 'translate(-50%, -10px)'
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <PlusIcon className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  添加评论
                </h3>
              </div>

              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="输入你的评论..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none"
                rows={3}
                autoFocus
              />

              <div className="flex justify-end gap-2 mt-3">
                <Button
                  onClick={() => setShowCommentDialog(false)}
                  variant="outline"
                  size="sm"
                >
                  取消
                </Button>
                <Button
                  onClick={handleAddComment}
                  disabled={!newCommentContent.trim() || isAddingComment}
                  size="sm"
                >
                  {isAddingComment ? '添加中...' : '添加评论'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Comment summary (when there are resolved comments) */}
      {resolvedComments.length > 0 && (
        <div className="absolute top-0 right-0 -translate-y-full mb-2">
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs">
            {resolvedComments.length} 个已解决的评论
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveComments