/**
 * LogBook Database
 *
 * IndexedDB database using Dexie.js for storing amateur radio contacts.
 * Schema: contacts with indexed baseCallsign and date fields.
 */

import Dexie from 'dexie'

// Create database instance
const db = new Dexie('LZRadioDB')

// Define schema
// ++id = auto-incrementing primary key
// baseCallsign, date = indexed fields for fast searching
db.version(1).stores({
  contacts: '++id, baseCallsign, date'
})

/**
 * Contact object structure:
 * {
 *   id: number (auto-generated),
 *   baseCallsign: string (e.g., 'W1ABC'),
 *   prefix: string | null (e.g., 'HB'),
 *   suffix: string | null (e.g., 'M', 'P'),
 *   date: string (ISO date 'YYYY-MM-DD'),
 *   time: string ('HH:MM:SS'),
 *   frequency: number (MHz),
 *   mode: string (e.g., 'SSB', 'CW', 'FT8'),
 *   power: number (watts),
 *   rstSent: string (signal report sent),
 *   rstReceived: string (signal report received),
 *   qslReceived: boolean,
 *   qslSent: boolean,
 *   remarks: string,
 *   createdAt: number (timestamp),
 *   updatedAt: number (timestamp)
 * }
 */

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Add a new contact to the database
 *
 * @param {Object} contactData - Contact data (without id, createdAt, updatedAt)
 * @returns {Promise<number>} ID of the newly created contact
 */
export async function addContact(contactData) {
  const now = Date.now()
  const contact = {
    ...contactData,
    createdAt: now,
    updatedAt: now
  }
  return await db.contacts.add(contact)
}

/**
 * Get a single contact by ID
 *
 * @param {number} id - Contact ID
 * @returns {Promise<Object|undefined>} Contact object or undefined if not found
 */
export async function getContact(id) {
  return await db.contacts.get(id)
}

/**
 * Get all contacts, sorted by date (newest first)
 *
 * @returns {Promise<Array>} Array of all contacts
 */
export async function getAllContacts() {
  return await db.contacts.orderBy('date').reverse().toArray()
}

/**
 * Search contacts by base callsign
 *
 * @param {string} baseCallsign - Base callsign to search for (e.g., 'W1ABC')
 * @returns {Promise<Array>} Array of matching contacts
 */
export async function searchByCallsign(baseCallsign) {
  return await db.contacts.where('baseCallsign').equals(baseCallsign.toUpperCase()).toArray()
}

/**
 * Update an existing contact
 *
 * @param {number} id - Contact ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<number>} Number of updated records (0 or 1)
 */
export async function updateContact(id, updates) {
  return await db.contacts.update(id, {
    ...updates,
    updatedAt: Date.now()
  })
}

/**
 * Delete a contact
 *
 * @param {number} id - Contact ID
 * @returns {Promise<void>}
 */
export async function deleteContact(id) {
  return await db.contacts.delete(id)
}

/**
 * Get total number of contacts
 *
 * @returns {Promise<number>} Total count
 */
export async function getContactCount() {
  return await db.contacts.count()
}

export default db
