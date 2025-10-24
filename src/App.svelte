<script>
  import Router from 'svelte-spa-router'
  import Nav from './components/shared/Nav.svelte'
  import Home from './routes/Home.svelte'
  import LogBook from './routes/LogBook.svelte'
  import LogBookAdd from './routes/LogBookAdd.svelte'
  import ExamHome from './routes/ExamHome.svelte'
  import ExamTechnician from './routes/ExamTechnician.svelte'
  import ExamGeneral from './routes/ExamGeneral.svelte'
  import ExamExtra from './routes/ExamExtra.svelte'
  import NotFound from './routes/NotFound.svelte'

  const routes = {
    '/': Home,
    '/logbook': LogBook,
    '/logbook/add': LogBookAdd,
    '/exam': ExamHome,
    '/exam/technician': ExamTechnician,
    '/exam/general': ExamGeneral,
    '/exam/extra': ExamExtra,
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
