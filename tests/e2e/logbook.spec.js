import { test, expect } from '@playwright/test'

/**
 * LogBook e2e tests
 * Tests IndexedDB integration, contact display, and empty state
 *
 * SAFETY NOTE: These tests run in Playwright's isolated browser context.
 * They do NOT affect your regular browser or any real user data.
 * Each test gets a fresh, isolated IndexedDB instance.
 */
test.describe('LogBook', () => {
  // Clear IndexedDB before each test to ensure clean state within this test context
  // This only affects the isolated test browser, never your real browser data
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/logbook')
    await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase('LZRadioDB')
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })
    // Reload page after clearing database
    await page.reload()
  })

  test('should display empty state when no contacts exist', async ({ page }) => {
    await page.goto('/#/logbook')

    // Wait for page to load
    await page.waitForSelector('h1')

    // Verify page title
    await expect(page.locator('h1')).toContainText('LogBook')

    // Verify contact count shows 0
    await expect(page.locator('.count')).toContainText('(0')

    // Verify empty state message is displayed
    const emptyState = page.locator('.empty-state')
    await expect(emptyState).toBeVisible()
    await expect(emptyState).toContainText('📻')

    // Verify table is NOT displayed
    await expect(page.locator('.contact-table')).not.toBeVisible()
  })

  test('should display contacts loaded from IndexedDB', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add contacts directly to IndexedDB
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')

      await addContact({
        baseCallsign: 'W1ABC',
        prefix: null,
        suffix: null,
        date: '2025-01-15',
        time: '14:23:00',
        frequency: 14.250,
        mode: 'SSB',
        power: 37,
        rstSent: '59',
        rstReceived: '57',
        qslSent: true,
        qslReceived: true,
        remarks: 'Great contact'
      })

      await addContact({
        baseCallsign: 'K2XYZ',
        prefix: null,
        suffix: null,
        date: '2025-01-14',
        time: '13:45:30',
        frequency: 7.125,
        mode: 'CW',
        power: 40,
        rstSent: '599',
        rstReceived: '579',
        qslSent: false,
        qslReceived: false,
        remarks: ''
      })
    })

    // Reload to trigger data load
    await page.reload()
    await page.waitForSelector('.contact-table')

    // Verify contact count
    await expect(page.locator('.count')).toContainText('(2')

    // Verify table is displayed
    const table = page.locator('.contact-table')
    await expect(table).toBeVisible()

    // Verify empty state is NOT displayed
    await expect(page.locator('.empty-state')).not.toBeVisible()

    // Verify table rows (2 contacts + header)
    const rows = page.locator('.contact-table tbody tr')
    await expect(rows).toHaveCount(2)

    // Verify first contact (newest first - W1ABC)
    const firstRow = rows.nth(0)
    await expect(firstRow).toContainText('W1ABC')
    await expect(firstRow).toContainText('2025-01-15')
    await expect(firstRow).toContainText('14:23:00')
    await expect(firstRow).toContainText('14.25')
    await expect(firstRow).toContainText('SSB')
    await expect(firstRow).toContainText('37')
    await expect(firstRow).toContainText('59')
    await expect(firstRow).toContainText('57')
    await expect(firstRow).toContainText('Great contact')

    // Verify second contact (K2XYZ)
    const secondRow = rows.nth(1)
    await expect(secondRow).toContainText('K2XYZ')
    await expect(secondRow).toContainText('2025-01-14')
    await expect(secondRow).toContainText('CW')
  })

  test('should display callsign with prefix and suffix correctly', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add contact with prefix and suffix
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')

      await addContact({
        baseCallsign: 'W1ABC',
        prefix: 'HB',
        suffix: 'P',
        date: '2025-01-10',
        time: '10:30:00',
        frequency: 3.750,
        mode: 'SSB',
        power: 100,
        rstSent: '59',
        rstReceived: '58',
        qslSent: false,
        qslReceived: false,
        remarks: 'Portable from Switzerland'
      })
    })

    await page.reload()
    await page.waitForSelector('.contact-table')

    // Verify callsign is built correctly: HB/W1ABC/P
    const callsignCell = page.locator('.contact-table tbody tr td.monospace.bold')
    await expect(callsignCell).toHaveText('HB/W1ABC/P')
  })

  test('should display QSL badges correctly', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add contacts with different QSL statuses
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')

      // Both QSL sent and received
      await addContact({
        baseCallsign: 'W1ABC',
        prefix: null,
        suffix: null,
        date: '2025-01-15',
        time: '14:00:00',
        frequency: 14.0,
        mode: 'SSB',
        qslSent: true,
        qslReceived: true
      })

      // Only QSL sent
      await addContact({
        baseCallsign: 'K2XYZ',
        prefix: null,
        suffix: null,
        date: '2025-01-14',
        time: '13:00:00',
        frequency: 7.0,
        mode: 'CW',
        qslSent: true,
        qslReceived: false
      })

      // No QSL
      await addContact({
        baseCallsign: 'DL1DEF',
        prefix: null,
        suffix: null,
        date: '2025-01-13',
        time: '12:00:00',
        frequency: 21.0,
        mode: 'FT8',
        qslSent: false,
        qslReceived: false
      })
    })

    await page.reload()
    await page.waitForSelector('.contact-table')

    const rows = page.locator('.contact-table tbody tr')

    // First row - both QSL should show checkmarks
    const firstRowQslSent = rows.nth(0).locator('td').nth(8) // QSL Sent column
    const firstRowQslRcvd = rows.nth(0).locator('td').nth(9) // QSL Rcvd column
    await expect(firstRowQslSent).toContainText('✓')
    await expect(firstRowQslRcvd).toContainText('✓')

    // Second row - only sent should show checkmark
    const secondRowQslSent = rows.nth(1).locator('td').nth(8)
    const secondRowQslRcvd = rows.nth(1).locator('td').nth(9)
    await expect(secondRowQslSent).toContainText('✓')
    await expect(secondRowQslRcvd).toContainText('—')

    // Third row - both should show dashes
    const thirdRowQslSent = rows.nth(2).locator('td').nth(8)
    const thirdRowQslRcvd = rows.nth(2).locator('td').nth(9)
    await expect(thirdRowQslSent).toContainText('—')
    await expect(thirdRowQslRcvd).toContainText('—')
  })

  test('should handle optional fields correctly', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add contact with minimal required fields only
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')

      await addContact({
        baseCallsign: 'W1ABC',
        prefix: null,
        suffix: null,
        date: '2025-01-15',
        time: '14:00:00',
        frequency: 14.0,
        mode: 'SSB',
        power: null, // Optional
        rstSent: null, // Optional
        rstReceived: null, // Optional
        qslSent: false,
        qslReceived: false,
        remarks: '' // Optional
      })
    })

    await page.reload()
    await page.waitForSelector('.contact-table')

    const row = page.locator('.contact-table tbody tr').first()

    // Verify optional fields show dash when empty
    const powerCell = row.locator('td').nth(5)
    const rstSentCell = row.locator('td').nth(6)
    const rstRcvdCell = row.locator('td').nth(7)

    await expect(powerCell).toContainText('—')
    await expect(rstSentCell).toContainText('—')
    await expect(rstRcvdCell).toContainText('—')
  })

  test('should navigate to Add Contact page', async ({ page }) => {
    await page.goto('/#/logbook')

    // Click Add Contact button
    await page.click('.btn-primary:has-text("Add")')

    // Verify navigation to add page
    await expect(page).toHaveURL(/#\/logbook\/add/)

    // Verify Add Contact form is displayed
    await expect(page.locator('h1')).toContainText('Add')
  })

  test('should add a new contact via form and display it in the list', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Fill out the form
    await page.fill('#callsign', 'W1ABC')
    await page.fill('#date', '2025-01-20')
    await page.fill('#time', '14:30:00')
    await page.fill('#frequency', '14.250')
    await page.selectOption('#mode', 'SSB')
    await page.fill('#power', '100')
    await page.fill('#rstSent', '59')
    await page.fill('#rstReceived', '57')
    await page.check('#qslSent')
    await page.fill('#remarks', 'Test contact from e2e')

    // Submit the form
    await page.click('button[type="submit"]')

    // Should navigate back to logbook
    await expect(page).toHaveURL(/#\/logbook/)

    // Wait for table to appear
    await page.waitForSelector('.contact-table')

    // Verify the contact appears in the list
    const table = page.locator('.contact-table')
    await expect(table).toContainText('W1ABC')
    await expect(table).toContainText('2025-01-20')
    await expect(table).toContainText('14:30:00')
    await expect(table).toContainText('SSB')
    await expect(table).toContainText('Test contact from e2e')

    // Verify contact count is updated
    await expect(page.locator('.count')).toContainText('(1')
  })

  test('should parse callsign with prefix and suffix correctly', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Fill form with callsign that has prefix and suffix
    await page.fill('#callsign', 'HB/W1ABC/P')
    await page.fill('#date', '2025-01-20')
    await page.fill('#time', '15:00:00')
    await page.fill('#frequency', '7.125')
    await page.selectOption('#mode', 'CW')

    // Submit
    await page.click('button[type="submit"]')

    // Navigate back to logbook
    await expect(page).toHaveURL(/#\/logbook/)
    await page.waitForSelector('.contact-table')

    // Verify callsign is displayed correctly
    const callsignCell = page.locator('.contact-table tbody tr td.monospace.bold')
    await expect(callsignCell).toHaveText('HB/W1ABC/P')
  })

  test('should show validation errors for required fields', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should still be on add page
    await expect(page).toHaveURL(/#\/logbook\/add/)

    // Verify error messages are displayed
    await expect(page.locator('.error-text')).toHaveCount(5) // callsign, date, time, frequency, mode

    // Should see error styling on fields
    await expect(page.locator('#callsign.error')).toBeVisible()
    await expect(page.locator('#date.error')).toBeVisible()
    await expect(page.locator('#time.error')).toBeVisible()
    await expect(page.locator('#frequency.error')).toBeVisible()
    await expect(page.locator('#mode.error')).toBeVisible()
  })

  test('should validate frequency is a positive number', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Fill required fields
    await page.fill('#callsign', 'W1ABC')
    await page.fill('#date', '2025-01-20')
    await page.fill('#time', '14:00:00')
    await page.fill('#frequency', '-10') // Invalid: negative
    await page.selectOption('#mode', 'SSB')

    // Submit
    await page.click('button[type="submit"]')

    // Should show error
    await expect(page.locator('.error-text')).toContainText('positive number')
    await expect(page).toHaveURL(/#\/logbook\/add/)
  })

  test('should clear form when clear button is clicked', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Fill some fields
    await page.fill('#callsign', 'W1ABC')
    await page.fill('#date', '2025-01-20')
    await page.fill('#remarks', 'Test remarks')

    // Click clear button
    await page.click('button:has-text("Clear")')

    // Verify fields are cleared
    await expect(page.locator('#callsign')).toHaveValue('')
    await expect(page.locator('#date')).toHaveValue('')
    await expect(page.locator('#remarks')).toHaveValue('')
  })

  test('should save contact with only required fields', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Fill only required fields (no power, RST, remarks)
    await page.fill('#callsign', 'K2XYZ')
    await page.fill('#date', '2025-01-21')
    await page.fill('#time', '16:00:00')
    await page.fill('#frequency', '21.300')
    await page.selectOption('#mode', 'FT8')

    // Submit
    await page.click('button[type="submit"]')

    // Navigate to logbook
    await expect(page).toHaveURL(/#\/logbook/)
    await page.waitForSelector('.contact-table')

    // Verify contact is saved with dashes for optional fields
    const row = page.locator('.contact-table tbody tr').first()
    await expect(row).toContainText('K2XYZ')

    // Power, RST should show dashes
    const powerCell = row.locator('td').nth(5)
    const rstSentCell = row.locator('td').nth(6)
    const rstRcvdCell = row.locator('td').nth(7)

    await expect(powerCell).toContainText('—')
    await expect(rstSentCell).toContainText('—')
    await expect(rstRcvdCell).toContainText('—')
  })

  test('should cancel and return to logbook without saving', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Fill some fields
    await page.fill('#callsign', 'W1ABC')
    await page.fill('#date', '2025-01-20')

    // Click cancel link
    await page.click('a:has-text("Cancel")')

    // Should navigate back to logbook
    await expect(page).toHaveURL(/#\/logbook/)

    // Should still show empty state (nothing was saved)
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should show actions menu with edit and delete options', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Add a contact first
    await page.fill('#callsign', 'W1ABC')
    await page.fill('#date', '2025-01-20')
    await page.fill('#time', '14:00:00')
    await page.fill('#frequency', '14.250')
    await page.selectOption('#mode', 'SSB')
    await page.click('button[type="submit"]')

    // Wait for logbook page
    await page.waitForSelector('.contact-table')

    // Find and click the dropdown menu button (⋮)
    const dropdownButton = page.locator('.dropdown-button').first()
    await expect(dropdownButton).toBeVisible()
    await dropdownButton.click()

    // Verify dropdown menu appears with Edit and Delete options
    await expect(page.locator('.dropdown-content')).toBeVisible()
    await expect(page.locator('.dropdown-content button:has-text("Edit")')).toBeVisible()
    await expect(page.locator('.dropdown-content button:has-text("Delete")')).toBeVisible()
  })

  test('should edit an existing contact', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Add a contact first
    await page.fill('#callsign', 'W1ABC')
    await page.fill('#date', '2025-01-20')
    await page.fill('#time', '14:00:00')
    await page.fill('#frequency', '14.250')
    await page.selectOption('#mode', 'SSB')
    await page.fill('#remarks', 'Original remark')
    await page.click('button[type="submit"]')

    // Wait for logbook page
    await page.waitForSelector('.contact-table')

    // Click dropdown menu and select Edit
    await page.locator('.dropdown-button').first().click()
    await page.locator('.dropdown-content button:has-text("Edit")').click()

    // Should navigate to edit page
    await expect(page).toHaveURL(/#\/logbook\/edit\/\d+/)

    // Verify page title changed to "Edit Contact"
    await expect(page.locator('h1')).toContainText('Edit Contact')

    // Verify form is pre-filled with existing data
    await expect(page.locator('#callsign')).toHaveValue('W1ABC')
    await expect(page.locator('#date')).toHaveValue('2025-01-20')
    await expect(page.locator('#frequency')).toHaveValue('14.25')
    await expect(page.locator('#remarks')).toHaveValue('Original remark')

    // Edit the contact
    await page.fill('#callsign', 'K2XYZ')
    await page.fill('#remarks', 'Updated remark')

    // Submit the changes
    await page.click('button[type="submit"]')

    // Should navigate back to logbook
    await expect(page).toHaveURL(/#\/logbook/)
    await page.waitForSelector('.contact-table')

    // Verify changes are reflected in the table
    await expect(page.locator('.contact-table')).toContainText('K2XYZ')
    await expect(page.locator('.contact-table')).toContainText('Updated remark')
    await expect(page.locator('.contact-table')).not.toContainText('W1ABC')
  })

  test('should show delete confirmation modal', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Add a contact
    await page.fill('#callsign', 'W1ABC')
    await page.fill('#date', '2025-01-20')
    await page.fill('#time', '14:00:00')
    await page.fill('#frequency', '14.250')
    await page.selectOption('#mode', 'SSB')
    await page.fill('#remarks', 'Test contact')
    await page.click('button[type="submit"]')

    // Wait for logbook page
    await page.waitForSelector('.contact-table')

    // Click dropdown menu and select Delete
    await page.locator('.dropdown-button').first().click()
    await page.locator('.dropdown-content button:has-text("Delete")').click()

    // Verify modal appears
    await expect(page.locator('.modal-backdrop')).toBeVisible()
    await expect(page.locator('.modal-header h2')).toContainText('Delete Contact')

    // Verify contact info is shown in modal
    await expect(page.locator('.modal-body')).toContainText('W1ABC')
    await expect(page.locator('.modal-body')).toContainText('2025-01-20')
    await expect(page.locator('.modal-body')).toContainText('14.25')
    await expect(page.locator('.modal-body')).toContainText('SSB')

    // Verify buttons are present
    await expect(page.locator('.modal-footer button:has-text("Cancel")')).toBeVisible()
    await expect(page.locator('.modal-footer button:has-text("Delete Contact")')).toBeVisible()
  })

  test('should delete contact after confirmation', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Add a contact
    await page.fill('#callsign', 'W1ABC')
    await page.fill('#date', '2025-01-20')
    await page.fill('#time', '14:00:00')
    await page.fill('#frequency', '14.250')
    await page.selectOption('#mode', 'SSB')
    await page.click('button[type="submit"]')

    // Wait for logbook page
    await page.waitForSelector('.contact-table')
    await expect(page.locator('.count')).toContainText('(1')

    // Click dropdown menu and select Delete
    await page.locator('.dropdown-button').first().click()
    await page.locator('.dropdown-content button:has-text("Delete")').click()

    // Confirm deletion
    await page.locator('.modal-footer button:has-text("Delete Contact")').click()

    // Modal should close and contact should be removed
    await expect(page.locator('.modal-backdrop')).not.toBeVisible()
    await expect(page.locator('.empty-state')).toBeVisible()
    await expect(page.locator('.count')).toContainText('(0')
  })

  test('should cancel deletion and keep contact', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Add a contact
    await page.fill('#callsign', 'W1ABC')
    await page.fill('#date', '2025-01-20')
    await page.fill('#time', '14:00:00')
    await page.fill('#frequency', '14.250')
    await page.selectOption('#mode', 'SSB')
    await page.click('button[type="submit"]')

    // Wait for logbook page
    await page.waitForSelector('.contact-table')

    // Click dropdown menu and select Delete
    await page.locator('.dropdown-button').first().click()
    await page.locator('.dropdown-content button:has-text("Delete")').click()

    // Cancel deletion
    await page.locator('.modal-footer button:has-text("Cancel")').click()

    // Modal should close and contact should still be there
    await expect(page.locator('.modal-backdrop')).not.toBeVisible()
    await expect(page.locator('.contact-table')).toContainText('W1ABC')
    await expect(page.locator('.count')).toContainText('(1')
  })

  test('should close delete modal with Escape key', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Add a contact
    await page.fill('#callsign', 'W1ABC')
    await page.fill('#date', '2025-01-20')
    await page.fill('#time', '14:00:00')
    await page.fill('#frequency', '14.250')
    await page.selectOption('#mode', 'SSB')
    await page.click('button[type="submit"]')

    // Wait for logbook page
    await page.waitForSelector('.contact-table')

    // Open delete modal
    await page.locator('.dropdown-button').first().click()
    await page.locator('.dropdown-content button:has-text("Delete")').click()

    // Press Escape key
    await page.keyboard.press('Escape')

    // Modal should close
    await expect(page.locator('.modal-backdrop')).not.toBeVisible()
    await expect(page.locator('.contact-table')).toContainText('W1ABC')
  })
})
