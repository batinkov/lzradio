<script>
  import { link } from 'svelte-spa-router'
</script>

<div class="page not-found">
  <h1>404 - Page Not Found</h1>
  <p>The page you're looking for doesn't exist.</p>
  <a href="/" use:link class="btn-primary">Go Home</a>
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
