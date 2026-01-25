import { test, expect } from '@playwright/test'

test.describe('Banner Component', () => {
  test.describe('LogBook Alpha Version Banner', () => {
    test('should display "Alpha Version" banner on /logbook', async ({ page }) => {
      await page.goto('/#/logbook')

      // Wait for page to load
      await page.waitForSelector('h1')

      // Check banner is visible
      const banner = page.locator('.banner')
      await expect(banner).toBeVisible()

      // Check badge text
      const badge = banner.locator('.badge')
      await expect(badge).toHaveText('Alpha Version')

      // Check message is present (verify it's a banner about alpha status)
      const message = banner.locator('.message')
      await expect(message).toBeVisible()
    })

    test('should NOT have close button on LogBook banner', async ({ page }) => {
      await page.goto('/#/logbook')

      // Wait for page to load
      await page.waitForSelector('h1')

      // Check banner is visible
      const banner = page.locator('.banner')
      await expect(banner).toBeVisible()

      // Verify no close button exists
      const closeButton = banner.locator('button[aria-label="Close banner"]')
      await expect(closeButton).not.toBeVisible()
    })

    test('should remain visible after navigation within LogBook', async ({ page }) => {
      await page.goto('/#/logbook')

      // Wait for banner
      const banner = page.locator('.banner')
      await expect(banner).toBeVisible()

      // Navigate to add contact page (if there are contacts)
      // For now, just verify banner is still visible on reload
      await page.reload()
      await page.waitForSelector('h1')

      // Banner should still be visible
      await expect(banner).toBeVisible()
    })

    test('should be positioned above the title in LogBook', async ({ page }) => {
      await page.goto('/#/logbook')

      // Wait for page to load
      await page.waitForSelector('h1')

      // Get positions of banner and title
      const banner = page.locator('.banner')
      const title = page.locator('h1')

      const bannerBox = await banner.boundingBox()
      const titleBox = await title.boundingBox()

      // Banner should be above title (lower y coordinate)
      expect(bannerBox.y).toBeLessThan(titleBox.y)
    })
  })

  test.describe('ExamHome Language Warning Banner', () => {
    test('should display "Important" banner on /exam when English is selected', async ({ page }) => {
      // Set language to English via localStorage before navigation
      await page.goto('/#/')
      await page.evaluate(() => {
        localStorage.setItem('svelte-i18n-locale', '"en"')
      })

      await page.goto('/#/exam')

      // Wait for page to load
      await page.waitForSelector('h1')

      // Check banner is visible
      const banner = page.locator('.banner')
      await expect(banner).toBeVisible()

      // Check badge text
      const badge = banner.locator('.badge')
      await expect(badge).toHaveText('Important')

      // Check message contains language warning
      const message = banner.locator('.message')
      await expect(message).toContainText('Bulgarian')
      await expect(message).toContainText('practice purposes')
    })

    test('should NOT display banner on /exam when Bulgarian is selected', async ({ page }) => {
      // Start at home page
      await page.goto('/#/')

      // Switch to Bulgarian using the language button
      await page.click('.lang-btn:has-text("bg")')

      // Wait for language change
      await page.waitForTimeout(500)

      // Navigate to exam page
      await page.goto('/#/exam')

      // Wait for page to load
      await page.waitForSelector('h1')

      // Banner should NOT be visible
      const banner = page.locator('.banner')
      await expect(banner).not.toBeVisible()
    })

    test('should NOT have close button on ExamHome banner', async ({ page }) => {
      // Set language to English
      await page.goto('/#/')
      await page.evaluate(() => {
        localStorage.setItem('svelte-i18n-locale', '"en"')
      })

      await page.goto('/#/exam')

      // Wait for page to load
      await page.waitForSelector('h1')

      // Check banner is visible
      const banner = page.locator('.banner')
      await expect(banner).toBeVisible()

      // Verify no close button exists
      const closeButton = banner.locator('button[aria-label="Close banner"]')
      await expect(closeButton).not.toBeVisible()
    })

    test('should be positioned above the title on ExamHome', async ({ page }) => {
      // Set language to English
      await page.goto('/#/')
      await page.evaluate(() => {
        localStorage.setItem('svelte-i18n-locale', '"en"')
      })

      await page.goto('/#/exam')

      // Wait for page to load
      await page.waitForSelector('h1')

      // Get positions of banner and title
      const banner = page.locator('.banner')
      const title = page.locator('h1')

      const bannerBox = await banner.boundingBox()
      const titleBox = await title.boundingBox()

      // Banner should be above title (lower y coordinate)
      expect(bannerBox.y).toBeLessThan(titleBox.y)
    })

    test('should NOT display banner on exam class pages (only on /exam home)', async ({ page }) => {
      // Set language to English
      await page.goto('/#/')
      await page.evaluate(() => {
        localStorage.setItem('svelte-i18n-locale', '"en"')
      })

      // Visit exam class selection page
      await page.goto('/#/exam/class1')

      // Wait for page to load
      await page.waitForSelector('h1')

      // Banner should NOT be visible (only on /exam, not /exam/class1)
      const banner = page.locator('.banner')
      await expect(banner).not.toBeVisible()
    })

    test('should NOT display banner on exam prep pages', async ({ page }) => {
      // Set language to English
      await page.goto('/#/')
      await page.evaluate(() => {
        localStorage.setItem('svelte-i18n-locale', '"en"')
      })

      // Visit exam prep page
      await page.goto('/#/exam/class1/prep?sections=1')

      // Wait for page to load
      await page.waitForSelector('.page')

      // Banner should NOT be visible
      const banner = page.locator('.banner')
      await expect(banner).not.toBeVisible()
    })

    test('should switch visibility when language changes', async ({ page }) => {
      // Start with English
      await page.goto('/#/')

      // Switch to English if not already
      await page.click('.lang-btn:has-text("en")')
      await page.waitForTimeout(500)

      await page.goto('/#/exam')
      await page.waitForSelector('h1')

      // Banner should be visible
      let banner = page.locator('.banner')
      await expect(banner).toBeVisible()

      // Switch to Bulgarian via language button
      await page.click('.lang-btn:has-text("bg")')

      // Wait for language change
      await page.waitForTimeout(500)

      // Banner should disappear
      await expect(banner).not.toBeVisible()

      // Switch back to English
      await page.click('.lang-btn:has-text("en")')

      // Wait for language change
      await page.waitForTimeout(500)

      // Banner should reappear
      await expect(banner).toBeVisible()
    })
  })
})
