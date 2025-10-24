import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Bars3Icon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/utils'
import { Button } from './ui'

// Mobile detection hook
export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      setOrientation(height > width ? 'portrait' : 'landscape')
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  return { isMobile, isTablet, orientation }
}

// Touch gesture hook
export const useTouch = () => {
  const [touches, setTouches] = useState<TouchList | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })

  const handleTouchStart = useCallback((e: TouchEvent) => {
    setTouches(e.touches)
    setIsDragging(true)
    startPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    setTouches(null)
    setIsDragging(false)
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return
    setTouches(e.touches)
  }, [isDragging])

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [handleTouchStart, handleTouchEnd, handleTouchMove])

  return {
    touches,
    isDragging,
    startPos: startPos.current,
    currentPos: touches?.[0] ? { x: touches[0].clientX, y: touches[0].clientY } : null
  }
}

// Swipe gesture hook
export const useSwipe = (onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void, threshold = 50) => {
  const startPos = useRef({ x: 0, y: 0 })

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const deltaX = endX - startPos.current.x
    const deltaY = endY - startPos.current.y

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        onSwipe(deltaX > 0 ? 'right' : 'left')
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        onSwipe(deltaY > 0 ? 'down' : 'up')
      }
    }
  }, [onSwipe, threshold])

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchEnd])
}

// Mobile toolbar component
interface MobileToolbarProps {
  children: React.ReactNode
  className?: string
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({ children, className }) => {
  const { isMobile } = useMobile()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isMobile) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn("bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700", className)}>
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          工具
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 p-0"
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronUpIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isExpanded ? "max-h-96" : "max-h-0"
      )}>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Pull to refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  className?: string
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 100,
  className
}) => {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - startY.current

    if (deltaY > 0) {
      e.preventDefault()
      setPullDistance(Math.min(deltaY, threshold * 1.5))
    }
  }, [isPulling, isRefreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return

    setIsPulling(false)

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
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
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 transition-transform duration-200 z-10"
        style={{
          height: '60px',
          transform: `translateY(${Math.max(-60 + pullDistance * 0.4, -60)}px)`
        }}
      >
        {isRefreshing ? (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">刷新中...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <ArrowUpIcon className={cn(
              "w-4 h-4 transition-transform duration-200",
              pullDistance >= threshold ? "rotate-180" : ""
            )} />
            <span className="text-sm font-medium">
              {pullDistance >= threshold ? '释放刷新' : '下拉刷新'}
            </span>
          </div>
        )}
      </div>

      <div style={{ transform: `translateY(${pullDistance * 0.3}px)` }}>
        {children}
      </div>
    </div>
  )
}

// Mobile drawer component
interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  position?: 'left' | 'right' | 'bottom'
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  children,
  title,
  position = 'left'
}) => {
  const { isMobile } = useMobile()

  useSwipe((direction) => {
    if (isOpen) {
      if (position === 'left' && direction === 'left') onClose()
      if (position === 'right' && direction === 'right') onClose()
      if (position === 'bottom' && direction === 'down') onClose()
    }
  })

  if (!isMobile) return null

  const positionClasses = {
    left: 'left-0 top-0 h-full w-80 translate-x-full',
    right: 'right-0 top-0 h-full w-80 -translate-x-full',
    bottom: 'bottom-0 left-0 right-0 max-h-[80vh] translate-y-full'
  }

  const openClasses = {
    left: 'translate-x-0',
    right: 'translate-x-0',
    bottom: 'translate-y-0'
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed bg-white dark:bg-gray-900 shadow-xl z-50 transition-transform duration-300",
          positionClasses[position],
          isOpen && openClasses[position]
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="p-4 overflow-auto flex-1">
          {children}
        </div>
      </div>
    </>
  )
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 }
}) => {
  const gridClasses = cn(
    "grid gap-4",
    `grid-cols-${cols.mobile || 1}`,
    `md:grid-cols-${cols.tablet || 2}`,
    `lg:grid-cols-${cols.desktop || 3}`,
    className
  )

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

// Mobile-friendly button component
interface MobileButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  disabled
}) => {
  const { isMobile } = useMobile()

  const baseClasses = "rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"

  const sizeClasses = {
    sm: isMobile ? "px-3 py-2 text-sm min-h-[44px]" : "px-3 py-2 text-sm",
    md: isMobile ? "px-4 py-3 text-base min-h-[48px]" : "px-4 py-2 text-sm",
    lg: isMobile ? "px-6 py-4 text-lg min-h-[52px]" : "px-6 py-3 text-base"
  }

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500",
    ghost: "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500"
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  )
}

// Touch-friendly scroll area
interface TouchScrollAreaProps {
  children: React.ReactNode
  className?: string
  maxHeight?: string
}

export const TouchScrollArea: React.FC<TouchScrollAreaProps> = ({
  children,
  className,
  maxHeight = '400px'
}) => {
  const { isMobile } = useMobile()

  const scrollClasses = cn(
    "overflow-auto",
    isMobile && "overscroll-contain scroll-smooth",
    className
  )

  const style = isMobile ? {
    maxHeight,
    WebkitOverflowScrolling: 'touch' as const
  } : { maxHeight }

  return (
    <div className={scrollClasses} style={style}>
      {children}
    </div>
  )
}

export default {
  useMobile,
  useTouch,
  useSwipe,
  MobileToolbar,
  PullToRefresh,
  MobileDrawer,
  ResponsiveGrid,
  MobileButton,
  TouchScrollArea
}