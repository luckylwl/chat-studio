import { useEffect, useRef, useState } from 'react'

/**
 * 滑动方向
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

/**
 * 滑动事件处理器
 */
export interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeStart?: (x: number, y: number) => void
  onSwipeMove?: (deltaX: number, deltaY: number) => void
  onSwipeEnd?: (direction: SwipeDirection | null) => void
}

/**
 * 滑动配置
 */
export interface SwipeConfig {
  minSwipeDistance?: number // 最小滑动距离 (px)
  maxSwipeTime?: number // 最大滑动时间 (ms)
  preventDefaultTouchmoveEvent?: boolean // 阻止默认触摸移动事件
  trackTouch?: boolean // 是否跟踪触摸移动
  trackMouse?: boolean // 是否跟踪鼠标移动
}

/**
 * 滑动状态
 */
export interface SwipeState {
  isSwiping: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  deltaX: number
  deltaY: number
  direction: SwipeDirection | null
}

/**
 * 滑动手势 Hook
 *
 * 功能:
 * - 检测滑动方向
 * - 跟踪滑动距离
 * - 支持触摸和鼠标
 * - 可配置灵敏度
 *
 * @param handlers 滑动事件处理器
 * @param config 滑动配置
 * @returns ref 和滑动状态
 *
 * @example
 * ```tsx
 * const { ref, swipeState } = useSwipe({
 *   onSwipeLeft: () => console.log('向左滑动'),
 *   onSwipeRight: () => console.log('向右滑动')
 * })
 *
 * return <div ref={ref}>滑动我</div>
 * ```
 */
export function useSwipe<T extends HTMLElement = HTMLElement>(
  handlers: SwipeHandlers = {},
  config: SwipeConfig = {}
) {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventDefaultTouchmoveEvent = false,
    trackTouch = true,
    trackMouse = false
  } = config

  const elementRef = useRef<T>(null)

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    direction: null
  })

  // 滑动开始时间
  const swipeStartTime = useRef<number>(0)

  // 开始滑动
  const handleSwipeStart = (clientX: number, clientY: number) => {
    swipeStartTime.current = Date.now()

    setSwipeState({
      isSwiping: true,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      deltaX: 0,
      deltaY: 0,
      direction: null
    })

    handlers.onSwipeStart?.(clientX, clientY)
  }

  // 滑动移动
  const handleSwipeMove = (clientX: number, clientY: number) => {
    if (!swipeState.isSwiping) return

    const deltaX = clientX - swipeState.startX
    const deltaY = clientY - swipeState.startY

    // 判断滑动方向
    let direction: SwipeDirection | null = null
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      // 垂直滑动
      direction = deltaY > 0 ? 'down' : 'up'
    }

    setSwipeState((prev) => ({
      ...prev,
      currentX: clientX,
      currentY: clientY,
      deltaX,
      deltaY,
      direction
    }))

    handlers.onSwipeMove?.(deltaX, deltaY)
  }

  // 结束滑动
  const handleSwipeEnd = () => {
    if (!swipeState.isSwiping) return

    const swipeTime = Date.now() - swipeStartTime.current
    const { deltaX, deltaY } = swipeState

    // 判断是否是有效滑动
    if (swipeTime <= maxSwipeTime) {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX >= minSwipeDistance || absY >= minSwipeDistance) {
        // 确定滑动方向
        let direction: SwipeDirection | null = null

        if (absX > absY) {
          // 水平滑动
          direction = deltaX > 0 ? 'right' : 'left'

          if (direction === 'left') {
            handlers.onSwipeLeft?.()
          } else {
            handlers.onSwipeRight?.()
          }
        } else {
          // 垂直滑动
          direction = deltaY > 0 ? 'down' : 'up'

          if (direction === 'up') {
            handlers.onSwipeUp?.()
          } else {
            handlers.onSwipeDown?.()
          }
        }

        handlers.onSwipeEnd?.(direction)

        // 更新最终方向
        setSwipeState((prev) => ({
          ...prev,
          isSwiping: false,
          direction
        }))

        return
      }
    }

    // 无效滑动
    setSwipeState((prev) => ({
      ...prev,
      isSwiping: false,
      direction: null
    }))

    handlers.onSwipeEnd?.(null)
  }

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // 触摸事件
    if (trackTouch) {
      const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0]
        handleSwipeStart(touch.clientX, touch.clientY)
      }

      const handleTouchMove = (e: TouchEvent) => {
        if (preventDefaultTouchmoveEvent) {
          e.preventDefault()
        }

        const touch = e.touches[0]
        handleSwipeMove(touch.clientX, touch.clientY)
      }

      const handleTouchEnd = () => {
        handleSwipeEnd()
      }

      element.addEventListener('touchstart', handleTouchStart, { passive: true })
      element.addEventListener('touchmove', handleTouchMove, {
        passive: !preventDefaultTouchmoveEvent
      })
      element.addEventListener('touchend', handleTouchEnd, { passive: true })
      element.addEventListener('touchcancel', handleTouchEnd, { passive: true })

      return () => {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
        element.removeEventListener('touchend', handleTouchEnd)
        element.removeEventListener('touchcancel', handleTouchEnd)
      }
    }

    // 鼠标事件
    if (trackMouse) {
      let isMouseDown = false

      const handleMouseDown = (e: MouseEvent) => {
        isMouseDown = true
        handleSwipeStart(e.clientX, e.clientY)
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!isMouseDown) return
        handleSwipeMove(e.clientX, e.clientY)
      }

      const handleMouseUp = () => {
        if (!isMouseDown) return
        isMouseDown = false
        handleSwipeEnd()
      }

      element.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        element.removeEventListener('mousedown', handleMouseDown)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [swipeState.isSwiping, handlers, minSwipeDistance, maxSwipeTime])

  return {
    ref: elementRef,
    swipeState
  }
}

/**
 * 长按手势 Hook
 *
 * @param callback 长按回调
 * @param duration 长按时长 (ms)
 * @returns ref
 *
 * @example
 * ```tsx
 * const ref = useLongPress(() => {
 *   console.log('长按触发')
 * }, 500)
 *
 * return <button ref={ref}>长按我</button>
 * ```
 */
export function useLongPress<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  duration: number = 500
) {
  const elementRef = useRef<T>(null)
  const timerRef = useRef<number>()
  const isLongPressRef = useRef(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleStart = () => {
      isLongPressRef.current = false

      timerRef.current = window.setTimeout(() => {
        isLongPressRef.current = true
        callback()
      }, duration)
    }

    const handleEnd = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }

    const handleClick = (e: Event) => {
      if (isLongPressRef.current) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // 触摸事件
    element.addEventListener('touchstart', handleStart, { passive: true })
    element.addEventListener('touchend', handleEnd, { passive: true })
    element.addEventListener('touchcancel', handleEnd, { passive: true })
    element.addEventListener('touchmove', handleEnd, { passive: true })

    // 鼠标事件
    element.addEventListener('mousedown', handleStart)
    element.addEventListener('mouseup', handleEnd)
    element.addEventListener('mouseleave', handleEnd)

    // 点击事件 (防止误触)
    element.addEventListener('click', handleClick)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      element.removeEventListener('touchstart', handleStart)
      element.removeEventListener('touchend', handleEnd)
      element.removeEventListener('touchcancel', handleEnd)
      element.removeEventListener('touchmove', handleEnd)

      element.removeEventListener('mousedown', handleStart)
      element.removeEventListener('mouseup', handleEnd)
      element.removeEventListener('mouseleave', handleEnd)

      element.removeEventListener('click', handleClick)
    }
  }, [callback, duration])

  return elementRef
}

/**
 * 双击手势 Hook
 *
 * @param callback 双击回调
 * @param delay 双击间隔 (ms)
 * @returns ref
 *
 * @example
 * ```tsx
 * const ref = useDoubleTap(() => {
 *   console.log('双击触发')
 * })
 *
 * return <div ref={ref}>双击我</div>
 * ```
 */
export function useDoubleTap<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  delay: number = 300
) {
  const elementRef = useRef<T>(null)
  const lastTapRef = useRef<number>(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTap = () => {
      const now = Date.now()
      const timeSinceLastTap = now - lastTapRef.current

      if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
        // 双击
        callback()
        lastTapRef.current = 0
      } else {
        // 单击
        lastTapRef.current = now
      }
    }

    element.addEventListener('click', handleTap)

    return () => {
      element.removeEventListener('click', handleTap)
    }
  }, [callback, delay])

  return elementRef
}

/**
 * 捏合缩放手势 Hook
 *
 * @param callback 缩放回调 (scale)
 * @returns ref
 *
 * @example
 * ```tsx
 * const ref = usePinch((scale) => {
 *   console.log('缩放比例:', scale)
 * })
 *
 * return <div ref={ref}>捏合缩放我</div>
 * ```
 */
export function usePinch<T extends HTMLElement = HTMLElement>(
  callback: (scale: number) => void
) {
  const elementRef = useRef<T>(null)
  const initialDistanceRef = useRef<number>(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX
      const dy = touch1.clientY - touch2.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistanceRef.current = getDistance(e.touches[0], e.touches[1])
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistanceRef.current > 0) {
        e.preventDefault()

        const currentDistance = getDistance(e.touches[0], e.touches[1])
        const scale = currentDistance / initialDistanceRef.current

        callback(scale)
      }
    }

    const handleTouchEnd = () => {
      initialDistanceRef.current = 0
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [callback])

  return elementRef
}
