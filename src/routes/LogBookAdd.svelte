<script>
  import { link } from 'svelte-spa-router'
</script>

<div class="page">
  <div class="header">
    <h1>Add Contact</h1>
    <a href="/logbook" use:link class="btn-secondary">← Back to Log</a>
  </div>

  <!-- Contact Entry Form -->
  <div class="form-card">
    <form class="contact-form">
      <!-- Primary Field: Station Callsign -->
      <div class="form-row">
        <div class="form-field full-width">
          <label for="station">Station Callsign *</label>
          <input
            type="text"
            id="station"
            placeholder="W1ABC"
            class="monospace"
            autofocus
          />
        </div>
      </div>

      <!-- Date and Time -->
      <div class="form-row">
        <div class="form-field">
          <label for="date">Date *</label>
          <input type="date" id="date" />
        </div>
        <div class="form-field">
          <label for="time">Time (UTC) *</label>
          <input type="time" id="time" step="1" />
        </div>
      </div>

      <!-- Technical Parameters -->
      <div class="form-row">
        <div class="form-field">
          <label for="frequency">Frequency (MHz) *</label>
          <input
            type="number"
            id="frequency"
            placeholder="14.250"
            step="0.001"
          />
        </div>
        <div class="form-field">
          <label for="mode">Mode *</label>
          <select id="mode">
            <option value="">Select mode</option>
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
          <label for="power">Power (dBW)</label>
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
          <label for="report">Signal Report (RST)</label>
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
            <span>QSL Card</span>
          </label>
        </div>
      </div>

      <!-- Remarks -->
      <div class="form-row">
        <div class="form-field full-width">
          <label for="remarks">Remarks</label>
          <textarea
            id="remarks"
            rows="3"
            placeholder="Additional notes..."
          ></textarea>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="form-actions">
        <button type="submit" class="btn-primary">Save Contact</button>
        <button type="button" class="btn-secondary">Clear Form</button>
        <a href="/logbook" use:link class="btn-text">Cancel</a>
      </div>
    </form>
  </div>
</div>

<style>
  .page {
    padding: var(--space-4) 0;
    max-width: 800px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .header h1 {
    margin: 0;
  }

  /* Form Card */
  .form-card {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
  }

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
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  textarea {
    resize: vertical;
    font-family: var(--font-sans);
  }

  .monospace {
    font-family: var(--font-mono);
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-2);
    align-items: center;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-primary:hover {
    background: #2563EB;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-secondary {
    background: white;
    color: var(--color-text);
    padding: 12px 24px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
    display: inline-block;
  }

  .btn-secondary:hover {
    background: var(--color-bg);
    border-color: var(--color-primary);
  }

  .btn-text {
    color: var(--color-text-muted);
    text-decoration: none;
    padding: 12px 16px;
    transition: color 0.15s ease;
  }

  .btn-text:hover {
    color: var(--color-text);
  }

  /* Mobile Responsive */
  @media (max-width: 767px) {
    .form-card {
      padding: var(--space-4);
    }

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

    .header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
