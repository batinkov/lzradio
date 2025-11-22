<script>
  import { link } from 'svelte-spa-router'
  import { _ } from 'svelte-i18n'
</script>

<div class="page page-narrow">
  <div class="header">
    <h1>{$_('logbook.addContactTitle')}</h1>
    <a href="/logbook" use:link class="btn-secondary">← {$_('logbook.backToLog')}</a>
  </div>

  <!-- Contact Entry Form -->
  <div class="card">
    <form class="contact-form">
      <!-- Primary Field: Station Callsign -->
      <div class="form-row">
        <div class="form-field full-width">
          <label for="station">{$_('logbook.stationCallsign')} *</label>
          <input
            type="text"
            id="station"
            placeholder="W1ABC"
            class="monospace"
          />
        </div>
      </div>

      <!-- Date and Time -->
      <div class="form-row">
        <div class="form-field">
          <label for="date">{$_('logbook.dateLabel')} *</label>
          <input type="date" id="date" />
        </div>
        <div class="form-field">
          <label for="time">{$_('logbook.timeLabel')} *</label>
          <input type="time" id="time" step="1" />
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
          />
        </div>
        <div class="form-field">
          <label for="mode">{$_('logbook.modeLabel')} *</label>
          <select id="mode">
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
        </div>
        <div class="form-field">
          <label for="power">{$_('logbook.powerLabel')}</label>
          <input
            type="number"
            id="power"
            placeholder="37"
            step="1"
          />
        </div>
      </div>

      <!-- Report -->
      <div class="form-row">
        <div class="form-field">
          <label for="report">{$_('logbook.signalReport')}</label>
          <input
            type="text"
            id="report"
            placeholder="59 or 599"
            maxlength="5"
          />
        </div>
        <div class="form-field checkbox-field">
          <label>
            <input type="checkbox" id="qsl" />
            <span>{$_('logbook.qslCard')}</span>
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
          ></textarea>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="form-actions">
        <button type="submit" class="btn-primary">{$_('logbook.saveContact')}</button>
        <button type="button" class="btn-secondary">{$_('logbook.clearForm')}</button>
        <a href="/logbook" use:link class="btn-text">{$_('common.cancel')}</a>
      </div>
    </form>
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
