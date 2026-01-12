import { test, expect } from '@playwright/test';

/**
 * Basic home page tests demonstrating DOM assertions
 */
test.describe('Home Page', () => {
  test('should display main heading and feature cards', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for page to load (wait for main heading)
    await page.waitForSelector('h1');

    // DOM Assertion 1: Check main heading text
    const heading = page.locator('.hero h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('LZ Radio');

    // DOM Assertion 2: Check subtitle is present
    const subtitle = page.locator('.subtitle');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveText('Amateur Radio Tools');

    // DOM Assertion 3: Verify both feature cards are present
    const featureCards = page.locator('.feature-card');
    await expect(featureCards).toHaveCount(2);

    // DOM Assertion 4: Check LogBook card content
    const logbookCard = featureCards.nth(0);
    await expect(logbookCard).toContainText('📻 LogBook');
    await expect(logbookCard).toContainText('Log and track your radio contacts');

    // DOM Assertion 5: Check Exam Prep card content
    const examCard = featureCards.nth(1);
    await expect(examCard).toContainText('📝 Exam Prep');
    await expect(examCard).toContainText('Practice for your amateur radio license exam');

    // DOM Assertion 6: Verify cards have correct href attributes (hash routing)
    await expect(logbookCard).toHaveAttribute('href', '#/logbook');
    await expect(examCard).toHaveAttribute('href', '#/exam');
  });

  test('should navigate to LogBook when clicking the card', async ({ page }) => {
    await page.goto('/');

    // Click the LogBook feature card
    await page.click('.feature-card:has-text("LogBook")');

    // DOM Assertion: Verify URL changed to logbook page (hash routing)
    await expect(page).toHaveURL(/#\/logbook/);

    // DOM Assertion: Verify LogBook page loaded
    await expect(page.locator('h1')).toContainText('The logbook of');
  });

  test('should navigate to Exam Prep when clicking the card', async ({ page }) => {
    await page.goto('/');

    // Click the Exam Prep feature card
    await page.click('.feature-card:has-text("Exam Prep")');

    // DOM Assertion: Verify URL changed to exam page (hash routing)
    await expect(page).toHaveURL(/#\/exam/);

    // DOM Assertion: Verify Exam page loaded
    await expect(page.locator('h1')).toContainText('Exam Preparation');
  });
});
