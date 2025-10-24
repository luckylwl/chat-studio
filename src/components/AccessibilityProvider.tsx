import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import { cn } from '@/utils'

interface AccessibilitySettings {
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large' | 'xl'
  reduceMotion: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  focusIndicator: boolean
  colorBlindFriendly: boolean
  announcements: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSettings: (settings: Partial<AccessibilitySettings>) => void
  announceToScreenReader: (message: string) => void
  focusElement: (selector: string) => void
  setFocusVisible: (visible: boolean) => void
  isFocusVisible: boolean
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const { user, updateUser } = useAppStore()
  const [isFocusVisible, setIsFocusVisible] = useState(false)

  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: user?.preferences?.accessibility?.highContrast || false,
    fontSize: user?.preferences?.accessibility?.fontSize || 'medium',
    reduceMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicator: true,
    colorBlindFriendly: false,
    announcements: true
  })

  // Detect system preferences
  useEffect(() => {
    const mediaQueries = {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)')
    }

    const updateFromSystem = () => {
      setSettings(prev => ({
        ...prev,
        reduceMotion: mediaQueries.reduceMotion.matches,
        highContrast: prev.highContrast || mediaQueries.highContrast.matches
      }))
    }

    updateFromSystem()

    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updateFromSystem)
    })

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updateFromSystem)
      })
    }
  }, [])

  // Apply accessibility styles
  useEffect(() => {
    const root = document.documentElement

    // Font size
    const fontSizeMap = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      xl: '1.25rem'
    }
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize])

    // High contrast
    if (settings.highContrast) {
      root.classList.add('accessibility-high-contrast')
    } else {
      root.classList.remove('accessibility-high-contrast')
    }

    // Color blind friendly
    if (settings.colorBlindFriendly) {
      root.classList.add('accessibility-colorblind-friendly')
    } else {
      root.classList.remove('accessibility-colorblind-friendly')
    }

    // Reduce motion
    if (settings.reduceMotion) {
      root.classList.add('accessibility-reduce-motion')
    } else {
      root.classList.remove('accessibility-reduce-motion')
    }

    // Focus indicator
    if (settings.focusIndicator) {
      root.classList.add('accessibility-focus-indicator')
    } else {
      root.classList.remove('accessibility-focus-indicator')
    }
  }, [settings])

  // Keyboard navigation detection
  useEffect(() => {
    let isUsingKeyboard = false

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true
        setIsFocusVisible(true)
      }
    }

    const handleMouseDown = () => {
      isUsingKeyboard = false
      setIsFocusVisible(false)
    }

    const handleFocus = () => {
      if (isUsingKeyboard) {
        setIsFocusVisible(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('focusin', handleFocus)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('focusin', handleFocus)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!settings.keyboardNavigation) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip content (for screen readers)
      if (e.key === 's' && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        const mainContent = document.querySelector('main')
        if (mainContent) {
          (mainContent as HTMLElement).focus()
          announceToScreenReader('跳转到主要内容')
        }
      }

      // Focus search
      if (e.key === 'f' && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        const searchInput = document.querySelector('[role="search"] input')
        if (searchInput) {
          (searchInput as HTMLElement).focus()
          announceToScreenReader('聚焦搜索框')
        }
      }

      // Open settings
      if (e.key === ',' && e.ctrlKey) {
        e.preventDefault()
        const settingsButton = document.querySelector('[aria-label*="设置"]')
        if (settingsButton) {
          (settingsButton as HTMLElement).click()
          announceToScreenReader('打开设置')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [settings.keyboardNavigation])

  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }

      // Update user preferences
      updateUser({
        preferences: {
          ...user?.preferences,
          accessibility: {
            ...user?.preferences?.accessibility,
            ...newSettings
          }
        }
      })

      return updated
    })
  }, [user, updateUser])

  const announceToScreenReader = useCallback((message: string) => {
    if (!settings.announcements) return

    // Create or update live region
    let liveRegion = document.getElementById('accessibility-announcements')
    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'accessibility-announcements'
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
    }

    // Clear and announce
    liveRegion.textContent = ''
    setTimeout(() => {
      liveRegion!.textContent = message
    }, 100)
  }, [settings.announcements])

  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      if (settings.announcements) {
        const label = element.getAttribute('aria-label') ||
                     element.getAttribute('title') ||
                     element.textContent ||
                     '未知元素'
        announceToScreenReader(`聚焦到 ${label}`)
      }
    }
  }, [settings.announcements, announceToScreenReader])

  const setFocusVisible = useCallback((visible: boolean) => {
    setIsFocusVisible(visible)
  }, [])

  const value: AccessibilityContextType = {
    settings,
    updateSettings,
    announceToScreenReader,
    focusElement,
    setFocusVisible,
    isFocusVisible
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

// Accessible Button Component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
  description?: string
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = '加载中',
  description,
  className,
  disabled,
  ...props
}) => {
  const { settings, isFocusVisible, announceToScreenReader } = useAccessibility()

  const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none"

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
  }

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm min-h-[32px]",
    md: "px-4 py-2 text-sm min-h-[40px]",
    lg: "px-6 py-3 text-base min-h-[48px]"
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) return

    if (settings.announcements && description) {
      announceToScreenReader(description)
    }

    props.onClick?.(e)
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        loading && "cursor-not-allowed opacity-75",
        disabled && "cursor-not-allowed opacity-50",
        settings.highContrast && "border-2 border-current",
        isFocusVisible && "ring-2 ring-offset-2",
        className
      )}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-describedby={description ? `${props.id}-description` : undefined}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="sr-only">{loadingText}</span>
        </div>
      )}
      <span className={loading ? "invisible" : ""}>{children}</span>
      {description && (
        <span id={`${props.id}-description`} className="sr-only">
          {description}
        </span>
      )}
    </button>
  )
}

// Skip Link Component
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {children}
    </a>
  )
}

// Screen Reader Only Component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span className="sr-only">{children}</span>
}

// Focus Trap Component
interface FocusTrapProps {
  children: React.ReactNode
  active: boolean
  className?: string
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, active, className }) => {
  const containerRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    const container = containerRef.current
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Focus first element
    firstElement.focus()

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

export default {
  AccessibilityProvider,
  AccessibleButton,
  SkipLink,
  ScreenReaderOnly,
  FocusTrap,
  useAccessibility
}