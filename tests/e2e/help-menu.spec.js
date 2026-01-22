// @ts-check
import { test, expect } from '@playwright/test'

test.describe('Help Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open dropdown menu when clicking help button', async ({ page }) => {
    // Click help button
    await page.click('button[aria-label*="Help"]')

    // Dropdown should be visible
    await expect(page.locator('.help-dropdown')).toBeVisible()

    // Should have Documentation link, Features and About buttons
    const docLink = page.locator('.help-dropdown a')
    await expect(docLink).toHaveCount(1)
    await expect(docLink).toContainText('Documentation')

    const buttons = page.locator('.help-dropdown button')
    await expect(buttons).toHaveCount(2)
    await expect(buttons.first()).toContainText('Features')
    await expect(buttons.last()).toContainText('About')
  })

  test('should close dropdown when clicking outside', async ({ page }) => {
    // Open dropdown
    await page.click('button[aria-label*="Help"]')
    await expect(page.locator('.help-dropdown')).toBeVisible()

    // Click outside (on the page body)
    await page.click('.nav-brand')
    await page.waitForTimeout(200)

    // Dropdown should be closed
    await expect(page.locator('.help-dropdown')).not.toBeVisible()
  })

  test.describe('Features Modal', () => {
    test('should open Features modal from dropdown', async ({ page }) => {
      // Open dropdown and click Features
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:has-text("Features")')

      // Modal should be visible with correct title
      await expect(page.locator('.modal')).toBeVisible()
      await expect(page.locator('.modal-header h2')).toContainText('Features')
    })

    test('should display LogBook feature description', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:has-text("Features")')

      // Should show LogBook feature
      await expect(page.locator('.modal-body')).toContainText('LogBook')
      await expect(page.locator('.modal-body')).toContainText('Export')
    })

    test('should display Exam Prep feature description', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:has-text("Features")')

      // Should show Exam Prep feature
      await expect(page.locator('.modal-body')).toContainText('Exam Prep')
    })

    test('should display keyboard shortcuts', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:has-text("Features")')

      // Should show keyboard shortcuts
      await expect(page.locator('.modal-body')).toContainText('Keyboard Shortcuts')
      await expect(page.locator('.modal-body code')).toHaveCount(3) // ← →, 1-4, Esc
    })

    test('should close Features modal with close button', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:has-text("Features")')
      await expect(page.locator('.modal')).toBeVisible()

      // Click close button
      await page.click('.modal-header .icon-btn')
      await page.waitForTimeout(200)

      await expect(page.locator('.modal')).not.toBeVisible()
    })
  })

  test.describe('About Modal', () => {
    test('should open About modal from dropdown', async ({ page }) => {
      // Open dropdown and click About
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:last-child')

      // Modal should be visible with correct title
      await expect(page.locator('.modal')).toBeVisible()
      await expect(page.locator('.modal-header h2')).toContainText('About')
    })

    test('should display app name and version', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:last-child')

      // Should show app name and version
      await expect(page.locator('.about-header h3')).toContainText('LZ Radio')
      await expect(page.locator('.about-header .version')).toContainText('Version')
    })

    test('should display maintainer callsign', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:last-child')

      // Should show maintainer info
      await expect(page.locator('.modal-body')).toContainText('Maintained by')
      await expect(page.locator('.modal-body')).toContainText('LZ3DY')
    })

    test('should display feedback links', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:last-child')

      // Should have 3 feedback links
      const feedbackLinks = page.locator('.feedback-links a')
      await expect(feedbackLinks).toHaveCount(3)

      // Verify link text
      await expect(feedbackLinks.nth(0)).toContainText('Report Bug')
      await expect(feedbackLinks.nth(1)).toContainText('Feature Request')
      await expect(feedbackLinks.nth(2)).toContainText('General Feedback')
    })

    test('should have correct GitHub links for feedback', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:last-child')

      const feedbackLinks = page.locator('.feedback-links a')

      // Verify links point to GitHub
      await expect(feedbackLinks.nth(0)).toHaveAttribute('href', /github\.com.*issues/)
      await expect(feedbackLinks.nth(1)).toHaveAttribute('href', /github\.com.*issues/)
      await expect(feedbackLinks.nth(2)).toHaveAttribute('href', /github\.com.*issues/)
    })

    test('should display open source and license info', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:last-child')

      // Should show license info
      await expect(page.locator('.about-footer')).toContainText('Open Source')
      await expect(page.locator('.about-footer')).toContainText('MIT License')
    })

    test('should have View on GitHub link', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:last-child')

      // Should have GitHub repo link
      const githubLink = page.locator('.about-footer a')
      await expect(githubLink).toContainText('View on GitHub')
      await expect(githubLink).toHaveAttribute('href', /github\.com/)
    })

    test('should close About modal with close button', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')
      await page.click('.help-dropdown button:last-child')
      await expect(page.locator('.modal')).toBeVisible()

      // Click close button
      await page.click('.modal-header .icon-btn')
      await page.waitForTimeout(200)

      await expect(page.locator('.modal')).not.toBeVisible()
    })
  })

  test.describe('Documentation Link', () => {
    test('should display documentation link in dropdown', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')

      const docLink = page.locator('.help-dropdown a')
      await expect(docLink).toBeVisible()
      await expect(docLink).toContainText('Documentation')
    })

    test('should link to English wiki when in English', async ({ page }) => {
      // Ensure English is selected
      await page.click('button.lang-btn:has-text("EN")')
      await page.waitForTimeout(100)

      await page.click('button[aria-label*="Help"]')

      const docLink = page.locator('.help-dropdown a')
      await expect(docLink).toHaveAttribute('href', 'https://github.com/batinkov/lzradio/wiki/en-Home')
    })

    test('should link to Bulgarian wiki when in Bulgarian', async ({ page }) => {
      // Switch to Bulgarian
      await page.click('button.lang-btn:has-text("BG")')
      await page.waitForTimeout(100)

      // Use container selector since aria-label changes with language
      await page.click('.help-menu-container .icon-btn')

      const docLink = page.locator('.help-dropdown a')
      await expect(docLink).toContainText('Документация')
      await expect(docLink).toHaveAttribute('href', 'https://github.com/batinkov/lzradio/wiki/bg-Home')
    })

    test('should open documentation in new tab', async ({ page }) => {
      await page.click('button[aria-label*="Help"]')

      const docLink = page.locator('.help-dropdown a')
      await expect(docLink).toHaveAttribute('target', '_blank')
      await expect(docLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    test('should close dropdown when clicking documentation link', async ({ page, context }) => {
      await page.click('button[aria-label*="Help"]')
      await expect(page.locator('.help-dropdown')).toBeVisible()

      // Listen for new page (since link opens in new tab)
      const pagePromise = context.waitForEvent('page')
      await page.click('.help-dropdown a')

      // Wait for new page to open
      const newPage = await pagePromise

      // Dropdown should be closed on original page
      await expect(page.locator('.help-dropdown')).not.toBeVisible()

      // Close the new page
      await newPage.close()
    })

    test('should update link when switching language', async ({ page }) => {
      // Start in English
      await page.click('button.lang-btn:has-text("EN")')
      await page.waitForTimeout(100)

      await page.click('.help-menu-container .icon-btn')
      let docLink = page.locator('.help-dropdown a')
      await expect(docLink).toHaveAttribute('href', 'https://github.com/batinkov/lzradio/wiki/en-Home')

      // Close dropdown
      await page.click('.nav-brand')
      await page.waitForTimeout(200)

      // Switch to Bulgarian
      await page.click('button.lang-btn:has-text("BG")')
      await page.waitForTimeout(100)

      // Reopen dropdown (use container selector since aria-label changed)
      await page.click('.help-menu-container .icon-btn')
      docLink = page.locator('.help-dropdown a')
      await expect(docLink).toHaveAttribute('href', 'https://github.com/batinkov/lzradio/wiki/bg-Home')
    })
  })
})
