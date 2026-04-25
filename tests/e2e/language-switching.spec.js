import { test, expect } from './fixtures.js';

/**
 * Language switching mechanism tests
 * Tests that the i18n system works correctly across the application
 */
test.describe('Language Switching', () => {
  test('should default to English on initial load', async ({ page }) => {
    await page.goto('/');

    // Verify English is active in language switcher
    const enButton = page.locator('button.lang-btn:has-text("EN")');
    await expect(enButton).toHaveClass(/active/);

    // Verify English content is displayed
    await expect(page.locator('.hero h1')).toHaveText('LZ Radio');
    await expect(page.locator('.subtitle')).toHaveText('Amateur Radio Tools');
  });

  test('should switch to Bulgarian when clicking BG button', async ({ page }) => {
    await page.goto('/');

    // Click Bulgarian button
    await page.click('button.lang-btn:has-text("BG")');

    // Wait for language to change
    await page.waitForTimeout(100);

    // Verify Bulgarian is now active
    const bgButton = page.locator('button.lang-btn:has-text("BG")');
    await expect(bgButton).toHaveClass(/active/);

    // Verify Bulgarian content is displayed
    await expect(page.locator('.hero h1')).toHaveText('LZ Радио');
    await expect(page.locator('.subtitle')).toHaveText('Инструменти за радиолюбители');

    // Verify feature cards show Bulgarian text
    const logbookCard = page.locator('.feature-card').first();
    await expect(logbookCard).toContainText('📻 Дневник');

    const examCard = page.locator('.feature-card').nth(1);
    await expect(examCard).toContainText('📝 Подготовка за изпит');
  });

  test('should persist language preference in localStorage', async ({ page }) => {
    await page.goto('/');

    // Switch to Bulgarian
    await page.click('button.lang-btn:has-text("BG")');
    await page.waitForTimeout(100);

    // Check localStorage contains Bulgarian locale (note: storage adapter saves as JSON)
    const locale = await page.evaluate(() => {
      const stored = localStorage.getItem('lzradio-language');
      return stored ? JSON.parse(stored) : null;
    });
    expect(locale).toBe('bg');

    // Reload page
    await page.reload();

    // Verify Bulgarian is still active after reload
    const bgButton = page.locator('button.lang-btn:has-text("BG")');
    await expect(bgButton).toHaveClass(/active/);
    await expect(page.locator('.hero h1')).toHaveText('LZ Радио');
  });

  test('should maintain language across navigation', async ({ page }) => {
    await page.goto('/');

    // Switch to Bulgarian
    await page.click('button.lang-btn:has-text("BG")');
    await page.waitForTimeout(100);

    // Navigate to LogBook
    await page.click('.feature-card:has-text("Дневник")');
    await expect(page).toHaveURL(/#\/logbook/);

    // Verify still in Bulgarian on LogBook page
    await expect(page.locator('h1')).toContainText('Дневник');
    const bgButton = page.locator('button.lang-btn:has-text("BG")');
    await expect(bgButton).toHaveClass(/active/);

    // Navigate to Exam page
    await page.click('a:has-text("Подготовка за изпит")');
    await expect(page).toHaveURL(/#\/exam/);

    // Verify still in Bulgarian on Exam page
    await expect(page.locator('h1')).toContainText('Подготовка за изпит');
    await expect(bgButton).toHaveClass(/active/);

    // Navigate back to home
    await page.click('.nav-brand a');
    await expect(page).toHaveURL(/#\/$/);

    // Verify still in Bulgarian on Home page
    await expect(page.locator('.hero h1')).toHaveText('LZ Радио');
    await expect(bgButton).toHaveClass(/active/);
  });

  test('should switch back to English from Bulgarian', async ({ page }) => {
    await page.goto('/');

    // Switch to Bulgarian
    await page.click('button.lang-btn:has-text("BG")');
    await page.waitForTimeout(100);
    await expect(page.locator('.hero h1')).toHaveText('LZ Радио');

    // Switch back to English
    await page.click('button.lang-btn:has-text("EN")');
    await page.waitForTimeout(100);

    // Verify English is active
    const enButton = page.locator('button.lang-btn:has-text("EN")');
    await expect(enButton).toHaveClass(/active/);

    // Verify English content
    await expect(page.locator('.hero h1')).toHaveText('LZ Radio');
    await expect(page.locator('.subtitle')).toHaveText('Amateur Radio Tools');

    // Verify localStorage updated (note: storage adapter saves as JSON)
    const locale = await page.evaluate(() => {
      const stored = localStorage.getItem('lzradio-language');
      return stored ? JSON.parse(stored) : null;
    });
    expect(locale).toBe('en');
  });

  test('should show Bulgarian navigation links', async ({ page }) => {
    await page.goto('/');

    // Switch to Bulgarian
    await page.click('button.lang-btn:has-text("BG")');
    await page.waitForTimeout(100);

    // Check navigation links are in Bulgarian
    const navLinks = page.locator('.nav-links.desktop a');
    await expect(navLinks.first()).toHaveText('Дневник'); // LogBook
    await expect(navLinks.nth(1)).toHaveText('Подготовка за изпит'); // Exam Prep
  });

  test('should show Bulgarian exam UI on class selection page', async ({ page }) => {
    await page.goto('/');

    // Switch to Bulgarian
    await page.click('button.lang-btn:has-text("BG")');
    await page.waitForTimeout(100);

    // Navigate to exam selection
    await page.click('.feature-card:has-text("Подготовка за изпит")');
    await expect(page).toHaveURL(/#\/exam/);

    // Verify exam page UI is in Bulgarian
    await expect(page.locator('h1')).toContainText('Подготовка за изпит');

    // Wait for class cards to load
    await page.waitForSelector('.class-card', { timeout: 5000 });

    // Verify class cards show Bulgarian text
    const classCards = page.locator('.class-card');
    await expect(classCards.first()).toContainText('Клас 1');

    // Verify question count text is in Bulgarian
    await expect(page.locator('.question-count').first()).toContainText('въпроси');
  });
});
