<script>
  import { link, location } from 'svelte-spa-router'

  let showMobileMenu = false
  let showHelpModal = false

  function toggleMobileMenu() {
    showMobileMenu = !showMobileMenu
  }

  function toggleHelpModal() {
    showHelpModal = !showHelpModal
  }

  function closeHelpModal() {
    showHelpModal = false
  }

  // Close mobile menu when route changes
  $: if ($location) {
    showMobileMenu = false
  }
</script>

<nav class="nav">
  <div class="nav-content">
    <div class="nav-brand">
      <a href="/" use:link>LZ Radio</a>
    </div>

    <!-- Desktop Navigation -->
    <div class="nav-links desktop">
      <a href="/callbook" use:link class:active={$location === '/callbook'}>
        Callbook
      </a>
      <a href="/exam" use:link class:active={$location.startsWith('/exam')}>
        Exam Prep
      </a>
    </div>

    <div class="nav-actions">
      <button class="icon-btn" on:click={toggleHelpModal} aria-label="Help">
        ?
      </button>

      <!-- Mobile Menu Toggle -->
      <button class="icon-btn mobile-menu-btn" on:click={toggleMobileMenu} aria-label="Menu">
        {showMobileMenu ? '×' : '≡'}
      </button>
    </div>
  </div>

  <!-- Mobile Menu -->
  {#if showMobileMenu}
    <div class="mobile-menu">
      <a href="/callbook" use:link class:active={$location === '/callbook'}>
        Callbook
      </a>
      <a href="/exam" use:link class:active={$location.startsWith('/exam')}>
        Exam Prep
      </a>
    </div>
  {/if}
</nav>

<!-- Help Modal -->
{#if showHelpModal}
  <div class="modal-backdrop" on:click={closeHelpModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>About LZ Radio</h2>
        <button class="icon-btn" on:click={closeHelpModal} aria-label="Close">
          ×
        </button>
      </div>
      <div class="modal-body">
        <p><strong>LZ Radio - Amateur Radio Tools</strong></p>
        <p>Version 1.0.0</p>

        <h3>Features</h3>

        <p><strong>📻 Callbook</strong><br>
        Log contacts during operation. All data stored locally in your browser - no server needed.</p>

        <p><strong>📝 Exam Prep</strong><br>
        Practice for Technician, General, and Extra class exams with question pools.</p>

        <p><strong>💾 Export/Import</strong><br>
        Your logbook data stays in your browser. Use Export to back up, Import to restore data.</p>

        <h3>Keyboard Shortcuts</h3>
        <ul>
          <li><code>Alt+C</code> → Callbook</li>
          <li><code>Alt+E</code> → Exam Prep</li>
          <li><code>Esc</code> → Close modals</li>
        </ul>

        <p class="footer-text">Made for ham radio operators<br>
        Open source • MIT License</p>
      </div>
    </div>
  </div>
{/if}

<style>
  .nav {
    background: white;
    border-bottom: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
  }

  .nav-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-6);
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-brand a {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: var(--space-6);
  }

  .nav-links a {
    color: var(--color-text-muted);
    text-decoration: none;
    font-weight: 500;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    transition: all 0.15s ease;
  }

  .nav-links a:hover {
    color: var(--color-text);
    background: var(--color-bg);
  }

  .nav-links a.active {
    color: var(--color-primary);
    background: rgba(59, 130, 246, 0.1);
  }

  .nav-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .icon-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
  }

  .icon-btn:hover {
    background: var(--color-bg);
  }

  .mobile-menu-btn {
    display: none;
  }

  .mobile-menu {
    display: none;
    flex-direction: column;
    padding: var(--space-4);
    border-top: 1px solid var(--color-border);
    background: white;
  }

  .mobile-menu a {
    padding: var(--space-3);
    color: var(--color-text);
    text-decoration: none;
    border-radius: var(--radius-md);
    transition: background 0.15s ease;
  }

  .mobile-menu a:hover {
    background: var(--color-bg);
  }

  .mobile-menu a.active {
    color: var(--color-primary);
    background: rgba(59, 130, 246, 0.1);
  }

  /* Modal Styles */
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
    z-index: 1000;
    padding: var(--space-4);
  }

  .modal {
    background: white;
    border-radius: var(--radius-lg);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-6);
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    margin: 0;
  }

  .modal-body {
    padding: var(--space-6);
  }

  .modal-body h3 {
    margin-top: var(--space-6);
    margin-bottom: var(--space-3);
    font-size: 1.125rem;
  }

  .modal-body p {
    margin-bottom: var(--space-4);
  }

  .modal-body ul {
    margin-left: var(--space-6);
    margin-bottom: var(--space-4);
  }

  .modal-body code {
    font-family: var(--font-mono);
    background: var(--color-bg);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
  }

  .footer-text {
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    margin-top: var(--space-6);
  }

  /* Mobile Styles */
  @media (max-width: 767px) {
    .nav-content {
      padding: 0 var(--space-4);
    }

    .nav-links.desktop {
      display: none;
    }

    .mobile-menu-btn {
      display: flex;
    }

    .mobile-menu {
      display: flex;
    }
  }
</style>
