<script>
  import { location } from 'svelte-spa-router'
  import SimulatedExamContainer from '../components/exam/SimulatedExamContainer.svelte'

  // Extract class number from URL
  $: classNum = $location.includes('class2') ? '2' : '1'
</script>

<SimulatedExamContainer {classNum} />
