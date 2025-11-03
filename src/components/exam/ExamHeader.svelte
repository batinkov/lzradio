<script>
  import { _ } from 'svelte-i18n'
  import { createEventDispatcher } from 'svelte'

  export let currentQuestionIndex
  export let totalQuestions
  export let answeredCount = null // Optional - only shown in progress
  export let timerDisplay = null // Optional - only shown in progress
  export let timerWarningLevel = 'normal' // normal, warning, critical
  export let showBackToResults = false // Show back button for review mode

  const dispatch = createEventDispatcher()
</script>

<div class="header exam-header">
  <div class="header-left">
    <button class="btn-navigator" on:click={() => dispatch('toggleNavigator')}>
      ☰ {$_('exam.questionsMenu')}
    </button>
    <div class="progress-text">
      {$_('exam.questionOf', { values: { current: currentQuestionIndex + 1, total: totalQuestions } })}
      {#if answeredCount !== null}
        <span class="answered-count">({answeredCount} {$_('exam.answered')})</span>
      {/if}
    </div>
  </div>
  <div class="header-right">
    {#if showBackToResults}
      <button class="btn-secondary" on:click={() => dispatch('exitReview')}>
        ← {$_('exam.backToResults')}
      </button>
    {/if}
    {#if timerDisplay}
      <div class="timer-display timer-{timerWarningLevel}">
        ⏱️ {timerDisplay}
      </div>
    {/if}
    <button class="btn-leave-exam" on:click={() => dispatch('leave')} title={$_('exam.leaveExamTooltip')}>
      {$_('exam.leaveExamButton')}
    </button>
  </div>
</div>

<style>
  .timer-display {
    font-size: 1.5rem;
    font-weight: 700;
    font-family: var(--font-mono);
    padding: 12px 24px;
    border-radius: var(--radius-md);
    border: 2px solid;
    min-width: 120px;
    text-align: center;
  }

  .timer-normal {
    color: var(--color-text);
    background: white;
    border-color: var(--color-border);
  }

  .timer-warning {
    color: var(--color-warning);
    background: #FEF3C7;
    border-color: var(--color-warning);
  }

  .timer-critical {
    color: var(--color-error);
    background: #FEE2E2;
    border-color: var(--color-error);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  @media (max-width: 767px) {
    .timer-display {
      width: 100%;
    }
  }
</style>
