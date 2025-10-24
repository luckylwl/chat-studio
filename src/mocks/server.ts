/**
 * Mock Service Worker Server Setup (for Node.js testing)
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup MSW server for Node.js (tests)
export const server = setupServer(...handlers)

// Establish API mocking before all tests
export const startMockServer = () => {
  server.listen({ onUnhandledRequest: 'bypass' })
  console.log('🎭 Mock Service Worker (Server) started')
}

// Reset handlers after each test
export const resetMockServer = () => {
  server.resetHandlers()
}

// Clean up after all tests
export const stopMockServer = () => {
  server.close()
}
