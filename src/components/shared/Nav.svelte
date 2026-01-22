<script>
  import { onMount, onDestroy } from 'svelte'
  import { link, location } from 'svelte-spa-router'
  import { _ } from 'svelte-i18n'
  import { locale, changeLanguage, SUPPORTED_LOCALES } from '../../lib/i18n.js'
  import { navigationBlocked } from '../../lib/navigationGuard.js'
  import { theme, toggleTheme } from '../../lib/theme.js'

  // Build-time injected values from package.json via Vite
  const appVersion = __APP_VERSION__
  const maintainerCallsign = __MAINTAINER_CALLSIGN__
  const githubRepo = __GITHUB_REPO__

  let showMobileMenu = false
  let showHelpMenu = false
  let showFeaturesModal = false
  let showAboutModal = false

  function toggleMobileMenu() {
    showMobileMenu = !showMobileMenu
  }

  function toggleHelpMenu() {
    showHelpMenu = !showHelpMenu
  }

  function closeHelpMenu() {
    showHelpMenu = false
  }

  function openFeaturesModal() {
    showFeaturesModal = true
    closeHelpMenu()
  }

  function closeFeaturesModal() {
    showFeaturesModal = false
  }

  function openAboutModal() {
    showAboutModal = true
    closeHelpMenu()
  }

  function closeAboutModal() {
    showAboutModal = false
  }

  function switchLanguage(lang) {
    changeLanguage(lang)
  }

  function switchTheme() {
    toggleTheme()
  }

  // Handle ESC key to close modals
  function handleEscapeKey(event) {
    if (event.key === 'Escape') {
      if (showFeaturesModal) closeFeaturesModal()
      if (showAboutModal) closeAboutModal()
      if (showHelpMenu) closeHelpMenu()
    }
  }

  // Handle click outside to close help menu
  function handleClickOutside(event) {
    if (showHelpMenu && !event.target.closest('.help-menu-container')) {
      closeHelpMenu()
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleEscapeKey)
    window.addEventListener('click', handleClickOutside)
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleEscapeKey)
    window.removeEventListener('click', handleClickOutside)
  })

  // Close mobile menu when route changes
  $: if ($location) {
    showMobileMenu = false
  }

  // Disable language switching during prep mode (simulated mode already disables entire nav)
  $: isInPrepMode = $location.includes('/prep')

  // Documentation URL based on current locale
  $: documentationUrl = $locale === 'bg'
    ? 'https://github.com/batinkov/lzradio/wiki/bg-Home'
    : 'https://github.com/batinkov/lzradio/wiki/en-Home'
</script>

<nav class="nav" class:nav-blocked={$navigationBlocked}>
  <div class="nav-content">
    <div class="nav-brand">
      <a href="/" use:link>
        LZ Radio
      </a>
    </div>

    <!-- Desktop Navigation -->
    <div class="nav-links desktop">
      <a
        href="/logbook"
        use:link
        class:active={$location === '/logbook'}
      >
        {$_('nav.logbook')}
      </a>
      <a
        href="/exam"
        use:link
        class:active={$location.startsWith('/exam')}
      >
        {$_('nav.examPrep')}
      </a>
    </div>

    <div class="nav-actions">
      <!-- Language Switcher -->
      <div class="language-switcher">
        {#each SUPPORTED_LOCALES as lang (lang)}
          <button
            class="lang-btn"
            class:active={$locale === lang}
            on:click={() => switchLanguage(lang)}
            disabled={isInPrepMode}
            title={isInPrepMode ? $_('nav.languageDisabledDuringExam') : `Switch to ${lang}`}
            aria-label="Switch to {lang}"
          >
            {lang.toUpperCase()}
          </button>
        {/each}
      </div>

      <!-- Theme Toggle -->
      <button
        class="icon-btn"
        on:click={switchTheme}
        aria-label={$_('nav.toggleTheme')}
        title={$theme === 'light' ? $_('nav.switchToDark') : $_('nav.switchToLight')}
      >
        {$theme === 'light' ? '🌙' : '☀️'}
      </button>

      <!-- Help Menu Dropdown -->
      <div class="help-menu-container">
        <button
          class="icon-btn"
          on:click={toggleHelpMenu}
          aria-label={$_('nav.help')}
          aria-expanded={showHelpMenu}
        >
          ?
        </button>
        {#if showHelpMenu}
          <div class="help-dropdown">
            <a href={documentationUrl} target="_blank" rel="noopener noreferrer" on:click={closeHelpMenu}>
              📖 {$_('helpMenu.documentation')}
            </a>
            <button on:click={openFeaturesModal}>
              📋 {$_('helpMenu.features')}
            </button>
            <button on:click={openAboutModal}>
              ℹ️ {$_('helpMenu.about')}
            </button>
          </div>
        {/if}
      </div>

      <!-- Mobile Menu Toggle -->
      <button class="icon-btn mobile-menu-btn" on:click={toggleMobileMenu} aria-label={$_('nav.menu')}>
        {showMobileMenu ? '×' : '≡'}
      </button>
    </div>
  </div>

  <!-- Mobile Menu -->
  {#if showMobileMenu}
    <div class="mobile-menu">
      <a
        href="/logbook"
        use:link
        class:active={$location === '/logbook'}
      >
        {$_('nav.logbook')}
      </a>
      <a
        href="/exam"
        use:link
        class:active={$location.startsWith('/exam')}
      >
        {$_('nav.examPrep')}
      </a>
    </div>
  {/if}
</nav>

<!-- Features Modal -->
{#if showFeaturesModal}
  <div class="modal-backdrop" on:click={closeFeaturesModal} role="presentation">
    <div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" tabindex="-1">
      <div class="modal-header">
        <h2>{$_('features.title')}</h2>
        <button class="icon-btn" on:click={closeFeaturesModal} aria-label={$_('common.close')}>
          ×
        </button>
      </div>
      <div class="modal-body">
        <p><strong>{$_('features.logbook.title')}</strong><br>
        {$_('features.logbook.description')}<br>
        <span class="feature-subsection">💾 {$_('features.logbook.exportImport')}</span></p>

        <p><strong>{$_('features.examPrep.title')}</strong><br>
        {$_('features.examPrep.description')}</p>

        <h3>{$_('features.keyboardShortcuts')}</h3>
        <ul>
          <li><code>← →</code> → {$_('features.shortcuts.arrowKeys')}</li>
          <li><code>1-4</code> → {$_('features.shortcuts.numberKeys')}</li>
          <li><code>Esc</code> → {$_('features.shortcuts.closeModals')}</li>
        </ul>

        <p class="footer-text">{$_('features.footer')}</p>
      </div>
    </div>
  </div>
{/if}

<!-- About Modal -->
{#if showAboutModal}
  <div class="modal-backdrop" on:click={closeAboutModal} role="presentation">
    <div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" tabindex="-1">
      <div class="modal-header">
        <h2>{$_('about.title')}</h2>
        <button class="icon-btn" on:click={closeAboutModal} aria-label={$_('common.close')}>
          ×
        </button>
      </div>
      <div class="modal-body">
        <div class="about-header">
          <h3>{$_('about.appName')}</h3>
          <p class="app-description">{$_('about.appDescription')}</p>
          <p class="version">{$_('about.version')} {appVersion}</p>
        </div>

        <div class="about-section">
          <p><strong>{$_('about.maintainedBy')}</strong> {maintainerCallsign}</p>
        </div>

        <div class="about-section">
          <h4>{$_('about.feedback')}</h4>
          <div class="feedback-links">
            <a href="https://github.com/{githubRepo}/issues/new?template=bug_report.md" target="_blank" rel="noopener noreferrer">
              🐛 {$_('about.reportBug')}
            </a>
            <a href="https://github.com/{githubRepo}/issues/new?template=feature_request.md" target="_blank" rel="noopener noreferrer">
              💡 {$_('about.featureRequest')}
            </a>
            <a href="https://github.com/{githubRepo}/issues/new" target="_blank" rel="noopener noreferrer">
              💬 {$_('about.generalFeedback')}
            </a>
          </div>
        </div>

        <div class="about-footer">
          <p>{$_('about.openSource')} • {$_('about.license')}</p>
          <a href="https://github.com/{githubRepo}" target="_blank" rel="noopener noreferrer">
            {$_('about.viewOnGitHub')}
          </a>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Navigation-specific styles */
  .nav {
    background: var(--color-bg-card);
    border-bottom: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
  }

  /* Disabled navigation during exam */
  .nav-blocked .nav-content {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
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
    background: var(--color-bg);
  }

  /* Light mode: use more visible background for active/hover states */
  :global(:root) .nav-links a.active,
  :global(:root) .nav-links a:hover {
    background: #E5E7EB;
  }

  /* Dark mode: keep using the CSS variable */
  :global([data-theme="dark"]) .nav-links a.active,
  :global([data-theme="dark"]) .nav-links a:hover {
    background: var(--color-bg);
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
    background: var(--color-bg-card);
  }

  .lang-btn.active {
    color: white;
    background: var(--color-primary);
  }

  .lang-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .lang-btn:disabled:hover {
    color: var(--color-text-muted);
    background: transparent;
  }

  .lang-btn.active:disabled:hover {
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
    background: var(--color-bg-card);
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
    background: var(--color-bg);
  }

  /* Help Menu Dropdown */
  .help-menu-container {
    position: relative;
  }

  .help-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: var(--space-2);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    min-width: 160px;
    z-index: 100;
    overflow: hidden;
  }

  .help-dropdown button,
  .help-dropdown a {
    display: block;
    width: 100%;
    padding: var(--space-3) var(--space-4);
    border: none;
    background: none;
    text-align: left;
    font-size: 0.9rem;
    color: var(--color-text);
    cursor: pointer;
    transition: background 0.15s ease;
    text-decoration: none;
    white-space: nowrap;
  }

  .help-dropdown button:hover,
  .help-dropdown a:hover {
    background: var(--color-bg);
  }

  /* About Modal Styles */
  .about-header {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .about-header h3 {
    font-size: 1.5rem;
    margin-bottom: var(--space-1);
  }

  .about-header .app-description {
    color: var(--color-text-muted);
    margin-bottom: var(--space-2);
  }

  .about-header .version {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .about-section {
    margin-bottom: var(--space-4);
  }

  .about-section h4 {
    font-size: 1rem;
    margin-bottom: var(--space-2);
  }

  .feedback-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .feedback-links a {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg);
    border-radius: var(--radius-md);
    color: var(--color-text);
    text-decoration: none;
    font-size: 0.9rem;
    transition: background 0.15s ease;
  }

  .feedback-links a:hover {
    background: var(--color-border);
  }

  .about-footer {
    text-align: center;
    margin-top: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .about-footer p {
    color: var(--color-text-muted);
    font-size: 0.875rem;
    margin-bottom: var(--space-2);
  }

  .about-footer a {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.875rem;
  }

  .about-footer a:hover {
    text-decoration: underline;
  }

  /* Modal-specific styles */
  .feature-subsection {
    display: inline-block;
    margin-top: var(--space-1);
    padding-left: var(--space-4);
    font-size: 0.9rem;
    color: var(--color-text-muted);
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
