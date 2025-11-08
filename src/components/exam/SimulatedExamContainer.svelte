<script>
  import { onMount, onDestroy } from 'svelte'
  import { _, locale } from 'svelte-i18n'
  import { examConfig } from '../../lib/examConfig.js'
  import { getSimulatedExamQuestions, getClassInfo } from '../../lib/questions.js'
  import { languageSwitchingDisabled } from '../../lib/i18n.js'
  import { navigationBlocked } from '../../lib/navigationGuard.js'
  import { calculateExamResults } from '../../lib/examScoring.js'
  import { formatTime, getTimerWarningLevel } from '../../lib/examTimer.js'
  import 'katex/dist/katex.min.css'
  import '../../styles/exam-shared.css'

  import ExamStartScreen from './ExamStartScreen.svelte'
  import ExamInProgress from './ExamInProgress.svelte'
  import ExamResults from './ExamResults.svelte'
  import ExamReview from './ExamReview.svelte'
  import QuestionNavigator from './QuestionNavigator.svelte'

  export let classNum

  // Exam states
  const EXAM_STATE = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    REVIEW: 'REVIEW'
  }

  // State
  let examState = EXAM_STATE.NOT_STARTED
  let classInfo = { class: '', update: '' }
  let questions = []
  let userAnswers = {}
  let currentQuestionIndex = 0
  let remainingSeconds = examConfig.examDuration * 60
  let timerInterval = null
  let showNavigator = false
  let examResults = null

  // Reactive values
  $: timerDisplay = formatTime(remainingSeconds)
  $: timerWarningLevel = getTimerWarningLevel(remainingSeconds)

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

  // Lifecycle
  onMount(() => {
    // Component mounted - ready for user to start exam
  })

  onDestroy(() => {
    cleanupTimer()
    cleanupNavigationGuards()
  })

  // Browser navigation warning & guards
  $: {
    if (examState === EXAM_STATE.IN_PROGRESS || examState === EXAM_STATE.REVIEW) {
      enableNavigationGuards()
    } else {
      disableNavigationGuards()
    }
  }

  // Navigation guards
  function enableNavigationGuards() {
    window.onbeforeunload = () => 'Your exam progress will be lost if you leave this page. Are you sure?'
    languageSwitchingDisabled.set(true)
    navigationBlocked.set(true)
  }

  function disableNavigationGuards() {
    window.onbeforeunload = null
    languageSwitchingDisabled.set(false)
    navigationBlocked.set(false)
  }

  function cleanupNavigationGuards() {
    disableNavigationGuards()
  }

  function leaveExam() {
    const confirmed = window.confirm($_('exam.leaveExamConfirm'))
    if (confirmed) {
      disableNavigationGuards()
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
        submitExam()
      }
    }, 1000)
  }

  function cleanupTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  }

  // Answer management
  function selectAnswer(event) {
    const answerKey = event.detail
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
  function submitExam() {
    if (timerInterval) {
      clearInterval(timerInterval)
    }

    // Calculate results using examScoring module
    const results = calculateExamResults(questions, userAnswers, {
      minCorrectAnswers: examConfig.minCorrectAnswers
    })

    examResults = {
      ...results,
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

  // Reset exam
  function tryAgain() {
    examState = EXAM_STATE.NOT_STARTED
    questions = []
    userAnswers = {}
    currentQuestionIndex = 0
    remainingSeconds = examConfig.examDuration * 60
    examResults = null
    showNavigator = false
  }
</script>

{#if examState === EXAM_STATE.NOT_STARTED}
  <ExamStartScreen {classNum} {classInfo} on:start={startExam} />

{:else if examState === EXAM_STATE.IN_PROGRESS}
  <ExamInProgress
    {classInfo}
    {questions}
    {userAnswers}
    {currentQuestionIndex}
    {timerDisplay}
    {timerWarningLevel}
    on:selectAnswer={selectAnswer}
    on:toggleNavigator={toggleNavigator}
    on:previous={previousQuestion}
    on:next={nextQuestion}
    on:submit={submitExam}
    on:leave={leaveExam}
  />

{:else if examState === EXAM_STATE.COMPLETED}
  <ExamResults
    {examResults}
    on:review={enterReviewMode}
    on:tryAgain={tryAgain}
    on:leave={leaveExam}
  />

{:else if examState === EXAM_STATE.REVIEW}
  <ExamReview
    {classInfo}
    {questions}
    {userAnswers}
    {currentQuestionIndex}
    on:toggleNavigator={toggleNavigator}
    on:previous={previousQuestion}
    on:next={nextQuestion}
    on:exitReview={exitReviewMode}
    on:leave={leaveExam}
  />
{/if}

<!-- Question Navigator Modal (shared for both IN_PROGRESS and REVIEW states) -->
<QuestionNavigator
  show={showNavigator && (examState === EXAM_STATE.IN_PROGRESS || examState === EXAM_STATE.REVIEW)}
  {questions}
  {currentQuestionIndex}
  {userAnswers}
  {examState}
  onClose={toggleNavigator}
  onJumpTo={jumpToQuestion}
/>
