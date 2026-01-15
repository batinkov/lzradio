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
    await expect(page.locator('h1')).toContainText('The logbook of')

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

    // Wait for page to load
    await page.waitForSelector('h1')

    // Click Add Contact button (should be visible even with no contacts)
    await page.click('.actions-right .btn-primary:has-text("Add")')

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

    // Find and click the dropdown menu button (⋮) in the table row
    const dropdownButton = page.locator('.contact-table .dropdown-button').first()
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
    await page.locator('.contact-table .dropdown-button').first().click()
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
    await page.locator('.contact-table .dropdown-button').first().click()
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
    await page.locator('.contact-table .dropdown-button').first().click()
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
    await page.locator('.contact-table .dropdown-button').first().click()
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
    await page.locator('.contact-table .dropdown-button').first().click()
    await page.locator('.dropdown-content button:has-text("Delete")').click()

    // Press Escape key
    await page.keyboard.press('Escape')

    // Modal should close
    await expect(page.locator('.modal-backdrop')).not.toBeVisible()
    await expect(page.locator('.contact-table')).toContainText('W1ABC')
  })

  test('should export contacts to JSON file', async ({ page }) => {
    await page.goto('/#/logbook/add')

    // Add a contact
    await page.fill('#callsign', 'W1ABC/M')
    await page.fill('#date', '2025-01-20')
    await page.fill('#time', '14:00:00')
    await page.fill('#frequency', '14.250')
    await page.selectOption('#mode', 'SSB')
    await page.fill('#power', '100')
    await page.fill('#rstSent', '59')
    await page.fill('#rstReceived', '57')
    await page.check('#qslSent')
    await page.fill('#remarks', 'Test contact')
    await page.click('button[type="submit"]')

    // Wait for logbook page
    await page.waitForSelector('.contact-table')

    // Open the actions dropdown menu
    await page.locator('.actions-right .dropdown-button').click()

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download')
    await page.locator('button:has-text("Export")').click()
    const download = await downloadPromise

    // Verify filename pattern
    expect(download.suggestedFilename()).toMatch(/^lzradio-logbook-\d{4}-\d{2}-\d{2}\.json$/)

    // Read and parse the downloaded file
    const path = await download.path()
    const fs = await import('fs')
    const content = fs.readFileSync(path, 'utf8')
    const exportData = JSON.parse(content)

    // Verify structure
    expect(exportData.metadata).toBeDefined()
    expect(exportData.metadata.appName).toBe('LZ Radio')
    expect(exportData.metadata.schemaVersion).toBe(1)
    expect(exportData.metadata.contactCount).toBe(1)
    expect(exportData.contacts).toHaveLength(1)

    // Verify contact data
    const contact = exportData.contacts[0]
    expect(contact.baseCallsign).toBe('W1ABC')
    expect(contact.suffix).toBe('M')
    expect(contact.date).toBe('2025-01-20')
    expect(contact.time).toBe('14:00:00')
    expect(contact.frequency).toBe(14.25)
    expect(contact.mode).toBe('SSB')
    expect(contact.power).toBe(100)
    expect(contact.rstSent).toBe('59')
    expect(contact.rstReceived).toBe('57')
    expect(contact.qslSent).toBe(true)
    expect(contact.remarks).toBe('Test contact')

    // Verify success toast appears
    const toast = page.locator('.toast-success')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('1 contact exported')
    await expect(toast).toContainText('2025-01-20')
    await expect(toast).toContainText('KB')

    // Verify toast auto-dismisses
    await expect(toast).not.toBeVisible({ timeout: 5000 })
  })

  test('should show warning toast when exporting with no contacts', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add a contact to make actions bar visible
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')
      await addContact({
        baseCallsign: 'W1ABC',
        prefix: null,
        suffix: null,
        date: '2025-01-20',
        time: '14:00:00',
        frequency: 14.25,
        mode: 'SSB'
      })
    })

    await page.reload()
    await page.waitForSelector('.contact-table')

    // Clear database directly without UI interaction so actions bar stays visible
    await page.evaluate(async () => {
      const { getAllContacts, deleteContact } = await import('/src/lib/logbookDB.js')
      const contacts = await getAllContacts()
      for (const contact of contacts) {
        await deleteContact(contact.id)
      }
    })

    // Open the actions dropdown menu (still visible because we didn't reload)
    await page.locator('.actions-right .dropdown-button').click()

    // Click export button
    await page.locator('button:has-text("Export")').click()

    // Verify warning toast appears
    const toast = page.locator('.toast-warning')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('No contacts to export')

    // Verify toast auto-dismisses
    await expect(toast).not.toBeVisible({ timeout: 4000 })
  })

  test('should import contacts from valid JSON file', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add a dummy contact so actions bar appears
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')
      await addContact({
        baseCallsign: 'DUMMY',
        prefix: null,
        suffix: null,
        date: '2025-01-01',
        time: '12:00:00',
        frequency: 14.0,
        mode: 'SSB'
      })
    })

    await page.reload()
    await page.waitForSelector('.contact-table')

    // Create test import file
    const importData = {
      metadata: {
        appName: 'LZ Radio',
        appVersion: '1.0.0',
        exportDate: '2025-01-20T10:00:00.000Z',
        contactCount: 2,
        schemaVersion: 1
      },
      contacts: [
        {
          baseCallsign: 'K2XYZ',
          prefix: null,
          suffix: null,
          date: '2025-01-21',
          time: '10:00:00',
          frequency: 7.1,
          mode: 'CW',
          power: 50,
          rstSent: '599',
          rstReceived: '599',
          qslSent: false,
          qslReceived: false,
          remarks: 'Nice QSO'
        },
        {
          baseCallsign: 'DL5ABC',
          prefix: null,
          suffix: 'P',
          date: '2025-01-22',
          time: '15:30:00',
          frequency: 21.2,
          mode: 'FT8',
          power: null,
          rstSent: null,
          rstReceived: null,
          qslSent: false,
          qslReceived: false,
          remarks: ''
        }
      ]
    }

    // Setup file chooser
    const fileChooserPromise = page.waitForEvent('filechooser')

    // Open the actions dropdown menu
    await page.locator('.actions-right .dropdown-button').click()

    await page.locator('button:has-text("Import")').click()
    const fileChooser = await fileChooserPromise

    // Create a temporary file
    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    const tmpFile = path.join(os.tmpdir(), 'test-import.json')
    fs.writeFileSync(tmpFile, JSON.stringify(importData))

    // Select the file
    await fileChooser.setFiles(tmpFile)

    // Wait for preview modal to appear
    await page.waitForSelector('.modal-backdrop')
    await expect(page.locator('.modal-header h2')).toContainText('Import LogBook Contacts')

    // Verify statistics (we have 1 DUMMY contact already)
    await expect(page.locator('.stat-row').nth(0)).toContainText('Existing contacts in your logbook:')
    await expect(page.locator('.stat-row').nth(0)).toContainText('1')
    await expect(page.locator('.stat-row').nth(1)).toContainText('Total contacts in import file:')
    await expect(page.locator('.stat-row').nth(1)).toContainText('2')
    await expect(page.locator('.stat-row').nth(2)).toContainText('New contacts to be imported:')
    await expect(page.locator('.stat-row').nth(2)).toContainText('2')

    // Confirm import
    await page.locator('.modal-footer button:has-text("Import")').click()

    // Wait for and verify success toast
    const toast = page.locator('.toast-success')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('Imported 2 contacts')

    // Verify contacts are displayed (3 total: 1 DUMMY + 2 imported)
    await expect(page.locator('.count')).toContainText('(3')
    await expect(page.locator('.contact-table')).toContainText('K2XYZ')
    await expect(page.locator('.contact-table')).toContainText('DL5ABC/P')

    // Cleanup
    fs.unlinkSync(tmpFile)
  })

  test('should detect and skip duplicate contacts during import', async ({ page }) => {
    // First, add a contact directly
    await page.goto('/#/logbook/add')
    await page.fill('#callsign', 'K2XYZ')
    await page.fill('#date', '2025-01-21')
    await page.fill('#time', '10:00:00')
    await page.fill('#frequency', '7.1')
    await page.selectOption('#mode', 'CW')
    await page.click('button[type="submit"]')
    await page.waitForSelector('.contact-table')

    // Now import file with 2 contacts (1 duplicate, 1 new)
    const importData = {
      metadata: {
        appName: 'LZ Radio',
        schemaVersion: 1,
        contactCount: 2
      },
      contacts: [
        {
          baseCallsign: 'K2XYZ',
          prefix: null,
          suffix: null,
          date: '2025-01-21',
          time: '10:00:00',
          frequency: 7.1,
          mode: 'CW',
          power: null,
          rstSent: null,
          rstReceived: null,
          qslSent: false,
          qslReceived: false,
          remarks: ''
        },
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-22',
          time: '11:00:00',
          frequency: 14.25,
          mode: 'SSB',
          power: null,
          rstSent: null,
          rstReceived: null,
          qslSent: false,
          qslReceived: false,
          remarks: ''
        }
      ]
    }

    const fileChooserPromise = page.waitForEvent('filechooser')

    // Open the actions dropdown menu
    await page.locator('.actions-right .dropdown-button').click()

    await page.locator('button:has-text("Import")').click()
    const fileChooser = await fileChooserPromise

    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    const tmpFile = path.join(os.tmpdir(), 'test-import-dup.json')
    fs.writeFileSync(tmpFile, JSON.stringify(importData))
    await fileChooser.setFiles(tmpFile)

    // Wait for preview modal
    await page.waitForSelector('.modal-backdrop')

    // Verify statistics show duplicate detection
    await expect(page.locator('.stat-row').nth(0)).toContainText('1') // Existing
    await expect(page.locator('.stat-row').nth(1)).toContainText('2') // Total in file
    await expect(page.locator('.stat-row').nth(2)).toContainText('1') // New
    await expect(page.locator('.stat-row').nth(3)).toContainText('Duplicate contacts (skipped):')
    await expect(page.locator('.stat-row').nth(3)).toContainText('1')

    // Verify duplicate is listed
    await expect(page.locator('.duplicates-section')).toBeVisible()
    await expect(page.locator('.duplicate-list')).toContainText('K2XYZ on 2025-01-21 at 10:00:00')

    // Confirm import
    await page.locator('.modal-footer button:has-text("Import")').click()

    // Wait for and verify success toast
    const toast = page.locator('.toast-success')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('Imported 1 contact')

    // Verify only 1 new contact was imported
    await expect(page.locator('.count')).toContainText('(2') // Still only 2 total

    fs.unlinkSync(tmpFile)
  })

  test('should show message when all contacts are duplicates', async ({ page }) => {
    // Add a contact
    await page.goto('/#/logbook/add')
    await page.fill('#callsign', 'K2XYZ')
    await page.fill('#date', '2025-01-21')
    await page.fill('#time', '10:00:00')
    await page.fill('#frequency', '7.1')
    await page.selectOption('#mode', 'CW')
    await page.click('button[type="submit"]')
    await page.waitForSelector('.contact-table')

    // Import file with only the duplicate contact
    const importData = {
      metadata: {
        appName: 'LZ Radio',
        schemaVersion: 1,
        contactCount: 1
      },
      contacts: [
        {
          baseCallsign: 'K2XYZ',
          prefix: null,
          suffix: null,
          date: '2025-01-21',
          time: '10:00:00',
          frequency: 7.1,
          mode: 'CW',
          power: null,
          rstSent: null,
          rstReceived: null,
          qslSent: false,
          qslReceived: false,
          remarks: ''
        }
      ]
    }

    const fileChooserPromise = page.waitForEvent('filechooser')

    // Open the actions dropdown menu
    await page.locator('.actions-right .dropdown-button').click()

    await page.locator('button:has-text("Import")').click()
    const fileChooser = await fileChooserPromise

    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    const tmpFile = path.join(os.tmpdir(), 'test-import-all-dup.json')
    fs.writeFileSync(tmpFile, JSON.stringify(importData))
    await fileChooser.setFiles(tmpFile)

    await page.waitForSelector('.modal-backdrop')

    // Verify warning message is shown
    await expect(page.locator('.warning-box')).toBeVisible()
    await expect(page.locator('.warning-box')).toContainText(
      'All contacts in this file already exist in your logbook'
    )
    await expect(page.locator('.warning-box')).toContainText('No new contacts to import')

    // Verify OK button instead of Import button
    await expect(page.locator('.modal-footer button:has-text("OK")')).toBeVisible()
    await expect(page.locator('.modal-footer button:has-text("Import")')).not.toBeVisible()

    // Click OK to close
    await page.locator('.modal-footer button:has-text("OK")').click()
    await expect(page.locator('.modal-backdrop')).not.toBeVisible()

    fs.unlinkSync(tmpFile)
  })

  test('should reject invalid JSON file', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add a dummy contact so actions bar appears
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')
      await addContact({
        baseCallsign: 'DUMMY',
        prefix: null,
        suffix: null,
        date: '2025-01-01',
        time: '12:00:00',
        frequency: 14.0,
        mode: 'SSB'
      })
    })

    await page.reload()
    await page.waitForSelector('.contact-table')

    const fileChooserPromise = page.waitForEvent('filechooser')

    // Open the actions dropdown menu
    await page.locator('.actions-right .dropdown-button').click()

    await page.locator('button:has-text("Import")').click()
    const fileChooser = await fileChooserPromise

    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    const tmpFile = path.join(os.tmpdir(), 'test-invalid.json')
    fs.writeFileSync(tmpFile, 'not valid json {{{')

    // Setup dialog promise before setting files
    const dialogPromise = page.waitForEvent('dialog')
    await fileChooser.setFiles(tmpFile)

    // Wait for and verify alert
    const dialog = await dialogPromise
    expect(dialog.message()).toBe('Invalid JSON file. Please select a valid LZ Radio export file.')
    await dialog.accept()

    fs.unlinkSync(tmpFile)
  })

  test('should reject non-LZ Radio export file', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add a dummy contact so actions bar appears
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')
      await addContact({
        baseCallsign: 'DUMMY',
        prefix: null,
        suffix: null,
        date: '2025-01-01',
        time: '12:00:00',
        frequency: 14.0,
        mode: 'SSB'
      })
    })

    await page.reload()
    await page.waitForSelector('.contact-table')

    const importData = {
      metadata: {
        appName: 'Some Other App',
        schemaVersion: 1
      },
      contacts: []
    }

    const fileChooserPromise = page.waitForEvent('filechooser')

    // Open the actions dropdown menu
    await page.locator('.actions-right .dropdown-button').click()

    await page.locator('button:has-text("Import")').click()
    const fileChooser = await fileChooserPromise

    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    const tmpFile = path.join(os.tmpdir(), 'test-other-app.json')
    fs.writeFileSync(tmpFile, JSON.stringify(importData))

    // Setup dialog promise before setting files
    const dialogPromise = page.waitForEvent('dialog')
    await fileChooser.setFiles(tmpFile)

    // Wait for and verify alert
    const dialog = await dialogPromise
    expect(dialog.message()).toContain('This file was not exported from LZ Radio')
    await dialog.accept()

    fs.unlinkSync(tmpFile)
  })

  test('should reject file with missing required fields', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add a dummy contact so actions bar appears
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')
      await addContact({
        baseCallsign: 'DUMMY',
        prefix: null,
        suffix: null,
        date: '2025-01-01',
        time: '12:00:00',
        frequency: 14.0,
        mode: 'SSB'
      })
    })

    await page.reload()
    await page.waitForSelector('.contact-table')

    const importData = {
      metadata: {
        appName: 'LZ Radio',
        schemaVersion: 1,
        contactCount: 1
      },
      contacts: [
        {
          baseCallsign: 'W1ABC',
          date: '2025-01-21',
          // Missing time, frequency, mode
          power: null,
          rstSent: null,
          rstReceived: null,
          qslSent: false,
          qslReceived: false,
          remarks: ''
        }
      ]
    }

    const fileChooserPromise = page.waitForEvent('filechooser')

    // Open the actions dropdown menu
    await page.locator('.actions-right .dropdown-button').click()

    await page.locator('button:has-text("Import")').click()
    const fileChooser = await fileChooserPromise

    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    const tmpFile = path.join(os.tmpdir(), 'test-missing-fields.json')
    fs.writeFileSync(tmpFile, JSON.stringify(importData))

    // Setup dialog promise before setting files
    const dialogPromise = page.waitForEvent('dialog')
    await fileChooser.setFiles(tmpFile)

    // Wait for and verify alert
    const dialog = await dialogPromise
    expect(dialog.message()).toContain('Import validation failed')
    expect(dialog.message()).toContain('missing required field')
    await dialog.accept()

    fs.unlinkSync(tmpFile)
  })

  test('should cancel import and close modal', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add a dummy contact so actions bar appears
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')
      await addContact({
        baseCallsign: 'DUMMY',
        prefix: null,
        suffix: null,
        date: '2025-01-01',
        time: '12:00:00',
        frequency: 14.0,
        mode: 'SSB'
      })
    })

    await page.reload()
    await page.waitForSelector('.contact-table')

    const importData = {
      metadata: {
        appName: 'LZ Radio',
        schemaVersion: 1,
        contactCount: 1
      },
      contacts: [
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-21',
          time: '10:00:00',
          frequency: 14.25,
          mode: 'SSB',
          power: null,
          rstSent: null,
          rstReceived: null,
          qslSent: false,
          qslReceived: false,
          remarks: ''
        }
      ]
    }

    const fileChooserPromise = page.waitForEvent('filechooser')

    // Open the actions dropdown menu
    await page.locator('.actions-right .dropdown-button').click()

    await page.locator('button:has-text("Import")').click()
    const fileChooser = await fileChooserPromise

    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    const tmpFile = path.join(os.tmpdir(), 'test-cancel.json')
    fs.writeFileSync(tmpFile, JSON.stringify(importData))
    await fileChooser.setFiles(tmpFile)

    await page.waitForSelector('.modal-backdrop')

    // Click Cancel
    await page.locator('.modal-footer button:has-text("Cancel")').click()

    // Modal should close
    await expect(page.locator('.modal-backdrop')).not.toBeVisible()

    // Verify no contacts were imported (still just the DUMMY contact)
    await expect(page.locator('.count')).toContainText('(1')
    await expect(page.locator('.contact-table')).toContainText('DUMMY')

    fs.unlinkSync(tmpFile)
  })

  test('should close import modal with Escape key', async ({ page }) => {
    await page.goto('/#/logbook')

    // Add a dummy contact so actions bar appears
    await page.evaluate(async () => {
      const { addContact } = await import('/src/lib/logbookDB.js')
      await addContact({
        baseCallsign: 'DUMMY',
        prefix: null,
        suffix: null,
        date: '2025-01-01',
        time: '12:00:00',
        frequency: 14.0,
        mode: 'SSB'
      })
    })

    await page.reload()
    await page.waitForSelector('.contact-table')

    const importData = {
      metadata: {
        appName: 'LZ Radio',
        schemaVersion: 1,
        contactCount: 1
      },
      contacts: [
        {
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-21',
          time: '10:00:00',
          frequency: 14.25,
          mode: 'SSB',
          power: null,
          rstSent: null,
          rstReceived: null,
          qslSent: false,
          qslReceived: false,
          remarks: ''
        }
      ]
    }

    const fileChooserPromise = page.waitForEvent('filechooser')

    // Open the actions dropdown menu
    await page.locator('.actions-right .dropdown-button').click()

    await page.locator('button:has-text("Import")').click()
    const fileChooser = await fileChooserPromise

    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    const tmpFile = path.join(os.tmpdir(), 'test-escape.json')
    fs.writeFileSync(tmpFile, JSON.stringify(importData))
    await fileChooser.setFiles(tmpFile)

    await page.waitForSelector('.modal-backdrop')

    // Press Escape
    await page.keyboard.press('Escape')

    // Modal should close
    await expect(page.locator('.modal-backdrop')).not.toBeVisible()

    // Verify no contacts were imported (still just the DUMMY contact)
    await expect(page.locator('.count')).toContainText('(1')

    fs.unlinkSync(tmpFile)
  })

  test.describe('Search Functionality', () => {
    test('should show disabled search bar when no contacts exist', async ({ page }) => {
      await page.goto('/#/logbook')

      // Verify search bar is visible
      await expect(page.locator('.search-container')).toBeVisible()

      // Verify search input is disabled
      await expect(page.locator('.search-input')).toBeDisabled()

      // Verify the wrapper has disabled class
      await expect(page.locator('.search-input-wrapper')).toHaveClass(/disabled/)

      // Verify Add Contact button IS visible (critical for UX)
      await expect(page.locator('.actions-right .btn-primary:has-text("Add")')).toBeVisible()

      // Verify empty state
      await expect(page.locator('.empty-state')).toBeVisible()
    })

    test('should show enabled search bar when contacts exist', async ({ page }) => {
      await page.goto('/#/logbook')

      // Add a contact
      await page.evaluate(async () => {
        const { addContact } = await import('/src/lib/logbookDB.js')
        await addContact({
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:00:00',
          frequency: 14.25,
          mode: 'SSB'
        })
      })

      await page.reload()
      await page.waitForSelector('.contact-table')

      // Verify search bar is visible
      await expect(page.locator('.search-container')).toBeVisible()
      await expect(page.locator('.search-input')).toBeVisible()

      // Verify search input is NOT disabled (enabled)
      await expect(page.locator('.search-input')).toBeEnabled()

      // Verify the wrapper does NOT have disabled class
      await expect(page.locator('.search-input-wrapper')).not.toHaveClass(/disabled/)
    })

    test('should filter contacts based on search query', async ({ page }) => {
      await page.goto('/#/logbook')

      // Add multiple contacts
      await page.evaluate(async () => {
        const { addContact } = await import('/src/lib/logbookDB.js')

        await addContact({
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:00:00',
          frequency: 14.25,
          mode: 'SSB',
          remarks: 'First contact'
        })

        await addContact({
          baseCallsign: 'K2XYZ',
          prefix: null,
          suffix: null,
          date: '2025-01-19',
          time: '13:00:00',
          frequency: 7.1,
          mode: 'CW',
          remarks: 'Second contact'
        })

        await addContact({
          baseCallsign: 'LZ1DEF',
          prefix: null,
          suffix: null,
          date: '2025-01-18',
          time: '12:00:00',
          frequency: 21.2,
          mode: 'FT8',
          remarks: 'Third contact'
        })
      })

      await page.reload()
      await page.waitForSelector('.contact-table')

      // Verify all 3 contacts are shown initially
      let rows = page.locator('.contact-table tbody tr')
      await expect(rows).toHaveCount(3)

      // Type search query
      await page.fill('.search-input', 'W1ABC')

      // Wait for filtering to occur
      await page.waitForTimeout(100)

      // Verify only 1 contact is shown
      rows = page.locator('.contact-table tbody tr')
      await expect(rows).toHaveCount(1)
      await expect(rows.first()).toContainText('W1ABC')

      // Verify search status is shown
      await expect(page.locator('.search-status')).toBeVisible()
      await expect(page.locator('.result-count')).toContainText('Showing 1 of 3 contacts')
    })

    test('should clear search when X button is clicked', async ({ page }) => {
      await page.goto('/#/logbook')

      // Add contacts
      await page.evaluate(async () => {
        const { addContact } = await import('/src/lib/logbookDB.js')
        await addContact({
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:00:00',
          frequency: 14.25,
          mode: 'SSB'
        })
        await addContact({
          baseCallsign: 'K2XYZ',
          prefix: null,
          suffix: null,
          date: '2025-01-19',
          time: '13:00:00',
          frequency: 7.1,
          mode: 'CW'
        })
      })

      await page.reload()
      await page.waitForSelector('.contact-table')

      // Type search query
      await page.fill('.search-input', 'W1ABC')
      await page.waitForTimeout(100)

      // Verify clear button appears
      await expect(page.locator('.clear-button')).toBeVisible()

      // Click clear button
      await page.click('.clear-button')

      // Verify search is cleared
      await expect(page.locator('.search-input')).toHaveValue('')
      await expect(page.locator('.clear-button')).not.toBeVisible()

      // Verify all contacts are shown again
      const rows = page.locator('.contact-table tbody tr')
      await expect(rows).toHaveCount(2)
    })

    test('should show "No results found" when search has no matches', async ({ page }) => {
      await page.goto('/#/logbook')

      // Add a contact
      await page.evaluate(async () => {
        const { addContact } = await import('/src/lib/logbookDB.js')
        await addContact({
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:00:00',
          frequency: 14.25,
          mode: 'SSB'
        })
      })

      await page.reload()
      await page.waitForSelector('.contact-table')

      // Search for non-existent callsign
      await page.fill('.search-input', 'ZZ9ZZZ')
      await page.waitForTimeout(100)

      // Verify "No results found" message
      await expect(page.locator('.no-results')).toBeVisible()
      await expect(page.locator('.no-results')).toContainText('No results found')

      // Verify table still exists but has no rows
      const rows = page.locator('.contact-table tbody tr')
      await expect(rows).toHaveCount(0)
    })

    test('should perform fuzzy matching on callsigns', async ({ page }) => {
      await page.goto('/#/logbook')

      // Add contacts with similar callsigns
      await page.evaluate(async () => {
        const { addContact } = await import('/src/lib/logbookDB.js')

        await addContact({
          baseCallsign: 'LZ1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:00:00',
          frequency: 14.25,
          mode: 'SSB'
        })

        await addContact({
          baseCallsign: 'LZ1XBC',
          prefix: null,
          suffix: null,
          date: '2025-01-19',
          time: '13:00:00',
          frequency: 7.1,
          mode: 'CW'
        })

        await addContact({
          baseCallsign: 'K2XYZ',
          prefix: null,
          suffix: null,
          date: '2025-01-18',
          time: '12:00:00',
          frequency: 21.2,
          mode: 'FT8'
        })
      })

      await page.reload()
      await page.waitForSelector('.contact-table')

      // Search for "LZ1ABC" should find both LZ1ABC and LZ1XBC (fuzzy match)
      await page.fill('.search-input', 'LZ1ABC')
      await page.waitForTimeout(100)

      // Verify both similar callsigns are found
      const rows = page.locator('.contact-table tbody tr')
      const rowCount = await rows.count()
      expect(rowCount).toBeGreaterThanOrEqual(2)

      // Verify both callsigns appear
      const tableText = await page.locator('.contact-table').textContent()
      expect(tableText).toContain('LZ1ABC')
      expect(tableText).toContain('LZ1XBC')
    })

    test('should highlight matched text in search results', async ({ page }) => {
      await page.goto('/#/logbook')

      // Add a contact
      await page.evaluate(async () => {
        const { addContact } = await import('/src/lib/logbookDB.js')
        await addContact({
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:00:00',
          frequency: 14.25,
          mode: 'SSB',
          remarks: 'Test ARRL contact'
        })
      })

      await page.reload()
      await page.waitForSelector('.contact-table')

      // Search for "ABC"
      await page.fill('.search-input', 'ABC')
      await page.waitForTimeout(100)

      // Verify <mark> tag is present in the callsign cell
      const callsignCell = page.locator('.contact-table tbody tr td').first()
      const html = await callsignCell.innerHTML()
      expect(html).toContain('<mark>')
      expect(html).toContain('ABC')
      expect(html).toContain('</mark>')
    })

    test('should focus search input when Ctrl+F is pressed', async ({ page }) => {
      await page.goto('/#/logbook')

      // Add a contact
      await page.evaluate(async () => {
        const { addContact } = await import('/src/lib/logbookDB.js')
        await addContact({
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:00:00',
          frequency: 14.25,
          mode: 'SSB'
        })
      })

      await page.reload()
      await page.waitForSelector('.contact-table')

      // Dispatch Ctrl+F keyboard event programmatically to avoid browser's native find dialog
      await page.evaluate(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'f',
          code: 'KeyF',
          ctrlKey: true,
          bubbles: true,
          cancelable: true
        })
        window.dispatchEvent(event)
      })

      // Wait a moment for focus to happen
      await page.waitForTimeout(100)

      // Verify search input is focused
      const searchInput = page.locator('.search-input')
      await expect(searchInput).toBeFocused()
    })

    test('should search in remarks field', async ({ page }) => {
      await page.goto('/#/logbook')

      // Add contacts with different remarks
      await page.evaluate(async () => {
        const { addContact } = await import('/src/lib/logbookDB.js')

        await addContact({
          baseCallsign: 'W1ABC',
          prefix: null,
          suffix: null,
          date: '2025-01-20',
          time: '14:00:00',
          frequency: 14.25,
          mode: 'SSB',
          remarks: 'ARRL headquarters'
        })

        await addContact({
          baseCallsign: 'K2XYZ',
          prefix: null,
          suffix: null,
          date: '2025-01-19',
          time: '13:00:00',
          frequency: 7.1,
          mode: 'CW',
          remarks: 'Contest QSO'
        })
      })

      await page.reload()
      await page.waitForSelector('.contact-table')

      // Search for text in remarks
      await page.fill('.search-input', 'ARRL')
      await page.waitForTimeout(100)

      // Verify only matching contact is shown
      const rows = page.locator('.contact-table tbody tr')
      await expect(rows).toHaveCount(1)
      await expect(rows.first()).toContainText('W1ABC')
      await expect(rows.first()).toContainText('ARRL headquarters')
    })
  })
})
