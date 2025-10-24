import { useEffect } from 'react'

/**
 * ESC 键关闭弹窗的 Hook
 */
export function useEscapeKey(callback: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [callback, enabled])
}