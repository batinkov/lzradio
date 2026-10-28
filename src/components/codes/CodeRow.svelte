<script>
  import { _ } from 'svelte-i18n'
  import { highlightMatch } from '../../lib/logbookSearch.js'
  import { splitCodeMatch } from '../../lib/codesSearch.js'

  /**
   * One code laid out as a row: code | content | origin badge.
   * The content depends on the category: Q-codes have a question and an
   * answer form, the rest have a list of meanings. Meaning text marks the
   * `highlight` query; the data is ours and holds no markup, so {@html} is safe.
   */
  let { entry, categoryId, highlight = '', onSee } = $props()

  const mark = (text) => highlightMatch(text, highlight)

  // The locale string places the alias list; split it there so each alias can be marked
  const aliasesText = $derived(
    $_('codes.alsoKnownAs', { values: { aliases: '\u0000' } }).split('\u0000')
  )

  const isQCode = $derived(categoryId === 'q-codes')
  const isProsign = $derived(categoryId === 'prosigns')

  // Data stores Morse as . and -; show it as dots and dashes that read well
  const morse = $derived(entry.morse?.replaceAll('.', '·').replaceAll('-', '−'))
</script>

{#snippet code(text)}
  {@const parts = splitCodeMatch(text, highlight)}
  {#if parts}<mark>{parts.match}</mark>{parts.rest}{:else}{text}{/if}
{/snippet}

<li class="row">
  <div class="code">
    <span class:overline={isProsign}>{@render code(entry.code)}</span>
    {#if entry.aliases}
      <span class="aliases">
        {aliasesText[0]}{#each entry.aliases as alias, i (alias)}{i > 0 ? ', ' : ''}{@render code(
            alias
          )}{/each}{aliasesText[1]}
      </span>
    {/if}
  </div>

  <div class="content">
    {#if isQCode}
      {#if entry.question}
        <div class="qa">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <p><span class="label">{entry.code}?</span>{@html mark(entry.question)}</p>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <p><span class="label">{entry.code}</span>{@html mark(entry.answer)}</p>
        </div>
      {:else}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <p>{@html mark(entry.answer)}</p>
      {/if}
      {#if entry.usage}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <p class="muted">{$_('codes.onAir')} {@html mark(entry.usage)}</p>
      {/if}
      {#if entry.scale}
        <ol class="scale">
          {#each entry.scale as step (step.value)}
            <li><b>{step.value}</b> {step.label}</li>
          {/each}
        </ol>
      {/if}
    {:else}
      <ul class="meanings">
        {#each entry.meanings as meaning (meaning)}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <li>{@html mark(meaning)}</li>
        {/each}
      </ul>
      {#if morse}
        <p class="morse" title={$_('codes.morse')}>{morse}</p>
      {/if}
    {/if}

    {#if entry.note}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <p class="muted">{@html mark(entry.note)}</p>
    {/if}
    {#if entry.see}
      <button type="button" class="see" onclick={onSee}>{$_('codes.seeRst')}</button>
    {/if}
  </div>

  <span class="badge" class:slang={entry.origin === 'slang'}>
    {#if entry.origin === 'itu'}
      <abbr title={$_('codes.originFull.itu')}>{$_('codes.origin.itu')}</abbr>
    {:else}
      {$_(`codes.origin.${entry.origin}`)}
    {/if}
  </span>
</li>

<style>
  .row {
    display: grid;
    grid-template-columns: 6.5rem 1fr auto;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--color-border);
    align-items: start;
  }

  .row:first-child {
    border-top: 0;
  }

  p {
    margin: 0;
  }

  .content > * + * {
    margin-top: var(--space-1);
  }

  .code {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 1.15rem;
  }

  .overline {
    text-decoration: overline;
  }

  .aliases {
    display: block;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--color-text-muted);
  }

  .qa {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .label {
    display: block;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .muted {
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .scale {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin: var(--space-2) 0 0;
    padding: 0;
    list-style: none;
  }

  .scale li {
    font-size: 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0 var(--space-1);
  }

  .scale b {
    font-family: var(--font-mono);
  }

  .meanings {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .meanings li {
    display: inline;
  }

  .meanings li + li::before {
    content: ' · ';
    color: var(--color-text-muted);
  }

  .morse {
    font-family: var(--font-mono);
    font-size: 1.1rem;
    letter-spacing: 0.15em;
  }

  .see {
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    font-size: 0.9rem;
    color: var(--color-primary);
    text-decoration: underline;
    cursor: pointer;
  }

  .badge {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    padding: 0 var(--space-2);
    color: var(--color-text-muted);
  }

  /* Amber text on white is unreadable, so the warning colour marks only the frame */
  /* The badge border already marks it; a dotted underline would be noise */
  .badge abbr {
    text-decoration: none;
    cursor: help;
  }

  .badge.slang {
    border-color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 15%, transparent);
    color: var(--color-text);
  }

  /* Phones: code and badge share the top line, content wraps below */
  @media (max-width: 640px) {
    .row {
      grid-template-columns: 1fr auto;
      gap: var(--space-2);
    }

    .content {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    .qa {
      grid-template-columns: 1fr;
      gap: var(--space-2);
    }
  }
</style>
