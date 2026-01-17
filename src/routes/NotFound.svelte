<script>
  import { link } from 'svelte-spa-router'
  import { _ } from 'svelte-i18n'
</script>

<div class="page not-found">
  <h1>{$_('notFound.title')}</h1>
  <p>{$_('notFound.message')}</p>
  <a href="/" use:link class="btn-primary">{$_('notFound.goHome')}</a>
</div>

<style>
  /* Component-specific styles */
  .not-found {
    text-align: center;
    padding: var(--space-12) var(--space-4);
  }

  .not-found h1 {
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
  }

  .not-found p {
    color: var(--color-text-muted);
    margin-bottom: var(--space-6);
  }
</style>
