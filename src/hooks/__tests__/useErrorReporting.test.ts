import { renderHook, act } from '@testing-library/react'
import { useErrorReporting, useComponentLifecycle, useUserInteractionTracking } from '../useErrorReporting'
import { crashReportingService } from '@/services/crashReportingService'

// Mock the crash reporting service
jest.mock('@/services/crashReportingService', () => ({
  crashReportingService: {
    reportError: jest.fn(),
    trackUserAction: jest.fn(),
    trackApiCall: jest.fn(),
    reportPerformanceMetric: jest.fn()
  }
}))

const mockCrashReportingService = crashReportingService as jest.Mocked<typeof crashReportingService>

describe('useErrorReporting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock performance.now()
    Object.defineProperty(performance, 'now', {
      writable: true,
      value: jest.fn(() => 1000)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('initializes with default options', () => {
    const { result } = renderHook(() => useErrorReporting())

    expect(result.current).toHaveProperty('reportError')
    expect(result.current).toHaveProperty('trackUserAction')
    expect(result.current).toHaveProperty('trackApiCall')
    expect(result.current).toHaveProperty('trackRenderPerformance')
  })

  it('tracks page load performance when enabled', () => {
    Object.defineProperty(document, 'readyState', {
      writable: true,
      value: 'complete'
    })

    renderHook(() => useErrorReporting({ enablePerformanceTracking: true }))

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'pageLoad',
      expect.any(Object)
    )
  })

  it('does not track performance when disabled', () => {
    renderHook(() => useErrorReporting({ enablePerformanceTracking: false }))

    expect(mockCrashReportingService.trackUserAction).not.toHaveBeenCalled()
  })

  it('reports custom errors correctly', () => {
    const { result } = renderHook(() => useErrorReporting({
      userId: 'test-user',
      context: { page: 'test-page' }
    }))

    const testError = new Error('Test error')
    const errorInfo = { componentStack: 'TestComponent' }

    act(() => {
      result.current.reportError(testError, errorInfo)
    })

    expect(mockCrashReportingService.reportError).toHaveBeenCalledWith({
      errorId: expect.stringMatching(/^manual_\d+_[a-z0-9]+$/),
      level: 'component',
      message: 'Test error',
      stack: testError.stack,
      timestamp: expect.any(String),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'test-user',
      buildVersion: expect.any(String),
      additionalInfo: {
        context: { page: 'test-page' },
        errorInfo,
        type: 'manual-report'
      }
    })
  })

  it('tracks user actions with context', () => {
    const { result } = renderHook(() => useErrorReporting({
      userId: 'test-user',
      context: { feature: 'chat' }
    }))

    act(() => {
      result.current.trackUserAction('button_click', { buttonId: 'send-message' })
    })

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'button_click',
      {
        buttonId: 'send-message',
        context: { feature: 'chat' },
        userId: 'test-user'
      }
    )
  })

  it('tracks API calls correctly', () => {
    const { result } = renderHook(() => useErrorReporting())

    act(() => {
      result.current.trackApiCall('/api/chat', 250, true, { model: 'gpt-3.5-turbo' })
    })

    expect(mockCrashReportingService.trackApiCall).toHaveBeenCalledWith(
      '/api/chat',
      250,
      true
    )
  })

  it('tracks render performance', () => {
    const { result } = renderHook(() => useErrorReporting({
      context: { component: 'ChatMessage' }
    }))

    act(() => {
      result.current.trackRenderPerformance('ChatMessage', 15.5)
    })

    expect(mockCrashReportingService.reportPerformanceMetric).toHaveBeenCalledWith(
      'componentRender',
      {
        component: 'ChatMessage',
        renderTime: 15.5,
        context: { component: 'ChatMessage' },
        timestamp: expect.any(String)
      }
    )
  })
})

describe('useComponentLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(performance.now as jest.Mock).mockReturnValue(1000)
  })

  it('tracks component mount and unmount', () => {
    const { unmount } = renderHook(() => useComponentLifecycle('TestComponent'))

    // Should track mount
    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'component_mount',
      {
        componentName: 'TestComponent',
        mountTime: 1000
      }
    )

    // Mock time passage
    ;(performance.now as jest.Mock).mockReturnValue(2000)

    unmount()

    // Should track unmount with lifetime
    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'component_unmount',
      {
        componentName: 'TestComponent',
        unmountTime: 2000,
        lifetime: 1000
      }
    )
  })

  it('tracks different component names separately', () => {
    const { unmount: unmount1 } = renderHook(() => useComponentLifecycle('Component1'))
    const { unmount: unmount2 } = renderHook(() => useComponentLifecycle('Component2'))

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'component_mount',
      expect.objectContaining({ componentName: 'Component1' })
    )

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'component_mount',
      expect.objectContaining({ componentName: 'Component2' })
    )

    unmount1()
    unmount2()

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledTimes(4) // 2 mounts + 2 unmounts
  })
})

describe('useUserInteractionTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks click interactions', () => {
    const { result } = renderHook(() => useUserInteractionTracking())

    act(() => {
      result.current.trackClick('send-button', 'button', { location: 'chat-input' })
    })

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'click',
      {
        elementId: 'send-button',
        elementType: 'button',
        location: 'chat-input'
      }
    )
  })

  it('tracks input interactions', () => {
    const { result } = renderHook(() => useUserInteractionTracking())

    act(() => {
      result.current.trackInput('message-input', 'textarea', 'Hello, AI!')
    })

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'input',
      {
        inputId: 'message-input',
        inputType: 'textarea',
        valueLength: 10
      }
    )
  })

  it('tracks navigation events', () => {
    const { result } = renderHook(() => useUserInteractionTracking())

    act(() => {
      result.current.trackNavigation('/chat', '/settings')
    })

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'navigation',
      {
        from: '/chat',
        to: '/settings',
        timestamp: expect.any(String)
      }
    )
  })

  it('tracks feature usage', () => {
    const { result } = renderHook(() => useUserInteractionTracking())

    act(() => {
      result.current.trackFeatureUsage('voice-input', {
        duration: 5000,
        successful: true
      })
    })

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'feature_usage',
      {
        featureName: 'voice-input',
        duration: 5000,
        successful: true
      }
    )
  })

  it('handles missing parameters gracefully', () => {
    const { result } = renderHook(() => useUserInteractionTracking())

    act(() => {
      result.current.trackClick('button-id')
      result.current.trackInput('input-id')
    })

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'click',
      {
        elementId: 'button-id',
        elementType: undefined
      }
    )

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'input',
      {
        inputId: 'input-id',
        inputType: undefined,
        valueLength: 0
      }
    )
  })
})

describe('Error Reporting Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('includes proper error context', () => {
    const { result } = renderHook(() => useErrorReporting({
      userId: 'user-123',
      context: {
        page: 'chat',
        feature: 'message-sending',
        sessionId: 'session-456'
      }
    }))

    const error = new Error('API request failed')
    const errorInfo = {
      componentStack: 'ChatInput > MessageForm',
      requestId: 'req-789'
    }

    act(() => {
      result.current.reportError(error, errorInfo)
    })

    const reportCall = mockCrashReportingService.reportError.mock.calls[0][0]

    expect(reportCall).toEqual({
      errorId: expect.any(String),
      level: 'component',
      message: 'API request failed',
      stack: error.stack,
      timestamp: expect.any(String),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'user-123',
      buildVersion: expect.any(String),
      additionalInfo: {
        context: {
          page: 'chat',
          feature: 'message-sending',
          sessionId: 'session-456'
        },
        errorInfo: {
          componentStack: 'ChatInput > MessageForm',
          requestId: 'req-789'
        },
        type: 'manual-report'
      }
    })
  })

  it('handles errors without stack traces', () => {
    const { result } = renderHook(() => useErrorReporting())

    const errorWithoutStack = {
      name: 'CustomError',
      message: 'Something went wrong'
    } as Error

    act(() => {
      result.current.reportError(errorWithoutStack)
    })

    expect(mockCrashReportingService.reportError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Something went wrong',
        stack: undefined
      })
    )
  })

  it('generates unique error IDs', () => {
    const { result } = renderHook(() => useErrorReporting())

    const error = new Error('Test error')

    act(() => {
      result.current.reportError(error)
    })

    act(() => {
      result.current.reportError(error)
    })

    const calls = mockCrashReportingService.reportError.mock.calls
    const errorId1 = calls[0][0].errorId
    const errorId2 = calls[1][0].errorId

    expect(errorId1).not.toBe(errorId2)
    expect(errorId1).toMatch(/^manual_\d+_[a-z0-9]+$/)
    expect(errorId2).toMatch(/^manual_\d+_[a-z0-9]+$/)
  })
})

describe('Performance Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window.addEventListener
    jest.spyOn(window, 'addEventListener')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sets up page load tracking correctly', () => {
    Object.defineProperty(document, 'readyState', {
      writable: true,
      value: 'loading'
    })

    renderHook(() => useErrorReporting({ enablePerformanceTracking: true }))

    expect(window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function))
  })

  it('tracks page load when document is already complete', () => {
    Object.defineProperty(document, 'readyState', {
      writable: true,
      value: 'complete'
    })

    renderHook(() => useErrorReporting({ enablePerformanceTracking: true }))

    expect(mockCrashReportingService.trackUserAction).toHaveBeenCalledWith(
      'pageLoad',
      expect.objectContaining({
        loadTime: expect.any(Number)
      })
    )
  })

  it('cleans up event listeners on unmount', () => {
    jest.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useErrorReporting({ enablePerformanceTracking: true }))

    unmount()

    expect(window.removeEventListener).toHaveBeenCalledWith('load', expect.any(Function))
  })
})