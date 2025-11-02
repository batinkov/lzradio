<script>
  import { _ } from 'svelte-i18n'

  // Props
  export let currentIndex = 0
  export let totalQuestions = 0
  export let onPrevious = () => {}
  export let onNext = () => {}
  export let onSubmit = null // Optional submit button
  export let submitLabel = ''
</script>

<div class="navigation">
  <button
    class="btn-nav"
    on:click={onPrevious}
    disabled={currentIndex === 0}
  >
    ← {$_('exam.previous')}
  </button>

  {#if onSubmit}
    <button
      class="btn-submit"
      on:click={onSubmit}
    >
      {submitLabel || $_('exam.submitExam')}
    </button>
  {/if}

  <button
    class="btn-nav btn-nav-primary"
    on:click={onNext}
    disabled={currentIndex === totalQuestions - 1}
  >
    {$_('exam.next')} →
  </button>
</div>

<style>
  /* All styles are in exam-shared.css */
</style>