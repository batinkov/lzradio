/**
 * Storage Adapter
 *
 * Provides a consistent, testable interface for working with browser storage
 * (localStorage, sessionStorage). Handles JSON serialization/deserialization
 * and error handling automatically.
 */

/**
 * Creates a storage adapter with a consistent API
 *
 * @param {Storage} storage - The storage object (localStorage, sessionStorage, or mock)
 * @returns {Object} Storage adapter with get, set, remove, clear, and has methods
 */
export function createStorageAdapter(storage) {
  /**
   * Gets a value from storage and parses it as JSON
   *
   * @param {string} key - Storage key
   * @param {*} [defaultValue=null] - Default value if key doesn't exist or parsing fails
   * @returns {*} Parsed value or default value
   */
  function get(key, defaultValue = null) {
    try {
      const item = storage.getItem(key)
      if (item === null) {
        return defaultValue
      }
      return JSON.parse(item)
    } catch (error) {
      console.warn(`Failed to get item "${key}" from storage:`, error)
      return defaultValue
    }
  }

  /**
   * Sets a value in storage after JSON serialization
   *
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON.stringified)
   * @returns {boolean} True if successful, false otherwise
   */
  function set(key, value) {
    try {
      const serialized = JSON.stringify(value)
      storage.setItem(key, serialized)
      return true
    } catch (error) {
      console.error(`Failed to set item "${key}" in storage:`, error)
      return false
    }
  }

  /**
   * Removes a value from storage
   *
   * @param {string} key - Storage key to remove
   * @returns {boolean} True if successful, false otherwise
   */
  function remove(key) {
    try {
      storage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Failed to remove item "${key}" from storage:`, error)
      return false
    }
  }

  /**
   * Clears all items from storage
   *
   * @returns {boolean} True if successful, false otherwise
   */
  function clear() {
    try {
      storage.clear()
      return true
    } catch (error) {
      console.error('Failed to clear storage:', error)
      return false
    }
  }

  /**
   * Checks if a key exists in storage
   *
   * @param {string} key - Storage key to check
   * @returns {boolean} True if key exists
   */
  function has(key) {
    try {
      return storage.getItem(key) !== null
    } catch (error) {
      console.warn(`Failed to check if "${key}" exists in storage:`, error)
      return false
    }
  }

  /**
   * Gets all keys in storage
   *
   * @returns {Array<string>} Array of all storage keys
   */
  function keys() {
    try {
      const allKeys = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key !== null) {
          allKeys.push(key)
        }
      }
      return allKeys
    } catch (error) {
      console.error('Failed to get storage keys:', error)
      return []
    }
  }

  /**
   * Gets the number of items in storage
   *
   * @returns {number} Number of items
   */
  function size() {
    try {
      return storage.length
    } catch (error) {
      console.error('Failed to get storage size:', error)
      return 0
    }
  }

  return {
    get,
    set,
    remove,
    clear,
    has,
    keys,
    size
  }
}

/**
 * Creates a mock storage for testing
 *
 * @returns {Storage} Mock storage object implementing Storage interface
 */
export function createMockStorage() {
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
