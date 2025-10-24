import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'

// Mock data and fixtures
export const mockConversation = {
  id: 'test-conv-1',
  title: 'Test Conversation',
  messages: [],
  model: 'gpt-3.5-turbo',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  settings: {
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 1000
  }
}

export const mockMessage = {
  id: 'test-msg-1',
  conversationId: 'test-conv-1',
  role: 'user' as const,
  content: 'Hello, AI!',
  timestamp: Date.now()
}

export const mockAIMessage = {
  id: 'test-msg-2',
  conversationId: 'test-conv-1',
  role: 'assistant' as const,
  content: 'Hello! How can I help you today?',
  timestamp: Date.now()
}

export const mockUser = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  preferences: {
    theme: 'light',
    language: 'en'
  }
}

// Test providers wrapper
interface TestProvidersProps {
  children: React.ReactNode
  initialEntries?: string[]
  queryClient?: QueryClient
}

const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  initialEntries = ['/'],
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries, queryClient, ...renderOptions } = options

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProviders initialEntries={initialEntries} queryClient={queryClient}>
      {children}
    </TestProviders>
  )

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}

// Mock API responses
export const mockApiResponses = {
  chat: {
    success: {
      id: 'response-1',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-3.5-turbo',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a test response from the AI.'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25
      }
    },
    error: {
      error: {
        message: 'Invalid API key',
        type: 'invalid_request_error',
        code: 'invalid_api_key'
      }
    }
  },
  conversations: {
    list: [mockConversation],
    create: mockConversation,
    update: { ...mockConversation, title: 'Updated Conversation' },
    delete: { success: true }
  }
}

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void): Promise<number> => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

export const measureRenderTime = (component: React.ReactElement): Promise<number> => {
  return new Promise((resolve) => {
    const start = performance.now()

    const { unmount } = renderWithProviders(component)

    // Use setTimeout to measure after render
    setTimeout(() => {
      const end = performance.now()
      unmount()
      resolve(end - start)
    }, 0)
  })
}

// Accessibility testing helpers
export const getAccessibilityViolations = async (container: HTMLElement) => {
  const { axe } = await import('@axe-core/react')
  return axe(container)
}

// Memory leak detection
export const detectMemoryLeaks = (testFn: () => void, iterations = 100): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!('memory' in performance)) {
      console.warn('Memory API not available, skipping memory leak test')
      resolve(false)
      return
    }

    const initialMemory = (performance as any).memory.usedJSHeapSize

    // Run test multiple times
    for (let i = 0; i < iterations; i++) {
      testFn()
    }

    // Force garbage collection (if available)
    if ('gc' in window) {
      (window as any).gc()
    }

    setTimeout(() => {
      const finalMemory = (performance as any).memory.usedJSHeapSize
      const memoryIncrease = finalMemory - initialMemory
      const threshold = 1024 * 1024 // 1MB threshold

      console.log(`Memory increase: ${memoryIncrease / 1024}KB`)
      resolve(memoryIncrease > threshold)
    }, 1000)
  })
}

// Visual regression testing utilities
export const captureScreenshot = async (element: HTMLElement): Promise<string> => {
  // This would integrate with actual screenshot tools in a real implementation
  return `screenshot-${Date.now()}.png`
}

export const compareScreenshots = (baseline: string, current: string): Promise<boolean> => {
  // This would integrate with image comparison tools
  return Promise.resolve(baseline === current)
}

// Network mocking utilities
export const mockNetworkRequest = (url: string, response: any, delay = 0) => {
  const originalFetch = window.fetch

  window.fetch = jest.fn().mockImplementation((requestUrl: string) => {
    if (requestUrl.includes(url)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => new Promise(resolve =>
          setTimeout(() => resolve(response), delay)
        )
      })
    }
    return originalFetch(requestUrl)
  })

  return () => {
    window.fetch = originalFetch
  }
}

export const mockNetworkError = (url: string, error = new Error('Network error')) => {
  const originalFetch = window.fetch

  window.fetch = jest.fn().mockImplementation((requestUrl: string) => {
    if (requestUrl.includes(url)) {
      return Promise.reject(error)
    }
    return originalFetch(requestUrl)
  })

  return () => {
    window.fetch = originalFetch
  }
}

// Storage mocking
export const mockLocalStorage = () => {
  const storage: { [key: string]: string } = {}

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => storage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        storage[key] = value
      }),
      removeItem: jest.fn((key: string) => {
        delete storage[key]
      }),
      clear: jest.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key])
      }),
      get length() {
        return Object.keys(storage).length
      },
      key: jest.fn((index: number) => {
        const keys = Object.keys(storage)
        return keys[index] || null
      })
    },
    writable: true
  })

  return storage
}

// IndexedDB mocking
export const mockIndexedDB = () => {
  const databases: { [name: string]: any } = {}

  Object.defineProperty(window, 'indexedDB', {
    value: {
      open: jest.fn((name: string, version: number) => {
        return Promise.resolve({
          result: {
            name,
            version,
            objectStoreNames: [],
            transaction: jest.fn(),
            close: jest.fn()
          }
        })
      }),
      deleteDatabase: jest.fn((name: string) => {
        delete databases[name]
        return Promise.resolve()
      })
    },
    writable: true
  })

  return databases
}

// Component testing utilities
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react')
  // Wait for any loading spinners to disappear
  await waitForElementToBeRemoved(() => document.querySelector('[data-testid="loading"]'))
}

export const triggerResize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  })

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  })

  window.dispatchEvent(new Event('resize'))
}

// Error boundary testing
export const ErrorThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Test data generators
export const generateMockConversations = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockConversation,
    id: `test-conv-${i + 1}`,
    title: `Test Conversation ${i + 1}`,
    createdAt: Date.now() - (i * 1000 * 60 * 60) // Each conversation is 1 hour older
  }))
}

export const generateMockMessages = (conversationId: string, count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `test-msg-${i + 1}`,
    conversationId,
    role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
    content: i % 2 === 0 ? `User message ${i + 1}` : `Assistant response ${i + 1}`,
    timestamp: Date.now() + (i * 1000 * 60) // Each message is 1 minute later
  }))
}

// Export everything
export * from '@testing-library/react'
export { userEvent }
export default {
  renderWithProviders,
  mockApiResponses,
  measurePerformance,
  measureRenderTime,
  detectMemoryLeaks,
  mockNetworkRequest,
  mockNetworkError,
  mockLocalStorage,
  mockIndexedDB,
  waitForLoadingToFinish,
  triggerResize,
  ErrorThrowingComponent,
  generateMockConversations,
  generateMockMessages
}