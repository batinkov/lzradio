import { test, expect } from '@playwright/test';

/**
 * Exam preparation mode tests
 * Tests the practice exam experience including question navigation,
 * answer selection, and state management
 */
test.describe('Exam Preparation Mode', () => {
  test('should start preparation mode with default settings', async ({ page }) => {
    await page.goto('/#/exam/class1');

    // Click Start Preparation button (with default settings)
    await page.click('button:has-text("Start Preparation")');

    // Verify we're on the prep page
    await expect(page).toHaveURL(/#\/exam\/class1\/prep/);

    // Wait for questions to load
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Verify page elements are present
    await expect(page.locator('.question-number')).toBeVisible();
    await expect(page.locator('.question-text')).toBeVisible();
    await expect(page.locator('.answers')).toBeVisible();
  });

  test('should display first question with correct structure', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');

    // Wait for questions to load
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Verify question header shows "Question 1 of X"
    const progressText = page.locator('.progress-text');
    await expect(progressText).toContainText('Question 1 of');

    // Verify question number is displayed
    const questionNumber = page.locator('.question-number');
    await expect(questionNumber).toBeVisible();
    await expect(questionNumber).toContainText('Question');

    // Verify answer choices are present (should have 4 options)
    const answerCards = page.locator('.answer-card');
    await expect(answerCards).toHaveCount(4);
  });

  test('should navigate to next question', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Verify we're on question 1
    await expect(page.locator('.progress-text')).toContainText('Question 1 of');

    // Click Next button
    await page.click('button:has-text("Next")');

    // Verify we're now on question 2
    await expect(page.locator('.progress-text')).toContainText('Question 2 of');
  });

  test('should navigate to previous question', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Go to question 2
    await page.click('button:has-text("Next")');
    await expect(page.locator('.progress-text')).toContainText('Question 2 of');

    // Go back to question 1
    await page.click('button:has-text("Previous")');
    await expect(page.locator('.progress-text')).toContainText('Question 1 of');
  });

  test('should disable Previous button on first question', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // On first question, Previous should be disabled
    const prevButton = page.locator('button:has-text("Previous")');
    await expect(prevButton).toBeDisabled();

    // Next button should be enabled
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeEnabled();
  });

  test('should select an answer', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Click the first answer choice
    const firstAnswer = page.locator('.answer-card').first();
    await firstAnswer.click();

    // Verify the answer is selected (should have 'selected' class or checked radio)
    const radio = firstAnswer.locator('input[type="radio"]');
    await expect(radio).toBeChecked();
  });

  test('should persist answer when navigating away and back', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Select an answer on question 1 (first choice)
    await page.click('.answer-card:first-child');
    const firstChoice = page.locator('.answer-card:first-child input[type="radio"]');
    await expect(firstChoice).toBeChecked();

    // Navigate to question 2
    await page.click('button:has-text("Next")');
    await expect(page.locator('.progress-text')).toContainText('Question 2 of');

    // Navigate back to question 1
    await page.click('button:has-text("Previous")');
    await expect(page.locator('.progress-text')).toContainText('Question 1 of');

    // Verify answer is still selected
    await expect(firstChoice).toBeChecked();
  });

  test('should change answer when selecting different option', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Select first answer
    await page.click('.answer-card:first-child');
    const firstChoice = page.locator('.answer-card:first-child input[type="radio"]');
    await expect(firstChoice).toBeChecked();

    // Select second answer
    await page.click('.answer-card:nth-child(2)');
    const secondChoice = page.locator('.answer-card:nth-child(2) input[type="radio"]');
    await expect(secondChoice).toBeChecked();

    // First choice should no longer be checked
    await expect(firstChoice).not.toBeChecked();
  });

  test('should show progress bar', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Progress bar should exist
    const progressBar = page.locator('.progress-bar');
    await expect(progressBar).toBeVisible();

    // Progress fill should exist (element exists, but may have 0 width initially)
    const progressFill = page.locator('.progress-fill');
    const initialWidth = await progressFill.evaluate(el => el.style.width);
    expect(initialWidth).toBe('0%'); // Initially no answers

    // Answer a question
    await page.click('.answer-card:first-child');

    // Progress fill should now have width > 0
    const updatedWidth = await progressFill.evaluate(el => el.style.width);
    expect(parseFloat(updatedWidth)).toBeGreaterThan(0);
  });

  test('should show back button to return to class selection', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Back button should be visible
    const backButton = page.locator('a.btn-secondary:has-text("Back")');
    await expect(backButton).toBeVisible();

    // Click back button
    await backButton.click();

    // Should return to class selection page
    await expect(page).toHaveURL(/#\/exam\/class1$/);
  });

  test('should open questions navigator modal', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Click Questions menu button
    const menuButton = page.locator('button.btn-navigator');
    await menuButton.click();

    // Questions navigator modal should appear
    const navigator = page.locator('.navigator-modal');
    await expect(navigator).toBeVisible();

    // Should show list of question number buttons
    const questionButtons = page.locator('.question-number-btn');
    await expect(questionButtons.first()).toBeVisible();

    // Should have multiple questions
    await expect(questionButtons).not.toHaveCount(0);
  });

  test('should show answered questions in navigator', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Answer question 1
    await page.click('.answer-card:first-child');

    // Go to question 2
    await page.click('button:has-text("Next")');

    // Answer question 2
    await page.click('.answer-card:first-child');

    // Open questions navigator
    await page.click('button.btn-navigator');

    // Should show answered status for questions 1 and 2
    const questionButtons = page.locator('.question-number-btn');

    // First two question buttons should have 'answered' class
    const firstQuestion = questionButtons.first();
    const secondQuestion = questionButtons.nth(1);

    await expect(firstQuestion).toHaveClass(/answered/);
    await expect(secondQuestion).toHaveClass(/answered/);
  });

  test('should navigate to question via navigator', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Currently on question 1
    await expect(page.locator('.progress-text')).toContainText('Question 1 of');

    // Open questions navigator
    await page.click('button.btn-navigator');

    // Click on question 5 in the navigator (0-indexed, so nth(4) is question 5)
    const questionButtons = page.locator('.question-number-btn');
    await questionButtons.nth(4).click();

    // Should navigate to question 5
    await expect(page.locator('.progress-text')).toContainText('Question 5 of');

    // Navigator should close
    const navigator = page.locator('.navigator-modal');
    await expect(navigator).not.toBeVisible();
  });

  test('should close navigator with close button', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Open questions navigator
    await page.click('button.btn-navigator');

    const navigator = page.locator('.navigator-modal');
    await expect(navigator).toBeVisible();

    // Click the X close button in the modal header
    const closeButton = page.locator('.icon-btn:has-text("×")');
    await closeButton.click();

    // Navigator should close
    await expect(navigator).not.toBeVisible();
  });

  test('should display class info', async ({ page }) => {
    await page.goto('/#/exam/class1/prep?order=sequential&categories=1,2,3');
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Class info should be visible
    const classInfo = page.locator('.class-info');
    await expect(classInfo).toBeVisible();

    // Should contain class name
    const className = page.locator('.class-name');
    await expect(className).toBeVisible();
  });
});
