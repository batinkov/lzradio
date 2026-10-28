<script>
  import { _ } from 'svelte-i18n'

  /**
   * RST explainer: report formats, the three rating scales and suffix letters.
   * RST is a rating worked out from what you hear, so it is not shown as rows.
   */
  let { rst } = $props()
</script>

<div class="rst">
  <dl class="formats">
    {#each rst.formats as format (format.mode)}
      <div>
        <dt>{format.mode}</dt>
        <dd><b>{format.example}</b> {format.description}</dd>
      </div>
    {/each}
  </dl>

  <div class="scales">
    {#each rst.scales as scale (scale.id)}
      <div>
        <table>
          <caption>{scale.id.toUpperCase()} · {scale.name}</caption>
          <tbody>
            {#each scale.values as step (step.value)}
              <tr>
                <td>{step.value}</td>
                <td>{step.label}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        {#if scale.note}
          <p class="note">{scale.note}</p>
        {/if}
      </div>
    {/each}
  </div>

  <h3>{$_('codes.rstSuffixes')}</h3>
  <ul class="suffixes">
    {#each rst.suffixes as suffix (suffix.letter)}
      <li><b>{suffix.letter}</b> {suffix.meaning}</li>
    {/each}
  </ul>
</div>

<style>
  .rst {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }

  .formats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-6);
    margin: 0;
  }

  dt {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
  }

  dd {
    margin: 0;
  }

  b {
    font-family: var(--font-mono);
  }

  .scales {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
    margin-top: var(--space-4);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  caption {
    text-align: left;
    font-weight: 700;
    padding-bottom: var(--space-1);
  }

  td {
    border-top: 1px solid var(--color-border);
    padding: var(--space-1);
    vertical-align: top;
  }

  td:first-child {
    font-family: var(--font-mono);
    font-weight: 700;
    width: 1.5rem;
  }

  .note {
    margin: var(--space-1) 0 0;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  h3 {
    font-size: 0.95rem;
    margin: var(--space-4) 0 var(--space-2);
  }

  .suffixes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.85rem;
  }

  @media (max-width: 640px) {
    .scales {
      grid-template-columns: 1fr;
    }
  }
</style>
