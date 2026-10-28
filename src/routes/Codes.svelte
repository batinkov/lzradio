<script>
  import { tick } from 'svelte'
  import { _, locale } from 'svelte-i18n'
  import { router, replace } from 'svelte-spa-router'
  import { loadCodes } from '../lib/codes.js'
  import { parseCodesParams, buildCodesLocation } from '../lib/urlParams.js'
  import { createCodesIndex, normalizeCodeQuery, searchCodes } from '../lib/codesSearch.js'
  import CodeRow from '../components/codes/CodeRow.svelte'
  import RstBlock from '../components/codes/RstBlock.svelte'
  import Banner from '../components/shared/Banner.svelte'

  const URL_UPDATE_DELAY_MS = 300

  let codes = $state(null)
  let query = $state('')
  let searchInput = $state()

  // Build the fuzzy index once per load, not on every keystroke
  const index = $derived(codes ? createCodesIndex(codes) : null)
  const searching = $derived(normalizeCodeQuery(query) !== '')
  const result = $derived(codes ? searchCodes(codes, query, index) : null)
  const highlight = $derived(searching ? query.trim() : '')

  // RST is not a code row, but a search that finds it should not read "0 codes"
  const total = $derived(
    result
      ? result.categories.reduce((sum, category) => sum + category.entries.length, 0) +
          (searching && result.rst ? 1 : 0)
      : 0
  )
  const nothingFound = $derived(searching && total === 0)

  // Load the data in the UI language, again whenever the language changes.
  // The previous language stays on screen until the new one has loaded.
  $effect(() => {
    const current = $locale
    let cancelled = false
    loadCodes(current).then((loaded) => {
      if (!cancelled) {
        codes = loaded
      }
    })
    return () => {
      cancelled = true
    }
  })

  // The search lives in the URL (/#/codes?q=qth) so it can be shared and reopened.
  // Remember what this page wrote, so its own URL updates are not read back:
  // that would trim the query while the user is still typing ("end of ").
  let writtenQuerystring = null

  // URL to search box: on load, and when a link changes ?q= while on the page
  $effect(() => {
    const querystring = router.querystring ?? ''
    if (querystring !== writtenQuerystring) {
      query = parseCodesParams(querystring).query
    }
  })

  // Search box to URL, once typing pauses. replace, not push: typing should
  // not fill the Back history.
  $effect(() => {
    const location = buildCodesLocation(query)
    const timer = setTimeout(() => {
      if (location !== buildCodesLocation(parseCodesParams(router.querystring ?? '').query)) {
        writtenQuerystring = location.split('?')[1] ?? ''
        replace(location)
      }
    }, URL_UPDATE_DELAY_MS)
    return () => clearTimeout(timer)
  })

  // Hash routing rules out href="#section" anchors, so section jumps scroll from JS
  function jumpTo(sectionId) {
    document
      .getElementById(`codes-${sectionId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function clearSearch() {
    query = ''
    searchInput?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // The RST section is hidden while a search does not match it, so clear first
  async function seeRst() {
    query = ''
    await tick()
    jumpTo(codes.rst.id)
  }

  // Results start at the top of the list; scrolled further down, they would sit
  // above the screen and the search would look like it found nothing
  function handleSearchInput() {
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  function handleSearchKeydown(event) {
    if (event.key === 'Escape') {
      clearSearch()
    }
  }

  // "/" focuses the search box, unless the user is already typing somewhere
  function handleWindowKeydown(event) {
    const target = event.target
    const typing =
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      searchInput?.focus()
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="codes-page">
  <Banner
    badgeText={$_('common.alphaVersion')}
    message={$_('codes.alphaBanner.message')}
    dismissible={false}
  />

  <h1>{$_('codes.title')}</h1>
  <p class="subtitle">{$_('codes.subtitle')}</p>

  {#if !codes}
    <p class="loading">{$_('common.loading')}</p>
  {:else}
    <div class="toolbar">
      <div class="search">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          bind:this={searchInput}
          bind:value={query}
          type="search"
          autocomplete="off"
          spellcheck="false"
          aria-label={$_('codes.searchLabel')}
          placeholder={$_('codes.searchPlaceholder')}
          oninput={handleSearchInput}
          onkeydown={handleSearchKeydown}
        />
        {#if query}
          <button
            type="button"
            class="clear"
            onclick={clearSearch}
            aria-label={$_('codes.clearSearch')}
          >
            ×
          </button>
        {:else}
          <kbd aria-hidden="true">/</kbd>
        {/if}
      </div>

      <div class="jump-row">
        <nav class="jump" aria-label={$_('codes.jumpTo')}>
          {#each result.categories as category (category.id)}
            <button
              type="button"
              disabled={category.entries.length === 0}
              onclick={() => jumpTo(category.id)}>{category.title}</button
            >
          {/each}
          <button type="button" disabled={!result.rst} onclick={() => jumpTo(codes.rst.id)}
            >{codes.rst.title}</button
          >
        </nav>
        <span class="total" aria-live="polite"
          >{$_('codes.total', { values: { count: total } })}</span
        >
      </div>
    </div>

    {#if nothingFound}
      <p class="empty">{$_('codes.noResults', { values: { query: query.trim() } })}</p>
    {/if}

    {#each result.categories as category (category.id)}
      {#if category.entries.length > 0}
        <section id="codes-{category.id}">
          <header>
            <h2>{category.title} <span class="count">{category.entries.length}</span></h2>
          </header>
          {#if !searching}
            <p class="intro">{category.intro}</p>
          {/if}
          <ul class="rows">
            {#each category.entries as entry (entry.id)}
              <CodeRow {entry} categoryId={category.id} {highlight} onSee={seeRst} />
            {/each}
          </ul>
        </section>
      {/if}
    {/each}

    {#if result.rst}
      <section id="codes-{codes.rst.id}">
        <header>
          <h2>{codes.rst.title}</h2>
        </header>
        {#if !searching}
          <p class="intro">{codes.rst.intro}</p>
        {/if}
        <RstBlock rst={codes.rst} />
      </section>
    {/if}
  {/if}
</div>

<style>
  .codes-page {
    max-width: 960px;
    margin: 0 auto;
  }

  h1 {
    margin-bottom: var(--space-1);
  }

  .subtitle,
  .loading {
    color: var(--color-text-muted);
    margin: 0 0 var(--space-4);
  }

  .toolbar {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: var(--space-3) 0;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  .search {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  /* The box shows focus for the input inside it, like a focused input in app.css */
  .search:focus-within {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .search input {
    flex: 1;
    min-width: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    outline: 0;
    background: transparent;
    color: var(--color-text);
    font: inherit;
    font-size: 1rem;
  }

  /* The clear button below replaces the browser's own */
  .search input::-webkit-search-cancel-button {
    appearance: none;
  }

  .search input:focus {
    outline: 0;
  }

  .search kbd {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0 0.3rem;
  }

  .clear {
    border: 0;
    padding: 0 var(--space-1);
    background: none;
    color: var(--color-text-muted);
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
  }

  .clear:hover {
    color: var(--color-text);
  }

  .jump-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-top: var(--space-2);
  }

  .jump {
    display: flex;
    flex-wrap: wrap;
    min-width: 0;
    gap: var(--space-2);
  }

  .jump button {
    font: inherit;
    font-size: 0.85rem;
    white-space: nowrap;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-bg-card);
    color: var(--color-text);
    padding: 0.15rem 0.7rem;
    cursor: pointer;
  }

  .jump button:hover:not(:disabled) {
    border-color: var(--color-primary);
  }

  .jump button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .total {
    margin-left: auto;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .empty {
    text-align: center;
    /* The message repeats the query, which may be one long word */
    overflow-wrap: anywhere;
    color: var(--color-text-muted);
    padding: var(--space-12) 0;
  }

  section {
    margin-top: var(--space-8);
    /* Keep the section heading clear of the sticky toolbar after a jump */
    scroll-margin-top: 7.5rem;
  }

  section > header {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    border-bottom: 2px solid var(--color-text);
    padding-bottom: var(--space-1);
  }

  h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  .count {
    font-weight: 400;
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  .intro {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin: var(--space-2) 0 var(--space-3);
  }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  /* Phones: one row of chips that scrolls sideways */
  @media (max-width: 640px) {
    .jump {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .total,
    .search input:focus {
      outline: 0;
    }

    .search kbd {
      display: none;
    }
  }
</style>
