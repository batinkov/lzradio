/**
 * LocalStorage Adapter
 *
 * Provides a convenient interface for working with browser localStorage.
 * Data persists across browser sessions.
 */

import { createStorageAdapter } from './storageAdapter.js'

/**
 * LocalStorage adapter instance
 * Uses browser's localStorage if available, otherwise creates a mock
 */
export const localStorageAdapter = createStorageAdapter(
  typeof window !== 'undefined' && window.localStorage
    ? window.localStorage
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
