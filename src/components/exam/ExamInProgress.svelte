<script>
  import { _ } from 'svelte-i18n'
  import { createEventDispatcher } from 'svelte'
  import { calculateProgress } from '../../lib/examProgress.js'
  import ExamHeader from './ExamHeader.svelte'
  import QuestionDisplay from './QuestionDisplay.svelte'
  import ExamNavigation from './ExamNavigation.svelte'

  export let classInfo
  export let questions
  export let userAnswers
  export let currentQuestionIndex
  export let timerDisplay
  export let timerWarningLevel

  const dispatch = createEventDispatcher()

  let showSubmitModal = false

  $: currentQuestion = questions[currentQuestionIndex]
  $: selectedAnswer = userAnswers[currentQuestionIndex]
  $: totalQuestions = questions.length
  $: progress = calculateProgress(userAnswers, totalQuestions)
  $: answeredCount = progress.answeredCount
  $: unansweredCount = progress.unansweredCount

  function openSubmitModal() {
    showSubmitModal = true
  }

  function closeSubmitModal() {
    showSubmitModal = false
  }

  function handleSubmit() {
    closeSubmitModal()
    dispatch('submit')
  }
</script>

<div class="page">
  <ExamHeader
    {currentQuestionIndex}
    {totalQuestions}
    {answeredCount}
    {timerDisplay}
    {timerWarningLevel}
    on:toggleNavigator
    on:leave
  />

  <!-- Class info -->
  <div class="class-info">
    <span class="class-name">{classInfo.class}</span>
    <span class="update-info">{classInfo.update}</span>
  </div>

  <!-- Progress Bar -->
  <div class="progress-bar">
    <div class="progress-fill" style="width: {(answeredCount / totalQuestions) * 100}%"></div>
  </div>

  <!-- Question Display -->
  <QuestionDisplay
    question={currentQuestion}
    selectedAnswer={selectedAnswer}
    isReviewMode={false}
    showResult={false}
    onAnswerSelect={(answerKey) => dispatch('selectAnswer', answerKey)}
  />

  <!-- Navigation -->
  <ExamNavigation
    currentIndex={currentQuestionIndex}
    totalQuestions={questions.length}
    onPrevious={() => dispatch('previous')}
    onNext={() => dispatch('next')}
    onSubmit={openSubmitModal}
    submitLabel={$_('exam.submitExam')}
  />
</div>

<!-- Submit Confirmation Modal -->
{#if showSubmitModal}
  <div class="modal-backdrop" on:click={closeSubmitModal} on:keydown={(e) => e.key === 'Escape' && closeSubmitModal()} role="button" tabindex="0">
    <div class="modal submit-modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" tabindex="-1">
      <div class="modal-header">
        <h3>{$_('exam.confirmSubmit')}</h3>
        <button class="icon-btn" on:click={closeSubmitModal}>×</button>
      </div>
      <div class="modal-body">
        <p>{$_('exam.submitWarning')}</p>
        {#if unansweredCount > 0}
          <p class="warning-text">
            ⚠️ {$_('exam.unansweredWarning', { values: { count: unansweredCount } })}
          </p>
        {/if}
        <p><strong>{$_('exam.timeRemaining')}:</strong> {timerDisplay}</p>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={closeSubmitModal}>
          {$_('common.cancel')}
        </button>
        <button class="btn-primary" on:click={handleSubmit}>
          {$_('exam.confirmSubmitButton')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .warning-text {
    color: var(--color-error);
    font-weight: 600;
  }

  .modal-actions {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-6);
    border-top: 1px solid var(--color-border);
  }

  .modal-actions button {
    flex: 1;
  }
</style>
