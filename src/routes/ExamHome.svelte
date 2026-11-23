<script>
  import { link } from 'svelte-spa-router'
  import { _, locale } from 'svelte-i18n'
  import { getAllQuestions, getSyllabusDates } from '../lib/questions.js'
  import Banner from '../components/shared/Banner.svelte'

  // State for question counts
  let class1Count = 0
  let class2Count = 0
  let syllabusDates = []

  const githubRepo = __GITHUB_REPO__
  const reportUrl = `https://github.com/${githubRepo}/issues/new?template=question_error.md`

  // Wiki section on how the questions are produced, in the current language
  $: wikiUrl = $locale?.startsWith('bg')
    ? `https://github.com/${githubRepo}/wiki/bg-Exam-Guide#как-се-изготвят-въпросите`
    : `https://github.com/${githubRepo}/wiki/en-Exam-Guide#how-the-questions-are-produced`

  // Load question counts when locale changes
  $: loadQuestionCounts($locale)

  async function loadQuestionCounts() {
    try {
      const [class1Questions, class2Questions, dates] = await Promise.all([
        getAllQuestions(1),
        getAllQuestions(2),
        getSyllabusDates()
      ])
      class1Count = class1Questions.length
      class2Count = class2Questions.length
      syllabusDates = dates
    } catch (error) {
      console.error('Failed to load questions:', error)
    }
  }
</script>

<div class="page page-centered">
  <!-- Language Warning (English only) -->
  {#if $locale?.startsWith('en')}
    <Banner
      badgeText="Important"
      message="Official amateur radio exams in Bulgaria are conducted only in Bulgarian. This English version is for practice purposes only."
      dismissible={false}
    />
  {/if}

  <div class="header">
    <h1>{$_('exam.title')}</h1>
  </div>

  <!-- Class Selection -->
  <section class="class-selection">
    <h2>{$_('exam.selectClass')}</h2>
    <div class="class-cards">
      <a href="/exam/class1" use:link class="class-card">
        <h3>{$_('exam.class1')}</h3>
        <p class="question-count">{class1Count} {$_('exam.questions')}</p>
        <span class="btn-link">{$_('exam.selectButton')} →</span>
      </a>
      <a href="/exam/class2" use:link class="class-card">
        <h3>{$_('exam.class2')}</h3>
        <p class="question-count">{class2Count} {$_('exam.questions')}</p>
        <span class="btn-link">{$_('exam.selectButton')} →</span>
      </a>
    </div>
  </section>

  {#if syllabusDates.length}
    <p class="question-source">
      {$_('exam.questionSource', { values: { date: syllabusDates.join(', ') } })}
      ·
      <a href={wikiUrl} target="_blank" rel="noopener noreferrer">{$_('exam.howWeUpdate')}</a>
      ·
      <a href={reportUrl} target="_blank" rel="noopener noreferrer">
        {$_('exam.reportQuestionError')}
      </a>
    </p>
  {/if}
</div>

<style>
  /* Component-specific styles */
  .header {
    margin-bottom: var(--space-8);
  }

  /* Class Selection */
  .class-selection h2 {
    margin-bottom: var(--space-6);
    text-align: center;
  }

  .class-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-6);
  }

  .class-card {
    background: var(--color-bg-card);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: block;
  }

  .class-card:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }

  .class-card h3 {
    font-size: 1.5rem;
    margin-bottom: var(--space-3);
    color: var(--color-primary);
  }

  .question-count {
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
  }

  .btn-link {
    color: var(--color-primary);
    font-weight: 500;
  }

  .question-source {
    margin-top: var(--space-8);
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  /* Mobile */
  @media (max-width: 767px) {
    .class-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
