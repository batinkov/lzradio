<script>
  import { _ } from 'svelte-i18n'
  import { getStationCallsign, setStationCallsign } from '../../lib/logbookSettings.js'
  import { toast } from '../../lib/toastStore.js'

  export let open = false
  export let onClose = () => {}

  let callsignInput = ''
  let saving = false

  // Load current callsign when modal opens
  $: if (open) {
    callsignInput = getStationCallsign() || ''
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && !saving) {
      onClose()
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !saving) {
      onClose()
    }
  }

  async function handleSave() {
    saving = true
    try {
      // Save callsign (will normalize automatically)
      setStationCallsign(callsignInput)

      // Show success toast
      toast.success($_('logbook.settingsSaved'))

      // Close modal
      onClose()
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings. Please try again.')
    } finally {
      saving = false
    }
  }

  function handleCancel() {
    if (!saving) {
      onClose()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">
        <h2>⚙️ {$_('logbook.settings')}</h2>
      </div>

      <div class="modal-body">
        <div class="form-field">
          <label for="stationCallsign">{$_('logbook.settingsModal.stationCallsign')}</label>
          <input
            type="text"
            id="stationCallsign"
            bind:value={callsignInput}
            placeholder={$_('logbook.settingsModal.stationCallsignPlaceholder')}
            class="monospace"
            disabled={saving}
            autofocus
          />
          <p class="help-text">{$_('logbook.settingsModal.stationCallsignHelp')}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" on:click={handleCancel} disabled={saving}>
          {$_('common.cancel')}
        </button>
        <button class="btn-primary" on:click={handleSave} disabled={saving}>
          {saving ? '💾 Saving...' : $_('common.save')}
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

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .form-field label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-text);
  }

  input[type="text"] {
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  input:focus {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .monospace {
    font-family: var(--font-mono);
  }

  .help-text {
    font-size: 0.875rem;
    color: var(--color-text-muted);
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
  }
</style>
