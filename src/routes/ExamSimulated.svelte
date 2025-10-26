<script>
  import { link, location } from 'svelte-spa-router'
  import { examConfig } from '../lib/examConfig.js'
  import { getClassInfo } from '../lib/questions.js'

  // Extract class number from URL path (/exam/class1/simulated or /exam/class2/simulated)
  $: classNum = $location.includes('class2') ? '2' : '1'
  $: classInfo = getClassInfo(parseInt(classNum))
</script>

<div class="page page-centered">
  <div class="header">
    <h1>Simulated Exam</h1>
    <a href="/exam/class{classNum}" use:link class="btn-secondary">← Back to Class {classNum}</a>
  </div>

  <!-- Class info -->
  <div class="class-info">
    <span class="class-name">{classInfo.class}</span>
    <span class="update-info">{classInfo.update}</span>
  </div>

  <div class="card">
    <h3>Exam Configuration</h3>
    <p><strong>Questions:</strong> {examConfig.numberOfQuestions} random questions</p>
    <p><strong>Duration:</strong> {examConfig.examDuration} minutes</p>
    <p><strong>Passing Criteria:</strong> Max {examConfig.maxWrongAnswers} wrong answers</p>
  </div>

  <div class="placeholder">
    <p>ExamSimulated component - Coming soon!</p>
    <p>This will show a timed exam with countdown timer</p>
  </div>
</div>

<style>
  /* Component-specific styles */
  .page {
    padding: var(--space-4);
  }

  .header {
    margin-bottom: var(--space-3);
  }

  .card {
    margin-bottom: var(--space-6);
  }

  .card h3 {
    margin-top: 0;
  }

  .placeholder {
    background: var(--color-bg);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-12);
    text-align: center;
    color: var(--color-text-muted);
  }

  /* Mobile styles handled by shared CSS */
</style>
