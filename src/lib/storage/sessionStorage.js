/**
 * SessionStorage Adapter
 *
 * Provides a convenient interface for working with browser sessionStorage.
 * Data persists only for the current tab/session and is cleared when the tab closes.
 */

import { createStorageAdapter } from './storageAdapter.js'

/**
 * SessionStorage adapter instance
 * Uses browser's sessionStorage if available, otherwise creates a mock
 */
export const sessionStorageAdapter = createStorageAdapter(
  typeof window !== 'undefined' && window.sessionStorage
    ? window.sessionStorage
    : createMockStorage()
)

// Re-export createMockStorage for testing
function createMockStorage() {
  let store = {}
  return {
    getItem(key) {
      return store[key] || null
    },
    setItem(key, value) {
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key(index) {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
}
