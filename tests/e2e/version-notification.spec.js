import { test, expect } from '@playwright/test'

/**
 * Version notification end-to-end tests
 * Tests the app's version update notification system
 */
test.describe('Version Notification', () => {
  test('should show toast with changelog link when version changes', async ({ page }) => {
    // Set old version in localStorage before page loads
    await page.addInitScript(() => {
      localStorage.setItem('lastSeenVersion', '0.0.0')
    })

    await page.goto('/')

    // Toast should appear
    await page.waitForSelector('.toast', { timeout: 3000 })

    // Should contain version update message
    await expect(page.locator('.toast')).toContainText('New version available')

    // Check link attributes
    const link = page.locator('.toast a')
    await expect(link).toHaveAttribute(
      'href',
      'https://github.com/batinkov/lzradio/blob/master/CHANGELOG.md'
    )
    await expect(link).toHaveText('View changelog')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('should not show toast for first-time users', async ({ page }) => {
    // Clear localStorage before page loads to simulate first-time user
    await page.addInitScript(() => {
      localStorage.clear()
    })

    await page.goto('/')

    // Wait a bit to ensure no toast appears
    await page.waitForTimeout(500)

    // Toast should not be visible
    await expect(page.locator('.toast')).not.toBeVisible()

    // Verify version was saved to localStorage
    const lastSeenVersion = await page.evaluate(() => localStorage.getItem('lastSeenVersion'))
    expect(lastSeenVersion).toBeTruthy()
  })

  test('should dismiss toast when X button is clicked', async ({ page }) => {
    // Set old version to trigger toast
    await page.addInitScript(() => {
      localStorage.setItem('lastSeenVersion', '0.0.0')
    })

    await page.goto('/')

    // Wait for toast to appear
    await page.waitForSelector('.toast', { timeout: 3000 })
    await expect(page.locator('.toast')).toBeVisible()

    // Click the X button to dismiss
    await page.click('.toast-close')

    // Toast should disappear
    await expect(page.locator('.toast')).not.toBeVisible()
  })

  test('should update localStorage after showing notification', async ({ page }) => {
    // Set old version
    await page.addInitScript(() => {
      localStorage.setItem('lastSeenVersion', '0.0.0')
    })

    await page.goto('/')

    // Wait for toast
    await page.waitForSelector('.toast', { timeout: 3000 })

    // Check that localStorage was updated to current version
    const updatedVersion = await page.evaluate(() => localStorage.getItem('lastSeenVersion'))
    expect(updatedVersion).toBeTruthy()
    expect(updatedVersion).not.toBe('0.0.0')
  })
})
