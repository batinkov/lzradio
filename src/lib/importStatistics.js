/**
 * Import statistics calculation for LogBook
 * Handles duplicate detection and generates import preview statistics
 */

import { buildCallsign } from './callsignParser.js'

/**
 * Calculates import statistics by comparing import contacts with existing contacts
 * @param {Array} importContacts - Contacts from import file
 * @param {Array} existingContacts - Contacts already in database
 * @returns {Object} Statistics object with counts and lists
 */
export function calculateImportStatistics(importContacts, existingContacts) {
  // Build a set of existing contacts for duplicate detection
  // Key format: "baseCallsign|date|time"
  const existingSet = new Set()
  existingContacts.forEach((contact) => {
    const key = buildDuplicateKey(contact)
    existingSet.add(key)
  })

  // Find duplicates and new contacts
  const duplicates = []
  const newContacts = []

  importContacts.forEach((contact) => {
    const key = buildDuplicateKey(contact)
    if (existingSet.has(key)) {
      duplicates.push({
        callsign: buildCallsign(contact.baseCallsign, contact.prefix, contact.suffix),
        date: contact.date,
        time: contact.time
      })
    } else {
      newContacts.push(contact)
    }
  })

  return {
    existingCount: existingContacts.length,
    importFileCount: importContacts.length,
    newCount: newContacts.length,
    duplicateCount: duplicates.length,
    duplicates: duplicates,
    newContacts: newContacts
  }
}

/**
 * Builds a unique key for duplicate detection
 * @param {Object} contact - Contact object
 * @returns {string} Unique key in format "baseCallsign|date|time"
 */
export function buildDuplicateKey(contact) {
  return `${contact.baseCallsign}|${contact.date}|${contact.time}`
}
