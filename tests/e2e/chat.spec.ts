import { test, expect } from '@playwright/test'

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('should load the chat interface', async ({ page }) => {
    await expect(page).toHaveTitle(/AI Chat Studio/)
  })

  test('should create a new conversation', async ({ page }) => {
    // Click new conversation button
    await page.click('button:has-text("New Conversation")')

    // Verify new conversation is created
    await expect(page.locator('[data-testid="conversation-list"]')).toContainText('New Chat')
  })

  test('should send a message', async ({ page }) => {
    // Type a message
    const input = page.locator('[data-testid="chat-input"]')
    await input.fill('Hello, AI!')

    // Send message
    await page.click('button[type="submit"]')

    // Verify message appears
    await expect(page.locator('[data-testid="message"]').last()).toContainText('Hello, AI!')
  })

  test('should display loading state while waiting for response', async ({ page }) => {
    await page.locator('[data-testid="chat-input"]').fill('Test message')
    await page.click('button[type="submit"]')

    // Check for loading spinner
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
  })

  test('should handle empty state', async ({ page }) => {
    // Navigate to empty conversations
    await page.goto('http://localhost:5173/chat')

    // Verify empty state is shown
    await expect(page.locator('text=No conversations yet')).toBeVisible()
  })
})

test.describe('Settings', () => {
  test('should navigate to settings', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.click('[data-testid="settings-button"]')

    await expect(page).toHaveURL(/settings/)
  })

  test('should save API key', async ({ page }) => {
    await page.goto('http://localhost:5173/settings')

    // Fill API key
    await page.fill('[data-testid="api-key-input"]', 'sk-test-key-123')

    // Save
    await page.click('button:has-text("Save")')

    // Verify success toast
    await expect(page.locator('text=Settings saved')).toBeVisible()
  })
})

test.describe('Keyboard Shortcuts', () => {
  test('should open command palette with Ctrl+K', async ({ page }) => {
    await page.goto('http://localhost:5173')

    await page.keyboard.press('Control+K')

    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible()
  })

  test('should submit message with Ctrl+Enter', async ({ page }) => {
    await page.goto('http://localhost:5173/chat')

    await page.locator('[data-testid="chat-input"]').fill('Test message')
    await page.keyboard.press('Control+Enter')

    await expect(page.locator('[data-testid="message"]').last()).toContainText('Test message')
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:5173')

    // Check mobile menu
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
  })

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:5173')

    // Should show responsive layout
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible()
  })
})
