import { describe, it, expect } from 'vitest'
import { validateImportData, normalizeContact } from '../../src/lib/importValidator.js'

describe('importValidator', () => {
  describe('validateImportData', () => {
    it('should accept valid import data', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1,
          exportDate: '2025-01-20T10:00:00.000Z',
          contactCount: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            prefix: null,
            suffix: null,
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB',
            power: 100,
            rstSent: '59',
            rstReceived: '57',
            qslSent: true,
            qslReceived: false,
            remarks: 'Test'
          }
        ]
      }

      const result = validateImportData(data)
      expect(result.valid).toBe(true)
      expect(result.contacts).toHaveLength(1)
    })

    it('should reject null data', () => {
      const result = validateImportData(null)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid JSON format')
    })

    it('should reject non-object data', () => {
      const result = validateImportData('not an object')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid JSON format')
    })

    it('should reject data without metadata', () => {
      const data = {
        contacts: []
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Missing or invalid "metadata"')
    })

    it('should reject data with wrong appName', () => {
      const data = {
        metadata: {
          appName: 'Other App',
          schemaVersion: 1
        },
        contacts: []
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not exported from LZ Radio')
    })

    it('should reject unsupported schema version', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 2
        },
        contacts: []
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unsupported schema version 2')
    })

    it('should reject missing schema version', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio'
        },
        contacts: []
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Missing or invalid schema version')
    })

    it('should reject data without contacts array', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        }
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('"contacts" must be an array')
    })

    it('should reject empty contacts array', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: []
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('No contacts found in import file')
    })

    it('should reject contact missing baseCallsign', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('missing required field: baseCallsign')
    })

    it('should reject contact missing date', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('missing required field: date')
    })

    it('should reject contact missing time', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('missing required field: time')
    })

    it('should reject contact missing frequency', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            time: '14:30:00',
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('missing required field: frequency')
    })

    it('should reject contact missing mode', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('missing required field: mode')
    })

    it('should reject contact with empty baseCallsign', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: '   ',
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty baseCallsign')
    })

    it('should reject contact with invalid date format', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '01/20/2025',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid date format')
    })

    it('should reject contact with invalid month', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-13-30',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid date')
      expect(result.error).toContain('2025-13-30')
    })

    it('should reject contact with invalid day for month', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-02-30',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid date')
      expect(result.error).toContain('day/month out of range')
    })

    it('should reject contact with invalid day (April 31)', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-04-31',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid date')
      expect(result.error).toContain('day/month out of range')
    })

    it('should accept valid leap year date', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2024-02-29',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid leap year date', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-02-29',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid date')
      expect(result.error).toContain('day/month out of range')
    })

    it('should reject contact with invalid time format', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            time: '2:30 PM',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid time format')
    })

    it('should accept time without seconds', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            time: '14:30',
            frequency: 14.25,
            mode: 'SSB',
            prefix: null,
            suffix: null,
            power: null,
            rstSent: null,
            rstReceived: null,
            qslSent: false,
            qslReceived: false,
            remarks: null
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(true)
    })

    it('should reject contact with negative frequency', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            time: '14:30:00',
            frequency: -14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid frequency')
    })

    it('should reject contact with zero frequency', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 0,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid frequency')
    })

    it('should reject contact with empty mode', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: '   '
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty mode')
    })

    it('should reject contact with wrong type for baseCallsign', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 123,
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid type for baseCallsign')
    })

    it('should reject contact with wrong type for frequency', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            time: '14:30:00',
            frequency: '14.25',
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid type for frequency')
    })

    it('should reject contact with invalid power type', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB',
            power: '100'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid power')
    })

    it('should reject contact with negative power', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB',
            power: -10
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid power')
    })

    it('should accept contact with null optional fields', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            prefix: null,
            suffix: null,
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB',
            power: null,
            rstSent: null,
            rstReceived: null,
            qslSent: null,
            qslReceived: null,
            remarks: null
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(true)
    })

    it('should reject contact with invalid prefix type', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            prefix: 123,
            suffix: null,
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid type for prefix')
    })

    it('should reject contact with invalid qslSent type', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            prefix: null,
            suffix: null,
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB',
            qslSent: 'yes'
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalid type for qslSent')
    })

    it('should validate multiple contacts', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            prefix: null,
            suffix: null,
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB',
            power: null,
            rstSent: null,
            rstReceived: null,
            qslSent: false,
            qslReceived: false,
            remarks: null
          },
          {
            baseCallsign: 'K2XYZ',
            prefix: null,
            suffix: null,
            date: '2025-01-21',
            time: '10:00:00',
            frequency: 7.1,
            mode: 'CW',
            power: null,
            rstSent: null,
            rstReceived: null,
            qslSent: false,
            qslReceived: false,
            remarks: null
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(true)
      expect(result.contacts).toHaveLength(2)
    })

    it('should report error with contact index', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1
        },
        contacts: [
          {
            baseCallsign: 'W1ABC',
            prefix: null,
            suffix: null,
            date: '2025-01-20',
            time: '14:30:00',
            frequency: 14.25,
            mode: 'SSB',
            power: null,
            rstSent: null,
            rstReceived: null,
            qslSent: false,
            qslReceived: false,
            remarks: null
          },
          {
            baseCallsign: 'K2XYZ',
            date: '2025-01-21',
            time: '10:00:00',
            frequency: 7.1
            // Missing mode
          }
        ]
      }
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('index 1')
      expect(result.error).toContain('missing required field: mode')
    })
  })

  describe('callsign validation (truth table)', () => {
    const validContact = {
      baseCallsign: 'W1ABC',
      date: '2025-01-20',
      time: '14:30:00',
      frequency: 14.25,
      mode: 'SSB'
    }

    const createImportData = (stationCallsign) => ({
      metadata: {
        appName: 'LZ Radio',
        schemaVersion: 1,
        exportDate: '2025-01-20T10:00:00.000Z',
        contactCount: 1,
        stationCallsign: stationCallsign
      },
      contacts: [validContact]
    })

    it('should accept when both callsigns match (LZ1ABC == LZ1ABC)', () => {
      const data = createImportData('LZ1ABC')
      const result = validateImportData(data, 'LZ1ABC')
      expect(result.valid).toBe(true)
      expect(result.contacts).toHaveLength(1)
      expect(result.shouldSetCallsign).toBeUndefined()
    })

    it('should reject when callsigns differ (LZ1ABC != LZ2XYZ)', () => {
      const data = createImportData('LZ2XYZ')
      const result = validateImportData(data, 'LZ1ABC')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Your callsign is LZ1ABC')
      expect(result.error).toContain('this logbook belongs to LZ2XYZ')
    })

    it('should accept when user has callsign but import does not', () => {
      const data = createImportData(null)
      const result = validateImportData(data, 'LZ1ABC')
      expect(result.valid).toBe(true)
      expect(result.contacts).toHaveLength(1)
      expect(result.shouldSetCallsign).toBeUndefined()
    })

    it('should accept and suggest callsign when user has none but import does', () => {
      const data = createImportData('LZ1ABC')
      const result = validateImportData(data, null)
      expect(result.valid).toBe(true)
      expect(result.contacts).toHaveLength(1)
      expect(result.shouldSetCallsign).toBe('LZ1ABC')
    })

    it('should accept when neither has callsign set', () => {
      const data = createImportData(null)
      const result = validateImportData(data, null)
      expect(result.valid).toBe(true)
      expect(result.contacts).toHaveLength(1)
      expect(result.shouldSetCallsign).toBeUndefined()
    })

    it('should handle missing stationCallsign field in metadata (backwards compatibility)', () => {
      const data = {
        metadata: {
          appName: 'LZ Radio',
          schemaVersion: 1,
          exportDate: '2025-01-20T10:00:00.000Z',
          contactCount: 1
          // No stationCallsign field
        },
        contacts: [validContact]
      }
      const result = validateImportData(data, 'LZ1ABC')
      expect(result.valid).toBe(true)
    })

    it('should handle empty string as user callsign (treated as null)', () => {
      const data = createImportData('LZ1ABC')
      const result = validateImportData(data, '')
      expect(result.valid).toBe(true)
      expect(result.shouldSetCallsign).toBe('LZ1ABC')
    })

    it('should handle empty string in import metadata (treated as null)', () => {
      const data = createImportData('')
      const result = validateImportData(data, 'LZ1ABC')
      expect(result.valid).toBe(true)
      expect(result.shouldSetCallsign).toBeUndefined()
    })
  })

  describe('normalizeContact', () => {
    it('should normalize contact with all fields', () => {
      const contact = {
        baseCallsign: '  W1ABC  ',
        prefix: '  HB  ',
        suffix: '  M  ',
        date: '2025-01-20',
        time: '14:30:00',
        frequency: 14.25,
        mode: '  SSB  ',
        power: 100,
        rstSent: '  59  ',
        rstReceived: '  57  ',
        qslSent: true,
        qslReceived: false,
        remarks: '  Test  '
      }

      const normalized = normalizeContact(contact)

      expect(normalized.baseCallsign).toBe('W1ABC')
      expect(normalized.prefix).toBe('HB')
      expect(normalized.suffix).toBe('M')
      expect(normalized.date).toBe('2025-01-20')
      expect(normalized.time).toBe('14:30:00')
      expect(normalized.frequency).toBe(14.25)
      expect(normalized.mode).toBe('SSB')
      expect(normalized.power).toBe(100)
      expect(normalized.rstSent).toBe('59')
      expect(normalized.rstReceived).toBe('57')
      expect(normalized.qslSent).toBe(true)
      expect(normalized.qslReceived).toBe(false)
      expect(normalized.remarks).toBe('Test')
    })

    it('should provide defaults for null optional fields', () => {
      const contact = {
        baseCallsign: 'W1ABC',
        prefix: null,
        suffix: null,
        date: '2025-01-20',
        time: '14:30:00',
        frequency: 14.25,
        mode: 'SSB',
        power: null,
        rstSent: null,
        rstReceived: null,
        qslSent: null,
        qslReceived: null,
        remarks: null
      }

      const normalized = normalizeContact(contact)

      expect(normalized.prefix).toBe(null)
      expect(normalized.suffix).toBe(null)
      expect(normalized.power).toBe(null)
      expect(normalized.rstSent).toBe(null)
      expect(normalized.rstReceived).toBe(null)
      expect(normalized.qslSent).toBe(false)
      expect(normalized.qslReceived).toBe(false)
      expect(normalized.remarks).toBe('')
    })

    it('should not include id, createdAt, or updatedAt', () => {
      const contact = {
        id: 123,
        baseCallsign: 'W1ABC',
        prefix: null,
        suffix: null,
        date: '2025-01-20',
        time: '14:30:00',
        frequency: 14.25,
        mode: 'SSB',
        createdAt: 1234567890,
        updatedAt: 1234567890
      }

      const normalized = normalizeContact(contact)

      expect(normalized.id).toBeUndefined()
      expect(normalized.createdAt).toBeUndefined()
      expect(normalized.updatedAt).toBeUndefined()
    })

    it('should handle empty string remarks', () => {
      const contact = {
        baseCallsign: 'W1ABC',
        prefix: null,
        suffix: null,
        date: '2025-01-20',
        time: '14:30:00',
        frequency: 14.25,
        mode: 'SSB',
        remarks: ''
      }

      const normalized = normalizeContact(contact)
      expect(normalized.remarks).toBe('')
    })

    it('should convert falsy qslSent to false', () => {
      const contact = {
        baseCallsign: 'W1ABC',
        prefix: null,
        suffix: null,
        date: '2025-01-20',
        time: '14:30:00',
        frequency: 14.25,
        mode: 'SSB',
        qslSent: undefined,
        qslReceived: 0
      }

      const normalized = normalizeContact(contact)
      expect(normalized.qslSent).toBe(false)
      expect(normalized.qslReceived).toBe(false)
    })
  })
})
