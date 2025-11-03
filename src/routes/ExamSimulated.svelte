<script>
  import { link, location } from 'svelte-spa-router'
  import { _, locale } from 'svelte-i18n'
  import { onMount, onDestroy } from 'svelte'
  import { examConfig } from '../lib/examConfig.js'
  import { getSimulatedExamQuestions, getClassInfo } from '../lib/questions.js'
  import { languageSwitchingDisabled } from '../lib/i18n.js'
  import { navigationBlocked } from '../lib/navigationGuard.js'
  import 'katex/dist/katex.min.css'
  import '../styles/exam-shared.css'
  import QuestionDisplay from '../components/exam/QuestionDisplay.svelte'
  import ExamNavigation from '../components/exam/ExamNavigation.svelte'
  import QuestionNavigator from '../components/exam/QuestionNavigator.svelte'

  // Exam states
  const EXAM_STATE = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    REVIEW: 'REVIEW'
  }

  // Extract class number from URL
  $: classNum = $location.includes('class2') ? '2' : '1'

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

  // No session restoration - simulated exams restart on page refresh/navigation
  onMount(() => {
    // Component mounted - ready for user to start exam
  })

  // Cleanup timer on unmount and reset language switching
  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    languageSwitchingDisabled.set(false)
  })

  // Browser navigation warning, language switching control, and navigation link blocking
  $: {
    if (examState === EXAM_STATE.IN_PROGRESS || examState === EXAM_STATE.REVIEW) {
      window.onbeforeunload = () => 'Your exam progress will be lost if you leave this page. Are you sure?'
      languageSwitchingDisabled.set(true)
      navigationBlocked.set(true)
    } else {
      window.onbeforeunload = null
      languageSwitchingDisabled.set(false)
      navigationBlocked.set(false)
    }
  }

  // Leave exam function
  function leaveExam() {
    const confirmed = window.confirm($_('exam.leaveExamConfirm'))
    if (confirmed) {
      // Disable blocking to allow navigation
      navigationBlocked.set(false)
      languageSwitchingDisabled.set(false)
      window.onbeforeunload = null
      // Navigate back to class home
      window.location.hash = `/exam/class${classNum}`
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

      // Auto-submit when time expires
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval)
        submitExam(true) // Auto-submit
      }
    }, 1000)
  }

  // Answer management
  function selectAnswer(answerKey) {
    userAnswers[currentQuestionIndex] = answerKey
    userAnswers = userAnswers // Trigger reactivity
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
  }

  // Review mode
  function enterReviewMode() {
    examState = EXAM_STATE.REVIEW
    currentQuestionIndex = 0
  }

  function exitReviewMode() {
    examState = EXAM_STATE.COMPLETED
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
      <div class="header-right">
        <div class="timer-display timer-{timerWarningLevel}">
          ⏱️ {timerDisplay}
        </div>
        <button class="btn-leave-exam" on:click={leaveExam} title={$_('exam.leaveExamTooltip')}>
          {$_('exam.leaveExamButton')}
        </button>
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
    <QuestionDisplay
      question={currentQuestion}
      selectedAnswer={selectedAnswer}
      isReviewMode={false}
      showResult={false}
      onAnswerSelect={selectAnswer}
    />

    <!-- Navigation -->
    <ExamNavigation
      currentIndex={currentQuestionIndex}
      totalQuestions={questions.length}
      onPrevious={previousQuestion}
      onNext={nextQuestion}
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
    <div class="header exam-header">
      <div class="header-left">
        <button class="btn-navigator" on:click={toggleNavigator}>
          ☰ {$_('exam.questionsMenu')}
        </button>
        <div class="progress-text">
          {$_('exam.questionOf', { values: { current: currentQuestionIndex + 1, total: totalQuestions } })}
        </div>
      </div>
      <div class="header-right">
        <button class="btn-secondary" on:click={exitReviewMode}>
          ← {$_('exam.backToResults')}
        </button>
        <button class="btn-leave-exam" on:click={leaveExam} title={$_('exam.leaveExamTooltip')}>
          {$_('exam.leaveExamButton')}
        </button>
      </div>
    </div>

    <!-- Class info -->
    <div class="class-info">
      <span class="class-name">{classInfo.class}</span>
      <span class="update-info">{classInfo.update}</span>
    </div>

    <!-- Question Display -->
    <QuestionDisplay
      question={currentQuestion}
      selectedAnswer={selectedAnswer}
      isReviewMode={true}
      showResult={false}
      onAnswerSelect={() => {}}
    />

    <!-- Navigation -->
    <ExamNavigation
      currentIndex={currentQuestionIndex}
      totalQuestions={questions.length}
      onPrevious={previousQuestion}
      onNext={nextQuestion}
    />
  </div>
{/if}

<!-- Question Navigator Modal (shared for both IN_PROGRESS and REVIEW states) -->
<QuestionNavigator
  show={showNavigator && (examState === EXAM_STATE.IN_PROGRESS || examState === EXAM_STATE.REVIEW)}
  questions={questions}
  currentQuestionIndex={currentQuestionIndex}
  userAnswers={userAnswers}
  examState={examState}
  onClose={toggleNavigator}
  onJumpTo={jumpToQuestion}
/>

<style>
  /* Shared exam styles are in exam-shared.css */
  /* This file only contains ExamSimulated-specific styles */

  /* Timer - unique to ExamSimulated */
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

  /* Cards - unique styles for exam start */
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

  /* Rules - unique to ExamSimulated */
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

  /* Results - unique to ExamSimulated */
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

  /* Modal specific overrides */
  .submit-modal {
    /* Uses shared modal styles from exam-shared.css */
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

  .btn-danger {
    background: var(--color-error);
    border-color: var(--color-error);
  }

  .btn-danger:hover {
    background: #dc2626;
    border-color: #dc2626;
  }

  /* Mobile overrides */
  @media (max-width: 767px) {
    .timer-display {
      width: 100%;
    }

    .results-actions {
      flex-direction: column;
    }
  }
</style>
