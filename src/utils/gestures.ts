import React from 'react'

// 手势工具类，提供触摸事件处理
export class GestureHandler {
  private startX: number = 0
  private startY: number = 0
  private startTime: number = 0
  private element: HTMLElement

  constructor(element: HTMLElement) {
    this.element = element
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // 被动事件监听，提升性能
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: true })
  }

  private handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    this.startX = touch.clientX
    this.startY = touch.clientY
    this.startTime = Date.now()
  }

  private handleTouchMove = (e: TouchEvent) => {
    // 防止在滑动时的默认行为（如页面滚动）
    const touch = e.touches[0]
    const deltaX = touch.clientX - this.startX
    const deltaY = touch.clientY - this.startY

    // 如果是水平滑动且距离足够大，阻止默认行为
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault()
    }
  }

  private handleTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0]
    const endX = touch.clientX
    const endY = touch.clientY
    const endTime = Date.now()

    const deltaX = endX - this.startX
    const deltaY = endY - this.startY
    const deltaTime = endTime - this.startTime

    // 检测是否为有效的滑动手势
    if (this.isSwipe(deltaX, deltaY, deltaTime)) {
      this.handleSwipe(deltaX, deltaY)
    } else if (this.isTap(deltaX, deltaY, deltaTime)) {
      this.handleTap()
    }
  }

  private isSwipe(deltaX: number, deltaY: number, deltaTime: number): boolean {
    const minDistance = 50 // 最小滑动距离
    const maxTime = 300 // 最大时间（毫秒）

    return (
      Math.abs(deltaX) > minDistance &&
      Math.abs(deltaX) > Math.abs(deltaY) * 2 &&
      deltaTime < maxTime
    )
  }

  private isTap(deltaX: number, deltaY: number, deltaTime: number): boolean {
    const maxDistance = 10 // 最大移动距离
    const maxTime = 300 // 最大时间

    return (
      Math.abs(deltaX) < maxDistance &&
      Math.abs(deltaY) < maxDistance &&
      deltaTime < maxTime
    )
  }

  private handleSwipe(deltaX: number, deltaY: number) {
    const direction = deltaX > 0 ? 'right' : 'left'

    // 触发自定义事件
    this.element.dispatchEvent(
      new CustomEvent('swipe', {
        detail: { direction, deltaX, deltaY }
      })
    )
  }

  private handleTap() {
    this.element.dispatchEvent(new CustomEvent('tap'))
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart)
    this.element.removeEventListener('touchmove', this.handleTouchMove)
    this.element.removeEventListener('touchend', this.handleTouchEnd)
  }
}

// Hook for using gestures in React components
export const useSwipeGesture = (
  elementRef: React.RefObject<HTMLElement>,
  callbacks: {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onTap?: () => void
  }
) => {
  React.useEffect(() => {
    if (!elementRef.current) return

    const gestureHandler = new GestureHandler(elementRef.current)

    const handleSwipe = (e: CustomEvent) => {
      const { direction } = e.detail
      if (direction === 'left' && callbacks.onSwipeLeft) {
        callbacks.onSwipeLeft()
      } else if (direction === 'right' && callbacks.onSwipeRight) {
        callbacks.onSwipeRight()
      }
    }

    const handleTap = () => {
      if (callbacks.onTap) {
        callbacks.onTap()
      }
    }

    elementRef.current.addEventListener('swipe', handleSwipe as EventListener)
    elementRef.current.addEventListener('tap', handleTap)

    return () => {
      gestureHandler.destroy()
      if (elementRef.current) {
        elementRef.current.removeEventListener('swipe', handleSwipe as EventListener)
        elementRef.current.removeEventListener('tap', handleTap)
      }
    }
  }, [callbacks])
}

// 触觉反馈工具
export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  },

  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20)
    }
  },

  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 10, 50])
    }
  },

  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 30, 100])
    }
  },

  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }
}