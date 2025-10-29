import { useState, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
  onRetry?: (attempt: number, error: Error) => void
  onMaxRetriesReached?: (error: Error) => void
}

export interface RetryState {
  isRetrying: boolean
  retryCount: number
  lastError: Error | null
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2, // Exponential backoff
  retryableErrors: [
    'Network request failed',
    'Failed to fetch',
    'NetworkError',
    'timeout',
    'ECONNREFUSED',
    'ETIMEDOUT',
    '429', // Rate limit
    '500', // Server error
    '502', // Bad gateway
    '503', // Service unavailable
    '504'  // Gateway timeout
  ],
  onRetry: () => {},
  onMaxRetriesReached: () => {}
}

/**
 * 智能错误重试 Hook
 *
 * 特性:
 * - 指数退避算法
 * - 可配置重试条件
 * - 自动识别可重试错误
 * - 重试状态管理
 * - 进度通知
 *
 * @example
 * const { execute, isRetrying, retryCount } = useRetry({
 *   maxRetries: 3,
 *   initialDelay: 1000
 * })
 *
 * const fetchData = async () => {
 *   return execute(async () => {
 *     const response = await fetch('/api/data')
 *     if (!response.ok) throw new Error('Request failed')
 *     return response.json()
 *   })
 * }
 */
export const useRetry = <T = any>(options: RetryOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * 检查错误是否可重试
   */
  const isRetryableError = (error: Error): boolean => {
    const errorMessage = error.message.toLowerCase()
    return opts.retryableErrors.some(retryableError =>
      errorMessage.includes(retryableError.toLowerCase())
    )
  }

  /**
   * 计算重试延迟 (指数退避)
   */
  const calculateDelay = (attemptNumber: number): number => {
    const delay = opts.initialDelay * Math.pow(opts.backoffMultiplier, attemptNumber - 1)
    return Math.min(delay, opts.maxDelay)
  }

  /**
   * 延迟执行
   */
  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 执行带重试的异步函数
   */
  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T> => {
      // 创建新的 AbortController
      abortControllerRef.current = new AbortController()

      let lastError: Error | null = null
      let attemptNumber = 0

      while (attemptNumber < opts.maxRetries) {
        try {
          attemptNumber++

          setState({
            isRetrying: attemptNumber > 1,
            retryCount: attemptNumber - 1,
            lastError
          })

          // 如果是重试,先延迟
          if (attemptNumber > 1) {
            const delayMs = calculateDelay(attemptNumber - 1)

            // 显示重试通知
            toast.loading(
              `请求失败，${(delayMs / 1000).toFixed(1)}秒后重试 (${attemptNumber - 1}/${opts.maxRetries})`,
              { duration: delayMs, id: 'retry-toast' }
            )

            opts.onRetry(attemptNumber - 1, lastError!)

            await delay(delayMs)

            // 检查是否已取消
            if (abortControllerRef.current?.signal.aborted) {
              throw new Error('Request aborted')
            }
          }

          // 执行函数
          const result = await fn()

          // 成功 - 清除状态和通知
          setState({
            isRetrying: false,
            retryCount: 0,
            lastError: null
          })

          if (attemptNumber > 1) {
            toast.success('重试成功', { id: 'retry-toast' })
          }

          return result
        } catch (error) {
          lastError = error as Error

          // 检查是否应该重试
          if (!isRetryableError(lastError) || attemptNumber >= opts.maxRetries) {
            // 不可重试或已达最大重试次数
            break
          }
        }
      }

      // 所有重试都失败了
      setState({
        isRetrying: false,
        retryCount: opts.maxRetries,
        lastError: lastError
      })

      opts.onMaxRetriesReached(lastError!)

      toast.error(
        `请求失败: ${lastError?.message || '未知错误'} (已重试 ${opts.maxRetries} 次)`,
        { id: 'retry-toast' }
      )

      throw lastError
    },
    [opts.maxRetries, opts.initialDelay, opts.maxDelay, opts.backoffMultiplier]
  )

  /**
   * 取消重试
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setState({
        isRetrying: false,
        retryCount: 0,
        lastError: null
      })
      toast.dismiss('retry-toast')
      toast.info('已取消重试')
    }
  }, [])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null
    })
  }, [])

  return {
    execute,
    cancel,
    reset,
    ...state
  }
}

/**
 * 创建可重试的 fetch 函数
 */
export const useRetryFetch = (options: RetryOptions = {}) => {
  const retry = useRetry<Response>(options)

  const retryFetch = useCallback(
    async (url: string, init?: RequestInit): Promise<Response> => {
      return retry.execute(async () => {
        const response = await fetch(url, init)

        // 检查 HTTP 状态码
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return response
      })
    },
    [retry]
  )

  return {
    fetch: retryFetch,
    ...retry
  }
}

/**
 * 辅助函数:等待指定时间
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 辅助函数:带超时的 Promise
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ])
}

/**
 * 辅助函数:批量重试
 */
export const retryBatch = async <T>(
  tasks: (() => Promise<T>)[],
  options: RetryOptions = {}
): Promise<T[]> => {
  const results: T[] = []

  for (const task of tasks) {
    const retry = useRetry<T>(options)
    const result = await retry.execute(task)
    results.push(result)
  }

  return results
}

export default useRetry
