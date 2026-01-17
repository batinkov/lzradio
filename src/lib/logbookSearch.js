import Fuse from 'fuse.js'

/**
 * Create a Fuse.js instance configured for logbook search
 * @param {Array} contacts - Array of contacts with fullCallsign and remarks
 * @returns {Fuse} Configured Fuse.js instance
 */
export function createFuseInstance(contacts) {
  return new Fuse(contacts, {
    keys: [
      { name: 'fullCallsign', weight: 0.7 },  // Prioritize callsign
      { name: 'remarks', weight: 0.3 }        // Secondary search in remarks
    ],
    threshold: 0.3,        // Balanced fuzzy threshold
    ignoreLocation: true,  // Match anywhere in string
    minMatchCharLength: 2  // Don't match single characters
  })
}

/**
 * Filter contacts based on search query using fuzzy matching
 * @param {Array} contacts - Array of contacts to filter
 * @param {string} query - Search query string
 * @param {Fuse} fuse - Fuse.js instance
 * @returns {Array} Filtered contacts array
 */
export function filterContacts(contacts, query, fuse) {
  const trimmedQuery = query.trim()

  // Show all if search is empty or too short
  if (trimmedQuery.length < 2) {
    return contacts
  }

  // Use Fuse.js for fuzzy search
  return fuse.search(trimmedQuery).map(result => result.item)
}

/**
 * Highlight matched text in a string with <mark> tags
 * @param {string} text - Text to search in
 * @param {string} query - Search query to highlight
 * @returns {string} Text with <mark> tags around first match
 */
export function highlightMatch(text, query) {
  if (!text || !query || query.trim().length < 2) {
    return text || ''
  }

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) {
    return text
  }

  const before = text.slice(0, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length)

  return `${before}<mark>${match}</mark>${after}`
}
