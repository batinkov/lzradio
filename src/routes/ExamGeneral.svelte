<script>
  import { link } from 'svelte-spa-router'
</script>

<div class="page">
  <h1>General Exam</h1>
  <p>Route: <code>/exam/general</code></p>
  <p>Exam questions will appear here.</p>

  <a href="/exam" use:link class="btn">← Back to Exam Selection</a>
</div>

<style>
  /* Component-specific styles */
  .btn {
    display: inline-block;
    margin-top: var(--space-4);
    padding: 8px 16px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .btn:hover {
    background: var(--color-bg-card);
    border-color: var(--color-primary);
  }
</style>
