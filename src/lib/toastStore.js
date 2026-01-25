/**
 * Simple toast notification store
 */
import { writable } from 'svelte/store'

function createToastStore() {
  const { subscribe, update } = writable([])
  let nextId = 0

  return {
    subscribe,
    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {('success'|'error'|'info'|'warning')} type - Toast type
     * @param {number} duration - Duration in ms (0 = no auto-dismiss)
     * @param {Object} options - Optional configuration
     * @param {string} options.link - Optional link URL
     * @param {string} options.linkText - Optional link text (defaults to "Learn more")
     */
    show(message, type = 'info', duration = 3000, options = {}) {
      const id = nextId++
      const toast = {
        id,
        message,
        type,
        link: options.link,
        linkText: options.linkText || 'Learn more'
      }

      update((toasts) => [...toasts, toast])

      if (duration > 0) {
        setTimeout(() => {
          this.dismiss(id)
        }, duration)
      }

      return id
    },
    /**
     * Show a success toast
     * @param {string} message
     * @param {number} duration
     * @param {Object} options
     */
    success(message, duration = 3000, options = {}) {
      return this.show(message, 'success', duration, options)
    },
    /**
     * Show an error toast
     * @param {string} message
     * @param {number} duration
     * @param {Object} options
     */
    error(message, duration = 4000, options = {}) {
      return this.show(message, 'error', duration, options)
    },
    /**
     * Show an info toast
     * @param {string} message
     * @param {number} duration
     * @param {Object} options
     */
    info(message, duration = 3000, options = {}) {
      return this.show(message, 'info', duration, options)
    },
    /**
     * Show a warning toast
     * @param {string} message
     * @param {number} duration
     * @param {Object} options
     */
    warning(message, duration = 3000, options = {}) {
      return this.show(message, 'warning', duration, options)
    },
    /**
     * Dismiss a specific toast
     * @param {number} id
     */
    dismiss(id) {
      update((toasts) => toasts.filter((t) => t.id !== id))
    },
    /**
     * Clear all toasts
     */
    clear() {
      update(() => [])
    }
  }
}

export const toast = createToastStore()
