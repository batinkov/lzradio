<script>
  import { link } from 'svelte-spa-router'
</script>

<div class="page not-found">
  <h1>404 - Page Not Found</h1>
  <p>The page you're looking for doesn't exist.</p>
  <a href="/" use:link class="btn-primary">Go Home</a>
</div>

<style>
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

  .btn-primary {
    display: inline-block;
    background: var(--color-primary);
    color: white;
    padding: 12px 24px;
    border-radius: var(--radius-md);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .btn-primary:hover {
    background: #2563EB;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
</style>
