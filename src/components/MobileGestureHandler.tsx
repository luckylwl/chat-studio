import React, { useRef, useState, useEffect, ReactNode } from 'react'

export interface GestureConfig {
  swipeThreshold?: number // 滑动触发的最小距离 (px)
  swipeVelocity?: number // 滑动速度阈值 (px/ms)
  longPressDelay?: number // 长按延迟 (ms)
  doubleTapDelay?: number // 双击间隔 (ms)
  pinchThreshold?: number // 缩放阈值
}

export interface GestureCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onLongPress?: (x: number, y: number) => void
  onDoubleTap?: (x: number, y: number) => void
  onPinchIn?: (scale: number) => void
  onPinchOut?: (scale: number) => void
  onTap?: (x: number, y: number) => void
}

interface MobileGestureHandlerProps {
  children: ReactNode
  config?: GestureConfig
  callbacks?: GestureCallbacks
  className?: string
  disabled?: boolean
}

interface TouchState {
  startX: number
  startY: number
  startTime: number
  lastTapTime: number
  isSwiping: boolean
  isLongPressing: boolean
  longPressTimer: number | null
  initialDistance: number
}

const defaultConfig: GestureConfig = {
  swipeThreshold: 50,
  swipeVelocity: 0.3,
  longPressDelay: 500,
  doubleTapDelay: 300,
  pinchThreshold: 0.1,
}

/**
 * 移动端手势处理组件
 * 支持滑动、长按、双击、缩放等手势
 */
const MobileGestureHandler: React.FC<MobileGestureHandlerProps> = ({
  children,
  config: userConfig,
  callbacks = {},
  className = '',
  disabled = false,
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    isSwiping: false,
    isLongPressing: false,
    longPressTimer: null,
    initialDistance: 0,
  })

  const config = { ...defaultConfig, ...userConfig }

  // 计算两点之间的距离
  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return

    const touch = e.touches[0]
    const now = Date.now()

    // 检测双击
    if (
      callbacks.onDoubleTap &&
      now - touchState.lastTapTime < config.doubleTapDelay!
    ) {
      callbacks.onDoubleTap(touch.clientX, touch.clientY)
      setTouchState((prev) => ({ ...prev, lastTapTime: 0 }))
      return
    }

    // 设置长按定时器
    let longPressTimer: number | null = null
    if (callbacks.onLongPress) {
      longPressTimer = window.setTimeout(() => {
        setTouchState((prev) => ({ ...prev, isLongPressing: true }))
        callbacks.onLongPress!(touch.clientX, touch.clientY)
      }, config.longPressDelay)
    }

    // 记录初始状态
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      lastTapTime: now,
      isSwiping: false,
      isLongPressing: false,
      longPressTimer,
      initialDistance:
        e.touches.length === 2
          ? getDistance(e.touches[0], e.touches[1])
          : 0,
    })
  }

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled) return

    // 清除长按定时器
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer)
      setTouchState((prev) => ({ ...prev, longPressTimer: null }))
    }

    // 处理缩放手势
    if (e.touches.length === 2 && touchState.initialDistance > 0) {
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const scale = currentDistance / touchState.initialDistance

      if (Math.abs(scale - 1) > config.pinchThreshold!) {
        if (scale > 1 && callbacks.onPinchOut) {
          callbacks.onPinchOut(scale)
        } else if (scale < 1 && callbacks.onPinchIn) {
          callbacks.onPinchIn(scale)
        }
      }
      return
    }

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchState.startX
    const deltaY = touch.clientY - touchState.startY

    // 判断是否开始滑动
    if (
      !touchState.isSwiping &&
      (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)
    ) {
      setTouchState((prev) => ({ ...prev, isSwiping: true }))
    }
  }

  // 处理触摸结束
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return

    // 清除长按定时器
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer)
    }

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchState.startX
    const deltaY = touch.clientY - touchState.startY
    const deltaTime = Date.now() - touchState.startTime
    const velocityX = Math.abs(deltaX) / deltaTime
    const velocityY = Math.abs(deltaY) / deltaTime

    // 如果是长按,直接返回
    if (touchState.isLongPressing) {
      setTouchState((prev) => ({
        ...prev,
        isLongPressing: false,
        longPressTimer: null,
      }))
      return
    }

    // 判断滑动方向
    if (touchState.isSwiping) {
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)

      if (isHorizontalSwipe) {
        // 水平滑动
        if (
          Math.abs(deltaX) > config.swipeThreshold! &&
          velocityX > config.swipeVelocity!
        ) {
          if (deltaX > 0 && callbacks.onSwipeRight) {
            callbacks.onSwipeRight()
          } else if (deltaX < 0 && callbacks.onSwipeLeft) {
            callbacks.onSwipeLeft()
          }
        }
      } else {
        // 垂直滑动
        if (
          Math.abs(deltaY) > config.swipeThreshold! &&
          velocityY > config.swipeVelocity!
        ) {
          if (deltaY > 0 && callbacks.onSwipeDown) {
            callbacks.onSwipeDown()
          } else if (deltaY < 0 && callbacks.onSwipeUp) {
            callbacks.onSwipeUp()
          }
        }
      }
    } else {
      // 单击
      if (callbacks.onTap && deltaTime < 300) {
        callbacks.onTap(touch.clientX, touch.clientY)
      }
    }

    setTouchState((prev) => ({
      ...prev,
      isSwiping: false,
      longPressTimer: null,
    }))
  }

  return (
    <div
      ref={elementRef}
      className={`mobile-gesture-handler ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none', userSelect: 'none' }}
    >
      {children}
    </div>
  )
}

export default MobileGestureHandler
