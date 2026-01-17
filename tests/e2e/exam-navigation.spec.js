import { test, expect } from '@playwright/test';

/**
 * Exam navigation tests
 * Tests basic user flows through the exam selection and mode selection screens
 */
test.describe('Exam Navigation', () => {
  test('should navigate from home to exam selection page', async ({ page }) => {
    await page.goto('/');

    // Click Exam Prep feature card
    await page.click('.feature-card:has-text("Exam Prep")');

    // Verify we're on the exam selection page
    await expect(page).toHaveURL(/#\/exam$/);
    await expect(page.locator('h1')).toContainText('Exam Preparation');

    // Verify both class cards are visible
    await expect(page.locator('.class-card')).toHaveCount(2);
    await expect(page.locator('.class-card').first()).toContainText('Class 1');
    await expect(page.locator('.class-card').nth(1)).toContainText('Class 2');
  });

  test('should navigate to Class 1 mode selection', async ({ page }) => {
    await page.goto('/#/exam');

    // Wait for class cards to load
    await page.waitForSelector('.class-card');

    // Click Class 1 card
    await page.click('.class-card:first-child');

    // Verify we're on Class 1 mode selection
    await expect(page).toHaveURL(/#\/exam\/class1$/);
    await expect(page.locator('h1')).toContainText('Class 1');

    // Verify both mode cards are visible
    await expect(page.locator('.mode-card')).toHaveCount(2);
    await expect(page.locator('.mode-card').first()).toContainText('Preparation Mode');
    await expect(page.locator('.mode-card').nth(1)).toContainText('Simulated Exam');
  });

  test('should navigate to Class 2 mode selection', async ({ page }) => {
    await page.goto('/#/exam');

    // Wait for class cards to load
    await page.waitForSelector('.class-card');

    // Click Class 2 card
    await page.click('.class-card:nth-child(2)');

    // Verify we're on Class 2 mode selection
    await expect(page).toHaveURL(/#\/exam\/class2$/);
    await expect(page.locator('h1')).toContainText('Class 2');

    // Verify both mode cards are visible
    await expect(page.locator('.mode-card')).toHaveCount(2);
  });

  test('should show back button on class selection page', async ({ page }) => {
    await page.goto('/#/exam/class1');

    // Verify back button exists and has correct text
    const backButton = page.locator('a.btn-secondary');
    await expect(backButton).toBeVisible();
    await expect(backButton).toContainText('Back to Classes');

    // Click back button
    await backButton.click();

    // Verify we're back on exam selection page
    await expect(page).toHaveURL(/#\/exam$/);
    await expect(page.locator('h1')).toContainText('Exam Preparation');
  });

  test('should display preparation mode configuration options', async ({ page }) => {
    await page.goto('/#/exam/class1');

    // Find preparation mode card
    const prepCard = page.locator('.prep-mode-card');
    await expect(prepCard).toBeVisible();

    // Verify question order options
    await expect(prepCard.locator('text=Question Order')).toBeVisible();
    await expect(prepCard.locator('text=Sequential')).toBeVisible();
    await expect(prepCard.locator('text=Random')).toBeVisible();

    // Verify category selection
    await expect(prepCard.locator('text=Categories')).toBeVisible();
    await expect(prepCard.locator('text=Category 1')).toBeVisible();
    await expect(prepCard.locator('text=Category 2')).toBeVisible();
    await expect(prepCard.locator('text=Category 3')).toBeVisible();

    // Verify all categories are checked by default
    const checkboxes = prepCard.locator('input[type="checkbox"]');
    await expect(checkboxes).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }

    // Verify Start Preparation button exists
    await expect(prepCard.locator('button:has-text("Start Preparation")')).toBeVisible();
    await expect(prepCard.locator('button:has-text("Start Preparation")')).toBeEnabled();
  });

  test('should display simulated exam information', async ({ page }) => {
    await page.goto('/#/exam/class1');

    // Find simulated exam card
    const simulatedCard = page.locator('.mode-card').nth(1);
    await expect(simulatedCard).toBeVisible();

    // Verify title
    await expect(simulatedCard.locator('h4')).toContainText('Simulated Exam');

    // Verify exam features are listed
    await expect(simulatedCard).toContainText('60 random questions');
    await expect(simulatedCard).toContainText('40 minute countdown');
    await expect(simulatedCard).toContainText('Min 48 correct to pass');

    // Verify Start Exam button exists
    await expect(simulatedCard.locator('a:has-text("Start Exam")')).toBeVisible();
    await expect(simulatedCard.locator('a:has-text("Start Exam")')).toBeEnabled();
  });

  test('should navigate to simulated exam start page', async ({ page }) => {
    await page.goto('/#/exam/class1');

    // Click Start Exam button
    await page.click('.mode-card:nth-child(2) a:has-text("Start Exam")');

    // Verify we're on the simulated exam page
    await expect(page).toHaveURL(/#\/exam\/class1\/simulated$/);
  });

  test('should disable Start Preparation button when no categories selected', async ({ page }) => {
    await page.goto('/#/exam/class1');

    const prepCard = page.locator('.prep-mode-card');
    const startButton = prepCard.locator('button:has-text("Start Preparation")');

    // Initially enabled (all categories checked)
    await expect(startButton).toBeEnabled();

    // Uncheck all categories
    const checkboxes = prepCard.locator('input[type="checkbox"]');
    for (let i = 0; i < 3; i++) {
      await checkboxes.nth(i).uncheck();
    }

    // Button should now be disabled
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeDisabled();

    // Re-check one category
    await checkboxes.first().check();

    // Button should be enabled again
    await expect(startButton).toBeEnabled();
  });
});
