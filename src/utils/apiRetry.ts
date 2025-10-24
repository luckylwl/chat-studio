/**
 * API Retry and Rate Limiting Utilities
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  timeout?: number
  shouldRetry?: (error: Error, attempt: number) => boolean
}

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

/**
 * Exponential backoff retry wrapper
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    timeout = 60000,
    shouldRetry = () => true,
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )

      const result = await Promise.race([fn(), timeoutPromise])
      return result as T
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError
      }

      const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay)

      console.log(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms:`,
        lastError.message
      )

      await sleep(delay)
    }
  }

  throw lastError!
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private queue: Array<() => void> = []
  private running = 0
  private timestamps: number[] = []
  private maxRequests: number
  private windowMs: number
  private maxConcurrent: number

  constructor(options: RateLimitOptions & { maxConcurrent?: number }) {
    this.maxRequests = options.maxRequests
    this.windowMs = options.windowMs
    this.maxConcurrent = options.maxConcurrent || 1
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot()
    this.running++

    try {
      const result = await fn()
      this.timestamps.push(Date.now())
      return result
    } finally {
      this.running--
      this.processQueue()
    }
  }

  private waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const checkSlot = () => {
        this.cleanOldTimestamps()

        if (
          this.running < this.maxConcurrent &&
          this.timestamps.length < this.maxRequests
        ) {
          resolve()
        } else {
          this.queue.push(checkSlot)
        }
      }

      checkSlot()
    })
  }

  private cleanOldTimestamps(): void {
    const now = Date.now()
    this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs)
  }

  private processQueue(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()
      if (next) next()
    }
  }

  getQueueLength(): number {
    return this.queue.length
  }

  reset(): void {
    this.queue = []
    this.running = 0
    this.timestamps = []
  }
}

/**
 * Request deduplication
 */
export class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map()

  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>
    }

    const promise = fn()
      .finally(() => {
        this.pending.delete(key)
      })

    this.pending.set(key, promise)
    return promise
  }

  clear(): void {
    this.pending.clear()
  }
}

/**
 * API error types for better retry logic
 */
export const isRetryableError = (error: any): boolean => {
  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return true
  }

  // HTTP status codes that should retry
  if (error.response?.status) {
    const status = error.response.status
    return (
      status === 408 || // Request Timeout
      status === 429 || // Too Many Requests
      status === 500 || // Internal Server Error
      status === 502 || // Bad Gateway
      status === 503 || // Service Unavailable
      status === 504    // Gateway Timeout
    )
  }

  return false
}

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime: number | null = null
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime! > this.resetTimeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN'
    }
  }

  getState(): string {
    return this.state
  }

  reset(): void {
    this.failureCount = 0
    this.lastFailureTime = null
    this.state = 'CLOSED'
  }
}

/**
 * Example usage:
 *
 * // Retry with backoff
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data').then(r => r.json()),
 *   {
 *     maxRetries: 3,
 *     shouldRetry: (error) => isRetryableError(error)
 *   }
 * )
 *
 * // Rate limiting
 * const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 })
 * const result = await limiter.execute(() => fetch('/api/data'))
 *
 * // Circuit breaker
 * const breaker = new CircuitBreaker(5, 60000, 30000)
 * const result = await breaker.execute(() => fetch('/api/data'))
 */
