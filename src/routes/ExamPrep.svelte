<script>
  import { link, location, querystring } from 'svelte-spa-router'
  import { _, locale } from 'svelte-i18n'
  import { getQuestions, getClassInfo } from '../lib/questions.js'
  import 'katex/dist/katex.min.css'
  import '../styles/exam-shared.css'
  import QuestionDisplay from '../components/exam/QuestionDisplay.svelte'
  import ExamNavigation from '../components/exam/ExamNavigation.svelte'
  import QuestionNavigator from '../components/exam/QuestionNavigator.svelte'

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
  $: totalQuestions = questions.length
  $: answeredCount = Object.keys(userAnswers).length

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
  <QuestionDisplay
    question={currentQuestion}
    selectedAnswer={selectedAnswer}
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
</div>

<!-- Question Navigator Modal -->
<QuestionNavigator
  show={showNavigator}
  questions={questions}
  currentQuestionIndex={currentQuestionIndex}
  userAnswers={userAnswers}
  examState="REVIEW"
  onClose={toggleNavigator}
  onJumpTo={jumpToQuestion}
/>

<style>
  /* All shared exam styles are now in exam-shared.css */
  /* This file only contains component-specific overrides if needed */
</style>
