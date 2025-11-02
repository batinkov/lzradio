<script>
  import { _ } from 'svelte-i18n'
  import { renderMath } from '../../lib/katex.js'

  // Props
  export let question = null
  export let selectedAnswer = undefined
  export let isReviewMode = false
  export let onAnswerSelect = () => {}

  // For practice mode (ExamPrep)
  export let showResult = false

  // Computed values
  $: isAnswered = selectedAnswer !== undefined
  $: isCorrect = isAnswered && selectedAnswer === question?.correct_answer
  $: locale = $_.locale || 'en'
</script>

{#if question}
  <div class="question-container" class:review-mode={isReviewMode}>
    <div class="question-header">
      <span class="question-number">{$_('exam.question')} {question.question_number}</span>
      {#if isReviewMode}
        <span class="question-status status-{isAnswered ? (isCorrect ? 'correct' : 'incorrect') : 'unanswered'}">
          {#if isCorrect}
            ✓ {$_('exam.correct')}
          {:else if isAnswered && !isCorrect}
            ✗ {$_('exam.incorrect')}
          {:else}
            — {$_('exam.unanswered')}
          {/if}
        </span>
      {/if}
    </div>

    <div class="question-text">
      {@html renderMath(question.question_body)}
    </div>

    {#if question.image}
      <div class="question-image">
        <img
          src="/images/questions/{locale.startsWith('bg') ? 'bg' : 'en'}/{question.image}"
          alt="Question diagram"
        />
      </div>
    {/if}

    <div class="answers">
      {#each question.choices || [] as choice}
        {#if isReviewMode}
          <!-- Review mode display -->
          <button
            class="answer-card review"
            class:user-answer={selectedAnswer === choice.key}
            class:correct-answer={choice.key === question.correct_answer}
            class:incorrect-answer={selectedAnswer === choice.key && choice.key !== question.correct_answer}
            disabled
          >
            <div class="answer-radio">
              <input
                type="radio"
                name="answer"
                checked={selectedAnswer === choice.key || choice.key === question.correct_answer}
                readonly
              />
            </div>
            <div class="answer-label">{choice.key}.</div>
            <div class="answer-text">{@html renderMath(choice.text)}</div>
            {#if choice.key === question.correct_answer}
              <div class="answer-badge correct-badge">✓ {$_('exam.correctAnswer')}</div>
            {/if}
            {#if selectedAnswer === choice.key && choice.key !== question.correct_answer}
              <div class="answer-badge wrong-badge">✗ {$_('exam.yourAnswer')}</div>
            {/if}
          </button>
        {:else}
          <!-- Regular mode (practice or in-progress) -->
          <button
            class="answer-card"
            class:selected={selectedAnswer === choice.key && (!showResult || !isAnswered)}
            class:correct={showResult && selectedAnswer === choice.key && isCorrect}
            class:incorrect={showResult && selectedAnswer === choice.key && !isCorrect && isAnswered}
            on:click={() => onAnswerSelect(choice.key)}
          >
            {#if showResult}
              <!-- Practice mode with radio buttons -->
              <div class="answer-radio">
                <input
                  type="radio"
                  name="answer"
                  checked={selectedAnswer === choice.key}
                  readonly
                />
              </div>
            {:else}
              <!-- Simulated exam mode without radio buttons initially -->
              <div class="answer-radio">
                <input
                  type="radio"
                  name="answer"
                  checked={selectedAnswer === choice.key}
                  readonly
                />
              </div>
            {/if}
            <div class="answer-label">{choice.key}.</div>
            <div class="answer-text">{@html renderMath(choice.text)}</div>
          </button>
        {/if}
      {/each}
    </div>
  </div>
{/if}

<style>
  /* All styles are in exam-shared.css */
</style>