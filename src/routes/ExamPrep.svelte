<script>
  import { link, location, querystring } from 'svelte-spa-router'
  import { _, locale } from 'svelte-i18n'
  import { getQuestions, getClassInfo } from '../lib/questions.js'
  import { renderMath } from '../lib/katex.js'
  import 'katex/dist/katex.min.css'

  // Parse URL parameters
  $: classNum = $location.includes('class2') ? '2' : '1'
  $: urlParams = new URLSearchParams($querystring)
  $: questionOrder = urlParams.get('order') || 'sequential'
  $: sections = urlParams.get('categories')?.split(',').map(Number) || [1, 2, 3]

  // State for loaded questions and class info
  let questions = []
  let classInfo = { class: '', update: '' }

  // Load questions when locale, class, sections, or order changes
  $: loadQuestions($locale, classNum, sections, questionOrder)

  async function loadQuestions(currentLocale, cls, secs, order) {
    try {
      const [loadedQuestions, loadedClassInfo] = await Promise.all([
        getQuestions(parseInt(cls), secs, order === 'random'),
        getClassInfo(parseInt(cls))
      ])
      questions = loadedQuestions
      classInfo = loadedClassInfo
    } catch (error) {
      console.error('Failed to load questions:', error)
      questions = []
      classInfo = { class: '', update: '' }
    }
  }

  // State
  let currentQuestionIndex = 0
  let userAnswers = {} // { questionIndex: selectedAnswerKey (А/Б/В/Г or A/B/C/D) }
  let showNavigator = false

  // Reactive current question
  $: currentQuestion = questions[currentQuestionIndex]
  $: selectedAnswer = userAnswers[currentQuestionIndex]
  $: isAnswered = selectedAnswer !== undefined
  $: isCorrect = isAnswered && selectedAnswer === currentQuestion?.correct_answer
  $: totalQuestions = questions.length
  $: answeredCount = Object.keys(userAnswers).length

  // Extract answer keys directly from the current question
  // Filter out metadata fields, leaving only answer options (A/B/C/D, А/Б/В/Г, 1/2/3/4, etc.)
  $: answerKeys = currentQuestion
    ? Object.keys(currentQuestion)
        .filter(key => !['question_number', 'question_body', 'correct_answer', 'image'].includes(key))
        .sort()
    : []

  function selectAnswer(answerKey) {
    userAnswers[currentQuestionIndex] = answerKey
    userAnswers = userAnswers // Trigger reactivity
  }

  function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++
    }
  }

  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--
    }
  }

  function jumpToQuestion(index) {
    currentQuestionIndex = index
    showNavigator = false
  }

  function toggleNavigator() {
    showNavigator = !showNavigator
  }

  function getQuestionStatus(question) {
    const index = questions.indexOf(question)
    const answer = userAnswers[index]
    if (answer === undefined) return 'unanswered'
    return answer === question.correct_answer ? 'correct' : 'incorrect'
  }
</script>

<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <button class="btn-navigator" on:click={toggleNavigator}>
        ☰ {$_('exam.questionsMenu')}
      </button>
      <div class="progress-text">
        {$_('exam.questionOf', { values: { current: currentQuestionIndex + 1, total: totalQuestions } })}
      </div>
    </div>
    <a href="/exam/class{classNum}" use:link class="btn-secondary">
      ← {$_('exam.back')}
    </a>
  </div>

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
  {#if currentQuestion}
    <div class="question-container">
      <div class="question-header">
        <span class="question-number">{$_('exam.question')} {currentQuestion.question_number}</span>
      </div>

      <div class="question-text">
        {@html renderMath(currentQuestion.question_body)}
      </div>

      {#if currentQuestion.image}
        <div class="question-image">
          <img
            src="/images/questions/{$locale.startsWith('bg') ? 'bg' : 'en'}/{currentQuestion.image}"
            alt="Question diagram"
          />
        </div>
      {/if}

      <div class="answers">
        {#each answerKeys as key}
          <button
            class="answer-card"
            class:selected={selectedAnswer === key && !isAnswered}
            class:correct={selectedAnswer === key && isCorrect}
            class:incorrect={selectedAnswer === key && !isCorrect && isAnswered}
            on:click={() => selectAnswer(key)}
          >
            <div class="answer-radio">
              <input
                type="radio"
                name="answer"
                checked={selectedAnswer === key}
                readonly
              />
            </div>
            <div class="answer-label">{key}.</div>
            <div class="answer-text">{@html renderMath(currentQuestion[key])}</div>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Navigation -->
  <div class="navigation">
    <button
      class="btn-nav"
      on:click={previousQuestion}
      disabled={currentQuestionIndex === 0}
    >
      ← {$_('exam.previous')}
    </button>
    <button
      class="btn-nav btn-nav-primary"
      on:click={nextQuestion}
      disabled={currentQuestionIndex === questions.length - 1}
    >
      {$_('exam.next')} →
    </button>
  </div>
</div>

<!-- Question Navigator Modal -->
{#if showNavigator}
  <div class="modal-backdrop" on:click={toggleNavigator}>
    <div class="modal navigator-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{$_('exam.allQuestions')}</h3>
        <button class="icon-btn" on:click={toggleNavigator}>×</button>
      </div>
      <div class="modal-body">
        <div class="question-grid">
          {#each questions as question, index}
            <button
              class="question-number-btn"
              class:active={index === currentQuestionIndex}
              class:answered-correct={getQuestionStatus(question) === 'correct'}
              class:answered-incorrect={getQuestionStatus(question) === 'incorrect'}
              on:click={() => jumpToQuestion(index)}
            >
              {question.question_number}
            </button>
          {/each}
        </div>
        <div class="legend">
          <div class="legend-item">
            <span class="legend-dot legend-current"></span> {$_('exam.current')}
          </div>
          <div class="legend-item">
            <span class="legend-dot legend-correct"></span> {$_('exam.correct')}
          </div>
          <div class="legend-item">
            <span class="legend-dot legend-incorrect"></span> {$_('exam.incorrect')}
          </div>
          <div class="legend-item">
            <span class="legend-dot legend-unanswered"></span> {$_('exam.unanswered')}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Component-specific styles */
  .page {
    padding: var(--space-4);
    min-height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .header {
    margin-bottom: var(--space-3);
    gap: var(--space-3);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .btn-navigator {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 10px 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-navigator:hover {
    background: var(--color-bg);
    border-color: var(--color-primary);
  }

  .progress-text {
    font-weight: 600;
    color: var(--color-text);
    font-size: 1.125rem;
  }

  .btn-secondary {
    white-space: nowrap;
  }

  /* Progress Bar */
  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: var(--space-6);
  }

  .progress-fill {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.3s ease;
  }

  /* Question Container */
  .question-container {
    flex: 1;
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    margin-bottom: var(--space-6);
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .question-number {
    background: var(--color-bg);
    padding: 4px 12px;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .question-text {
    font-size: 1.25rem;
    line-height: 1.6;
    color: var(--color-text);
    margin-bottom: var(--space-6);
    font-weight: 500;
  }

  /* Question Image */
  .question-image {
    margin-bottom: var(--space-8);
    text-align: center;
  }

  .question-image img {
    max-width: 40%;
    height: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  /* Answers */
  .answers {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .answer-card {
    background: white;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .answer-card:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }

  .answer-card.selected {
    border-color: var(--color-primary);
    background: rgba(59, 130, 246, 0.05);
  }

  .answer-card.correct {
    border-color: var(--color-success);
    background: rgba(34, 197, 94, 0.1);
  }

  .answer-card.incorrect {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .answer-radio {
    flex-shrink: 0;
  }

  .answer-radio input[type="radio"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .answer-label {
    flex-shrink: 0;
    font-weight: 600;
    font-size: 1rem;
    color: var(--color-text);
    min-width: 24px;
  }

  .answer-text {
    flex: 1;
    font-size: 1rem;
    line-height: 1.5;
  }

  /* Navigation */
  .navigation {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .btn-nav {
    flex: 1;
    padding: 14px 24px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: white;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-nav:hover:not(:disabled) {
    background: var(--color-bg);
    border-color: var(--color-primary);
  }

  .btn-nav:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-nav-primary {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .btn-nav-primary:hover:not(:disabled) {
    background: #2563EB;
  }

  /* Navigator Modal specific */
  .navigator-modal {
    max-width: 800px;
  }

  /* Question Grid */
  .question-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: var(--space-2);
    margin-bottom: var(--space-6);
  }

  .question-number-btn {
    aspect-ratio: 1;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .question-number-btn:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }

  .question-number-btn.active {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: white;
  }

  .question-number-btn.answered-correct {
    border-color: var(--color-success);
    background: var(--color-success);
    color: white;
  }

  .question-number-btn.answered-incorrect {
    border-color: #ef4444;
    background: #ef4444;
    color: white;
  }

  /* Legend */
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.875rem;
  }

  .legend-dot {
    width: 16px;
    height: 16px;
    border-radius: var(--radius-md);
    border: 2px solid;
  }

  .legend-current {
    border-color: var(--color-primary);
    background: var(--color-primary);
  }

  .legend-correct {
    border-color: var(--color-success);
    background: var(--color-success);
  }

  .legend-incorrect {
    border-color: #ef4444;
    background: #ef4444;
  }

  .legend-unanswered {
    border-color: var(--color-border);
    background: white;
  }

  /* Mobile */
  @media (max-width: 767px) {
    .header {
      flex-wrap: wrap;
    }

    .header-left {
      flex-wrap: wrap;
      width: 100%;
    }

    .progress-text {
      font-size: 1rem;
    }

    .question-container {
      padding: var(--space-4);
    }

    .question-text {
      font-size: 1.125rem;
    }

    .question-grid {
      grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
    }
  }
</style>
