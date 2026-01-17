<script>
  import { _ } from 'svelte-i18n'

  export let importData = null
  export let statistics = null
  export let onConfirm = () => {}
  export let onCancel = () => {}
  export let importing = false

  function handleKeydown(event) {
    if (event.key === 'Escape' && !importing) {
      onCancel()
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !importing) {
      onCancel()
    }
  }

  $: showDuplicates = statistics?.duplicates?.length > 0
  $: hasNewContacts = statistics?.newCount > 0
</script>

<svelte:window on:keydown={handleKeydown} />

{#if importData && statistics}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">
        <h2>📥 Import LogBook Contacts</h2>
      </div>

      <div class="modal-body">
        <div class="file-info">
          <div class="info-row">
            <span class="label">File:</span>
            <span class="value">{importData.fileName}</span>
          </div>
          {#if importData.metadata.stationCallsign}
            <div class="info-row">
              <span class="label">Station:</span>
              <span class="value monospace">{importData.metadata.stationCallsign}</span>
            </div>
          {/if}
          {#if importData.metadata.exportDate}
            <div class="info-row">
              <span class="label">Export Date:</span>
              <span class="value">{new Date(importData.metadata.exportDate).toLocaleString()}</span>
            </div>
          {/if}
        </div>

        <div class="statistics-box">
          <h3>Import Summary</h3>
          <div class="stat-row">
            <span class="stat-icon">📊</span>
            <span class="stat-label">Existing contacts in your logbook:</span>
            <span class="stat-value">{statistics.existingCount}</span>
          </div>
          <div class="stat-row">
            <span class="stat-icon">📂</span>
            <span class="stat-label">Total contacts in import file:</span>
            <span class="stat-value">{statistics.importFileCount}</span>
          </div>
          <div class="stat-row highlight-success">
            <span class="stat-icon">✅</span>
            <span class="stat-label">New contacts to be imported:</span>
            <span class="stat-value">{statistics.newCount}</span>
          </div>
          {#if statistics.duplicateCount > 0}
            <div class="stat-row highlight-warning">
              <span class="stat-icon">⚠️</span>
              <span class="stat-label">Duplicate contacts (skipped):</span>
              <span class="stat-value">{statistics.duplicateCount}</span>
            </div>
          {/if}
        </div>

        {#if showDuplicates}
          <div class="duplicates-section">
            <h4>ℹ️ Duplicates detected:</h4>
            <ul class="duplicate-list">
              {#each statistics.duplicates.slice(0, 5) as dup, index (index)}
                <li>{dup.callsign} on {dup.date} at {dup.time}</li>
              {/each}
              {#if statistics.duplicates.length > 5}
                <li class="more">and {statistics.duplicates.length - 5} more...</li>
              {/if}
            </ul>
          </div>
        {/if}

        {#if !hasNewContacts}
          <div class="warning-box">
            <p>⚠️ All contacts in this file already exist in your logbook.</p>
            <p>No new contacts to import.</p>
          </div>
        {:else}
          <div class="info-note">
            <p>Note: Contacts with matching callsign, date, and time will be skipped to avoid duplicates.</p>
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" on:click={onCancel} disabled={importing}>
          {$_('common.cancel')}
        </button>
        {#if hasNewContacts}
          <button class="btn-primary" on:click={onConfirm} disabled={importing}>
            {importing ? '📥 Importing...' : `📥 Import ${statistics.newCount} Contact${statistics.newCount === 1 ? '' : 's'}`}
          </button>
        {:else}
          <button class="btn-primary" on:click={onCancel}>
            OK
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background: var(--color-bg-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow: auto;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-text);
  }

  .modal-body {
    padding: var(--space-4);
  }

  .file-info {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .info-row {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .info-row:last-child {
    margin-bottom: 0;
  }

  .label {
    font-weight: 600;
    color: var(--color-text-muted);
    min-width: 100px;
  }

  .value {
    color: var(--color-text);
    word-break: break-word;
  }

  .statistics-box {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .statistics-box h3 {
    margin: 0 0 var(--space-3) 0;
    font-size: 1rem;
    color: var(--color-text);
  }

  .stat-row {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    gap: var(--space-2);
    padding: var(--space-2);
    align-items: center;
  }

  .stat-icon {
    font-size: 1rem;
  }

  .stat-label {
    color: var(--color-text);
  }

  .stat-value {
    font-weight: 600;
    color: var(--color-text);
    font-size: 1.125rem;
  }

  .highlight-success {
    background: rgba(34, 197, 94, 0.1);
    border-radius: var(--radius-md);
  }

  .highlight-success .stat-value {
    color: var(--color-success);
  }

  .highlight-warning {
    background: rgba(251, 146, 60, 0.1);
    border-radius: var(--radius-md);
  }

  .highlight-warning .stat-value {
    color: #f97316;
  }

  .duplicates-section {
    background: rgba(251, 146, 60, 0.1);
    border: 1px solid #f97316;
    border-radius: var(--radius-md);
    padding: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .duplicates-section h4 {
    margin: 0 0 var(--space-2) 0;
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .duplicate-list {
    margin: 0;
    padding-left: var(--space-4);
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .duplicate-list li {
    margin-bottom: var(--space-1);
  }

  .duplicate-list li.more {
    font-style: italic;
  }

  .warning-box {
    background: rgba(251, 146, 60, 0.1);
    border: 1px solid #f97316;
    border-radius: var(--radius-md);
    padding: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .warning-box p {
    margin: 0;
    color: var(--color-text);
  }

  .warning-box p:first-child {
    font-weight: 600;
    margin-bottom: var(--space-2);
  }

  .info-note {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .info-note p {
    margin: 0;
  }

  .modal-footer {
    padding: var(--space-4);
    border-top: 1px solid var(--color-border);
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }

  /* Mobile */
  @media (max-width: 767px) {
    .modal-content {
      width: 95%;
    }

    .modal-footer {
      flex-direction: column-reverse;
    }

    .btn-secondary,
    .btn-primary {
      width: 100%;
    }

    .stat-row {
      grid-template-columns: 24px 1fr;
      gap: var(--space-1);
    }

    .stat-value {
      grid-column: 2;
      text-align: right;
    }
  }
</style>
