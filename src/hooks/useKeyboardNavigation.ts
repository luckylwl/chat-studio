import { useEffect, useRef, useCallback } from 'react'

export interface KeyboardNavigationOptions {
  onEnter?: () => void
  onEscape?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
  onShiftTab?: () => void
  enabled?: boolean
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions) => {
  const {
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    enabled = true,
  } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          if (onEnter) {
            e.preventDefault()
            onEnter()
          }
          break
        case 'Escape':
          if (onEscape) {
            e.preventDefault()
            onEscape()
          }
          break
        case 'ArrowUp':
          if (onArrowUp) {
            e.preventDefault()
            onArrowUp()
          }
          break
        case 'ArrowDown':
          if (onArrowDown) {
            e.preventDefault()
            onArrowDown()
          }
          break
        case 'ArrowLeft':
          if (onArrowLeft) {
            e.preventDefault()
            onArrowLeft()
          }
          break
        case 'ArrowRight':
          if (onArrowRight) {
            e.preventDefault()
            onArrowRight()
          }
          break
        case 'Tab':
          if (e.shiftKey && onShiftTab) {
            e.preventDefault()
            onShiftTab()
          } else if (onTab) {
            e.preventDefault()
            onTab()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onShiftTab])
}

// Hook for managing focus trap (useful in modals)
export const useFocusTrap = (enabled: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element when trap activates
    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [enabled])

  return containerRef
}

// Hook for list keyboard navigation
export const useListNavigation = <T,>(
  items: T[],
  options: {
    initialIndex?: number
    onSelect?: (item: T, index: number) => void
    loop?: boolean
  } = {}
) => {
  const { initialIndex = 0, onSelect, loop = true } = options
  const [selectedIndex, setSelectedIndex] = React.useState(initialIndex)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
          e.preventDefault()
          setSelectedIndex((prev) => {
            const next = prev + 1
            if (next >= items.length) {
              return loop ? 0 : prev
            }
            return next
          })
          break

        case 'ArrowUp':
        case 'Up':
          e.preventDefault()
          setSelectedIndex((prev) => {
            const next = prev - 1
            if (next < 0) {
              return loop ? items.length - 1 : prev
            }
            return next
          })
          break

        case 'Home':
          e.preventDefault()
          setSelectedIndex(0)
          break

        case 'End':
          e.preventDefault()
          setSelectedIndex(items.length - 1)
          break

        case 'Enter':
        case ' ':
          e.preventDefault()
          if (onSelect && items[selectedIndex]) {
            onSelect(items[selectedIndex], selectedIndex)
          }
          break
      }
    },
    [items, selectedIndex, onSelect, loop]
  )

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    selectedItem: items[selectedIndex],
  }
}

// React import for useState
import React from 'react'
