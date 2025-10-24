import { useState, useEffect } from 'react'

/**
 * 响应式断点
 */
export const BREAKPOINTS = {
  xs: 320,  // 超小屏幕
  sm: 640,  // 小屏幕 (手机)
  md: 768,  // 中等屏幕 (平板)
  lg: 1024, // 大屏幕 (桌面)
  xl: 1280, // 超大屏幕
  '2xl': 1536 // 超超大屏幕
} as const

/**
 * 设备类型
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * 屏幕尺寸
 */
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * 响应式状态
 */
export interface ResponsiveState {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  deviceType: DeviceType
  screenSize: ScreenSize
  orientation: 'portrait' | 'landscape'
  isTouch: boolean
}

/**
 * 响应式 Hook
 *
 * 功能:
 * - 实时监听窗口大小变化
 * - 判断设备类型
 * - 检测触摸设备
 * - 获取屏幕方向
 *
 * @returns 响应式状态
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, screenSize } = useResponsive()
 *
 * if (isMobile) {
 *   return <MobileLayout />
 * }
 *
 * return <DesktopLayout />
 * ```
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    return getResponsiveState()
  })

  useEffect(() => {
    const handleResize = () => {
      setState(getResponsiveState())
    }

    const handleOrientationChange = () => {
      // 延迟更新，等待浏览器完成旋转
      setTimeout(() => {
        setState(getResponsiveState())
      }, 100)
    }

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)

    // 监听屏幕方向变化 (移动设备)
    window.addEventListener('orientationchange', handleOrientationChange)

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return state
}

/**
 * 获取响应式状态
 */
function getResponsiveState(): ResponsiveState {
  const width = window.innerWidth
  const height = window.innerHeight

  // 判断设备类型
  const isMobile = width < BREAKPOINTS.md
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg
  const isDesktop = width >= BREAKPOINTS.lg

  // 确定设备类型
  let deviceType: DeviceType
  if (isMobile) {
    deviceType = 'mobile'
  } else if (isTablet) {
    deviceType = 'tablet'
  } else {
    deviceType = 'desktop'
  }

  // 确定屏幕尺寸
  let screenSize: ScreenSize
  if (width < BREAKPOINTS.sm) {
    screenSize = 'xs'
  } else if (width < BREAKPOINTS.md) {
    screenSize = 'sm'
  } else if (width < BREAKPOINTS.lg) {
    screenSize = 'md'
  } else if (width < BREAKPOINTS.xl) {
    screenSize = 'lg'
  } else if (width < BREAKPOINTS['2xl']) {
    screenSize = 'xl'
  } else {
    screenSize = '2xl'
  }

  // 屏幕方向
  const orientation = width > height ? 'landscape' : 'portrait'

  // 检测触摸设备
  const isTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    screenSize,
    orientation,
    isTouch
  }
}

/**
 * 使用媒体查询 Hook
 *
 * @param query 媒体查询字符串
 * @returns 是否匹配
 *
 * @example
 * ```tsx
 * const isSmallScreen = useMediaQuery('(max-width: 640px)')
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // 现代浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // 旧版浏览器
      mediaQuery.addListener(handleChange)
    }

    // 清理
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [query])

  return matches
}

/**
 * 使用视口高度 Hook (考虑移动端地址栏)
 *
 * @returns 视口高度 (px)
 *
 * @example
 * ```tsx
 * const viewportHeight = useViewportHeight()
 *
 * <div style={{ height: `${viewportHeight}px` }}>
 *   ...
 * </div>
 * ```
 */
export function useViewportHeight(): number {
  const [height, setHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight
    }
    return 0
  })

  useEffect(() => {
    const updateHeight = () => {
      // 使用 visualViewport 获取真实可见高度 (排除移动端工具栏)
      const vh = window.visualViewport?.height || window.innerHeight
      setHeight(vh)
    }

    updateHeight()

    window.addEventListener('resize', updateHeight)
    window.visualViewport?.addEventListener('resize', updateHeight)

    return () => {
      window.removeEventListener('resize', updateHeight)
      window.visualViewport?.removeEventListener('resize', updateHeight)
    }
  }, [])

  return height
}

/**
 * 使用安全区域 Hook (iOS notch)
 *
 * @returns 安全区域内边距
 *
 * @example
 * ```tsx
 * const safeArea = useSafeArea()
 *
 * <div style={{ paddingTop: safeArea.top }}>
 *   ...
 * </div>
 * ```
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  useEffect(() => {
    const updateSafeArea = () => {
      // 读取 CSS 环境变量
      const computedStyle = getComputedStyle(document.documentElement)

      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0')
      })
    }

    updateSafeArea()

    // 监听变化
    window.addEventListener('resize', updateSafeArea)
    window.addEventListener('orientationchange', updateSafeArea)

    return () => {
      window.removeEventListener('resize', updateSafeArea)
      window.removeEventListener('orientationchange', updateSafeArea)
    }
  }, [])

  return safeArea
}
