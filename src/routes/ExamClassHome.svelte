<script>
  import { link, push, location } from 'svelte-spa-router'
  import { _ } from 'svelte-i18n'
  import { examConfig } from '../lib/examConfig.js'

  // Extract class number from URL path (/exam/class1 or /exam/class2)
  $: classNum = $location.includes('class2') ? '2' : '1'

  let questionOrder = 'sequential'
  let selectedCategories = [1, 2, 3]

  function toggleCategory(category) {
    if (selectedCategories.includes(category)) {
      selectedCategories = selectedCategories.filter(c => c !== category)
    } else {
      selectedCategories = [...selectedCategories, category].sort()
    }
  }

  function startPreparation() {
    const params = new URLSearchParams({
      order: questionOrder,
      categories: selectedCategories.join(',')
    })
    const url = `/exam/class${classNum}/prep?${params.toString()}`
    console.log('Navigating to:', url)
    push(url)
  }
</script>

<div class="page page-centered">
  <div class="header">
    <h1>{$_('exam.classExamPrep', { values: { classNum } })}</h1>
    <a href="/exam" use:link class="btn-secondary">← {$_('exam.backToClasses')}</a>
  </div>

  <section class="mode-selection">
    <h2>{$_('exam.selectMode')}</h2>

    <div class="mode-cards">
      <!-- Preparation Mode -->
      <div class="mode-card prep-mode-card">
        <div class="mode-icon">📚</div>
        <h4>{$_('exam.prepMode')}</h4>

        <!-- Question Order -->
        <div class="config-section">
          <div class="config-label">{$_('exam.questionOrder')}</div>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                name="order"
                value="sequential"
                bind:group={questionOrder}
              />
              <span>{$_('exam.sequential')}</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="order"
                value="random"
                bind:group={questionOrder}
              />
              <span>{$_('exam.random')}</span>
            </label>
          </div>
        </div>

        <!-- Category Selection -->
        <div class="config-section">
          <div class="config-label">{$_('exam.categories')}</div>
          <div class="checkbox-group">
            <label class="checkbox-option">
              <input
                type="checkbox"
                checked={selectedCategories.includes(1)}
                on:change={() => toggleCategory(1)}
              />
              <span>{$_('exam.category')} 1</span>
            </label>
            <label class="checkbox-option">
              <input
                type="checkbox"
                checked={selectedCategories.includes(2)}
                on:change={() => toggleCategory(2)}
              />
              <span>{$_('exam.category')} 2</span>
            </label>
            <label class="checkbox-option">
              <input
                type="checkbox"
                checked={selectedCategories.includes(3)}
                on:change={() => toggleCategory(3)}
              />
              <span>{$_('exam.category')} 3</span>
            </label>
          </div>
        </div>

        <button
          class="btn-primary"
          on:click={startPreparation}
          disabled={selectedCategories.length === 0}
        >
          {$_('exam.startPreparation')}
        </button>
      </div>

      <!-- Simulated Exam Mode -->
      <div class="mode-card">
        <div class="mode-icon">📝</div>
        <h4>{$_('exam.simulatedExam')}</h4>
        <ul class="mode-features">
          <li>{$_('exam.randomQuestionsFromAllSections', { values: { count: examConfig.numberOfQuestions } })}</li>
          <li>{examConfig.examDuration} {$_('exam.minuteCountdown')}</li>
          <li>{$_('exam.minCorrectToPass', { values: { count: examConfig.minCorrectAnswers } })}</li>
        </ul>
        <a href="/exam/class{classNum}/simulated" use:link class="btn-primary">
          {$_('exam.startExam')}
        </a>
      </div>
    </div>
  </section>
</div>

<style>
  /* Component-specific styles */
  .header {
    margin-bottom: var(--space-8);
  }

  /* Mode Selection */
  .mode-selection h2 {
    margin-bottom: var(--space-6);
    text-align: center;
  }

  .mode-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-6);
  }

  .mode-card {
    background: var(--color-bg-card);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
  }

  .mode-card:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
  }

  .prep-mode-card {
    gap: var(--space-4);
  }

  .mode-icon {
    font-size: 3rem;
    text-align: center;
    margin-bottom: var(--space-4);
  }

  .mode-card h4 {
    text-align: center;
    margin-bottom: var(--space-4);
    font-size: 1.25rem;
  }

  .mode-features {
    list-style: none;
    margin-bottom: var(--space-6);
    flex: 1;
  }

  .mode-features li {
    padding: var(--space-2) 0;
    padding-left: var(--space-6);
    position: relative;
  }

  .mode-features li::before {
    content: "•";
    position: absolute;
    left: var(--space-3);
    color: var(--color-primary);
    font-weight: bold;
  }

  /* Override for mode buttons */
  .prep-mode-card .btn-primary,
  .mode-card .btn-primary {
    display: block;
  }

  /* Configuration Sections */
  .config-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .config-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .radio-group,
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .radio-option,
  .checkbox-option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    padding: var(--space-2);
    border-radius: var(--radius-md);
    transition: background 0.15s ease;
  }

  .radio-option:hover,
  .checkbox-option:hover {
    background: var(--color-bg);
  }

  .radio-option input[type="radio"],
  .checkbox-option input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .radio-option span,
  .checkbox-option span {
    font-size: 0.875rem;
    user-select: none;
  }

  /* Mobile */
  @media (max-width: 767px) {
    .mode-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
