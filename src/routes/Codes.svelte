<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-i18n'
  import { loadCodes } from '../lib/codes.js'
  import CodeRow from '../components/codes/CodeRow.svelte'
  import RstBlock from '../components/codes/RstBlock.svelte'

  let codes = $state(null)

  const total = $derived(
    codes ? codes.categories.reduce((sum, category) => sum + category.entries.length, 0) : 0
  )

  onMount(async () => {
    codes = await loadCodes()
  })

  // Hash routing rules out href="#section" anchors, so section jumps scroll from JS
  function jumpTo(sectionId) {
    document
      .getElementById(`codes-${sectionId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
</script>

<div class="codes-page">
  <h1>{$_('codes.title')}</h1>
  <p class="subtitle">{$_('codes.subtitle')}</p>

  {#if !codes}
    <p class="loading">{$_('common.loading')}</p>
  {:else}
    <div class="toolbar">
      <nav class="jump" aria-label={$_('codes.jumpTo')}>
        {#each codes.categories as category (category.id)}
          <button type="button" onclick={() => jumpTo(category.id)}>{category.title}</button>
        {/each}
        <button type="button" onclick={() => jumpTo(codes.rst.id)}>{codes.rst.title}</button>
      </nav>
      <span class="total">{$_('codes.total', { values: { count: total } })}</span>
    </div>

    {#each codes.categories as category (category.id)}
      <section id="codes-{category.id}">
        <header>
          <h2>{category.title} <span class="count">{category.entries.length}</span></h2>
        </header>
        <p class="intro">{category.intro}</p>
        <ul class="rows">
          {#each category.entries as entry (entry.id)}
            <CodeRow {entry} categoryId={category.id} onSee={() => jumpTo(entry.see)} />
          {/each}
        </ul>
      </section>
    {/each}

    <section id="codes-{codes.rst.id}">
      <header>
        <h2>{codes.rst.title}</h2>
      </header>
      <p class="intro">{codes.rst.intro}</p>
      <RstBlock rst={codes.rst} />
    </section>
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
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) 0;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
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

  .jump button:hover {
    border-color: var(--color-primary);
  }

  .total {
    margin-left: auto;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  section {
    margin-top: var(--space-8);
    /* Keep the section heading clear of the sticky toolbar after a jump */
    scroll-margin-top: 4rem;
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

    .total {
      display: none;
    }
  }
</style>
