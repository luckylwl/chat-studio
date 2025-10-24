import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '../Toast'

describe('useToast', () => {
  it('creates a toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Test message')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('success')
    expect(result.current.toasts[0].message).toBe('Test message')
  })

  it('creates different toast types', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Success')
      result.current.error('Error')
      result.current.warning('Warning')
      result.current.info('Info')
    })

    expect(result.current.toasts).toHaveLength(4)
    expect(result.current.toasts[0].type).toBe('success')
    expect(result.current.toasts[1].type).toBe('error')
    expect(result.current.toasts[2].type).toBe('warning')
    expect(result.current.toasts[3].type).toBe('info')
  })

  it('closes a toast', () => {
    const { result } = renderHook(() => useToast())

    let toastId: string

    act(() => {
      toastId = result.current.success('Test')
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.closeToast(toastId!)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('supports custom description and action', () => {
    const { result } = renderHook(() => useToast())
    const mockAction = vi.fn()

    act(() => {
      result.current.success('Test', {
        description: 'Test description',
        action: {
          label: 'Undo',
          onClick: mockAction,
        },
      })
    })

    expect(result.current.toasts[0].description).toBe('Test description')
    expect(result.current.toasts[0].action?.label).toBe('Undo')
  })

  it('auto-closes toast after duration', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Test', { duration: 1000 })
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(1100)
    })

    expect(result.current.toasts).toHaveLength(0)

    vi.useRealTimers()
  })
})
