<script>
  import { router } from 'svelte-spa-router'
  import SimulatedExamContainer from '../components/exam/SimulatedExamContainer.svelte'

  // Extract class number from URL
  const classNum = $derived(router.location.includes('class2') ? '2' : '1')
</script>

<SimulatedExamContainer {classNum} />
