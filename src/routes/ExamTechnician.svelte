<script>
  import { link } from 'svelte-spa-router'
</script>

<div class="page">
  <h1>Technician Exam</h1>
  <p>Route: <code>/exam/technician</code></p>
  <p>Exam questions will appear here.</p>

  <a href="/exam" use:link class="btn">← Back to Exam Selection</a>
</div>

<style>
  .page {
    padding: var(--space-4) 0;
  }

  code {
    font-family: var(--font-mono);
    background: var(--color-bg);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }

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
    background: white;
    border-color: var(--color-primary);
  }
</style>
