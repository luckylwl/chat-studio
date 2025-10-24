import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useSwipe, useMobile } from './MobileOptimizations'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

interface GestureControlsProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinch?: (scale: number) => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  className?: string
  disabled?: boolean
}

export const GestureControls: React.FC<GestureControlsProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onDoubleTap,
  onLongPress,
  className,
  disabled = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useMobile()

  const [touches, setTouches] = useState<TouchList | null>(null)
  const [lastTapTime, setLastTapTime] = useState(0)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [initialDistance, setInitialDistance] = useState(0)

  // Swipe detection
  useSwipe((direction) => {
    if (disabled) return

    switch (direction) {
      case 'left':
        onSwipeLeft?.()
        break
      case 'right':
        onSwipeRight?.()
        break
      case 'up':
        onSwipeUp?.()
        break
      case 'down':
        onSwipeDown?.()
        break
    }
  })

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || !isMobile) return

    setTouches(e.touches)

    if (e.touches.length === 2 && onPinch) {
      const distance = getDistance(e.touches[0], e.touches[1])
      setInitialDistance(distance)
    }

    // Long press detection
    if (e.touches.length === 1 && onLongPress) {
      const timer = setTimeout(() => {
        onLongPress()
        navigator.vibrate?.(50) // Haptic feedback
      }, 800)
      setLongPressTimer(timer)
    }

    // Double tap detection
    if (e.touches.length === 1 && onDoubleTap) {
      const currentTime = Date.now()
      const timeDiff = currentTime - lastTapTime

      if (timeDiff < 300) {
        onDoubleTap()
        navigator.vibrate?.(30) // Haptic feedback
      }
      setLastTapTime(currentTime)
    }
  }, [disabled, isMobile, onPinch, onLongPress, onDoubleTap, lastTapTime])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !isMobile) return

    setTouches(e.touches)

    // Clear long press timer on move
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }

    // Pinch detection
    if (e.touches.length === 2 && onPinch && initialDistance > 0) {
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const scale = currentDistance / initialDistance
      onPinch(scale)
    }
  }, [disabled, isMobile, onPinch, initialDistance, longPressTimer])

  const handleTouchEnd = useCallback(() => {
    if (disabled || !isMobile) return

    setTouches(null)
    setInitialDistance(0)

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }, [disabled, isMobile, longPressTimer])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !isMobile) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isMobile])

  return (
    <div
      ref={containerRef}
      className={cn("touch-pan-y", className)}
    >
      {children}
    </div>
  )
}

interface SwipeActionsProps {
  children: React.ReactNode
  leftAction?: {
    icon: React.ReactNode
    label: string
    color: 'blue' | 'green' | 'red' | 'yellow'
    onAction: () => void
  }
  rightAction?: {
    icon: React.ReactNode
    label: string
    color: 'blue' | 'green' | 'red' | 'yellow'
    onAction: () => void
  }
  threshold?: number
  className?: string
}

export const SwipeActions: React.FC<SwipeActionsProps> = ({
  children,
  leftAction,
  rightAction,
  threshold = 80,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [translateX, setTranslateX] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [startX, setStartX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    red: 'bg-red-500 text-white',
    yellow: 'bg-yellow-500 text-white'
  }

  const handleTouchStart = useCallback((e: TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
    setIsAnimating(false)
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return

    const currentX = e.touches[0].clientX
    const deltaX = currentX - startX

    // Limit swipe range
    const maxSwipe = 120
    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX))

    // Only allow swipe if corresponding action exists
    if (clampedDelta > 0 && !rightAction) return
    if (clampedDelta < 0 && !leftAction) return

    setTranslateX(clampedDelta)
  }, [isDragging, startX, leftAction, rightAction])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return

    setIsDragging(false)
    setIsAnimating(true)

    // Check if threshold is reached
    if (Math.abs(translateX) >= threshold) {
      if (translateX > 0 && rightAction) {
        rightAction.onAction()
        navigator.vibrate?.(50)
      } else if (translateX < 0 && leftAction) {
        leftAction.onAction()
        navigator.vibrate?.(50)
      }
    }

    // Animate back to center
    setTranslateX(0)
    setTimeout(() => setIsAnimating(false), 300)
  }, [isDragging, translateX, threshold, leftAction, rightAction])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Left Action */}
      {leftAction && (
        <div
          className={cn(
            "absolute left-0 top-0 h-full flex items-center justify-center px-4",
            colorClasses[leftAction.color],
            "transform transition-transform duration-300",
            translateX < -threshold/2 ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ width: Math.abs(Math.min(translateX, 0)) + 'px' }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="text-lg">{leftAction.icon}</div>
            <span className="text-xs font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right Action */}
      {rightAction && (
        <div
          className={cn(
            "absolute right-0 top-0 h-full flex items-center justify-center px-4",
            colorClasses[rightAction.color],
            "transform transition-transform duration-300",
            translateX > threshold/2 ? "translate-x-0" : "translate-x-full"
          )}
          style={{ width: Math.max(translateX, 0) + 'px' }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="text-lg">{rightAction.icon}</div>
            <span className="text-xs font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          "relative z-10 bg-white dark:bg-gray-800",
          isAnimating && "transition-transform duration-300 ease-out"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
      >
        {children}
      </div>
    </div>
  )
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  className?: string
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [startY, setStartY] = useState(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY)
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - startY

    if (deltaY > 0) {
      e.preventDefault()
      setPullDistance(Math.min(deltaY * 0.6, threshold * 1.5))
    }
  }, [isPulling, isRefreshing, startY, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return

    setIsPulling(false)

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      navigator.vibrate?.(50)

      try {
        await onRefresh()
        toast.success('刷新完成')
      } catch (error) {
        toast.error('刷新失败')
      } finally {
        setIsRefreshing(false)
      }
    }

    setPullDistance(0)
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div ref={containerRef} className={cn("relative overflow-auto", className)}>
      {/* Pull Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-transform duration-200 z-10"
        style={{
          height: '60px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          transform: `translateY(${Math.max(-60 + pullDistance * 0.8, -60)}px)`
        }}
      >
        {isRefreshing ? (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">刷新中...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-600">
            <div
              className={cn(
                "w-4 h-4 border-2 border-gray-600 rounded-full transition-transform duration-200",
                pullDistance >= threshold ? "rotate-180" : ""
              )}
            >
              ↑
            </div>
            <span className="text-sm font-medium">
              {pullDistance >= threshold ? '释放刷新' : '下拉刷新'}
            </span>
          </div>
        )}
      </div>

      <div
        style={{ transform: `translateY(${pullDistance * 0.4}px)` }}
        className="transition-transform duration-200"
      >
        {children}
      </div>
    </div>
  )
}

export default {
  GestureControls,
  SwipeActions,
  PullToRefresh
}