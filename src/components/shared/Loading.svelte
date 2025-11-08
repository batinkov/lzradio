<script>
  export let message = 'Loading...'
</script>

<div class="loading">
  <div class="spinner"></div>
  {#if message}
    <p>{message}</p>
  {/if}
</div>

<style>
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    min-height: 200px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  p {
    margin-top: 1rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
</style>
