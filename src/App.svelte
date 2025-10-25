<script>
  import Router from 'svelte-spa-router'
  import Nav from './components/shared/Nav.svelte'
  import Home from './routes/Home.svelte'
  import LogBook from './routes/LogBook.svelte'
  import LogBookAdd from './routes/LogBookAdd.svelte'
  import ExamHome from './routes/ExamHome.svelte'
  import ExamClassHome from './routes/ExamClassHome.svelte'
  import ExamPrep from './routes/ExamPrep.svelte'
  import ExamSimulated from './routes/ExamSimulated.svelte'
  import NotFound from './routes/NotFound.svelte'

  const routes = {
    '/': Home,
    '/logbook': LogBook,
    '/logbook/add': LogBookAdd,
    '/exam': ExamHome,
    '/exam/class1': ExamClassHome,
    '/exam/class2': ExamClassHome,
    '/exam/class1/prep': ExamPrep,
    '/exam/class2/prep': ExamPrep,
    '/exam/class1/simulated': ExamSimulated,
    '/exam/class2/simulated': ExamSimulated,
    '*': NotFound
  }
</script>

<Nav />
<main>
  <Router {routes} />
</main>

<style>
  main {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: var(--space-6);
  }

  @media (max-width: 767px) {
    main {
      padding: var(--space-4);
    }
  }
</style>
