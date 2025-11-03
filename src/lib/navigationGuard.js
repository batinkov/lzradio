/**
 * Navigation Guard
 *
 * Provides a mechanism to block navigation and prompt for confirmation
 * Used for preventing accidental navigation during simulated exams
 */

import { writable } from 'svelte/store'

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
