import { useRef, useCallback, useEffect, useState } from 'react'
import { AIApiServiceEnhanced } from '@/services/aiApi.enhanced'

/**
 * 管理 AI API 请求的 Hook
 * 提供请求取消、自动清理等功能
 */
export function useAIRequest() {
  const apiServiceRef = useRef<AIApiServiceEnhanced | null>(null)
  const requestIdRef = useRef<string | null>(null)

  // 设置 API 服务
  const setApiService = useCallback((service: AIApiServiceEnhanced) => {
    apiServiceRef.current = service
  }, [])

  // 取消当前请求
  const cancelRequest = useCallback(() => {
    if (apiServiceRef.current) {
      apiServiceRef.current.cancel()
      requestIdRef.current = null
    }
  }, [])

  // 发送请求
  const sendRequest = useCallback(async (
    requestFn: (service: AIApiServiceEnhanced) => Promise<any>,
    requestId?: string
  ) => {
    if (!apiServiceRef.current) {
      throw new Error('API service not initialized')
    }

    // 如果有新的请求ID,取消之前的请求
    if (requestId && requestId !== requestIdRef.current) {
      cancelRequest()
      requestIdRef.current = requestId
    }

    try {
      const result = await requestFn(apiServiceRef.current)
      return result
    } catch (error) {
      // 如果是取消错误,静默处理
      if (error instanceof Error && error.message === '请求已取消') {
        return null
      }
      throw error
    }
  }, [cancelRequest])

  // 组件卸载时自动取消请求
  useEffect(() => {
    return () => {
      cancelRequest()
    }
  }, [cancelRequest])

  return {
    setApiService,
    sendRequest,
    cancelRequest
  }
}

/**
 * 防抖 Hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 节流 Hook
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now()
      if (now - lastRun.current >= delay) {
        lastRun.current = now
        return callback(...args)
      }
    }) as T,
    [callback, delay]
  )
}
