<script>
  import { link } from 'svelte-spa-router'
  import { _ } from 'svelte-i18n'
  import { createEventDispatcher } from 'svelte'
  import { examConfig } from '../../lib/examConfig.js'

  export let classNum
  export let classInfo

  const dispatch = createEventDispatcher()
</script>

<div class="page page-centered">
  <div class="header">
    <h1>{$_('exam.simulatedExam')}</h1>
    <a href="/exam/class{classNum}" use:link class="btn-secondary">← {$_('exam.backToClass', { values: { classNum } })}</a>
  </div>

  <!-- Class info -->
  <div class="class-info">
    <span class="class-name">{classInfo.class}</span>
    <span class="update-info">{classInfo.update}</span>
  </div>

  <!-- Exam Configuration -->
  <div class="card">
    <h3>{$_('exam.examConfiguration')}</h3>
    <p><strong>{$_('exam.questionsLabel')}:</strong> {examConfig.numberOfQuestions} {$_('exam.randomQuestions')}</p>
    <p><strong>{$_('exam.durationLabel')}:</strong> {examConfig.examDuration} {$_('exam.minutes')}</p>
    <p><strong>{$_('exam.passingCriteria')}:</strong> {examConfig.minCorrectAnswers} {$_('exam.correctAnswersRequired')}</p>
  </div>

  <!-- Exam Rules -->
  <div class="card rules-card">
    <h3>{$_('exam.examRules')}</h3>
    <ul class="rules-list">
      <li>{$_('exam.rule1')}</li>
      <li>{$_('exam.rule2')}</li>
      <li>{$_('exam.rule3')}</li>
      <li>{$_('exam.rule4')}</li>
    </ul>
  </div>

  <button
    class="btn-primary btn-large"
    on:click={() => dispatch('start')}
  >
    {$_('exam.startExam')}
  </button>
</div>

<style>
  .card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-4);
  }

  .card h3 {
    margin-top: 0;
    margin-bottom: var(--space-4);
    color: var(--color-text);
  }

  .card p {
    margin-bottom: var(--space-3);
  }

  .card p:last-child {
    margin-bottom: 0;
  }

  .rules-card {
    border-color: var(--color-primary);
  }

  .rules-list {
    list-style: none;
    padding: 0;
    margin-bottom: var(--space-6);
  }

  .rules-list li {
    padding: var(--space-3);
    margin-bottom: var(--space-2);
    background: var(--color-bg);
    border-left: 3px solid var(--color-primary);
    border-radius: var(--radius-sm);
  }

  .btn-large {
    width: 100%;
    padding: 16px 32px;
    font-size: 1.125rem;
  }
</style>
