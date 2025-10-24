import { useEffect, useRef } from 'react'

/**
 * 点击外部区域关闭弹窗的 Hook
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  enabled: boolean = true
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    }

    // 延迟添加事件监听器，避免立即触发
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [callback, enabled])

  return ref
}