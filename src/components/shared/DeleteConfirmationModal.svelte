<script>
  import { _ } from 'svelte-i18n'
  import { buildCallsign } from '../../lib/callsignParser.js'

  export let contact = null
  export let onConfirm = () => {}
  export let onCancel = () => {}
  export let deleting = false

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      onCancel()
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onCancel()
    }
  }

  $: callsign = contact
    ? buildCallsign(contact.baseCallsign, contact.prefix, contact.suffix)
    : ''
</script>

<svelte:window on:keydown={handleKeydown} />

{#if contact}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">
        <h2>🗑️ Delete Contact</h2>
      </div>

      <div class="modal-body">
        <p class="warning-text">
          Are you sure you want to delete this contact? This action cannot be undone.
        </p>

        <div class="contact-info">
          <div class="info-row">
            <span class="label">Callsign:</span>
            <span class="value monospace">{callsign}</span>
          </div>
          <div class="info-row">
            <span class="label">Date:</span>
            <span class="value">{contact.date} {contact.time}</span>
          </div>
          <div class="info-row">
            <span class="label">Frequency:</span>
            <span class="value">{contact.frequency} MHz</span>
          </div>
          <div class="info-row">
            <span class="label">Mode:</span>
            <span class="value">{contact.mode}</span>
          </div>
          {#if contact.remarks}
            <div class="info-row">
              <span class="label">Remarks:</span>
              <span class="value">{contact.remarks}</span>
            </div>
          {/if}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" on:click={onCancel} disabled={deleting}>
          {$_('common.cancel')}
        </button>
        <button class="btn-danger" on:click={onConfirm} disabled={deleting}>
          {deleting ? '🗑️ Deleting...' : '🗑️ Delete Contact'}
        </button>
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
    max-width: 500px;
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

  .warning-text {
    color: #c00;
    font-weight: 500;
    margin-bottom: var(--space-4);
  }

  .contact-info {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
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
    min-width: 90px;
  }

  .value {
    color: var(--color-text);
  }

  .monospace {
    font-family: var(--font-mono);
  }

  .modal-footer {
    padding: var(--space-4);
    border-top: 1px solid var(--color-border);
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }

  .btn-danger {
    background: #c00;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .btn-danger:hover:not(:disabled) {
    background: #a00;
  }

  .btn-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
    .btn-danger {
      width: 100%;
    }
  }
</style>
