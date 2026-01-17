<script>
  import Router from 'svelte-spa-router'
  import { wrap } from 'svelte-spa-router/wrap'
  import { isLoading } from 'svelte-i18n'
  import { setupI18n } from './lib/i18n.js'
  import { initializeTheme } from './lib/theme.js'
  import Nav from './components/shared/Nav.svelte'
  import Toast from './components/shared/Toast.svelte'

  // Initialize i18n
  setupI18n()

  // Initialize theme
  initializeTheme()

  // Routes with code splitting - components are loaded on demand
  const routes = {
    '/': wrap({
      asyncComponent: () => import('./routes/Home.svelte')
    }),
    '/logbook': wrap({
      asyncComponent: () => import('./routes/LogBook.svelte')
    }),
    '/logbook/add': wrap({
      asyncComponent: () => import('./routes/LogBookAdd.svelte')
    }),
    '/logbook/view/:id': wrap({
      asyncComponent: () => import('./routes/LogBookAdd.svelte')
    }),
    '/logbook/edit/:id': wrap({
      asyncComponent: () => import('./routes/LogBookAdd.svelte')
    }),
    '/exam': wrap({
      asyncComponent: () => import('./routes/ExamHome.svelte')
    }),
    '/exam/class1': wrap({
      asyncComponent: () => import('./routes/ExamClassHome.svelte')
    }),
    '/exam/class2': wrap({
      asyncComponent: () => import('./routes/ExamClassHome.svelte')
    }),
    '/exam/class1/prep': wrap({
      asyncComponent: () => import('./routes/ExamPrep.svelte')
    }),
    '/exam/class2/prep': wrap({
      asyncComponent: () => import('./routes/ExamPrep.svelte')
    }),
    '/exam/class1/simulated': wrap({
      asyncComponent: () => import('./routes/ExamSimulated.svelte')
    }),
    '/exam/class2/simulated': wrap({
      asyncComponent: () => import('./routes/ExamSimulated.svelte')
    }),
    '*': wrap({
      asyncComponent: () => import('./routes/NotFound.svelte')
    })
  }
</script>

{#if $isLoading}
  <div class="loading">Loading...</div>
{:else}
  <Nav />
  <main>
    <Router {routes} />
  </main>
  <Toast />
{/if}

<style>
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.25rem;
    color: var(--color-text-muted);
  }

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
