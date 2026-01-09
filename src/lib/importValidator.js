/**
 * Validation utilities for LogBook import JSON files
 */

/**
 * Validates the structure and content of an import JSON file
 * @param {any} data - Parsed JSON data
 * @returns {{ valid: boolean, error?: string, contacts?: Array }} Validation result
 */
export function validateImportData(data) {
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON format. Expected an object.' }
  }

  // Validate metadata
  const metadataValidation = validateMetadata(data.metadata)
  if (!metadataValidation.valid) {
    return metadataValidation
  }

  // Validate contacts array
  if (!Array.isArray(data.contacts)) {
    return { valid: false, error: 'Invalid format. "contacts" must be an array.' }
  }

  if (data.contacts.length === 0) {
    return { valid: false, error: 'No contacts found in import file.' }
  }

  // Validate each contact
  for (let i = 0; i < data.contacts.length; i++) {
    const contactValidation = validateContact(data.contacts[i], i)
    if (!contactValidation.valid) {
      return contactValidation
    }
  }

  return { valid: true, contacts: data.contacts }
}

/**
 * Validates metadata section
 * @param {any} metadata - Metadata object
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
function validateMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return { valid: false, error: 'Invalid format. Missing or invalid "metadata" section.' }
  }

  // Validate appName
  if (metadata.appName !== 'LZ Radio') {
    return {
      valid: false,
      error: 'This file was not exported from LZ Radio. Cannot import.'
    }
  }

  // Validate schemaVersion
  if (typeof metadata.schemaVersion !== 'number') {
    return { valid: false, error: 'Invalid metadata. Missing or invalid schema version.' }
  }

  // Check if schema version is supported (currently only version 1)
  if (metadata.schemaVersion !== 1) {
    return {
      valid: false,
      error: `Unsupported schema version ${metadata.schemaVersion}. This version of LZ Radio only supports schema version 1.`
    }
  }

  return { valid: true }
}

/**
 * Validates a single contact object
 * @param {any} contact - Contact object
 * @param {number} index - Array index for error reporting
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
function validateContact(contact, index) {
  if (!contact || typeof contact !== 'object') {
    return {
      valid: false,
      error: `Invalid contact at index ${index}. Expected an object.`
    }
  }

  // Validate required fields
  const requiredFields = [
    { name: 'baseCallsign', type: 'string' },
    { name: 'date', type: 'string' },
    { name: 'time', type: 'string' },
    { name: 'frequency', type: 'number' },
    { name: 'mode', type: 'string' }
  ]

  for (const field of requiredFields) {
    if (contact[field.name] === undefined || contact[field.name] === null) {
      return {
        valid: false,
        error: `Contact at index ${index} is missing required field: ${field.name}`
      }
    }

    if (typeof contact[field.name] !== field.type) {
      return {
        valid: false,
        error: `Contact at index ${index} has invalid type for ${field.name}. Expected ${field.type}, got ${typeof contact[field.name]}`
      }
    }
  }

  // Validate baseCallsign is not empty
  if (!contact.baseCallsign.trim()) {
    return {
      valid: false,
      error: `Contact at index ${index} has empty baseCallsign`
    }
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(contact.date)) {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid date format. Expected YYYY-MM-DD, got: ${contact.date}`
    }
  }

  // Validate date is a real date
  const dateObj = new Date(contact.date + 'T00:00:00')
  if (isNaN(dateObj.getTime())) {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid date: ${contact.date}`
    }
  }

  // Verify the date components match (prevents dates like 2025-02-30 becoming 2025-03-02)
  const [year, month, day] = contact.date.split('-').map(Number)
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() + 1 !== month ||
    dateObj.getDate() !== day
  ) {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid date: ${contact.date} (day/month out of range)`
    }
  }

  // Validate time format (HH:MM:SS or HH:MM)
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(contact.time)) {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid time format. Expected HH:MM:SS or HH:MM, got: ${contact.time}`
    }
  }

  // Validate frequency is positive
  if (contact.frequency <= 0) {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid frequency. Must be positive, got: ${contact.frequency}`
    }
  }

  // Validate mode is not empty
  if (!contact.mode.trim()) {
    return {
      valid: false,
      error: `Contact at index ${index} has empty mode`
    }
  }

  // Validate optional fields types if present
  if (contact.prefix !== null && contact.prefix !== undefined && typeof contact.prefix !== 'string') {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid type for prefix. Expected string or null`
    }
  }

  if (contact.suffix !== null && contact.suffix !== undefined && typeof contact.suffix !== 'string') {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid type for suffix. Expected string or null`
    }
  }

  if (contact.power !== null && contact.power !== undefined) {
    if (typeof contact.power !== 'number' || contact.power <= 0) {
      return {
        valid: false,
        error: `Contact at index ${index} has invalid power. Expected positive number or null`
      }
    }
  }

  if (contact.rstSent !== null && contact.rstSent !== undefined && typeof contact.rstSent !== 'string') {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid type for rstSent. Expected string or null`
    }
  }

  if (contact.rstReceived !== null && contact.rstReceived !== undefined && typeof contact.rstReceived !== 'string') {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid type for rstReceived. Expected string or null`
    }
  }

  if (contact.qslSent !== null && contact.qslSent !== undefined && typeof contact.qslSent !== 'boolean') {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid type for qslSent. Expected boolean or null`
    }
  }

  if (contact.qslReceived !== null && contact.qslReceived !== undefined && typeof contact.qslReceived !== 'boolean') {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid type for qslReceived. Expected boolean or null`
    }
  }

  if (contact.remarks !== null && contact.remarks !== undefined && typeof contact.remarks !== 'string') {
    return {
      valid: false,
      error: `Contact at index ${index} has invalid type for remarks. Expected string or null`
    }
  }

  return { valid: true }
}

/**
 * Normalizes a contact object for import by providing defaults for optional fields
 * @param {Object} contact - Contact object from import file
 * @returns {Object} Normalized contact ready for database insertion
 */
export function normalizeContact(contact) {
  return {
    baseCallsign: contact.baseCallsign.trim(),
    prefix: contact.prefix?.trim() || null,
    suffix: contact.suffix?.trim() || null,
    date: contact.date,
    time: contact.time,
    frequency: contact.frequency,
    mode: contact.mode.trim(),
    power: contact.power || null,
    rstSent: contact.rstSent?.trim() || null,
    rstReceived: contact.rstReceived?.trim() || null,
    qslSent: contact.qslSent || false,
    qslReceived: contact.qslReceived || false,
    remarks: contact.remarks?.trim() || ''
    // Note: id, createdAt, updatedAt are NOT included - IndexedDB will generate them
  }
}
