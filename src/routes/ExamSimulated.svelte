<script>
  import { link, location } from 'svelte-spa-router'
  import { _, locale } from 'svelte-i18n'
  import { examConfig } from '../lib/examConfig.js'
  import { getClassInfo } from '../lib/questions.js'
  import { renderMath } from '../lib/katex.js'
  import 'katex/dist/katex.min.css'

  // Extract class number from URL path (/exam/class1/simulated or /exam/class2/simulated)
  $: classNum = $location.includes('class2') ? '2' : '1'

  // State for class info
  let classInfo = { class: '', update: '' }

  // Load class info when locale or class changes
  $: loadClassInfo($locale, classNum)

  async function loadClassInfo(currentLocale, cls) {
    try {
      classInfo = await getClassInfo(parseInt(cls))
    } catch (error) {
      console.error('Failed to load class info:', error)
      classInfo = { class: '', update: '' }
    }
  }
</script>

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

  <div class="card">
    <h3>{$_('exam.examConfiguration')}</h3>
    <p><strong>{$_('exam.questionsLabel')}</strong> {examConfig.numberOfQuestions} {$_('exam.randomQuestions')}</p>
    <p><strong>{$_('exam.durationLabel')}</strong> {examConfig.examDuration} {$_('exam.minutes')}</p>
    <p><strong>{$_('exam.passingCriteria')}</strong> {$_('exam.maxWrongAnswers', { values: { count: examConfig.maxWrongAnswers } })}</p>
  </div>

  <div class="placeholder">
    <p>{$_('exam.comingSoon')}</p>
    <p>{$_('exam.timedExamDescription')}</p>
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
