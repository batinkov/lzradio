<script>
  import { onMount, onDestroy } from 'svelte'
  import { link, push } from 'svelte-spa-router'
  import { _ } from 'svelte-i18n'
  import { getAllContacts, getContactCount, deleteContact, addContact } from '../lib/logbookDB.js'
  import { buildCallsign } from '../lib/callsignParser.js'
  import { validateImportData, normalizeContact } from '../lib/importValidator.js'
  import { calculateImportStatistics } from '../lib/importStatistics.js'
  import { toast } from '../lib/toastStore.js'
  import { getStationCallsign, setStationCallsign } from '../lib/logbookSettings.js'
  import { createFuseInstance, filterContacts, highlightMatch } from '../lib/logbookSearch.js'
  import DropdownMenu from '../components/shared/DropdownMenu.svelte'
  import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal.svelte'
  import ImportPreviewModal from '../components/shared/ImportPreviewModal.svelte'
  import SettingsModal from '../components/shared/SettingsModal.svelte'
  import Banner from '../components/shared/Banner.svelte'

  let contacts = []
  let contactCount = 0
  let loading = true
  let contactToDelete = null
  let deleting = false
  let importData = null
  let importStatistics = null
  let importing = false
  let settingsModalOpen = false
  let stationCallsign = null
  let shouldSetCallsign = null

  // Search state
  let searchQuery = ''
  let searchInput
  let debounceTimer

  onMount(async () => {
    await loadContacts()
    stationCallsign = getStationCallsign()
  })

  async function loadContacts() {
    loading = true
    try {
      contacts = await getAllContacts()
      contactCount = await getContactCount()
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      loading = false
    }
  }

  function handleEdit(contactId) {
    push(`/logbook/edit/${contactId}`)
  }

  function confirmDelete(contact) {
    contactToDelete = contact
  }

  function cancelDelete() {
    contactToDelete = null
  }

  async function handleDelete() {
    if (!contactToDelete) return

    deleting = true
    try {
      await deleteContact(contactToDelete.id)
      await loadContacts()
      contactToDelete = null
    } catch (error) {
      console.error('Failed to delete contact:', error)
      alert('Failed to delete contact. Please try again.')
    } finally {
      deleting = false
    }
  }

  async function handleExport() {
    try {
      const allContacts = await getAllContacts()

      if (allContacts.length === 0) {
        toast.warning($_('logbook.noContactsToExport'))
        return
      }

      const userCallsign = getStationCallsign()

      // Create export data structure
      const exportData = {
        metadata: {
          appName: 'LZ Radio',
          appVersion: '1.0.0',
          exportDate: new Date().toISOString(),
          contactCount: allContacts.length,
          schemaVersion: 1,
          stationCallsign: userCallsign
        },
        contacts: allContacts
      }

      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(exportData, null, 2)

      // Calculate file size
      const sizeInKB = (new Blob([jsonString]).size / 1024).toFixed(1)

      // Calculate date range
      const dates = allContacts.map((c) => c.date).sort()
      const dateRange =
        dates.length > 1 ? `${dates[0]} to ${dates[dates.length - 1]}` : dates[0]

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Include callsign in filename if set
      const callsignPart = userCallsign ? `-${userCallsign}` : ''
      const fileName = `lzradio-logbook${callsignPart}-${new Date().toISOString().split('T')[0]}.json`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Show success toast with statistics
      const contactLabel =
        allContacts.length === 1
          ? $_('logbook.exportSuccess')
          : $_('logbook.exportSuccessPlural')
      toast.success(`✓ ${allContacts.length} ${contactLabel} • ${dateRange} • ${sizeInKB} KB`, 4000)
    } catch (error) {
      console.error('Failed to export contacts:', error)
      toast.error($_('logbook.exportFailed'))
    }
  }

  async function handleImport() {
    // Create file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'

    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await file.text()
        let data

        // Parse JSON
        try {
          data = JSON.parse(text)
        } catch {
          alert('Invalid JSON file. Please select a valid LZ Radio export file.')
          return
        }

        // Validate import data with callsign check
        const userCallsign = getStationCallsign()
        const validation = validateImportData(data, userCallsign)
        if (!validation.valid) {
          alert(`Import validation failed: ${validation.error}`)
          return
        }

        // Store whether we should set callsign after import
        shouldSetCallsign = validation.shouldSetCallsign || null

        // Calculate statistics
        const existingContacts = await getAllContacts()
        const statistics = calculateImportStatistics(validation.contacts, existingContacts)

        // Show preview modal
        importData = {
          fileName: file.name,
          metadata: data.metadata,
          contacts: validation.contacts
        }
        importStatistics = statistics
      } catch (error) {
        console.error('Failed to process import file:', error)
        alert('Failed to process import file. Please try again.')
      }
    }

    input.click()
  }

  async function confirmImport() {
    if (!importData || !importStatistics) return

    importing = true
    try {
      // Import only the new contacts
      for (const contact of importStatistics.newContacts) {
        const normalized = normalizeContact(contact)
        await addContact(normalized)
      }

      // Set callsign if needed (user had none, import file has one)
      if (shouldSetCallsign) {
        setStationCallsign(shouldSetCallsign)
        stationCallsign = shouldSetCallsign
      }

      // Reload contacts
      await loadContacts()

      // Show success toast
      const contactCount = importStatistics.newCount
      const contactLabel = contactCount === 1 ? 'contact' : 'contacts'

      if (shouldSetCallsign) {
        // Show special message when callsign was auto-set
        toast.success(
          `✓ Imported ${contactCount} ${contactLabel} • ${$_('logbook.importCallsignSet')} ${shouldSetCallsign}`,
          4000
        )
      } else {
        // Regular success message
        toast.success(`✓ Imported ${contactCount} ${contactLabel}`, 3000)
      }

      // Close modal and reset state
      importData = null
      importStatistics = null
      shouldSetCallsign = null
    } catch (error) {
      console.error('Failed to import contacts:', error)
      toast.error('Failed to import contacts. Please try again.')
    } finally {
      importing = false
    }
  }

  function cancelImport() {
    importData = null
    importStatistics = null
    shouldSetCallsign = null
  }

  function openSettings() {
    settingsModalOpen = true
  }

  function closeSettings() {
    settingsModalOpen = false
    // Reload callsign in case it changed
    stationCallsign = getStationCallsign()
  }

  // Search functionality
  // Prepare contacts with searchable full callsign
  $: contactsWithCallsign = contacts.map(contact => ({
    ...contact,
    fullCallsign: buildCallsign(contact.baseCallsign, contact.prefix, contact.suffix)
  }))

  // Configure Fuse.js for fuzzy search
  $: fuse = createFuseInstance(contactsWithCallsign)

  // Filtered contacts based on search query
  $: filteredContacts = filterContacts(contacts, searchQuery, fuse)

  // Track if we're showing filtered results
  $: isFiltering = searchQuery.trim().length >= 2 && filteredContacts.length < contacts.length

  function clearSearch() {
    searchQuery = ''
    if (searchInput) {
      searchInput.focus()
    }
  }

  function handleSearchKeydown(event) {
    if (event.key === 'Escape') {
      clearSearch()
    }
  }

  function handleGlobalKeydown(event) {
    // Ctrl+F / Cmd+F to focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault()
      if (searchInput) {
        searchInput.focus()
      }
    }
  }

  onMount(async () => {
    await loadContacts()
    stationCallsign = getStationCallsign()

    // Add global keyboard shortcut listener
    window.addEventListener('keydown', handleGlobalKeydown)
  })

  onDestroy(() => {
    // Clean up event listener
    window.removeEventListener('keydown', handleGlobalKeydown)

    // Clear any pending debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })
</script>

<div class="page">
  <!-- Alpha Version Banner -->
  <Banner
    badgeText="Alpha Version"
    message={$_('logbook.alphaBanner.message')}
    dismissible={false}
  />

  <!-- Header with callsign -->
  <div class="header">
    <h1>
      📻 {$_('logbook.logbookOf')}
      <button class="callsign-button" on:click={openSettings}>
        {#if stationCallsign}
          <span class="callsign">{stationCallsign}</span>
        {:else}
          <span class="callsign-notset">{$_('logbook.notSet')}</span>
        {/if}
      </button>
      <span class="count">({contactCount} {$_('logbook.contacts')})</span>
    </h1>
  </div>

  <!-- Actions Bar (always visible) -->
  {#if !loading}
    <div class="actions-bar">
      <!-- Search Bar (always visible, disabled when no contacts) -->
      <div class="search-container">
        <div class="search-input-wrapper" class:disabled={contacts.length === 0}>
          <span class="search-icon">🔍</span>
          <input
            bind:this={searchInput}
            bind:value={searchQuery}
            type="text"
            placeholder={$_('logbook.searchPlaceholder')}
            class="search-input"
            disabled={contacts.length === 0}
            on:keydown={handleSearchKeydown}
          />
          {#if searchQuery}
            <button class="clear-button" on:click={clearSearch} aria-label="Clear search">
              ×
            </button>
          {/if}
        </div>
      </div>

      <div class="actions-right">
        <a href="/logbook/add" use:link class="btn-primary">+ {$_('logbook.addContact')}</a>
        <DropdownMenu let:closeMenu>
          <button on:click={() => { openSettings(); closeMenu(); }}>
            ⚙️ {$_('logbook.settings')}
          </button>
          <div class="dropdown-divider"></div>
          <button on:click={() => { handleExport(); closeMenu(); }}>
            📤 {$_('logbook.exportData')}
          </button>
          <button on:click={() => { handleImport(); closeMenu(); }}>
            📥 {$_('logbook.importData')}
          </button>
        </DropdownMenu>
      </div>
    </div>

    {#if isFiltering}
      <div class="search-status">
        <span class="fuzzy-indicator">⚡ {$_('logbook.fuzzyMatch')}</span>
        <span class="result-count">
          {$_('logbook.showingResults', {
            values: { shown: filteredContacts.length, total: contacts.length }
          })}
        </span>
      </div>
    {/if}

    {#if searchQuery.trim().length >= 2 && filteredContacts.length === 0}
      <div class="no-results">
        📭 {$_('logbook.noResults')}
      </div>
    {/if}
  {/if}

  <!-- Contact Table -->
  {#if loading}
    <div class="loading-state">
      <p>⏳ {$_('common.loading')}...</p>
    </div>
  {:else if contacts.length > 0}
    <div class="contact-table-wrapper">
      <table class="contact-table">
        <thead>
          <tr>
            <th>{$_('logbook.callsign')}</th>
            <th>{$_('logbook.date')}</th>
            <th>{$_('logbook.time')}</th>
            <th>{$_('logbook.frequency')}</th>
            <th>{$_('logbook.mode')}</th>
            <th>{$_('logbook.remarks')}</th>
            <th class="actions-header">{$_('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredContacts as contact (contact.id)}
            <tr>
              <td class="monospace bold">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html highlightMatch(buildCallsign(contact.baseCallsign, contact.prefix, contact.suffix), searchQuery)}
              </td>
              <td>{contact.date}</td>
              <td>{contact.time}</td>
              <td>{contact.frequency}</td>
              <td>{contact.mode}</td>
              <td class="remarks-cell">
                <span class="remarks-content" title={contact.remarks || ''}>
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html highlightMatch(contact.remarks || '', searchQuery)}
                </span>
              </td>
              <td class="actions-cell">
                <DropdownMenu let:closeMenu>
                  <button on:click={() => { push(`/logbook/view/${contact.id}`); closeMenu(); }}>
                    👁️ {$_('common.view')}
                  </button>
                  <button on:click={() => { handleEdit(contact.id); closeMenu(); }}>
                    ✏️ {$_('common.edit')}
                  </button>
                  <button class="danger" on:click={() => { confirmDelete(contact); closeMenu(); }}>
                    🗑️ {$_('common.delete')}
                  </button>
                </DropdownMenu>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <!-- Empty State -->
    <div class="empty-state">
      <p>📻 {$_('logbook.emptyState')}</p>
      <p class="muted">{$_('logbook.emptyStateSubtext')}</p>
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
<DeleteConfirmationModal
  contact={contactToDelete}
  onConfirm={handleDelete}
  onCancel={cancelDelete}
  {deleting}
/>

<!-- Import Preview Modal -->
<ImportPreviewModal
  {importData}
  statistics={importStatistics}
  onConfirm={confirmImport}
  onCancel={cancelImport}
  {importing}
/>

<!-- Settings Modal -->
<SettingsModal
  open={settingsModalOpen}
  onClose={closeSettings}
/>

<style>
  /* Component-specific styles */
  .count {
    font-size: 1rem;
    color: var(--color-text-muted);
    font-weight: normal;
  }

  /* Callsign display */
  .callsign-button {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    display: inline;
    text-decoration: underline;
    text-decoration-style: dotted;
    text-decoration-color: var(--color-primary);
    text-underline-offset: 4px;
    transition: all 0.15s ease;
  }

  .callsign-button:hover {
    text-decoration-style: solid;
    color: var(--color-primary);
  }

  .callsign {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--color-primary);
  }

  .callsign-notset {
    color: var(--color-text-muted);
    font-style: italic;
  }

  /* Dropdown divider */
  .dropdown-divider {
    height: 1px;
    background: var(--color-border);
    margin: var(--space-1) 0;
  }

  /* Actions Bar (Search left, Buttons right) */
  .actions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .actions-right {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .actions-right .btn-primary {
    white-space: nowrap;
    height: 44px;
    display: flex;
    align-items: center;
  }

  /* Search Container */
  .search-container {
    flex: 0 1 500px;
    max-width: 500px;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    height: 44px;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  }

  .search-input-wrapper:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-input-wrapper.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-bg);
  }

  .search-input-wrapper.disabled:focus-within {
    border-color: var(--color-border);
    box-shadow: none;
  }

  .search-icon {
    font-size: 1.25rem;
    color: var(--color-text-muted);
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.95rem;
    color: var(--color-text);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
  }

  .clear-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0 var(--space-2);
    line-height: 1;
    transition: color 0.15s ease;
  }

  .clear-button:hover {
    color: var(--color-text);
  }

  .search-status {
    margin-bottom: var(--space-3);
    font-size: 0.85rem;
    color: var(--color-text-muted);
    display: flex;
    gap: var(--space-3);
    align-items: center;
    flex-wrap: wrap;
  }

  .fuzzy-indicator {
    color: #f59e0b;
    font-weight: 500;
  }

  .result-count {
    color: var(--color-text-muted);
  }

  .no-results {
    margin-bottom: var(--space-4);
    padding: var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
    background: var(--color-bg);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
  }

  /* Highlight matched text */
  :global(mark) {
    background-color: #fef08a;
    color: inherit;
    font-weight: 600;
    padding: 0 2px;
    border-radius: 2px;
  }

  /* Contact Table */
  .contact-table-wrapper {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow-x: auto;
    box-shadow: var(--shadow-sm);
  }

  .contact-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  /* Column width constraints for compact display */
  .contact-table th:nth-child(1),
  .contact-table td:nth-child(1) {
    width: 120px; /* Callsign */
  }

  .contact-table th:nth-child(2),
  .contact-table td:nth-child(2) {
    width: 120px; /* Date */
  }

  .contact-table th:nth-child(3),
  .contact-table td:nth-child(3) {
    width: 90px; /* Time */
  }

  .contact-table th:nth-child(4),
  .contact-table td:nth-child(4) {
    width: 100px; /* Frequency */
  }

  .contact-table th:nth-child(5),
  .contact-table td:nth-child(5) {
    width: 70px; /* Mode */
  }

  /* Remarks column takes remaining space */
  .contact-table th:nth-child(6),
  .contact-table td:nth-child(6) {
    width: auto;
  }

  .contact-table thead {
    background: var(--color-bg);
    border-bottom: 2px solid var(--color-border);
  }

  .contact-table th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
  }

  .contact-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
    white-space: nowrap;
  }

  .contact-table tbody tr:last-child td {
    border-bottom: none;
  }

  .contact-table tbody tr:hover {
    background: var(--color-bg);
  }

  .bold {
    font-weight: 600;
    color: var(--color-primary);
  }

  /* Remarks Column - Truncate long text */
  .remarks-cell {
    max-width: 200px;
  }

  .remarks-content {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
  }

  /* Actions Column - Sticky on right */
  .actions-header {
    width: 80px;
    text-align: center;
    position: sticky;
    right: 0;
    background: var(--color-bg);
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.05);
  }

  .actions-cell {
    text-align: center;
    padding: 8px !important;
    position: sticky;
    right: 0;
    background: var(--color-bg-card);
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.05);
  }

  /* Maintain background on hover for sticky column */
  .contact-table tbody tr:hover .actions-cell {
    background: var(--color-bg);
  }

  /* Empty State and Loading State */
  .empty-state,
  .loading-state {
    text-align: center;
    padding: var(--space-12) var(--space-4);
    color: var(--color-text-muted);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .empty-state p:first-child {
    font-size: 1.5rem;
    margin-bottom: var(--space-2);
  }

  .muted {
    font-size: 0.875rem;
  }

  /* Mobile Responsive */
  @media (max-width: 767px) {
    .actions-bar {
      flex-direction: column;
      align-items: stretch;
    }

    .search-container {
      max-width: 100%;
      flex: 1;
    }

    .actions-right {
      width: 100%;
      justify-content: space-between;
    }

    .actions-right .btn-primary {
      flex: 1;
      justify-content: center;
    }

    .contact-table {
      font-size: 0.75rem;
    }

    .contact-table th,
    .contact-table td {
      padding: 8px;
    }
  }
</style>
