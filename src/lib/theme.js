/**
 * Theme Management
 *
 * Sets up theme switching with:
 * - Light and dark mode support
 * - LocalStorage persistence for theme preference
 * - System preference detection as fallback
 * - Can be disabled during exams (similar to language switching)
 */

import { writable } from 'svelte/store'
import { localStorageAdapter } from './storage/localStorage.js'

const STORAGE_KEY = 'lzradio-theme'
const THEMES = ['light', 'dark']
const DEFAULT_THEME = 'light'

/**
 * Store to track if theme switching should be disabled
 * (e.g., during simulated exam)
 */
export const themeSwitchingDisabled = writable(false)

/**
 * Get initial theme from LocalStorage or system preference
 */
export function getInitialTheme() {
  // Try LocalStorage first
  const stored = localStorageAdapter.get(STORAGE_KEY)
  if (stored && THEMES.includes(stored)) {
    return stored
  }

  // Try system preference (only in browser environment)
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  // Fallback to default
  return DEFAULT_THEME
}

/**
 * Theme store
 */
export const theme = writable(getInitialTheme())

/**
 * Apply theme to document and persist to LocalStorage
 */
export function applyTheme(newTheme) {
  if (!THEMES.includes(newTheme)) {
    console.warn(`Invalid theme: ${newTheme}`)
    return
  }

  // Update document attribute (only in browser environment)
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // Persist to LocalStorage
  localStorageAdapter.set(STORAGE_KEY, newTheme)

  // Update store
  theme.set(newTheme)
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme() {
  let currentTheme
  theme.subscribe(value => {
    currentTheme = value
  })()

  const newTheme = currentTheme === 'light' ? 'dark' : 'light'
  applyTheme(newTheme)
}

/**
 * Initialize theme on app load
 */
export function initializeTheme() {
  applyTheme(getInitialTheme())
}

/**
 * Get list of supported themes
 */
export { THEMES }
