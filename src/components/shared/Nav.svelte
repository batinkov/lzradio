<script>
  import { link, location } from 'svelte-spa-router'
  import { _ } from 'svelte-i18n'
  import { locale, changeLanguage, SUPPORTED_LOCALES } from '../../lib/i18n.js'

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

  function switchLanguage(lang) {
    changeLanguage(lang)
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
        {$_('nav.logbook')}
      </a>
      <a href="/exam" use:link class:active={$location.startsWith('/exam')}>
        {$_('nav.examPrep')}
      </a>
    </div>

    <div class="nav-actions">
      <!-- Language Switcher -->
      <div class="language-switcher">
        {#each SUPPORTED_LOCALES as lang}
          <button
            class="lang-btn"
            class:active={$locale === lang}
            on:click={() => switchLanguage(lang)}
            aria-label="Switch to {lang}"
          >
            {lang.toUpperCase()}
          </button>
        {/each}
      </div>

      <button class="icon-btn" on:click={toggleHelpModal} aria-label={$_('nav.help')}>
        ?
      </button>

      <!-- Mobile Menu Toggle -->
      <button class="icon-btn mobile-menu-btn" on:click={toggleMobileMenu} aria-label={$_('nav.menu')}>
        {showMobileMenu ? '×' : '≡'}
      </button>
    </div>
  </div>

  <!-- Mobile Menu -->
  {#if showMobileMenu}
    <div class="mobile-menu">
      <a href="/logbook" use:link class:active={$location === '/logbook'}>
        {$_('nav.logbook')}
      </a>
      <a href="/exam" use:link class:active={$location.startsWith('/exam')}>
        {$_('nav.examPrep')}
      </a>
    </div>
  {/if}
</nav>

<!-- Help Modal -->
{#if showHelpModal}
  <div class="modal-backdrop" on:click={closeHelpModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>{$_('help.title')}</h2>
        <button class="icon-btn" on:click={closeHelpModal} aria-label={$_('common.close')}>
          ×
        </button>
      </div>
      <div class="modal-body">
        <p><strong>{$_('help.description')}</strong></p>
        <p>{$_('help.version')}</p>

        <h3>{$_('help.features')}</h3>

        <p><strong>{$_('help.logbook.title')}</strong><br>
        {$_('help.logbook.description')}</p>

        <p><strong>{$_('help.examPrep.title')}</strong><br>
        {$_('help.examPrep.description')}</p>

        <p><strong>{$_('help.exportImport.title')}</strong><br>
        {$_('help.exportImport.description')}</p>

        <h3>{$_('help.keyboardShortcuts')}</h3>
        <ul>
          <li><code>Alt+L</code> → {$_('help.shortcuts.logbook')}</li>
          <li><code>Alt+E</code> → {$_('help.shortcuts.examPrep')}</li>
          <li><code>Esc</code> → {$_('help.shortcuts.closeModals')}</li>
        </ul>

        <p class="footer-text">{$_('help.footer')}<br>
        {$_('help.openSource')}</p>
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

  .language-switcher {
    display: flex;
    gap: 2px;
    background: var(--color-bg);
    border-radius: var(--radius-md);
    padding: 2px;
  }

  .lang-btn {
    padding: 6px 12px;
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .lang-btn:hover {
    color: var(--color-text);
    background: white;
  }

  .lang-btn.active {
    color: white;
    background: var(--color-primary);
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
