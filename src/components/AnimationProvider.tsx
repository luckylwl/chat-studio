import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAppStore } from '@/store'

interface AnimationContextType {
  isAnimationEnabled: boolean
  isReducedMotion: boolean
  animate: (element: HTMLElement, animation: string, options?: KeyframeAnimationOptions) => Animation | null
  fadeIn: (element: HTMLElement, duration?: number) => Animation | null
  slideIn: (element: HTMLElement, direction?: 'up' | 'down' | 'left' | 'right', duration?: number) => Animation | null
  scale: (element: HTMLElement, from?: number, to?: number, duration?: number) => Animation | null
  bounce: (element: HTMLElement, intensity?: number) => Animation | null
}

const AnimationContext = createContext<AnimationContextType | null>(null)

export const useAnimation = (): AnimationContextType => {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error('useAnimation must be used within AnimationProvider')
  }
  return context
}

interface AnimationProviderProps {
  children: React.ReactNode
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const { user } = useAppStore()
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  // Check for user's motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const isAnimationEnabled = user?.preferences?.enableAnimations !== false && !isReducedMotion

  const animate = (
    element: HTMLElement,
    animation: string,
    options: KeyframeAnimationOptions = {}
  ): Animation | null => {
    if (!isAnimationEnabled || !element) return null

    try {
      return element.animate(getAnimationKeyframes(animation), {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards',
        ...options
      })
    } catch (error) {
      console.warn('Animation failed:', error)
      return null
    }
  }

  const fadeIn = (element: HTMLElement, duration = 300): Animation | null => {
    if (!isAnimationEnabled || !element) return null

    return element.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration,
      easing: 'ease-out',
      fill: 'forwards'
    })
  }

  const slideIn = (
    element: HTMLElement,
    direction: 'up' | 'down' | 'left' | 'right' = 'up',
    duration = 300
  ): Animation | null => {
    if (!isAnimationEnabled || !element) return null

    const transforms = {
      up: ['translateY(20px)', 'translateY(0)'],
      down: ['translateY(-20px)', 'translateY(0)'],
      left: ['translateX(20px)', 'translateX(0)'],
      right: ['translateX(-20px)', 'translateX(0)']
    }

    return element.animate([
      {
        opacity: 0,
        transform: transforms[direction][0]
      },
      {
        opacity: 1,
        transform: transforms[direction][1]
      }
    ], {
      duration,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      fill: 'forwards'
    })
  }

  const scale = (
    element: HTMLElement,
    from = 0.9,
    to = 1,
    duration = 200
  ): Animation | null => {
    if (!isAnimationEnabled || !element) return null

    return element.animate([
      {
        opacity: 0,
        transform: `scale(${from})`
      },
      {
        opacity: 1,
        transform: `scale(${to})`
      }
    ], {
      duration,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards'
    })
  }

  const bounce = (element: HTMLElement, intensity = 1.1): Animation | null => {
    if (!isAnimationEnabled || !element) return null

    return element.animate([
      { transform: 'scale(1)' },
      { transform: `scale(${intensity})` },
      { transform: 'scale(1)' }
    ], {
      duration: 200,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    })
  }

  const value: AnimationContextType = {
    isAnimationEnabled,
    isReducedMotion,
    animate,
    fadeIn,
    slideIn,
    scale,
    bounce
  }

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  )
}

// 预定义动画关键帧
const getAnimationKeyframes = (animation: string): Keyframe[] => {
  const animations: Record<string, Keyframe[]> = {
    'fade-in': [
      { opacity: 0 },
      { opacity: 1 }
    ],
    'fade-out': [
      { opacity: 1 },
      { opacity: 0 }
    ],
    'slide-up': [
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    'slide-down': [
      { opacity: 0, transform: 'translateY(-20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    'slide-left': [
      { opacity: 0, transform: 'translateX(20px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ],
    'slide-right': [
      { opacity: 0, transform: 'translateX(-20px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ],
    'scale-in': [
      { opacity: 0, transform: 'scale(0.9)' },
      { opacity: 1, transform: 'scale(1)' }
    ],
    'scale-out': [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.9)' }
    ],
    'bounce': [
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(1)' }
    ],
    'shake': [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(0)' }
    ],
    'pulse': [
      { opacity: 1 },
      { opacity: 0.7 },
      { opacity: 1 }
    ],
    'flip': [
      { transform: 'rotateY(0deg)' },
      { transform: 'rotateY(180deg)' }
    ],
    'rotate': [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ]
  }

  return animations[animation] || [{ opacity: 0 }, { opacity: 1 }]
}

// 用于组件的动画装饰器Hook
export const useAnimatedMount = (
  animation: string = 'fade-in',
  dependencies: any[] = []
) => {
  const { animate, isAnimationEnabled } = useAnimation()
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (ref && isAnimationEnabled) {
      const anim = animate(ref, animation)
      return () => {
        if (anim) {
          anim.cancel()
        }
      }
    }
  }, [ref, animation, isAnimationEnabled, ...dependencies])

  return setRef
}

// 用于交互式动画的Hook
export const useHoverAnimation = (
  hoverAnimation: string = 'scale-in',
  leaveAnimation: string = 'scale-out'
) => {
  const { animate, isAnimationEnabled } = useAnimation()
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref || !isAnimationEnabled) return

    const handleMouseEnter = () => {
      animate(ref, hoverAnimation, { duration: 150 })
    }

    const handleMouseLeave = () => {
      animate(ref, leaveAnimation, { duration: 150 })
    }

    ref.addEventListener('mouseenter', handleMouseEnter)
    ref.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      ref.removeEventListener('mouseenter', handleMouseEnter)
      ref.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [ref, hoverAnimation, leaveAnimation, isAnimationEnabled])

  return setRef
}

// 用于点击反馈动画的Hook
export const useClickAnimation = (animation: string = 'bounce') => {
  const { animate, isAnimationEnabled } = useAnimation()
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref || !isAnimationEnabled) return

    const handleClick = () => {
      animate(ref, animation, { duration: 200 })
    }

    ref.addEventListener('click', handleClick)
    return () => {
      ref.removeEventListener('click', handleClick)
    }
  }, [ref, animation, isAnimationEnabled])

  return setRef
}

// 滚动触发动画的Hook
export const useScrollAnimation = (
  animation: string = 'slide-up',
  threshold: number = 0.1
) => {
  const { animate, isAnimationEnabled } = useAnimation()
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref || !isAnimationEnabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(ref, animation)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, animation, threshold, isAnimationEnabled])

  return setRef
}

export default AnimationProvider