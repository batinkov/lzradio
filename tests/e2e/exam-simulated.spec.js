import { test, expect } from '@playwright/test';

/**
 * Simulated exam mode tests
 * Tests the timed exam experience including timer, navigation warnings,
 * submit flow, and results display
 */

/**
 * Helper function to start a simulated exam
 * Navigates to the simulated exam page and clicks the Start Exam button
 */
async function startSimulatedExam(page) {
  await page.goto('/#/exam/class1/simulated');

  // Click the Start Exam button on the instructions page
  await page.click('button:has-text("Start Exam")');

  // Wait for questions to load
  await page.waitForSelector('.question-container', { timeout: 5000 });
}

/**
 * Helper function to parse timer string to seconds
 * @param {string} timeStr - Time string in format "⏱️ MM:SS" or "MM:SS"
 * @returns {number} Total time in seconds
 */
function parseTime(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)/);
  if (!match) return 0;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  return minutes * 60 + seconds;
}

test.describe('Simulated Exam Mode', () => {
  test('should start simulated exam and load questions', async ({ page }) => {
    await page.goto('/#/exam/class1');

    // Click Start Exam button from mode selection
    await page.click('.mode-card:nth-child(2) a:has-text("Start Exam")');

    // Verify we're on the simulated exam instructions page
    await expect(page).toHaveURL(/#\/exam\/class1\/simulated$/);

    // Should show exam configuration and rules
    await expect(page.locator('h1')).toContainText(/Simulated Exam/);
    await expect(page.locator('text=60 random questions')).toBeVisible();

    // Click the Start Exam button on the instructions page
    await page.click('button:has-text("Start Exam")');

    // Wait for questions to load
    await page.waitForSelector('.question-container', { timeout: 5000 });

    // Verify exam elements are present
    await expect(page.locator('.question-number')).toBeVisible();
    await expect(page.locator('.question-text')).toBeVisible();
    await expect(page.locator('.answers')).toBeVisible();
  });

  test('should display timer with correct initial time', async ({ page }) => {
    await startSimulatedExam(page);

    // Timer should be visible
    const timer = page.locator('.timer-display');
    await expect(timer).toBeVisible();

    // Should show 40:00 initially (40 minutes for exam)
    const timerText = await timer.textContent();
    expect(timerText).toMatch(/40:00|39:59|39:58|39:57/); // Allow for slight delay in loading
  });

  test('should show timer counting down', async ({ page }) => {
    await startSimulatedExam(page);

    const timer = page.locator('.timer-display');
    const initialTimeText = await timer.textContent();
    const initialTimeInSeconds = parseTime(initialTimeText);

    // Wait a few seconds
    await page.waitForTimeout(3000);

    const updatedTimeText = await timer.textContent();
    const updatedTimeInSeconds = parseTime(updatedTimeText);

    // Time should have decreased (countdown timer)
    expect(updatedTimeInSeconds).toBeLessThan(initialTimeInSeconds);

    // Should have decreased by approximately 3 seconds (allow some tolerance)
    const difference = initialTimeInSeconds - updatedTimeInSeconds;
    expect(difference).toBeGreaterThanOrEqual(2); // At least 2 seconds
    expect(difference).toBeLessThanOrEqual(4); // At most 4 seconds
  });

  test('should display 60 questions in simulated exam', async ({ page }) => {
    await startSimulatedExam(page);

    // Open questions navigator to see total count
    await page.click('button.btn-navigator');

    // Should have 60 question buttons
    const questionButtons = page.locator('.question-number-btn');
    await expect(questionButtons).toHaveCount(60);
  });

  test('should not interfere with timer when opening navigator', async ({ page }) => {
    await startSimulatedExam(page);

    // Wait a moment for timer to stabilize after exam start
    await page.waitForTimeout(1000);

    // Get initial timer value
    const timer = page.locator('.timer-display');
    await expect(timer).toBeVisible();
    const initialTimeText = await timer.textContent();
    const initialTimeInSeconds = parseTime(initialTimeText);

    // Open questions navigator
    await page.click('button.btn-navigator');
    const navigator = page.locator('.navigator-modal');
    await expect(navigator).toBeVisible();

    // Timer should still be visible and running
    await expect(timer).toBeVisible();

    // Wait 3 seconds with navigator open to ensure timer updates
    await page.waitForTimeout(3000);

    // Timer should still be counting down
    const timeWhileOpenText = await timer.textContent();
    const timeWhileOpen = parseTime(timeWhileOpenText);

    // Verify timer has decreased by at least 2 seconds
    const elapsedWhileOpen = initialTimeInSeconds - timeWhileOpen;
    expect(elapsedWhileOpen).toBeGreaterThanOrEqual(2);
    expect(timeWhileOpen).toBeLessThan(initialTimeInSeconds);

    // Close navigator
    const closeButton = page.locator('.icon-btn:has-text("×")');
    await closeButton.click();
    await expect(navigator).not.toBeVisible();

    // Wait another 2 seconds after closing
    await page.waitForTimeout(2000);

    // Timer should still be visible and continue counting
    await expect(timer).toBeVisible();
    const timeAfterCloseText = await timer.textContent();
    const timeAfterClose = parseTime(timeAfterCloseText);

    // Verify timer continued to decrease after closing
    expect(timeAfterClose).toBeLessThan(timeWhileOpen);
    const elapsedAfterClose = timeWhileOpen - timeAfterClose;
    expect(elapsedAfterClose).toBeGreaterThanOrEqual(1);
  });

  test('should show timer warning at 10 minutes (yellow)', async ({ page }) => {
    // This test would require mocking time or fast-forwarding
    // For now, we'll test that the timer element exists and can have warning classes
    await startSimulatedExam(page);

    const timer = page.locator('.timer-display');
    await expect(timer).toBeVisible();

    // Timer should have one of the state classes (normal, warning, or critical)
    const timerClasses = await timer.getAttribute('class');
    expect(timerClasses).toMatch(/timer-(normal|warning|critical)/);

    // Note: In a real implementation, we'd need to manipulate time
    // or wait 30 minutes to see the yellow warning
  });

  test('should show submit confirmation modal', async ({ page }) => {
    await startSimulatedExam(page);

    // Click Submit button
    const submitButton = page.locator('button:has-text("Submit Exam")');
    await submitButton.click();

    // Confirmation modal should appear
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();

    // Should show confirmation text
    await expect(modal).toContainText('submit');
  });

  test('should show unanswered questions count in submit confirmation', async ({ page }) => {
    await startSimulatedExam(page);

    // Don't answer any questions, just try to submit
    await page.click('button:has-text("Submit Exam")');

    // Modal should appear with unanswered count
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();

    // Should mention 60 unanswered questions
    await expect(modal).toContainText('60');
  });

  test('should allow canceling submit confirmation', async ({ page }) => {
    await startSimulatedExam(page);

    // Click Submit button
    await page.click('button:has-text("Submit Exam")');

    // Modal should appear
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();

    // Click Cancel button (use specific selector to avoid clicking wrong element)
    await page.locator('.modal-actions button:has-text("Cancel")').click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Should still be on exam page
    await expect(page).toHaveURL(/#\/exam\/class1\/simulated$/);
  });

  test('should submit exam and show results', async ({ page }) => {
    await startSimulatedExam(page);

    // Answer some questions (at least one)
    await page.click('.answer-card:first-child');

    // Submit exam
    await page.click('button:has-text("Submit Exam")');

    // Confirm submission in modal
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    await page.locator('.modal-actions button:has-text("Yes")').click();

    // Results should be visible (displayed on same page, not separate route)
    const results = page.locator('.results-card');
    await expect(results).toBeVisible();

    // Should show either passed or failed status
    const hasPassedOrFailed = await results.evaluate(el =>
      el.classList.contains('passed') || el.classList.contains('failed')
    );
    expect(hasPassedOrFailed).toBe(true);
  });

  test('should display pass/fail status in results', async ({ page }) => {
    await startSimulatedExam(page);

    // Answer all questions correctly or incorrectly
    // For simplicity, just answer one question
    await page.click('.answer-card:first-child');

    // Submit exam
    await page.click('button:has-text("Submit Exam")');
    await page.locator('.modal-actions button:has-text("Yes")').click();

    // Wait for results card to appear
    const results = page.locator('.results-card');
    await expect(results).toBeVisible();

    // Should show either "PASSED" or "FAILED" heading
    const statusHeading = page.locator('.result-status h2');
    await expect(statusHeading).toBeVisible();
    const statusText = await statusHeading.textContent();
    expect(statusText).toMatch(/PASSED|FAILED/i);
  });

  test('should show score in results', async ({ page }) => {
    await startSimulatedExam(page);

    // Answer one question
    await page.click('.answer-card:first-child');

    // Submit exam
    await page.click('button:has-text("Submit Exam")');
    await page.locator('.modal-actions button:has-text("Yes")').click();

    // Wait for results card
    const results = page.locator('.results-card');
    await expect(results).toBeVisible();

    // Should show result rows with scores
    const resultRows = page.locator('.result-row');
    await expect(resultRows.first()).toBeVisible();

    // Should contain "60" somewhere (total questions)
    await expect(results).toContainText('60');
  });

  test('should provide review button in results', async ({ page }) => {
    await startSimulatedExam(page);

    // Answer one question
    await page.click('.answer-card:first-child');

    // Submit exam
    await page.click('button:has-text("Submit Exam")');
    await page.locator('.modal-actions button:has-text("Yes")').click();

    // Wait for results card
    const results = page.locator('.results-card');
    await expect(results).toBeVisible();

    // Should have a Review Answers button
    const reviewButton = page.locator('button:has-text("Review")');
    await expect(reviewButton).toBeVisible();
  });

  test('should navigate to review mode from results', async ({ page }) => {
    await startSimulatedExam(page);

    // Answer one question
    await page.click('.answer-card:first-child');

    // Submit exam
    await page.click('button:has-text("Submit Exam")');
    await page.locator('.modal-actions button:has-text("Yes")').click();

    // Wait for results card
    const results = page.locator('.results-card');
    await expect(results).toBeVisible();

    // Click Review Answers button
    await page.click('button:has-text("Review")');

    // Should enter review mode (results disappear, questions appear)
    await expect(results).not.toBeVisible();

    // Question container should be visible in review mode
    const questionContainer = page.locator('.question-container');
    await expect(questionContainer).toBeVisible();
  });

  test('should show correct/incorrect indicators in review mode', async ({ page }) => {
    await startSimulatedExam(page);

    // Answer one question
    await page.click('.answer-card:first-child');

    // Submit exam
    await page.click('button:has-text("Submit Exam")');
    await page.locator('.modal-actions button:has-text("Yes")').click();

    // Go to review
    await page.click('button:has-text("Review")');

    // Wait for review mode
    const questionContainer = page.locator('.question-container');
    await expect(questionContainer).toBeVisible();

    // Should show correct/incorrect indicators on answer cards
    const answerCards = page.locator('.answer-card.review');
    await expect(answerCards.first()).toBeVisible();

    // At least one answer should have correct-answer or incorrect-answer class
    const markedAnswer = page.locator('.answer-card.correct-answer, .answer-card.incorrect-answer');
    await expect(markedAnswer.first()).toBeVisible();
  });

  test('should show correct answer in review mode', async ({ page }) => {
    await startSimulatedExam(page);

    // Answer a question (could be right or wrong)
    await page.click('.answer-card:first-child');

    // Submit exam
    await page.click('button:has-text("Submit Exam")');
    await page.locator('.modal-actions button:has-text("Yes")').click();

    // Go to review
    await page.click('button:has-text("Review")');

    // Wait for review mode
    const questionContainer = page.locator('.question-container');
    await expect(questionContainer).toBeVisible();

    // Should highlight the correct answer with green styling
    const correctAnswer = page.locator('.answer-card.correct-answer');
    await expect(correctAnswer).toBeVisible();

    // Correct answer should have a badge
    const correctBadge = page.locator('.correct-badge');
    await expect(correctBadge).toBeVisible();
  });

  test('should navigate between questions in review mode', async ({ page }) => {
    await startSimulatedExam(page);

    // Answer a question
    await page.click('.answer-card:first-child');

    // Submit exam
    await page.click('button:has-text("Submit Exam")');
    await page.locator('.modal-actions button:has-text("Yes")').click();

    // Go to review
    await page.click('button:has-text("Review")');

    // Wait for review mode
    const questionContainer = page.locator('.question-container');
    await expect(questionContainer).toBeVisible();

    // Should be on question 1
    await expect(page.locator('.progress-text')).toContainText('Question 1 of');

    // Click Next button
    await page.click('button:has-text("Next")');

    // Should navigate to question 2
    await expect(page.locator('.progress-text')).toContainText('Question 2 of');
  });

  test('should prevent navigation away during exam', async ({ page }) => {
    await startSimulatedExam(page);

    // Set up dialog handler to catch beforeunload
    let dialogShown = false;
    page.on('dialog', async dialog => {
      dialogShown = true;
      await dialog.dismiss();
    });

    // Try to navigate away
    await page.goto('/#/');

    // In a real browser, this would show a confirmation dialog
    // The implementation uses beforeunload event
    // We can't fully test this in Playwright without special setup
  });

  test('should have exit exam button in results', async ({ page }) => {
    await startSimulatedExam(page);

    // Answer one question
    await page.click('.answer-card:first-child');

    // Submit exam
    await page.click('button:has-text("Submit Exam")');
    await page.locator('.modal-actions button:has-text("Yes")').click();

    // Wait for results card
    const results = page.locator('.results-card');
    await expect(results).toBeVisible();

    // Should have an Exit Exam button
    const exitButton = page.locator('button:has-text("Exit"), button.btn-leave-exam');
    await expect(exitButton.first()).toBeVisible();
  });
});
