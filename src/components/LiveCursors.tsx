import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import collaborationService, { type CollaborationUser } from '@/services/collaborationService'
import { cn } from '@/utils'

interface LiveCursorsProps {
  enabled?: boolean
  className?: string
}

interface CursorPosition {
  userId: string
  user: CollaborationUser
  x: number
  y: number
  timestamp: Date
  visible: boolean
}

const LiveCursors: React.FC<LiveCursorsProps> = ({
  enabled = true,
  className
}) => {
  const [cursors, setCursors] = useState<CursorPosition[]>([])
  const [currentUserCursor, setCurrentUserCursor] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseTrackingRef = useRef<boolean>(false)

  useEffect(() => {
    if (!enabled) return

    // Set up event listeners for collaboration service
    const handleCursorUpdated = ({ userId, cursor }: { userId: string; cursor: any }) => {
      if (!cursor) return

      setCursors(prev => {
        const filtered = prev.filter(c => c.userId !== userId)
        const session = collaborationService.getCurrentSession()
        const user = session?.participants.find(p => p.id === userId)

        if (user && cursor) {
          return [
            ...filtered,
            {
              userId,
              user,
              x: cursor.x,
              y: cursor.y,
              timestamp: new Date(cursor.timestamp),
              visible: true
            }
          ]
        }

        return filtered
      })
    }

    const handleUserLeft = (user: CollaborationUser) => {
      setCursors(prev => prev.filter(c => c.userId !== user.id))
    }

    collaborationService.on('cursor_updated', handleCursorUpdated)
    collaborationService.on('user_left', handleUserLeft)

    return () => {
      collaborationService.off('cursor_updated', handleCursorUpdated)
      collaborationService.off('user_left', handleUserLeft)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    // Set up mouse tracking
    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseTrackingRef.current) return

      const { clientX, clientY } = event
      setCurrentUserCursor({ x: clientX, y: clientY })

      // Throttle cursor updates to server
      throttledCursorUpdate(clientX, clientY)
    }

    const handleMouseEnter = () => {
      mouseTrackingRef.current = true
    }

    const handleMouseLeave = () => {
      mouseTrackingRef.current = false
      setCurrentUserCursor(null)
    }

    // Throttle cursor updates to avoid overwhelming the server
    let lastUpdate = 0
    const throttledCursorUpdate = (x: number, y: number) => {
      const now = Date.now()
      if (now - lastUpdate > 50) { // Update at most every 50ms
        collaborationService.updateCursor(x, y)
        lastUpdate = now
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [enabled])

  useEffect(() => {
    // Hide cursors that haven't been updated in a while
    const interval = setInterval(() => {
      const now = Date.now()
      setCursors(prev => prev.map(cursor => ({
        ...cursor,
        visible: now - cursor.timestamp.getTime() < 5000 // Hide after 5 seconds
      })))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!enabled) return null

  const currentUser = collaborationService.getCurrentUser()

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 pointer-events-none z-50',
        className
      )}
    >
      <AnimatePresence>
        {cursors
          .filter(cursor => cursor.visible && cursor.userId !== currentUser?.id)
          .map((cursor) => (
            <motion.div
              key={cursor.userId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute pointer-events-none"
              style={{
                left: cursor.x,
                top: cursor.y,
                transform: 'translate(-2px, -2px)'
              }}
            >
              {/* Cursor SVG */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="drop-shadow-lg"
              >
                <path
                  d="M2 2L18 7L11 9L9 16L2 2Z"
                  fill={cursor.user.color}
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>

              {/* User label */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-6 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
                style={{
                  backgroundColor: cursor.user.color,
                  color: getContrastColor(cursor.user.color)
                }}
              >
                {cursor.user.name}
              </motion.div>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Current user cursor (for debugging/preview) */}
      {currentUserCursor && currentUser && (
        <div
          className="absolute pointer-events-none opacity-50"
          style={{
            left: currentUserCursor.x,
            top: currentUserCursor.y,
            transform: 'translate(-2px, -2px)'
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="drop-shadow-lg"
          >
            <path
              d="M2 2L18 7L11 9L9 16L2 2Z"
              fill={currentUser.color}
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

// Helper function to get contrasting text color
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export default LiveCursors