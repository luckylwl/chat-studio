import { test, expect } from '@playwright/test'

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to UI components demo page
    await page.goto('http://localhost:5173/demo/ui-components')
  })

  test('Toast notifications should work', async ({ page }) => {
    await page.click('button:has-text("Show Success")')
    await expect(page.locator('text=Success!')).toBeVisible()

    // Toast should auto-dismiss
    await page.waitForTimeout(6000)
    await expect(page.locator('text=Success!')).not.toBeVisible()
  })

  test('Modal should open and close', async ({ page }) => {
    await page.click('button:has-text("Open Modal")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // Close with button
    await page.click('button:has-text("Close")')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('Modal should close with Escape key', async ({ page }) => {
    await page.click('button:has-text("Open Modal")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('Progress bar should update', async ({ page }) => {
    await page.click('button:has-text("Simulate Upload")')

    // Check initial state
    const progressBar = page.locator('[role="progressbar"]')
    await expect(progressBar).toBeVisible()

    // Wait for completion
    await page.waitForTimeout(6000)
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })

  test('Form validation should work', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const submitButton = page.locator('button:has-text("Submit")')

    // Try submitting empty form
    await submitButton.click()
    await expect(page.locator('text=Email is required')).toBeVisible()

    // Enter invalid email
    await emailInput.fill('invalid-email')
    await emailInput.blur()
    await expect(page.locator('text=Invalid email')).toBeVisible()

    // Enter valid email
    await emailInput.fill('test@example.com')
    await emailInput.blur()
    await expect(page.locator('text=Invalid email')).not.toBeVisible()
  })

  test('Loading spinner should be visible', async ({ page }) => {
    await page.click('button:has-text("Simulate API Call")')
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()

    await page.waitForTimeout(2500)
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test('Tooltip should show on hover', async ({ page }) => {
    const button = page.locator('button:has-text("Hover for Tooltip")')
    await button.hover()

    await expect(page.locator('[role="tooltip"]')).toBeVisible()
    await expect(page.locator('text=This is a tooltip')).toBeVisible()
  })

  test('Confirm dialog should work', async ({ page }) => {
    await page.click('button:has-text("Delete Item")')

    await expect(page.locator('text=Delete item?')).toBeVisible()

    // Cancel
    await page.click('button:has-text("Cancel")')
    await expect(page.locator('text=Delete item?')).not.toBeVisible()

    // Confirm
    await page.click('button:has-text("Delete Item")')
    await page.click('button:has-text("Delete"):not(:has-text("Item"))')
    await expect(page.locator('text=Item deleted!')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:5173/demo/ui-components')

    // Check modal has correct ARIA attributes
    await page.click('button:has-text("Open Modal")')
    const dialog = page.locator('[role="dialog"]')

    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toHaveAttribute('aria-labelledby')
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/demo/ui-components')

    // Tab through elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should have focus trap in modal', async ({ page }) => {
    await page.goto('http://localhost:5173/demo/ui-components')

    await page.click('button:has-text("Open Modal")')

    // Tab should cycle within modal
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      const isInModal = await focused.evaluate((el) => {
        return el.closest('[role="dialog"]') !== null
      })
      expect(isInModal).toBe(true)
    }
  })
})
