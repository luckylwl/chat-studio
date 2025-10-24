/**
 * Mock Service Worker Browser Setup
 */

import { setupWorker } from 'msw'
import { handlers } from './handlers'

// Setup MSW worker for browser
export const worker = setupWorker(...handlers)

// Start worker in development
export const startMockServer = () => {
  if (import.meta.env.DEV) {
    worker.start({
      onUnhandledRequest: 'bypass', // Don't warn for unhandled requests
    })
    console.log('🎭 Mock Service Worker started')
  }
}
