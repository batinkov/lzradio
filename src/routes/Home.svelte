<script>
  import { link } from 'svelte-spa-router'
</script>

<div class="home">
  <div class="hero">
    <h1>LZ Radio</h1>
    <p class="subtitle">Amateur Radio Tools</p>
    <p>Route: <code>/</code> (home page)</p>
  </div>

  <div class="features">
    <a href="/logbook" use:link class="feature-card">
      <h2>📻 LogBook</h2>
      <p>Log and track your radio contacts</p>
    </a>

    <a href="/exam" use:link class="feature-card">
      <h2>📝 Exam Prep</h2>
      <p>Practice for your amateur radio license exam</p>
    </a>
  </div>
</div>

<style>
  /* Component-specific styles */
  .home {
    padding: var(--space-8) 0;
  }

  .hero {
    text-align: center;
    margin-bottom: var(--space-12);
  }

  .hero h1 {
    font-size: 3rem;
    margin-bottom: var(--space-2);
    color: var(--color-primary);
  }

  .subtitle {
    font-size: 1.25rem;
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-6);
    max-width: 800px;
    margin: 0 auto;
  }

  .feature-card {
    padding: var(--space-8);
    background: white;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    text-align: center;
    text-decoration: none;
    color: var(--color-text);
    transition: all 0.2s ease;
  }

  .feature-card h2 {
    font-size: 1.5rem;
    margin-bottom: var(--space-3);
  }

  .feature-card p {
    color: var(--color-text-muted);
    margin: 0;
  }

  .feature-card:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }

  @media (max-width: 767px) {
    .hero h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .features {
      grid-template-columns: 1fr;
    }
  }
</style>
