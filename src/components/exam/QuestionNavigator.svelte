<script>
  import { _ } from 'svelte-i18n'
  import { getAnswerStatus } from '../../lib/examScoring.js'

  // Props
  export let show = false
  export let questions = []
  export let currentQuestionIndex = 0
  export let userAnswers = {}
  export let examState = null
  export let onClose = () => {}
  export let onJumpTo = () => {}

  // Helper function to get question status
  function getQuestionStatus(index) {
    const question = questions[index]
    const answer = userAnswers[index]
    return getAnswerStatus(question, answer)
  }

  // Determine if we're in review mode
  $: isReviewMode = examState === 'REVIEW'
  $: isInProgress = examState === 'IN_PROGRESS'
</script>

{#if show}
  <div
    class="modal-backdrop"
    on:click={onClose}
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    role="button"
    tabindex="0"
  >
    <div
      class="modal navigator-modal"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      tabindex="-1"
    >
      <div class="modal-header">
        <h3>{$_('exam.allQuestions')}</h3>
        <button class="icon-btn" on:click={onClose}>×</button>
      </div>
      <div class="modal-body">
        <div class="question-grid">
          {#each questions as question, index (index)}
            <button
              class="question-number-btn"
              class:active={index === currentQuestionIndex}
              class:answered={isInProgress && userAnswers[index] !== undefined}
              class:answered-correct={isReviewMode && getQuestionStatus(index) === 'correct'}
              class:answered-incorrect={isReviewMode && getQuestionStatus(index) === 'incorrect'}
              on:click={() => onJumpTo(index)}
            >
              {question.question_number}
            </button>
          {/each}
        </div>
        <div class="legend">
          <div class="legend-item">
            <span class="legend-dot legend-current"></span> {$_('exam.current')}
          </div>
          {#if isInProgress}
            <div class="legend-item">
              <span class="legend-dot legend-answered"></span> {$_('exam.answered')}
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-unanswered"></span> {$_('exam.unanswered')}
            </div>
          {:else}
            <div class="legend-item">
              <span class="legend-dot legend-correct"></span> {$_('exam.correct')}
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-incorrect"></span> {$_('exam.incorrect')}
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-unanswered"></span> {$_('exam.unanswered')}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* All styles are in exam-shared.css */
</style>