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
      <a href="/logbook" use:link class:active={$location === '/logbook'}>
        LogBook
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
      <a href="/logbook" use:link class:active={$location === '/logbook'}>
        LogBook
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

        <p><strong>📻 LogBook</strong><br>
        Log contacts during operation. All data stored locally in your browser - no server needed.</p>

        <p><strong>📝 Exam Prep</strong><br>
        Practice for Technician, General, and Extra class exams with question pools.</p>

        <p><strong>💾 Export/Import</strong><br>
        Your logbook data stays in your browser. Use Export to back up, Import to restore data.</p>

        <h3>Keyboard Shortcuts</h3>
        <ul>
          <li><code>Alt+L</code> → LogBook</li>
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
  /* Navigation-specific styles */
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

  /* Modal-specific styles */
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
