/**
 * Navigation Guard
 *
 * Provides a mechanism to block navigation and prompt for confirmation
 * Used for preventing accidental navigation during simulated exams
 */

import { writable } from 'svelte/store'
import { languageSwitchingDisabled } from './i18n.js'

/**
 * Store to track if navigation should be blocked
 */
export const navigationBlocked = writable(false)

/**
 * Store to track pending navigation (location user tried to navigate to)
 */
export const pendingNavigation = writable(null)

/**
 * Store to track if confirmation modal should be shown
 */
export const showNavigationConfirmation = writable(false)

/**
 * Default warning message for browser navigation
 */
const DEFAULT_WARNING_MESSAGE = 'Your exam progress will be lost if you leave this page. Are you sure?'

/**
 * Determines if navigation guards should be enabled based on exam state
 *
 * @param {string} examState - Current exam state
 * @returns {boolean} True if guards should be enabled
 */
export function shouldEnableGuards(examState) {
  return examState === 'IN_PROGRESS' || examState === 'REVIEW'
}

/**
 * Enables navigation guards to prevent accidental navigation
 * - Sets browser beforeunload warning
 * - Disables language switching
 * - Blocks in-app navigation
 *
 * @param {Object} options - Configuration options
 * @param {string} [options.warningMessage] - Custom warning message for beforeunload
 * @param {Window} [options.window] - Window object (for testing)
 */
export function enableNavigationGuards(options = {}) {
  const {
    warningMessage = DEFAULT_WARNING_MESSAGE,
    window: win = globalThis.window
  } = options

  // Set browser beforeunload warning
  if (win) {
    win.onbeforeunload = () => warningMessage
  }

  // Disable language switching
  languageSwitchingDisabled.set(true)

  // Block in-app navigation
  navigationBlocked.set(true)
}

/**
 * Disables all navigation guards
 * - Removes browser beforeunload warning
 * - Re-enables language switching
 * - Unblocks in-app navigation
 *
 * @param {Object} options - Configuration options
 * @param {Window} [options.window] - Window object (for testing)
 */
export function disableNavigationGuards(options = {}) {
  const { window: win = globalThis.window } = options

  // Remove browser beforeunload warning
  if (win) {
    win.onbeforeunload = null
  }

  // Re-enable language switching
  languageSwitchingDisabled.set(false)

  // Unblock in-app navigation
  navigationBlocked.set(false)
}

/**
 * Alias for disableNavigationGuards for backward compatibility
 *
 * @param {Object} options - Configuration options
 */
export function cleanupNavigationGuards(options = {}) {
  disableNavigationGuards(options)
}
