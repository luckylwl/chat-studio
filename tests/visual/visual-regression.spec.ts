/**
 * Visual Regression Tests
 * Captures screenshots and compares them against baseline images
 */

import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('homepage appearance', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('chat interface appearance', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click new conversation
    await page.click('button:has-text("New Conversation")')

    // Wait for chat interface
    await page.waitForSelector('[data-testid="chat-interface"]')

    await expect(page).toHaveScreenshot('chat-interface.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('settings page appearance', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open settings
    await page.click('[aria-label="Settings"]')

    // Wait for settings modal
    await page.waitForSelector('[data-testid="settings-modal"]')

    await expect(page).toHaveScreenshot('settings-page.png', {
      animations: 'disabled',
    })
  })

  test('dark mode appearance', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Toggle dark mode
    await page.click('[aria-label="Settings"]')
    await page.waitForSelector('[data-testid="settings-modal"]')
    await page.click('button:has-text("Dark")')

    await page.click('[aria-label="Close"]')

    await expect(page).toHaveScreenshot('dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('mobile viewport appearance', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('tablet viewport appearance', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('tablet-homepage.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('error state appearance', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Trigger error by sending message without API key
    await page.click('button:has-text("New Conversation")')
    await page.fill('[placeholder="Type your message..."]', 'Test message')
    await page.press('[placeholder="Type your message..."]', 'Enter')

    // Wait for error message
    await page.waitForSelector('[data-testid="error-message"]')

    await expect(page).toHaveScreenshot('error-state.png', {
      animations: 'disabled',
    })
  })

  test('loading state appearance', async ({ page }) => {
    await page.goto('/')

    // Capture loading state
    await expect(page).toHaveScreenshot('loading-state.png', {
      animations: 'disabled',
    })
  })

  test('empty conversation list', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Clear all conversations
    await page.evaluate(() => {
      localStorage.clear()
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('empty-conversations.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('conversation with multiple messages', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Load demo conversation
    const demoConversation = page.locator('text=Learning React Basics').first()
    if (await demoConversation.isVisible()) {
      await demoConversation.click()

      await expect(page).toHaveScreenshot('conversation-with-messages.png', {
        fullPage: true,
        animations: 'disabled',
      })
    }
  })
})

test.describe('Component Visual Tests', () => {
  test('button states', async ({ page }) => {
    await page.goto('/') // Assuming component showcase page

    await expect(page.locator('[data-testid="button-showcase"]')).toHaveScreenshot(
      'button-states.png',
      {
        animations: 'disabled',
      }
    )
  })

  test('form fields', async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="Settings"]')

    await expect(page.locator('[data-testid="api-settings"]')).toHaveScreenshot(
      'form-fields.png',
      {
        animations: 'disabled',
      }
    )
  })

  test('toast notifications', async ({ page }) => {
    await page.goto('/')

    // Trigger success toast
    await page.evaluate(() => {
      const event = new CustomEvent('show-toast', {
        detail: { type: 'success', message: 'Test success message' },
      })
      window.dispatchEvent(event)
    })

    await page.waitForSelector('text=Test success message')

    await expect(page).toHaveScreenshot('toast-success.png', {
      animations: 'disabled',
    })
  })
})

test.describe('Cross-browser Visual Tests', () => {
  test('firefox homepage', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox only test')

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('firefox-homepage.png', {
      fullPage: true,
    })
  })

  test('webkit homepage', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'WebKit only test')

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('webkit-homepage.png', {
      fullPage: true,
    })
  })
})
