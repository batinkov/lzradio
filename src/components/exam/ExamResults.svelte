<script>
  import { _ } from 'svelte-i18n'
  import { createEventDispatcher } from 'svelte'
  import { examConfig } from '../../lib/examConfig.js'

  export let examResults

  const dispatch = createEventDispatcher()

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }
</script>

<div class="page page-centered">
  <div class="header">
    <h1>{$_('exam.examResults')}</h1>
  </div>

  <!-- Results Card -->
  <div class="results-card" class:passed={examResults.passed} class:failed={!examResults.passed}>
    <div class="result-status">
      {#if examResults.passed}
        <div class="status-icon success">✓</div>
        <h2>{$_('exam.passed')}</h2>
      {:else}
        <div class="status-icon failure">✗</div>
        <h2>{$_('exam.failed')}</h2>
      {/if}
    </div>

    <div class="result-details">
      <div class="result-row">
        <span class="result-label">{$_('exam.correctAnswers')}:</span>
        <span class="result-value correct">{examResults.correctCount} / {examResults.totalQuestions}</span>
      </div>
      <div class="result-row">
        <span class="result-label">{$_('exam.wrongAnswers')}:</span>
        <span class="result-value wrong">{examResults.wrongCount}</span>
      </div>
      {#if examResults.unansweredCount > 0}
        <div class="result-row">
          <span class="result-label">{$_('exam.unansweredQuestions')}:</span>
          <span class="result-value unanswered">{examResults.unansweredCount}</span>
        </div>
      {/if}
      <div class="result-row">
        <span class="result-label">{$_('exam.completionTime')}:</span>
        <span class="result-value">{formatTime(examResults.completionTime)}</span>
      </div>
      <div class="result-row passing-criteria">
        <span class="result-label">{$_('exam.requiredToPass')}:</span>
        <span class="result-value">{examConfig.minCorrectAnswers} {$_('exam.correct')}</span>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="results-actions">
    <button class="btn-secondary btn-large" on:click={() => dispatch('review')}>
      {$_('exam.reviewAnswers')}
    </button>
    <button class="btn-primary btn-large" on:click={() => dispatch('tryAgain')}>
      {$_('exam.tryAgain')}
    </button>
    <button class="btn-leave-exam btn-large" on:click={() => dispatch('leave')} title={$_('exam.leaveExamTooltip')}>
      {$_('exam.leaveExamButton')}
    </button>
  </div>
</div>

<style>
  .results-card {
    background: white;
    border: 3px solid;
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    margin-bottom: var(--space-6);
  }

  .results-card.passed {
    border-color: var(--color-success);
    background: rgba(34, 197, 94, 0.05);
  }

  .results-card.failed {
    border-color: var(--color-error);
    background: rgba(239, 68, 68, 0.05);
  }

  .result-status {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .status-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    font-weight: 700;
    margin: 0 auto var(--space-4);
  }

  .status-icon.success {
    background: var(--color-success);
    color: white;
  }

  .status-icon.failure {
    background: var(--color-error);
    color: white;
  }

  .result-status h2 {
    margin: 0;
    font-size: 2rem;
  }

  .result-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .result-row {
    display: flex;
    justify-content: space-between;
    padding: var(--space-3);
    background: white;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }

  .result-row.passing-criteria {
    border: 2px solid var(--color-primary);
    background: rgba(59, 130, 246, 0.05);
  }

  .result-label {
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .result-value {
    font-weight: 700;
    font-size: 1.125rem;
  }

  .result-value.correct {
    color: var(--color-success);
  }

  .result-value.wrong {
    color: var(--color-error);
  }

  .result-value.unanswered {
    color: var(--color-text-muted);
  }

  .results-actions {
    display: flex;
    gap: var(--space-4);
  }

  .btn-large {
    width: 100%;
    padding: 16px 32px;
    font-size: 1.125rem;
  }

  @media (max-width: 767px) {
    .results-actions {
      flex-direction: column;
    }
  }
</style>
