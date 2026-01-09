<script>
  import { onMount } from 'svelte'
  import { link, push } from 'svelte-spa-router'
  import { _ } from 'svelte-i18n'
  import { getAllContacts, getContactCount, deleteContact, addContact } from '../lib/logbookDB.js'
  import { buildCallsign } from '../lib/callsignParser.js'
  import { validateImportData, normalizeContact } from '../lib/importValidator.js'
  import { calculateImportStatistics } from '../lib/importStatistics.js'
  import { toast } from '../lib/toastStore.js'
  import DropdownMenu from '../components/shared/DropdownMenu.svelte'
  import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal.svelte'
  import ImportPreviewModal from '../components/shared/ImportPreviewModal.svelte'

  let contacts = []
  let contactCount = 0
  let loading = true
  let contactToDelete = null
  let deleting = false
  let importData = null
  let importStatistics = null
  let importing = false

  onMount(async () => {
    await loadContacts()
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

      // Create export data structure
      const exportData = {
        metadata: {
          appName: 'LZ Radio',
          appVersion: '1.0.0',
          exportDate: new Date().toISOString(),
          contactCount: allContacts.length,
          schemaVersion: 1
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
      const fileName = `lzradio-logbook-${new Date().toISOString().split('T')[0]}.json`
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

        // Validate import data
        const validation = validateImportData(data)
        if (!validation.valid) {
          alert(`Import validation failed: ${validation.error}`)
          return
        }

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

      // Reload contacts
      await loadContacts()

      // Show success message
      alert(
        `Successfully imported ${importStatistics.newCount} contact${importStatistics.newCount === 1 ? '' : 's'}!`
      )

      // Close modal
      importData = null
      importStatistics = null
    } catch (error) {
      console.error('Failed to import contacts:', error)
      alert('Failed to import contacts. Please try again.')
    } finally {
      importing = false
    }
  }

  function cancelImport() {
    importData = null
    importStatistics = null
  }
</script>

<div class="page">
  <!-- Header with Add Button -->
  <div class="header">
    <h1>{$_('logbook.title')} <span class="count">({contactCount} {$_('logbook.contacts')})</span></h1>
    <div class="header-actions">
      <a href="/logbook/add" use:link class="btn-primary">+ {$_('logbook.addContact')}</a>
      <button class="btn-secondary" on:click={handleExport}>📤 {$_('logbook.exportData')}</button>
      <button class="btn-secondary" on:click={handleImport}>📥 {$_('logbook.importData')}</button>
    </div>
  </div>

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
            <th>{$_('logbook.power')}</th>
            <th>{$_('logbook.rstSent')}</th>
            <th>{$_('logbook.rstRcvd')}</th>
            <th>{$_('logbook.qslSent')}</th>
            <th>{$_('logbook.qslRcvd')}</th>
            <th>{$_('logbook.remarks')}</th>
            <th class="actions-header">{$_('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {#each contacts as contact (contact.id)}
            <tr>
              <td class="monospace bold">
                {buildCallsign(contact.baseCallsign, contact.prefix, contact.suffix)}
              </td>
              <td>{contact.date}</td>
              <td>{contact.time}</td>
              <td>{contact.frequency}</td>
              <td>{contact.mode}</td>
              <td>{contact.power || '—'}</td>
              <td>{contact.rstSent || '—'}</td>
              <td>{contact.rstReceived || '—'}</td>
              <td>{#if contact.qslSent}<span class="qsl-badge">✓</span>{:else}—{/if}</td>
              <td>{#if contact.qslReceived}<span class="qsl-badge">✓</span>{:else}—{/if}</td>
              <td>{contact.remarks || ''}</td>
              <td class="actions-cell">
                <DropdownMenu let:closeMenu>
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

<style>
  /* Component-specific styles */
  .count {
    font-size: 1rem;
    color: var(--color-text-muted);
    font-weight: normal;
  }

  .header-actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
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

  .qsl-badge {
    display: inline-block;
    color: var(--color-success);
    font-weight: bold;
  }

  /* Actions Column */
  .actions-header {
    width: 80px;
    text-align: center;
  }

  .actions-cell {
    text-align: center;
    padding: 8px !important;
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
    .header-actions {
      width: 100%;
    }

    .btn-primary,
    .btn-secondary {
      flex: 1;
      text-align: center;
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
