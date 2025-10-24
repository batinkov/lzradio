<script>
  import { link } from 'svelte-spa-router'
</script>

<div class="page">
  <h1>Exam Prep</h1>
  <p>Route: <code>/exam</code></p>
  <p>Select an exam level to practice:</p>

  <div class="exam-links">
    <a href="/exam/technician" use:link class="exam-card">Technician</a>
    <a href="/exam/general" use:link class="exam-card">General</a>
    <a href="/exam/extra" use:link class="exam-card">Extra</a>
  </div>
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

  .exam-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
    margin-top: var(--space-6);
  }

  .exam-card {
    padding: var(--space-6);
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    text-align: center;
    text-decoration: none;
    color: var(--color-text);
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .exam-card:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
</style>
