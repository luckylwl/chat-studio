import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null }
  disconnect() { return null }
  unobserve() { return null }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null }
  disconnect() { return null }
  unobserve() { return null }
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn()
})

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0)
}

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id)
}

// Mock Web APIs that might not be available in test environment
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue('')
  }
})

// Mock getUserMedia for voice testing
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{
        stop: jest.fn()
      }]
    })
  }
})

// Mock speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn().mockReturnValue([]),
    speaking: false,
    pending: false,
    paused: false
  }
})

// Mock SpeechRecognition
global.SpeechRecognition = class SpeechRecognition {
  start = jest.fn()
  stop = jest.fn()
  abort = jest.fn()
  continuous = true
  interimResults = true
  onstart = null
  onend = null
  onresult = null
  onerror = null
} as any

global.webkitSpeechRecognition = global.SpeechRecognition

// Mock IndexedDB
const mockIDBRequest = {
  onsuccess: null,
  onerror: null,
  result: null,
  error: null
}

const mockIDBDatabase = {
  transaction: jest.fn().mockReturnValue({
    objectStore: jest.fn().mockReturnValue({
      add: jest.fn().mockReturnValue(mockIDBRequest),
      put: jest.fn().mockReturnValue(mockIDBRequest),
      get: jest.fn().mockReturnValue(mockIDBRequest),
      getAll: jest.fn().mockReturnValue(mockIDBRequest),
      delete: jest.fn().mockReturnValue(mockIDBRequest),
      clear: jest.fn().mockReturnValue(mockIDBRequest),
      count: jest.fn().mockReturnValue(mockIDBRequest),
      createIndex: jest.fn(),
      index: jest.fn().mockReturnValue({
        get: jest.fn().mockReturnValue(mockIDBRequest),
        getAll: jest.fn().mockReturnValue(mockIDBRequest)
      })
    })
  }),
  createObjectStore: jest.fn().mockReturnValue({
    createIndex: jest.fn()
  }),
  close: jest.fn()
}

Object.defineProperty(window, 'indexedDB', {
  value: {
    open: jest.fn().mockReturnValue({
      ...mockIDBRequest,
      result: mockIDBDatabase,
      onupgradeneeded: null
    }),
    deleteDatabase: jest.fn().mockReturnValue(mockIDBRequest)
  }
})

// Mock crypto for generating UUIDs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
    getRandomValues: jest.fn((arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  }
})

// Mock Notification API
global.Notification = class Notification {
  static permission = 'granted'
  static requestPermission = jest.fn().mockResolvedValue('granted')
  constructor(public title: string, public options?: NotificationOptions) {}
  close = jest.fn()
  onclick = null
  onclose = null
  onerror = null
  onshow = null
} as any

// Mock performance API for memory testing
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 10 * 1024 * 1024, // 10MB
    totalJSHeapSize: 20 * 1024 * 1024, // 20MB
    jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
  }
})

// Mock performance timing
Object.defineProperty(performance, 'timing', {
  value: {
    navigationStart: Date.now() - 1000,
    loadEventEnd: Date.now()
  }
})

// Mock URLPattern (for PWA routing)
global.URLPattern = class URLPattern {
  constructor(public pattern: string) {}
  test() { return true }
  exec() { return null }
} as any

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: {
        postMessage: jest.fn()
      },
      addEventListener: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined)
    }),
    ready: Promise.resolve({
      showNotification: jest.fn().mockResolvedValue(undefined),
      unregister: jest.fn().mockResolvedValue(true)
    }),
    controller: {
      postMessage: jest.fn()
    },
    addEventListener: jest.fn(),
    getRegistration: jest.fn().mockResolvedValue({
      waiting: {
        postMessage: jest.fn()
      }
    })
  }
})

// Mock Web Share API
Object.defineProperty(navigator, 'share', {
  value: jest.fn().mockResolvedValue(undefined)
})

// Mock Connection API
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  }
})

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('Warning: componentWillReceiveProps has been renamed'))
  ) {
    return
  }
  originalConsoleError.call(console, ...args)
}

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R
    }
  }
}

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      }
    }
  }
})

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()

  // Clear any timers
  jest.clearAllTimers()

  // Reset DOM
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})