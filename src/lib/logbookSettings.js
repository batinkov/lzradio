/**
 * LogBook Settings Storage
 *
 * Manages persistent storage of logbook-specific settings like station callsign.
 * Uses LocalStorage via storage adapter for persistence.
 */

import { localStorageAdapter } from './storage/localStorage.js'

const STORAGE_KEY = 'logbookSettings'

/**
 * Default settings structure
 */
const DEFAULT_SETTINGS = {
  stationCallsign: null
}

/**
 * Normalize callsign (uppercase, trim)
 * @param {string|null} callsign - Raw callsign input
 * @returns {string|null} Normalized callsign or null
 */
function normalizeCallsign(callsign) {
  if (!callsign || typeof callsign !== 'string') {
    return null
  }

  const trimmed = callsign.trim()
  if (trimmed === '') {
    return null
  }

  return trimmed.toUpperCase()
}

/**
 * Get logbook settings from storage
 * @returns {Object} Settings object with stationCallsign
 */
export function getLogbookSettings() {
  const stored = localStorageAdapter.get(STORAGE_KEY)
  return stored ? { ...DEFAULT_SETTINGS, ...stored } : { ...DEFAULT_SETTINGS }
}

/**
 * Get station callsign from settings
 * @returns {string|null} Station callsign or null if not set
 */
export function getStationCallsign() {
  const settings = getLogbookSettings()
  return settings.stationCallsign
}

/**
 * Set station callsign in settings
 * Automatically normalizes (uppercase, trim, empty string -> null)
 * @param {string|null} callsign - Station callsign to save
 * @returns {boolean} True if saved successfully
 */
export function setStationCallsign(callsign) {
  const normalized = normalizeCallsign(callsign)
  const settings = getLogbookSettings()
  settings.stationCallsign = normalized

  return localStorageAdapter.set(STORAGE_KEY, settings)
}

/**
 * Update multiple settings at once
 * @param {Object} updates - Partial settings object to merge
 * @returns {boolean} True if saved successfully
 */
export function updateLogbookSettings(updates) {
  const settings = getLogbookSettings()
  const merged = { ...settings, ...updates }

  // Normalize callsign if present
  if ('stationCallsign' in merged) {
    merged.stationCallsign = normalizeCallsign(merged.stationCallsign)
  }

  return localStorageAdapter.set(STORAGE_KEY, merged)
}

/**
 * Clear all logbook settings
 * @returns {boolean} True if cleared successfully
 */
export function clearLogbookSettings() {
  return localStorageAdapter.remove(STORAGE_KEY)
}
