<script>
  import { link, location, querystring } from 'svelte-spa-router'

  // Parse URL parameters
  // URL format: /exam/class1/prep?order=random&categories=1,2,3
  $: classNum = $location.includes('class2') ? '2' : '1'
  $: urlParams = new URLSearchParams($querystring)
  $: questionOrder = urlParams.get('order') || 'sequential'
  $: categories = urlParams.get('categories')?.split(',').map(Number) || [1, 2, 3]
</script>

<div class="page">
  <div class="header">
    <h1>Preparation Mode - Class {classNum}</h1>
    <a href="/exam/class{classNum}" use:link class="btn-secondary">← Back to Class {classNum} - Exam Preparation</a>
  </div>

  <div class="info-card">
    <h3>Configuration</h3>
    <p><strong>Question Order:</strong> {questionOrder}</p>
    <p><strong>Categories:</strong> {categories.join(', ')}</p>
  </div>

  <div class="placeholder">
    <p>ExamPrep component - Coming soon!</p>
    <p>This will show questions with immediate feedback (green/red)</p>
  </div>
</div>

<style>
  .page {
    padding: var(--space-4) 0;
    max-width: 900px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .header h1 {
    margin: 0;
  }

  .btn-secondary {
    background: white;
    color: var(--color-text);
    padding: 10px 20px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .btn-secondary:hover {
    background: var(--color-bg);
    border-color: var(--color-primary);
  }

  .info-card {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
  }

  .info-card h3 {
    margin-top: 0;
  }

  .placeholder {
    background: var(--color-bg);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-12);
    text-align: center;
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
