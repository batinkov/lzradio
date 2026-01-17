import { test, expect } from '@playwright/test'

/**
 * Keyboard shortcuts end-to-end tests
 * Tests keyboard navigation and answer selection in different exam modes
 */
test.describe('Keyboard Shortcuts', () => {
  test.describe('Prep Mode', () => {
    test('should navigate between questions using arrow keys', async ({ page }) => {
      await page.goto('/#/exam/class1/prep?order=sequential&categories=1')
      await page.waitForSelector('.question-container', { timeout: 5000 })

      // Verify starting at question 1
      await expect(page.locator('.progress-text')).toContainText('Question 1 of')

      // Press right arrow to go to next question
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('.progress-text')).toContainText('Question 2 of')

      // Press right arrow again
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('.progress-text')).toContainText('Question 3 of')

      // Press left arrow to go back
      await page.keyboard.press('ArrowLeft')
      await expect(page.locator('.progress-text')).toContainText('Question 2 of')
    })

    test('should select answers using number keys 1-4', async ({ page }) => {
      await page.goto('/#/exam/class1/prep?order=sequential&categories=1')
      await page.waitForSelector('.question-container', { timeout: 5000 })

      // Press 1 to select first answer
      await page.keyboard.press('1')
      await page.waitForTimeout(100) // Wait for selection to register

      // First answer should be selected (radio button checked)
      const firstAnswer = page.locator('.answer-card').first()
      const firstRadio = firstAnswer.locator('input[type="radio"]')
      await expect(firstRadio).toBeChecked()

      // Press 3 to select third answer
      await page.keyboard.press('3')
      await page.waitForTimeout(100)

      // Third answer should now be selected
      const thirdAnswer = page.locator('.answer-card').nth(2)
      const thirdRadio = thirdAnswer.locator('input[type="radio"]')
      await expect(thirdRadio).toBeChecked()

      // First answer should no longer be selected
      await expect(firstRadio).not.toBeChecked()
    })

    test('should not handle shortcuts when question navigator is open', async ({ page }) => {
      await page.goto('/#/exam/class1/prep?order=sequential&categories=1')
      await page.waitForSelector('.question-container', { timeout: 5000 })

      // Verify at question 1
      await expect(page.locator('.progress-text')).toContainText('Question 1 of')

      // Open question navigator
      await page.click('button:has-text("☰")')
      await page.waitForSelector('.navigator-modal', { timeout: 2000 })

      // Try to navigate with arrow keys (should not work)
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)

      // Should still be at question 1 (navigation blocked)
      await expect(page.locator('.progress-text')).toContainText('Question 1 of')

      // Close navigator with ESC
      await page.keyboard.press('Escape')

      // Wait for navigator to close completely
      await expect(page.locator('.navigator-modal')).not.toBeVisible()

      // Remove focus from any element to ensure clean state
      await page.evaluate(() => document.activeElement?.blur())
      await page.waitForTimeout(300) // Give time for all state to settle

      // Now arrow keys should work again
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200) // Give time for navigation to complete
      await expect(page.locator('.progress-text')).toContainText('Question 2 of')
    })
  })

  test.describe('Simulated Exam Mode', () => {
    test('should navigate between questions using arrow keys', async ({ page }) => {
      await page.goto('/#/exam/class1/simulated')
      await page.waitForSelector('.page-centered', { timeout: 5000 })

      // Start the exam
      await page.click('button:has-text("Start Exam")')
      await page.waitForSelector('.question-container', { timeout: 5000 })

      // Verify starting at question 1
      await expect(page.locator('.progress-text')).toContainText('Question 1 of 60')

      // Press right arrow to go to next question
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('.progress-text')).toContainText('Question 2 of 60')

      // Press left arrow to go back
      await page.keyboard.press('ArrowLeft')
      await expect(page.locator('.progress-text')).toContainText('Question 1 of 60')
    })

    test('should select answers using number keys 1-4 during exam', async ({ page }) => {
      await page.goto('/#/exam/class1/simulated')
      await page.waitForSelector('.page-centered', { timeout: 5000 })

      // Start the exam
      await page.click('button:has-text("Start Exam")')
      await page.waitForSelector('.question-container', { timeout: 5000 })

      // Press 2 to select second answer
      await page.keyboard.press('2')
      await page.waitForTimeout(100)

      // Second answer should be selected
      const secondAnswer = page.locator('.answer-card').nth(1)
      const secondRadio = secondAnswer.locator('input[type="radio"]')
      await expect(secondRadio).toBeChecked()

      // Navigate to next question and select answer 4
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('4')
      await page.waitForTimeout(100)

      // Fourth answer should be selected
      const fourthAnswer = page.locator('.answer-card').nth(3)
      const fourthRadio = fourthAnswer.locator('input[type="radio"]')
      await expect(fourthRadio).toBeChecked()
    })

    test('should not handle shortcuts when question navigator is open', async ({ page }) => {
      await page.goto('/#/exam/class1/simulated')
      await page.waitForSelector('.page-centered', { timeout: 5000 })

      // Start the exam
      await page.click('button:has-text("Start Exam")')
      await page.waitForSelector('.question-container', { timeout: 5000 })

      // Open question navigator
      await page.click('button:has-text("☰")')
      await page.waitForSelector('.navigator-modal', { timeout: 2000 })

      // Try to navigate with arrow keys (should not work)
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)

      // Should still be at question 1
      await expect(page.locator('.progress-text')).toContainText('Question 1 of 60')

      // Close with ESC
      await page.keyboard.press('Escape')

      // Wait for navigator to close completely
      await expect(page.locator('.navigator-modal')).not.toBeVisible()

      // Remove focus from any element to ensure clean state
      await page.evaluate(() => document.activeElement?.blur())
      await page.waitForTimeout(300) // Give time for all state to settle

      // Now navigation should work
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200) // Give time for navigation to complete
      await expect(page.locator('.progress-text')).toContainText('Question 2 of 60')
    })
  })

  test.describe('Review Mode', () => {
    test('should navigate with arrow keys but not allow answer selection', async ({ page }) => {
      await page.goto('/#/exam/class1/simulated')
      await page.waitForSelector('.page-centered', { timeout: 5000 })

      // Start the exam
      await page.click('button:has-text("Start Exam")')
      await page.waitForSelector('.question-container', { timeout: 5000 })

      // Answer a few questions quickly to have some data
      await page.keyboard.press('1')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('2')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('3')

      // Submit the exam
      await page.click('button:has-text("Submit Exam")')
      await page.waitForSelector('.submit-modal', { timeout: 2000 })
      await page.click('.submit-modal button:has-text("Submit")')

      // Wait for results
      await page.waitForSelector('.results-card', { timeout: 5000 })

      // Click Review Answers
      await page.click('button:has-text("Review Answers")')
      await page.waitForSelector('.question-container', { timeout: 5000 })

      // Arrow keys should work in review mode
      await expect(page.locator('.progress-text')).toContainText('Question 1 of 60')
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('.progress-text')).toContainText('Question 2 of 60')

      // Number keys should NOT change answers in review mode
      // Get the currently selected answer (if any)
      const secondAnswer = page.locator('.answer-card').nth(1)
      const isCheckedBefore = await secondAnswer.locator('input[type="radio"]').isChecked()

      // Try to select different answer with number key
      await page.keyboard.press('4')
      await page.waitForTimeout(100)

      // Answer state should not have changed
      const isCheckedAfter = await secondAnswer.locator('input[type="radio"]').isChecked()
      expect(isCheckedBefore).toBe(isCheckedAfter)
    })
  })

  test.describe('ESC key behavior', () => {
    test('should close features modal with ESC key', async ({ page }) => {
      await page.goto('/')

      // Open help dropdown menu
      await page.click('button[aria-label*="Help"]')
      await page.waitForSelector('.help-dropdown', { timeout: 2000 })

      // Click on Features to open modal
      await page.click('.help-dropdown button:first-child')
      await page.waitForSelector('.modal', { timeout: 2000 })

      // Modal should be visible
      await expect(page.locator('.modal')).toBeVisible()

      // Press ESC to close
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)

      // Modal should be closed
      await expect(page.locator('.modal')).not.toBeVisible()
    })

    test('should close submit confirmation modal with ESC key', async ({ page }) => {
      await page.goto('/#/exam/class1/simulated')
      await page.waitForSelector('.page-centered', { timeout: 5000 })

      // Start the exam
      await page.click('button:has-text("Start Exam")')
      await page.waitForSelector('.question-container', { timeout: 5000 })

      // Open submit modal
      await page.click('button:has-text("Submit Exam")')
      await page.waitForSelector('.submit-modal', { timeout: 2000 })

      // Submit modal should be visible
      await expect(page.locator('.submit-modal')).toBeVisible()

      // Press ESC to close
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)

      // Modal should be closed
      await expect(page.locator('.submit-modal')).not.toBeVisible()

      // Should still be in exam (not submitted)
      await expect(page.locator('.question-container')).toBeVisible()
    })
  })
})
