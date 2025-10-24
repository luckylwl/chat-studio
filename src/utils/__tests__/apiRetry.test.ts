import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  retryWithBackoff,
  RateLimiter,
  CircuitBreaker,
  RequestDeduplicator,
  isRetryableError,
} from '../apiRetry'

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('succeeds on first try', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')

    const result = await retryWithBackoff(mockFn, { maxRetries: 3 })

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and eventually succeeds', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success')

    const promise = retryWithBackoff(mockFn, {
      maxRetries: 3,
      initialDelay: 100,
    })

    // Advance timers for retries
    await vi.runAllTimersAsync()

    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('throws after max retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'))

    const promise = retryWithBackoff(mockFn, {
      maxRetries: 2,
      initialDelay: 100,
    })

    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('Always fails')
    expect(mockFn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('respects shouldRetry callback', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Non-retryable'))

    const shouldRetry = vi.fn().mockReturnValue(false)

    const promise = retryWithBackoff(mockFn, {
      maxRetries: 3,
      shouldRetry,
    })

    await expect(promise).rejects.toThrow('Non-retryable')
    expect(mockFn).toHaveBeenCalledTimes(1) // No retries
  })

  it('implements exponential backoff', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success')

    const delays: number[] = []
    const originalSetTimeout = global.setTimeout

    vi.spyOn(global, 'setTimeout').mockImplementation(((fn: any, delay: number) => {
      if (delay > 0) delays.push(delay)
      return originalSetTimeout(fn, 0)
    }) as any)

    const promise = retryWithBackoff(mockFn, {
      maxRetries: 3,
      initialDelay: 100,
      backoffFactor: 2,
    })

    await vi.runAllTimersAsync()
    await promise

    expect(delays[0]).toBe(100) // First retry
    expect(delays[1]).toBe(200) // Second retry (100 * 2)
  })
})

describe('RateLimiter', () => {
  it('allows requests within limit', async () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
    })

    const mockFn = vi.fn().mockResolvedValue('success')

    const results = await Promise.all([
      limiter.execute(mockFn),
      limiter.execute(mockFn),
      limiter.execute(mockFn),
    ])

    expect(results).toEqual(['success', 'success', 'success'])
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('queues requests exceeding limit', async () => {
    const limiter = new RateLimiter({
      maxRequests: 2,
      windowMs: 1000,
      maxConcurrent: 1,
    })

    const callTimes: number[] = []
    const mockFn = vi.fn().mockImplementation(async () => {
      callTimes.push(Date.now())
      await new Promise((resolve) => setTimeout(resolve, 100))
      return 'success'
    })

    const promises = [
      limiter.execute(mockFn),
      limiter.execute(mockFn),
      limiter.execute(mockFn),
    ]

    await Promise.all(promises)

    expect(mockFn).toHaveBeenCalledTimes(3)
    expect(limiter.getQueueLength()).toBe(0)
  })

  it('resets correctly', () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
    })

    limiter.reset()

    expect(limiter.getQueueLength()).toBe(0)
  })
})

describe('CircuitBreaker', () => {
  it('allows requests when circuit is closed', async () => {
    const breaker = new CircuitBreaker(3, 1000, 500)
    const mockFn = vi.fn().mockResolvedValue('success')

    const result = await breaker.execute(mockFn)

    expect(result).toBe('success')
    expect(breaker.getState()).toBe('CLOSED')
  })

  it('opens circuit after threshold failures', async () => {
    const breaker = new CircuitBreaker(2, 1000, 500)
    const mockFn = vi.fn().mockRejectedValue(new Error('Fail'))

    // Trigger failures
    await expect(breaker.execute(mockFn)).rejects.toThrow()
    await expect(breaker.execute(mockFn)).rejects.toThrow()

    expect(breaker.getState()).toBe('OPEN')

    // Next request should fail immediately
    await expect(breaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN')
    expect(mockFn).toHaveBeenCalledTimes(2) // Not called the third time
  })

  it('resets to closed on success', async () => {
    const breaker = new CircuitBreaker(3, 1000, 500)
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValue('success')

    await expect(breaker.execute(mockFn)).rejects.toThrow()
    expect(breaker.getState()).toBe('CLOSED') // Still closed, threshold not reached

    await breaker.execute(mockFn)
    expect(breaker.getState()).toBe('CLOSED')
  })
})

describe('RequestDeduplicator', () => {
  it('deduplicates concurrent requests', async () => {
    const deduplicator = new RequestDeduplicator()
    const mockFn = vi.fn().mockResolvedValue('result')

    const [result1, result2, result3] = await Promise.all([
      deduplicator.execute('key1', mockFn),
      deduplicator.execute('key1', mockFn),
      deduplicator.execute('key1', mockFn),
    ])

    expect(result1).toBe('result')
    expect(result2).toBe('result')
    expect(result3).toBe('result')
    expect(mockFn).toHaveBeenCalledTimes(1) // Only called once
  })

  it('allows different keys to execute separately', async () => {
    const deduplicator = new RequestDeduplicator()
    const mockFn = vi.fn().mockResolvedValue('result')

    await Promise.all([
      deduplicator.execute('key1', mockFn),
      deduplicator.execute('key2', mockFn),
    ])

    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('clears pending requests', () => {
    const deduplicator = new RequestDeduplicator()

    deduplicator.clear()

    // No error should occur
    expect(true).toBe(true)
  })
})

describe('isRetryableError', () => {
  it('identifies network errors', () => {
    const error = new Error('network error')
    expect(isRetryableError(error)).toBe(true)
  })

  it('identifies 429 rate limit', () => {
    const error = { response: { status: 429 } }
    expect(isRetryableError(error)).toBe(true)
  })

  it('identifies 500 server error', () => {
    const error = { response: { status: 500 } }
    expect(isRetryableError(error)).toBe(true)
  })

  it('identifies 503 service unavailable', () => {
    const error = { response: { status: 503 } }
    expect(isRetryableError(error)).toBe(true)
  })

  it('does not retry 400 bad request', () => {
    const error = { response: { status: 400 } }
    expect(isRetryableError(error)).toBe(false)
  })

  it('does not retry 404 not found', () => {
    const error = { response: { status: 404 } }
    expect(isRetryableError(error)).toBe(false)
  })
})
