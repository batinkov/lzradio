<script>
  import { onMount } from 'svelte'
  import { link, push, location } from 'svelte-spa-router'
  import { _ } from 'svelte-i18n'
  import { addContact, getContact, updateContact } from '../lib/logbookDB.js'
  import { parseCallsign, buildCallsign } from '../lib/callsignParser.js'

  export let params = {}

  // Mode detection
  $: contactId = params.id ? parseInt(params.id) : null
  $: isViewMode = $location.includes('/view/')
  $: isEditMode = contactId !== null && !isViewMode
  $: isReadOnly = isViewMode

  // Form state
  let formData = {
    callsign: '',
    date: '',
    time: '',
    frequency: '',
    mode: '',
    power: '',
    rstSent: '',
    rstReceived: '',
    qslSent: false,
    qslReceived: false,
    remarks: ''
  }

  let errors = {}
  let saving = false
  let errorMessage = ''
  let loading = false

  onMount(async () => {
    if (isEditMode || isViewMode) {
      await loadContact()
    }
  })

  async function loadContact() {
    loading = true
    try {
      const contact = await getContact(contactId)
      if (!contact) {
        errorMessage = 'Contact not found'
        return
      }

      // Populate form with contact data
      formData = {
        callsign: buildCallsign(contact.baseCallsign, contact.prefix, contact.suffix),
        date: contact.date,
        time: contact.time,
        frequency: contact.frequency.toString(),
        mode: contact.mode,
        power: contact.power ? contact.power.toString() : '',
        rstSent: contact.rstSent || '',
        rstReceived: contact.rstReceived || '',
        qslSent: contact.qslSent,
        qslReceived: contact.qslReceived,
        remarks: contact.remarks || ''
      }
    } catch (error) {
      console.error('Failed to load contact:', error)
      errorMessage = 'Failed to load contact'
    } finally {
      loading = false
    }
  }

  // Validation
  function validateForm() {
    errors = {}

    if (!formData.callsign.trim()) {
      errors.callsign = 'Callsign is required'
    }

    if (!formData.date) {
      errors.date = 'Date is required'
    } else {
      // Validate date is actually valid
      const dateObj = new Date(formData.date + 'T00:00:00')
      if (isNaN(dateObj.getTime())) {
        errors.date = 'Invalid date'
      } else {
        // Verify the date components match (prevents dates like 2025-02-30 becoming 2025-03-02)
        const [year, month, day] = formData.date.split('-').map(Number)
        if (
          dateObj.getFullYear() !== year ||
          dateObj.getMonth() + 1 !== month ||
          dateObj.getDate() !== day
        ) {
          errors.date = 'Invalid date (day/month out of range)'
        }
      }
    }

    if (!formData.time) {
      errors.time = 'Time is required'
    }

    if (!formData.frequency) {
      errors.frequency = 'Frequency is required'
    } else if (isNaN(formData.frequency) || formData.frequency <= 0) {
      errors.frequency = 'Frequency must be a positive number'
    }

    if (!formData.mode) {
      errors.mode = 'Mode is required'
    }

    return Object.keys(errors).length === 0
  }

  // Submit handler
  async function handleSubmit(event) {
    event.preventDefault()
    errorMessage = ''

    if (!validateForm()) {
      return
    }

    saving = true

    try {
      // Parse callsign into base, prefix, and suffix
      const { base, prefix, suffix } = parseCallsign(formData.callsign)

      // Prepare contact data
      const contactData = {
        baseCallsign: base,
        prefix: prefix,
        suffix: suffix,
        date: formData.date,
        time: formData.time,
        frequency: parseFloat(formData.frequency),
        mode: formData.mode,
        power: formData.power ? parseInt(formData.power) : null,
        rstSent: formData.rstSent || null,
        rstReceived: formData.rstReceived || null,
        qslSent: formData.qslSent,
        qslReceived: formData.qslReceived,
        remarks: formData.remarks
      }

      if (isEditMode) {
        // Update existing contact
        await updateContact(contactId, contactData)
      } else {
        // Add new contact
        await addContact(contactData)
      }

      // Navigate back to logbook
      push('/logbook')
    } catch (error) {
      console.error('Failed to save contact:', error)
      errorMessage = `Failed to ${isEditMode ? 'update' : 'save'} contact. Please try again.`
    } finally {
      saving = false
    }
  }

  // Clear form
  function handleClear() {
    formData = {
      callsign: '',
      date: '',
      time: '',
      frequency: '',
      mode: '',
      power: '',
      rstSent: '',
      rstReceived: '',
      qslSent: false,
      qslReceived: false,
      remarks: ''
    }
    errors = {}
    errorMessage = ''
  }
</script>

<div class="page page-narrow">
  <div class="header">
    <h1>{isViewMode ? $_('logbook.viewContact') : isEditMode ? $_('logbook.editContact') : $_('logbook.addContactTitle')}</h1>
    <a href="/logbook" use:link class="btn-secondary">← {$_('logbook.backToLog')}</a>
  </div>

  <!-- Contact Entry Form -->
  <div class="card">
    {#if loading}
      <div class="loading-message">
        ⏳ Loading contact...
      </div>
    {:else}
      {#if errorMessage}
        <div class="error-message">
          ❌ {errorMessage}
        </div>
      {/if}

      <form class="contact-form" on:submit={handleSubmit}>
      <!-- Primary Field: Callsign -->
      <div class="form-row">
        <div class="form-field full-width">
          <label for="callsign">{$_('logbook.callsign')} *</label>
          <input
            type="text"
            id="callsign"
            placeholder="W1ABC or HB/W1ABC/P"
            class="monospace"
            bind:value={formData.callsign}
            class:error={errors.callsign}
            disabled={saving || isReadOnly}
          />
          {#if errors.callsign}
            <span class="error-text">{errors.callsign}</span>
          {/if}
        </div>
      </div>

      <!-- Date and Time -->
      <div class="form-row">
        <div class="form-field">
          <label for="date">{$_('logbook.dateLabel')} *</label>
          <input
            type="date"
            id="date"
            bind:value={formData.date}
            class:error={errors.date}
            disabled={saving || isReadOnly}
          />
          {#if errors.date}
            <span class="error-text">{errors.date}</span>
          {/if}
        </div>
        <div class="form-field">
          <label for="time">{$_('logbook.timeLabel')} *</label>
          <input
            type="time"
            id="time"
            step="1"
            bind:value={formData.time}
            class:error={errors.time}
            disabled={saving || isReadOnly}
          />
          {#if errors.time}
            <span class="error-text">{errors.time}</span>
          {/if}
        </div>
      </div>

      <!-- Technical Parameters -->
      <div class="form-row">
        <div class="form-field">
          <label for="frequency">{$_('logbook.frequencyLabel')} *</label>
          <input
            type="number"
            id="frequency"
            placeholder="14.250"
            step="0.001"
            bind:value={formData.frequency}
            class:error={errors.frequency}
            disabled={saving || isReadOnly}
          />
          {#if errors.frequency}
            <span class="error-text">{errors.frequency}</span>
          {/if}
        </div>
        <div class="form-field">
          <label for="mode">{$_('logbook.modeLabel')} *</label>
          <select
            id="mode"
            bind:value={formData.mode}
            class:error={errors.mode}
            disabled={saving || isReadOnly}
          >
            <option value="">{$_('logbook.selectMode')}</option>
            <option value="SSB">SSB</option>
            <option value="CW">CW</option>
            <option value="FM">FM</option>
            <option value="AM">AM</option>
            <option value="FT8">FT8</option>
            <option value="FT4">FT4</option>
            <option value="RTTY">RTTY</option>
            <option value="PSK31">PSK31</option>
          </select>
          {#if errors.mode}
            <span class="error-text">{errors.mode}</span>
          {/if}
        </div>
        <div class="form-field">
          <label for="power">{$_('logbook.powerLabel')}</label>
          <input
            type="number"
            id="power"
            placeholder="37"
            step="1"
            bind:value={formData.power}
            disabled={saving || isReadOnly}
          />
        </div>
      </div>

      <!-- RST Reports -->
      <div class="form-row">
        <div class="form-field">
          <label for="rstSent">{$_('logbook.rstSent')}</label>
          <input
            type="text"
            id="rstSent"
            placeholder="59"
            maxlength="5"
            bind:value={formData.rstSent}
            disabled={saving || isReadOnly}
          />
        </div>
        <div class="form-field">
          <label for="rstReceived">{$_('logbook.rstRcvd')}</label>
          <input
            type="text"
            id="rstReceived"
            placeholder="57"
            maxlength="5"
            bind:value={formData.rstReceived}
            disabled={saving || isReadOnly}
          />
        </div>
      </div>

      <!-- QSL Status (optional - usually updated later) -->
      <div class="form-row">
        <div class="form-field checkbox-field">
          <label>
            <input
              type="checkbox"
              id="qslSent"
              bind:checked={formData.qslSent}
              disabled={saving || isReadOnly}
            />
            <span>{$_('logbook.qslSent')}</span>
          </label>
        </div>
        <div class="form-field checkbox-field">
          <label>
            <input
              type="checkbox"
              id="qslReceived"
              bind:checked={formData.qslReceived}
              disabled={saving || isReadOnly}
            />
            <span>{$_('logbook.qslRcvd')}</span>
          </label>
        </div>
      </div>

      <!-- Remarks -->
      <div class="form-row">
        <div class="form-field full-width">
          <label for="remarks">{$_('logbook.remarksLabel')}</label>
          <textarea
            id="remarks"
            rows="3"
            placeholder={$_('logbook.additionalNotes')}
            bind:value={formData.remarks}
            disabled={saving || isReadOnly}
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      {#if !isViewMode}
      <div class="form-actions">
          <button type="submit" class="btn-primary" disabled={saving}>
            {#if saving}
              💾 {isEditMode ? $_('logbook.updating') : $_('logbook.saving')}
            {:else}
              {isEditMode ? '✏️ ' + $_('logbook.updateContact') : $_('logbook.saveContact')}
            {/if}
          </button>
          {#if !isEditMode}
          <button
            type="button"
            class="btn-secondary"
            on:click={handleClear}
            disabled={saving}
          >
            {$_('logbook.clearForm')}
          </button>
          <a href="/logbook" use:link class="btn-text">{$_('common.cancel')}</a>
          {/if}
      </div>
      {/if}
    </form>
    {/if}
  </div>
</div>

<style>
  /* Form Layout */
  .contact-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .form-field.full-width {
    grid-column: 1 / -1;
  }

  .form-field.checkbox-field {
    justify-content: flex-end;
  }

  .form-field label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .checkbox-field label {
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }

  .checkbox-field input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  /* Form Inputs */
  input[type="text"],
  input[type="date"],
  input[type="time"],
  input[type="number"],
  select,
  textarea {
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  input:focus,
  select:focus,
  textarea:focus {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  textarea {
    resize: vertical;
    font-family: var(--font-sans);
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-2);
    align-items: center;
  }

  /* Error and Loading States */
  .error-message,
  .loading-message {
    padding: var(--space-3);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
    font-weight: 500;
  }

  .error-message {
    background: #fee;
    border: 1px solid #c00;
    color: #c00;
  }

  .loading-message {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    text-align: center;
  }

  input.error,
  select.error,
  textarea.error {
    border-color: #c00;
  }

  .error-text {
    color: #c00;
    font-size: 0.875rem;
    margin-top: var(--space-1);
  }

  /* Mobile Responsive */
  @media (max-width: 767px) {
    .form-row {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
      text-align: center;
    }
  }
</style>
