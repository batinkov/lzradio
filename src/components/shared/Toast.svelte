<script>
  import { toast } from '../../lib/toastStore.js'
  import { fly } from 'svelte/transition'

  $: toasts = $toast
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div
      class="toast toast-{toast.type}"
      transition:fly={{ y: 30, duration: 300 }}
      role="status"
      aria-live="polite"
    >
      <div class="toast-icon">
        {#if toast.type === 'success'}
          ✓
        {:else if toast.type === 'error'}
          ✕
        {:else if toast.type === 'warning'}
          ⚠
        {:else}
          ℹ
        {/if}
      </div>
      <div class="toast-message">{toast.message}</div>
      <button
        class="toast-close"
        on:click={() => toast.dismiss(toast.id)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: var(--space-6);
    right: var(--space-6);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-width: 400px;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--color-bg-card);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    border-left: 4px solid;
    pointer-events: auto;
    min-width: 300px;
  }

  .toast-success {
    border-left-color: var(--color-success);
  }

  .toast-error {
    border-left-color: var(--color-error);
  }

  .toast-warning {
    border-left-color: var(--color-warning);
  }

  .toast-info {
    border-left-color: var(--color-primary);
  }

  .toast-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    border-radius: var(--radius-full);
    color: white;
  }

  .toast-success .toast-icon {
    background: var(--color-success);
  }

  .toast-error .toast-icon {
    background: var(--color-error);
  }

  .toast-warning .toast-icon {
    background: var(--color-warning);
  }

  .toast-info .toast-icon {
    background: var(--color-primary);
  }

  .toast-message {
    flex: 1;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--color-text);
  }

  .toast-close {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    font-size: 18px;
    line-height: 1;
    transition: all 0.2s ease;
  }

  .toast-close:hover {
    background: var(--color-bg);
    color: var(--color-text);
  }

  @media (max-width: 640px) {
    .toast-container {
      bottom: var(--space-4);
      right: var(--space-4);
      left: var(--space-4);
      max-width: none;
    }

    .toast {
      min-width: 0;
    }
  }
</style>
