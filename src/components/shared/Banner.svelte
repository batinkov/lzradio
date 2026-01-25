<script>
  import { onMount } from 'svelte'

  export let badgeText = 'Notice'
  export let message = ''
  export let dismissible = true
  export let autoDismiss = 0 // 0 = never auto-dismiss, >0 = auto-dismiss after X milliseconds

  let visible = true

  onMount(() => {
    // Setup auto-dismiss timer if configured
    if (autoDismiss > 0) {
      setTimeout(() => {
        visible = false
      }, autoDismiss)
    }
  })

  function dismiss() {
    visible = false
  }
</script>

{#if visible}
  <div class="banner">
    <span class="badge">{badgeText}</span>
    <span class="message">{message}</span>
    {#if dismissible}
      <button class="close-btn" on:click={dismiss} aria-label="Close banner">✕</button>
    {/if}
  </div>
{/if}

<style>
  /* Exact styles from LogBook - orange warning style */
  .banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    margin-bottom: var(--space-6);
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 1px solid #f59e0b;
    border-radius: var(--radius-md);
    font-size: 0.8rem;
  }

  :global([data-theme="dark"]) .banner {
    background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
    border-color: #b45309;
  }

  .badge {
    background: #f59e0b;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  :global([data-theme="dark"]) .badge {
    background: #d97706;
  }

  .message {
    flex: 1;
    color: #92400e;
  }

  :global([data-theme="dark"]) .message {
    color: #fef3c7;
  }

  .close-btn {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #92400e;
    cursor: pointer;
    border-radius: var(--radius-sm);
    font-size: 18px;
    line-height: 1;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  :global([data-theme="dark"]) .close-btn {
    color: #fef3c7;
  }

  :global([data-theme="dark"]) .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
