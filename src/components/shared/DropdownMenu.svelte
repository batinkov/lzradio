<script>
  import { onMount, onDestroy, tick } from 'svelte'

  export let buttonLabel = '⋮'
  export let align = 'right' // 'left' or 'right'

  let isOpen = false
  let buttonElement
  let menuElement
  let portalContainer
  let menuPosition = { top: 0, left: 0, right: 'auto' }

  function toggleMenu() {
    if (!isOpen) {
      calculateMenuPosition()
    }
    isOpen = !isOpen
  }

  function closeMenu() {
    isOpen = false
  }

  function calculateMenuPosition() {
    if (!buttonElement) return

    const buttonRect = buttonElement.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const menuHeight = 120 // Approximate menu height (increased for 3 items)
    const menuWidth = 150 // Min width from CSS

    // Calculate vertical position
    let top = buttonRect.bottom + 4 // 4px margin

    // If not enough space below, show above
    if (top + menuHeight > viewportHeight && buttonRect.top - menuHeight > 0) {
      top = buttonRect.top - menuHeight - 4
    }

    // Calculate horizontal position based on align prop
    let left = 'auto'
    let right = 'auto'

    if (align === 'right') {
      right = viewportWidth - buttonRect.right
      // Ensure menu doesn't go off left edge
      if (buttonRect.right - menuWidth < 0) {
        left = buttonRect.left
        right = 'auto'
      }
    } else {
      left = buttonRect.left
      // Ensure menu doesn't go off right edge
      if (buttonRect.left + menuWidth > viewportWidth) {
        right = viewportWidth - buttonRect.right
        left = 'auto'
      }
    }

    menuPosition = { top, left, right }
  }

  function handleClickOutside(event) {
    if (
      isOpen &&
      buttonElement &&
      menuElement &&
      !buttonElement.contains(event.target) &&
      !menuElement.contains(event.target)
    ) {
      closeMenu()
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      closeMenu()
    }
  }

  function handleScroll() {
    if (isOpen) {
      calculateMenuPosition()
    }
  }

  // Move menu to portal when it opens
  async function moveToPortal() {
    await tick()
    if (menuElement && portalContainer) {
      portalContainer.appendChild(menuElement)
    }
  }

  // Watch for menu open state changes
  $: if (isOpen) {
    moveToPortal()
  }

  onMount(() => {
    // Create portal container in document body
    portalContainer = document.createElement('div')
    portalContainer.className = 'dropdown-portal'
    document.body.appendChild(portalContainer)

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeydown)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
  })

  onDestroy(() => {
    // Clean up portal container
    if (portalContainer && portalContainer.parentNode) {
      portalContainer.parentNode.removeChild(portalContainer)
    }

    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('scroll', handleScroll, true)
    window.removeEventListener('resize', handleScroll)
  })
</script>

<div class="dropdown-menu">
  <button
    bind:this={buttonElement}
    class="dropdown-button"
    on:click={toggleMenu}
    aria-label="Actions"
    aria-expanded={isOpen}
  >
    {buttonLabel}
  </button>

  {#if isOpen}
    <div
      bind:this={menuElement}
      class="dropdown-content"
      style="top: {menuPosition.top}px; left: {menuPosition.left === 'auto' ? 'auto' : menuPosition.left + 'px'}; right: {menuPosition.right === 'auto' ? 'auto' : menuPosition.right + 'px'};"
    >
      <slot {closeMenu} />
    </div>
  {/if}
</div>

<style>
  .dropdown-menu {
    position: relative;
    display: inline-block;
  }

  .dropdown-button {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 4px 8px;
    color: var(--color-text-muted);
    border-radius: var(--radius-md);
    transition: background-color 0.15s ease, color 0.15s ease;
    line-height: 1;
  }

  .dropdown-button:hover {
    background: var(--color-bg);
    color: var(--color-text);
  }

  .dropdown-button:active {
    transform: scale(0.95);
  }

  .dropdown-content {
    position: fixed;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    min-width: 150px;
    z-index: 9999;
    overflow: hidden;
    animation: dropdownFadeIn 0.15s ease;
  }

  @keyframes dropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Style for menu items (buttons/links passed via slot) */
  .dropdown-content :global(button),
  .dropdown-content :global(a) {
    display: block;
    width: 100%;
    padding: 10px 16px;
    text-align: left;
    background: none;
    border: none;
    color: var(--color-text);
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
    text-decoration: none;
  }

  .dropdown-content :global(button:hover),
  .dropdown-content :global(a:hover) {
    background: var(--color-bg);
  }

  .dropdown-content :global(button.danger),
  .dropdown-content :global(a.danger) {
    color: #c00;
  }

  .dropdown-content :global(button.danger:hover),
  .dropdown-content :global(a.danger:hover) {
    background: #fee;
  }

  .dropdown-content :global(hr) {
    margin: 4px 0;
    border: none;
    border-top: 1px solid var(--color-border);
  }
</style>
