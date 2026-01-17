<script>
  import { link } from 'svelte-spa-router'
  import { _, locale } from 'svelte-i18n'
  import { getAllQuestions } from '../lib/questions.js'

  // State for question counts
  let class1Count = 0
  let class2Count = 0

  // Load question counts when locale changes
  $: loadQuestionCounts($locale)

  async function loadQuestionCounts() {
    try {
      const [class1Questions, class2Questions] = await Promise.all([
        getAllQuestions(1),
        getAllQuestions(2)
      ])
      class1Count = class1Questions.length
      class2Count = class2Questions.length
    } catch (error) {
      console.error('Failed to load questions:', error)
    }
  }
</script>

<div class="page page-centered">
  <div class="header">
    <h1>{$_('exam.title')}</h1>
  </div>

  <!-- Class Selection -->
  <section class="class-selection">
    <h2>{$_('exam.selectClass')}</h2>
    <div class="class-cards">
      <a href="/exam/class1" use:link class="class-card">
        <h3>{$_('exam.class1')}</h3>
        <p class="question-count">{class1Count} {$_('exam.questions')}</p>
        <span class="btn-link">{$_('exam.selectButton')} →</span>
      </a>
      <a href="/exam/class2" use:link class="class-card">
        <h3>{$_('exam.class2')}</h3>
        <p class="question-count">{class2Count} {$_('exam.questions')}</p>
        <span class="btn-link">{$_('exam.selectButton')} →</span>
      </a>
    </div>
  </section>
</div>

<style>
  /* Component-specific styles */
  .header {
    margin-bottom: var(--space-8);
  }

  /* Class Selection */
  .class-selection h2 {
    margin-bottom: var(--space-6);
    text-align: center;
  }

  .class-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-6);
  }

  .class-card {
    background: var(--color-bg-card);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: block;
  }

  .class-card:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }

  .class-card h3 {
    font-size: 1.5rem;
    margin-bottom: var(--space-3);
    color: var(--color-primary);
  }

  .question-count {
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
  }

  .btn-link {
    color: var(--color-primary);
    font-weight: 500;
  }

  /* Mobile */
  @media (max-width: 767px) {
    .class-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
