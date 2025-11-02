<script>
  import { link, location } from 'svelte-spa-router'
  import { _, locale } from 'svelte-i18n'
  import { onMount, onDestroy } from 'svelte'
  import { examConfig } from '../lib/examConfig.js'
  import { getSimulatedExamQuestions, getClassInfo } from '../lib/questions.js'
  import { renderMath } from '../lib/katex.js'
  import 'katex/dist/katex.min.css'

  // Exam states
  const EXAM_STATE = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    REVIEW: 'REVIEW'
  }

  // Extract class number from URL
  $: classNum = $location.includes('class2') ? '2' : '1'
  $: storageKey = `lzradio-exam-session-class${classNum}`

  // State
  let examState = EXAM_STATE.NOT_STARTED
  let classInfo = { class: '', update: '' }
  let questions = []
  let userAnswers = {}
  let currentQuestionIndex = 0
  let remainingSeconds = examConfig.examDuration * 60
  let timerInterval = null
  let showNavigator = false
  let showSubmitModal = false
  let examResults = null

  // Reactive values
  $: currentQuestion = questions[currentQuestionIndex]
  $: selectedAnswer = userAnswers[currentQuestionIndex]
  $: totalQuestions = questions.length
  $: answeredCount = Object.keys(userAnswers).length
  $: unansweredCount = totalQuestions - answeredCount
  $: timerMinutes = Math.floor(remainingSeconds / 60)
  $: timerSeconds = remainingSeconds % 60
  $: timerDisplay = `${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}`
  $: timerWarningLevel = remainingSeconds <= 300 ? 'critical' : remainingSeconds <= 600 ? 'warning' : 'normal'

  // Extract answer keys from current question
  $: answerKeys = currentQuestion
    ? Object.keys(currentQuestion)
        .filter(key => !['question_number', 'question_body', 'correct_answer'].includes(key))
        .sort()
    : []

  // Load class info
  $: loadClassInfo($locale, classNum)

  async function loadClassInfo(currentLocale, cls) {
    try {
      classInfo = await getClassInfo(parseInt(cls))
    } catch (error) {
      console.error('Failed to load class info:', error)
      classInfo = { class: '', update: '' }
    }
  }

  // Check for existing session on mount
  onMount(() => {
    const savedSession = sessionStorage.getItem(storageKey)
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        // Restore session
        examState = session.examState
        questions = session.questions
        userAnswers = session.userAnswers
        currentQuestionIndex = session.currentQuestionIndex || 0
        remainingSeconds = session.remainingSeconds
        examResults = session.examResults || null

        if (examState === EXAM_STATE.IN_PROGRESS) {
          startTimer()
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
        clearSession()
      }
    }
  })

  // Cleanup timer on unmount
  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  })

  // Browser navigation warning
  $: {
    if (examState === EXAM_STATE.IN_PROGRESS) {
      window.onbeforeunload = () => 'Your exam progress will be lost if you leave this page. Are you sure?'
    } else {
      window.onbeforeunload = null
    }
  }

  // Start exam
  async function startExam() {
    try {
      questions = await getSimulatedExamQuestions(parseInt(classNum), examConfig.numberOfQuestions)
      userAnswers = {}
      currentQuestionIndex = 0
      remainingSeconds = examConfig.examDuration * 60
      examState = EXAM_STATE.IN_PROGRESS
      examResults = null

      saveSession()
      startTimer()
    } catch (error) {
      console.error('Failed to start exam:', error)
      alert('Failed to load exam questions. Please try again.')
    }
  }

  // Timer management
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval)

    timerInterval = setInterval(() => {
      remainingSeconds--

      // Save timer to session every 30 seconds
      if (remainingSeconds % 30 === 0) {
        saveSession()
      }

      // Auto-submit when time expires
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval)
        submitExam(true) // Auto-submit
      }
    }, 1000)
  }

  // Session storage management
  function saveSession() {
    const session = {
      examState,
      questions,
      userAnswers,
      currentQuestionIndex,
      remainingSeconds,
      examResults
    }
    sessionStorage.setItem(storageKey, JSON.stringify(session))
  }

  function clearSession() {
    sessionStorage.removeItem(storageKey)
  }

  // Answer management
  function selectAnswer(answerKey) {
    userAnswers[currentQuestionIndex] = answerKey
    userAnswers = userAnswers // Trigger reactivity
    saveSession()
  }

  // Navigation
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

  // Submit exam
  function openSubmitModal() {
    showSubmitModal = true
  }

  function closeSubmitModal() {
    showSubmitModal = false
  }

  function submitExam(autoSubmit = false) {
    if (!autoSubmit) {
      closeSubmitModal()
    }

    if (timerInterval) {
      clearInterval(timerInterval)
    }

    // Calculate results
    let correctCount = 0
    let wrongCount = 0
    let unansweredCount = 0

    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index]
      if (userAnswer === undefined) {
        unansweredCount++
      } else if (userAnswer === question.correct_answer) {
        correctCount++
      } else {
        wrongCount++
      }
    })

    const passed = correctCount >= examConfig.minCorrectAnswers

    examResults = {
      correctCount,
      wrongCount,
      unansweredCount,
      totalQuestions,
      passed,
      completionTime: examConfig.examDuration * 60 - remainingSeconds
    }

    examState = EXAM_STATE.COMPLETED
    saveSession()
  }

  // Review mode
  function enterReviewMode() {
    examState = EXAM_STATE.REVIEW
    currentQuestionIndex = 0
    saveSession()
  }

  function exitReviewMode() {
    examState = EXAM_STATE.COMPLETED
    saveSession()
  }

  function getQuestionStatus(question) {
    const index = questions.indexOf(question)
    const answer = userAnswers[index]
    if (answer === undefined) return 'unanswered'
    return answer === question.correct_answer ? 'correct' : 'incorrect'
  }

  function getQuestionStatusForReview(index) {
    const question = questions[index]
    const answer = userAnswers[index]
    if (answer === undefined) return 'unanswered'
    return answer === question.correct_answer ? 'correct' : 'incorrect'
  }

  // Reset exam
  function tryAgain() {
    clearSession()
    examState = EXAM_STATE.NOT_STARTED
    questions = []
    userAnswers = {}
    currentQuestionIndex = 0
    remainingSeconds = examConfig.examDuration * 60
    examResults = null
    showNavigator = false
    showSubmitModal = false
  }

  // Format time for display
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }
</script>

<!-- NOT STARTED STATE -->
{#if examState === EXAM_STATE.NOT_STARTED}
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
      on:click={startExam}
    >
      {$_('exam.startExam')}
    </button>
  </div>

<!-- IN PROGRESS STATE -->
{:else if examState === EXAM_STATE.IN_PROGRESS}
  <div class="page">
    <!-- Header with Timer -->
    <div class="header exam-header">
      <div class="header-left">
        <button class="btn-navigator" on:click={toggleNavigator}>
          ☰ {$_('exam.questionsMenu')}
        </button>
        <div class="progress-text">
          {$_('exam.questionOf', { values: { current: currentQuestionIndex + 1, total: totalQuestions } })}
          <span class="answered-count">({answeredCount} {$_('exam.answered')})</span>
        </div>
      </div>
      <div class="timer-display timer-{timerWarningLevel}">
        ⏱️ {timerDisplay}
      </div>
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
              class:selected={selectedAnswer === key}
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
        class="btn-submit"
        on:click={openSubmitModal}
      >
        {$_('exam.submitExam')}
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
                class:answered={userAnswers[index] !== undefined}
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
              <span class="legend-dot legend-answered"></span> {$_('exam.answered')}
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-unanswered"></span> {$_('exam.unanswered')}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Submit Confirmation Modal -->
  {#if showSubmitModal}
    <div class="modal-backdrop" on:click={closeSubmitModal}>
      <div class="modal submit-modal" on:click|stopPropagation>
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
          <button class="btn-primary" on:click={() => submitExam(false)}>
            {$_('exam.confirmSubmitButton')}
          </button>
        </div>
      </div>
    </div>
  {/if}

<!-- COMPLETED STATE -->
{:else if examState === EXAM_STATE.COMPLETED}
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
      <button class="btn-secondary btn-large" on:click={enterReviewMode}>
        {$_('exam.reviewAnswers')}
      </button>
      <button class="btn-primary btn-large" on:click={tryAgain}>
        {$_('exam.tryAgain')}
      </button>
    </div>
  </div>

<!-- REVIEW STATE -->
{:else if examState === EXAM_STATE.REVIEW}
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
      <button class="btn-secondary" on:click={exitReviewMode}>
        ← {$_('exam.backToResults')}
      </button>
    </div>

    <!-- Class info -->
    <div class="class-info">
      <span class="class-name">{classInfo.class}</span>
      <span class="update-info">{classInfo.update}</span>
    </div>

    <!-- Question Display -->
    {#if currentQuestion}
      <div class="question-container review-mode">
        <div class="question-header">
          <span class="question-number">{$_('exam.question')} {currentQuestion.question_number}</span>
          <span class="question-status status-{getQuestionStatusForReview(currentQuestionIndex)}">
            {#if getQuestionStatusForReview(currentQuestionIndex) === 'correct'}
              ✓ {$_('exam.correct')}
            {:else if getQuestionStatusForReview(currentQuestionIndex) === 'incorrect'}
              ✗ {$_('exam.incorrect')}
            {:else}
              — {$_('exam.unanswered')}
            {/if}
          </span>
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
              class="answer-card review"
              class:user-answer={selectedAnswer === key}
              class:correct-answer={key === currentQuestion.correct_answer}
              class:incorrect-answer={selectedAnswer === key && key !== currentQuestion.correct_answer}
              disabled
            >
              <div class="answer-radio">
                <input
                  type="radio"
                  name="answer"
                  checked={selectedAnswer === key || key === currentQuestion.correct_answer}
                  readonly
                />
              </div>
              <div class="answer-label">{key}.</div>
              <div class="answer-text">{@html renderMath(currentQuestion[key])}</div>
              {#if key === currentQuestion.correct_answer}
                <div class="answer-badge correct-badge">✓ {$_('exam.correctAnswer')}</div>
              {/if}
              {#if selectedAnswer === key && key !== currentQuestion.correct_answer}
                <div class="answer-badge wrong-badge">✗ {$_('exam.yourAnswer')}</div>
              {/if}
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
                class:answered-correct={getQuestionStatusForReview(index) === 'correct'}
                class:answered-incorrect={getQuestionStatusForReview(index) === 'incorrect'}
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
{/if}

<style>
  /* Reuse styles from ExamPrep and add new ones */
  .page {
    padding: var(--space-4);
    min-height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
  }

  .page-centered {
    max-width: 800px;
    margin: 0 auto;
  }

  /* Header */
  .header {
    margin-bottom: var(--space-3);
    gap: var(--space-3);
  }

  .exam-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex: 1;
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

  .answered-count {
    color: var(--color-text-muted);
    font-size: 0.875rem;
    font-weight: 400;
  }

  /* Timer */
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

  .question-status {
    padding: 4px 12px;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 600;
  }

  .status-correct {
    background: rgba(34, 197, 94, 0.1);
    color: var(--color-success);
  }

  .status-incorrect {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
  }

  .status-unanswered {
    background: var(--color-bg);
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
    position: relative;
  }

  .answer-card:not(.review):hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }

  .answer-card.selected {
    border-color: var(--color-primary);
    background: rgba(59, 130, 246, 0.05);
  }

  /* Review mode answer styles */
  .answer-card.review {
    cursor: default;
  }

  .answer-card.correct-answer {
    border-color: var(--color-success);
    background: rgba(34, 197, 94, 0.1);
  }

  .answer-card.incorrect-answer {
    border-color: var(--color-error);
    background: rgba(239, 68, 68, 0.1);
  }

  .answer-badge {
    position: absolute;
    top: 8px;
    right: 12px;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .correct-badge {
    background: var(--color-success);
    color: white;
  }

  .wrong-badge {
    background: var(--color-error);
    color: white;
  }

  .answer-radio {
    flex-shrink: 0;
  }

  .answer-radio input[type="radio"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .answer-card.review .answer-radio input[type="radio"] {
    cursor: default;
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

  .btn-submit {
    flex: 1;
    padding: 14px 24px;
    border: 2px solid var(--color-primary);
    border-radius: var(--radius-md);
    background: white;
    color: var(--color-primary);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-submit:hover {
    background: var(--color-primary);
    color: white;
  }

  /* Cards */
  .card {
    background: white;
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

  /* Rules */
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

  /* Results */
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

  /* Modals */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--space-4);
  }

  .modal {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .navigator-modal {
    max-width: 800px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-6);
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h3 {
    margin: 0;
  }

  .icon-btn {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    cursor: pointer;
    color: var(--color-text-muted);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn:hover {
    color: var(--color-text);
  }

  .modal-body {
    padding: var(--space-6);
  }

  .modal-body p {
    margin-bottom: var(--space-4);
  }

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

  .question-number-btn.answered {
    background: rgba(59, 130, 246, 0.1);
    border-color: var(--color-primary);
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

  .legend-answered {
    border-color: var(--color-primary);
    background: rgba(59, 130, 246, 0.1);
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
    .exam-header {
      flex-wrap: wrap;
    }

    .header-left {
      flex-wrap: wrap;
      width: 100%;
      margin-bottom: var(--space-3);
    }

    .timer-display {
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

    .results-actions {
      flex-direction: column;
    }
  }
</style>
