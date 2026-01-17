<script>
  import { createEventDispatcher } from 'svelte'
  import ExamHeader from './ExamHeader.svelte'
  import QuestionDisplay from './QuestionDisplay.svelte'
  import ExamNavigation from './ExamNavigation.svelte'

  export let classInfo
  export let questions
  export let userAnswers
  export let currentQuestionIndex

  const dispatch = createEventDispatcher()

  $: currentQuestion = questions[currentQuestionIndex]
  $: selectedAnswer = userAnswers[currentQuestionIndex]
  $: totalQuestions = questions.length
</script>

<div class="page">
  <ExamHeader
    {currentQuestionIndex}
    {totalQuestions}
    showBackToResults={true}
    on:toggleNavigator
    on:exitReview
    on:leave
  />

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
    onPrevious={() => dispatch('previous')}
    onNext={() => dispatch('next')}
  />
</div>
