<script>
  import { onMount, onDestroy } from 'svelte'
  import { link, router } from 'svelte-spa-router'
  import { _, locale } from 'svelte-i18n'
  import { getQuestions, getClassInfo } from '../lib/questions.js'
  import { parseExamParams } from '../lib/urlParams.js'
  import { createExamKeyboardHandler } from '../lib/examKeyboardShortcuts.js'
  import 'katex/dist/katex.min.css'
  import '../styles/exam-shared.css'
  import Loading from '../components/shared/Loading.svelte'
  import QuestionDisplay from '../components/exam/QuestionDisplay.svelte'
  import ExamNavigation from '../components/exam/ExamNavigation.svelte'
  import QuestionNavigator from '../components/exam/QuestionNavigator.svelte'

  // Parse URL parameters
  const examParams = $derived(parseExamParams(router.location, router.querystring))
  const classNum = $derived(examParams.classNum)
  const questionOrder = $derived(examParams.questionOrder)
  const sections = $derived(examParams.sections)

  // State for loaded questions and class info
  let questions = $state([])
  let classInfo = $state({ class: '', update: '' })
  let isLoading = $state(true)

  // Load questions when locale, class, sections, or order changes.
  // Every dependency is read synchronously here: $effect only tracks reads that
  // happen before the first await, and loadQuestions is async.
  $effect(() => {
    loadQuestions($locale, classNum, sections, questionOrder)
  })

  async function loadQuestions(currentLocale, cls, secs, order) {
    isLoading = true
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
    } finally {
      isLoading = false
    }
  }

  // State
  let currentQuestionIndex = $state(0)
  let userAnswers = $state({}) // { questionIndex: selectedAnswerKey (А/Б/В/Г or A/B/C/D) }
  let showNavigator = $state(false)

  // Reactive current question
  const currentQuestion = $derived(questions[currentQuestionIndex])
  const selectedAnswer = $derived(userAnswers[currentQuestionIndex])
  const totalQuestions = $derived(questions.length)
  const answeredCount = $derived(Object.keys(userAnswers).length)

  function selectAnswer(answerKey) {
    userAnswers[currentQuestionIndex] = answerKey
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

  // Keyboard shortcuts using shared handler
  const handleKeydown = createExamKeyboardHandler({
    onPrevious: previousQuestion,
    onNext: nextQuestion,
    onSelectAnswer: selectAnswer,
    getCurrentQuestion: () => currentQuestion,
    isModalOpen: () => showNavigator
  })

  onMount(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
</script>

<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <button class="btn-navigator" onclick={toggleNavigator}>
        ☰ {$_('exam.questionsMenu')}
      </button>
      <div class="progress-text">
        {$_('exam.questionOf', {
          values: { current: currentQuestionIndex + 1, total: totalQuestions }
        })}
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
  {#if isLoading}
    <Loading />
  {:else}
    <QuestionDisplay
      question={currentQuestion}
      {selectedAnswer}
      isReviewMode={false}
      showResult={true}
      onAnswerSelect={selectAnswer}
    />

    <!-- Navigation -->
    <ExamNavigation
      currentIndex={currentQuestionIndex}
      totalQuestions={questions.length}
      onPrevious={previousQuestion}
      onNext={nextQuestion}
    />
  {/if}
</div>

<!-- Question Navigator Modal -->
<QuestionNavigator
  show={showNavigator}
  {questions}
  {currentQuestionIndex}
  {userAnswers}
  examState="REVIEW"
  onClose={toggleNavigator}
  onJumpTo={jumpToQuestion}
/>

<style>
  /* All shared exam styles are now in exam-shared.css */
  /* This file only contains component-specific overrides if needed */
</style>
