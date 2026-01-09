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
     */
    show(message, type = 'info', duration = 3000) {
      const id = nextId++
      const toast = { id, message, type }

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
     */
    success(message, duration = 3000) {
      return this.show(message, 'success', duration)
    },
    /**
     * Show an error toast
     * @param {string} message
     * @param {number} duration
     */
    error(message, duration = 4000) {
      return this.show(message, 'error', duration)
    },
    /**
     * Show an info toast
     * @param {string} message
     * @param {number} duration
     */
    info(message, duration = 3000) {
      return this.show(message, 'info', duration)
    },
    /**
     * Show a warning toast
     * @param {string} message
     * @param {number} duration
     */
    warning(message, duration = 3000) {
      return this.show(message, 'warning', duration)
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
