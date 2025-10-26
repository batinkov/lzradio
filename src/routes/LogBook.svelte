<script>
  import { link } from 'svelte-spa-router'
</script>

<div class="page">
  <!-- Header with Add Button -->
  <div class="header">
    <h1>LogBook <span class="count">(3 contacts)</span></h1>
    <div class="header-actions">
      <a href="/logbook/add" use:link class="btn-primary">+ Add Contact</a>
      <button class="btn-secondary">📤 Export</button>
      <button class="btn-secondary">📥 Import</button>
    </div>
  </div>

  <!-- Contact Table -->
  <div class="contact-table-wrapper">
    <table class="contact-table">
      <thead>
        <tr>
          <th>Station</th>
          <th>Date</th>
          <th>Time</th>
          <th>Freq (MHz)</th>
          <th>Mode</th>
          <th>Power (dBW)</th>
          <th>Report</th>
          <th>QSL</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        <!-- Sample Data for Design -->
        <tr>
          <td class="monospace bold">W1ABC</td>
          <td>2025-01-15</td>
          <td>14:23:00</td>
          <td>14.250</td>
          <td>SSB</td>
          <td>37</td>
          <td>59</td>
          <td><span class="qsl-badge">✓</span></td>
          <td>Great contact, clear signal</td>
        </tr>
        <tr>
          <td class="monospace bold">K2XYZ</td>
          <td>2025-01-15</td>
          <td>13:45:30</td>
          <td>7.125</td>
          <td>CW</td>
          <td>40</td>
          <td>599</td>
          <td>—</td>
          <td></td>
        </tr>
        <tr>
          <td class="monospace bold">DL1DEF</td>
          <td>2025-01-14</td>
          <td>20:15:12</td>
          <td>21.300</td>
          <td>FT8</td>
          <td>33</td>
          <td>-12</td>
          <td><span class="qsl-badge">✓</span></td>
          <td>First FT8 contact</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Empty State (hidden when there are contacts) -->
  <div class="empty-state" style="display: none;">
    <p>📻 No contacts logged yet</p>
    <p class="muted">Click "Add Contact" above to log your first contact!</p>
  </div>
</div>

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
    background: white;
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

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: var(--space-12) var(--space-4);
    color: var(--color-text-muted);
    background: white;
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
